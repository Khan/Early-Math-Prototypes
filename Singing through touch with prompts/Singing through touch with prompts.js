if (Layer.root.width !== 1024) {
	throw "This prototype is meant to be run in landscape on an iPad"
}

var beatLineYPosition = 300
var beatVelocity = 300 // points per second
var timeBetweenEmission = 1.0 // in seconds
var beatDiameter = 50

var topHalf = new Layer()
topHalf.frame = new Rect({x: 0, y: 0, width: Layer.root.width, height: beatLineYPosition})
topHalf.backgroundColor = new Color({white: 0.97})
topHalf.cornerRadius = 1 // Hack to make the top half clip to bounds. TODO(andy): make real Prototope API for this
topHalf.zPosition = 1000

var bottomHalf = new Layer()
bottomHalf.frame = new Rect({x: 0, y: beatLineYPosition, width: Layer.root.width, height: Layer.root.height - beatLineYPosition})
bottomHalf.backgroundColor = Color.white

var lastBeatEmissionTime = Timestamp.currentTimestamp() - timeBetweenEmission
Layer.root.behaviors = [
	new ActionBehavior({handler: function() {
		var t = Timestamp.currentTimestamp()
		if (t > lastBeatEmissionTime + timeBetweenEmission) {
			var beat = new ShapeLayer.Circle({center: Layer.root.position, radius: beatDiameter / 2.0, parent: topHalf})
			beat.fillColor = Color.orange
			beat.strokeColor = undefined
			beat.originY = -beatDiameter
			beat.x = Math.random() * (Layer.root.width * 0.75) + Layer.root.width * 0.125
			beat.behaviors = [new ActionBehavior({handler: function() { beatBehavior(beat) }})]

			lastBeatEmissionTime = t
		}
	}})
]

function beatBehavior(beat) {
	var t = Timestamp.currentTimestamp()
	if (beat.lastMovementTimestamp !== undefined) {
		beat.y += (t - beat.lastMovementTimestamp) * beatVelocity
	}
	beat.lastMovementTimestamp = t


	if (beat.y > beatLineYPosition - beatDiameter / 2.0 && beat.burst === undefined) {
		if (bottomHalf.numberOfActiveTouches > 0) {
			var sounds = ["cat_e", "cat_fsharp", "cat_gsharp"]
			new Sound({name: sounds[Math.floor(Math.random()*sounds.length)]}).play()
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
		afterDuration(particle.lifetime, function() {
			bottomHalf.removeParticleEmitter(particleEmitter)
			layer.emitter = undefined
		})
	})
}