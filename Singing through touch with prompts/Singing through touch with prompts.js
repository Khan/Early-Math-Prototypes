if (Layer.root.width !== 1024) {
	throw "This prototype is meant to be run in landscape on an iPad"
}

var beatLineYPosition = 300
var beatVelocity = 300 // points per second
var timeBetweenEmission = 1.0 // in seconds
var beatDiameter = 50
var pitches = ["cat_e", "cat_fsharp", "cat_gsharp", "cat_a", "cat_b"]

var topHalf = new Layer()
topHalf.frame = new Rect({x: 0, y: 0, width: Layer.root.width, height: beatLineYPosition})
topHalf.backgroundColor = new Color({white: 0.97})
topHalf.cornerRadius = 1 // Hack to make the top half clip to bounds. TODO(andy): make real Prototope API for this
topHalf.zPosition = 1000

var bottomHalf = new Layer()
bottomHalf.frame = new Rect({x: 0, y: beatLineYPosition, width: Layer.root.width, height: Layer.root.height - beatLineYPosition})
bottomHalf.backgroundColor = Color.white

var lastBeatEmissionTime = Timestamp.currentTimestamp() - timeBetweenEmission
var lastTouchSequence = null
Layer.root.behaviors = [
	new ActionBehavior({handler: function() {
		var t = Timestamp.currentTimestamp()
		if (t > lastBeatEmissionTime + timeBetweenEmission) {
			var beat = new ShapeLayer.Circle({center: Layer.root.position, radius: beatDiameter / 2.0, parent: topHalf})
			beat.fillColor = Color.orange
			beat.strokeColor = undefined
			beat.originY = -beatDiameter
			beat.pitch = Math.floor(Math.random() * pitches.length)
			beat.x = beat.pitch * (Layer.root.width * 0.75 / (pitches.length - 1)) + Layer.root.width * 0.125
			beat.behaviors = [new ActionBehavior({handler: function() { beatBehavior(beat) }})]

			lastBeatEmissionTime = t
		}
	}})
]

bottomHalf.touchBeganHandler = function(touchSequence) {
	lastTouchSequence = touchSequence
	// TODO(andy): You should be able to resize the frame of a shape layer and make the shape resize. Maybe? I dunno...
	var touchBurst = new Layer({parent: bottomHalf})
	touchBurst.width = touchBurst.height = 20
	touchBurst.position = bottomHalf.convertGlobalPointToLocalPoint(touchSequence.firstSample.globalLocation)
	touchBurst.border = new Border({width: 2, color: Color.orange})
	touchBurst.cornerRadius = touchBurst.width / 2.0
	touchBurst.behaviors = [
		new ActionBehavior({handler: function() {
			if (touchBurst.originX > 0 || touchBurst.frameMaxX < bottomHalf.width) {
				var newDiameter = touchBurst.width + 30
				touchBurst.width = touchBurst.height = newDiameter
				touchBurst.cornerRadius = newDiameter / 2.0
			} else {
				touchBurst.parent = undefined
			}
		}})
	]
}

function beatBehavior(beat) {
	var t = Timestamp.currentTimestamp()
	if (beat.lastMovementTimestamp !== undefined) {
		beat.y += (t - beat.lastMovementTimestamp) * beatVelocity
	}
	beat.lastMovementTimestamp = t


	if (beat.y > beatLineYPosition + beatDiameter / 3.0 && beat.burst === undefined) {
		if (lastTouchSequence !== null && t - lastTouchSequence.firstSample.timestamp < 0.3) {
			console.log(t - lastTouchSequence.firstSample.timestamp)
			new Sound({name: pitches[beat.pitch]}).play()
		} else {
			addBurstEmitter(beat)
		}
		beat.burst = true
	}

	if (beat.emitter !== undefined) {
		beat.emitter.position = bottomHalf.convertGlobalPointToLocalPoint(beat.parent.convertLocalPointToGlobalPoint(beat.position))
	}
}

function addBurstEmitter(layer) {
	var particle = new Particle({imageName: "sparkles"})
	particle.lifetime = 2.0
	particle.lifetimeRange = 0.3
	particle.alphaSpeed = -2.0
	particle.birthRate = 300
	particle.yAcceleration = 300.0
	particle.velocity = 10
	particle.emissionRange = 2 * Math.PI
	particle.scale = 0.01
	particle.scaleRange = 0.5
	particle.scaleSpeed = 0
	particle.color = layer.fillColor

	var particleEmitter = new ParticleEmitter({particle: particle})
	particleEmitter.shape = "circle"
	particleEmitter.shapeMode = "outline"

	bottomHalf.addParticleEmitter(particleEmitter)
	particleEmitter.size = new Size({width: beatDiameter, height: beatDiameter})
	particleEmitter.position = bottomHalf.convertGlobalPointToLocalPoint(layer.parent.convertLocalPointToGlobalPoint(layer.position))
	layer.emitter = particleEmitter

	afterDuration(0.2, function() {
		particleEmitter.birthRate = 0
		afterDuration(particle.lifetime + particle.lifetimeRange, function() {
			bottomHalf.removeParticleEmitter(particleEmitter)
			layer.emitter = undefined
		})
	})
}