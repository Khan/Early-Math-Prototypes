if (Layer.root.width !== 1024) {
	throw "This prototype is meant to be run in landscape on an iPad"
}

var beatLineYPosition = 300
var beatVelocity = 300 // points per second
var timeBetweenEmission = 1.0 // in seconds
var beatDiameter = 50
var leewayBetweenTouchAndBeat = 0.3 // in seconds
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

var activeBeats = []

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

			beat.animators.alpha.springBounciness = 0
			beat.animators.alpha.springSpeed = 5
			beat.animators.scale.springBounciness = 0
			beat.animators.scale.springSpeed = 5

			activeBeats.push(beat)

			lastBeatEmissionTime = t
		}
	}})
]

var touchBursts = []

bottomHalf.touchBeganHandler = function(touchSequence) {
	var nearestBeat = nearestUnpairedBeatToPoint(touchSequence.firstSample.globalLocation)
	if (nearestBeat !== undefined) {
		nearestBeat.pairedTime = Timestamp.currentTimestamp()

		lastTouchSequence = touchSequence
		// TODO(andy): You should be able to resize the frame of a shape layer and make the shape resize. Maybe? I dunno...

		var from = bottomHalf.convertGlobalPointToLocalPoint(touchSequence.firstSample.globalLocation)
		var to = new Point({x: nearestBeat.x, y: 0})

		var touchBurst = new ShapeLayer({parent: bottomHalf})
		touchBurst.frame = bottomHalf.bounds
		touchBurst.fillColor = undefined
		touchBurst.strokeWidth = 1
		touchBurst.strokeColor = Color.black
		touchBurst.lineCapStyle = LineCapStyle.Round
		touchBursts.push(touchBurst)

		var startTime = touchSequence.firstSample.timestamp

		touchBurst.behaviors = [
			new ActionBehavior({handler: function() {
				var unitTime = (Timestamp.currentTimestamp() - startTime) / leewayBetweenTouchAndBeat
				var lineVector = to.subtract(from).multiply(1)
				var angle = Math.atan2(lineVector.y, lineVector.x)
				var normalAngle = angle + Math.PI / 2.0
				var waveUnitVector = new Point({x: Math.cos(normalAngle), y: Math.sin(normalAngle)})

				var segments = []
				touchBurst.strokeWidth = Math.sin(unitTime * Math.PI) * 7

				var numberOfSamples = 100
				var frequency = 5
				var amplitude = 20
				var transverseVelocity = -40
				for (var sampleIndex = 0; sampleIndex < numberOfSamples; sampleIndex++) {
					var unitSampleIndex = sampleIndex / (numberOfSamples - 1)
					var baseSampleAmplitude = amplitude * Math.sin(unitSampleIndex * Math.PI)
					var sampleAmplitude = Math.sin(unitSampleIndex * Math.PI * 2.0 * frequency + transverseVelocity * Timestamp.currentTimestamp()) * baseSampleAmplitude
					var waveVector = waveUnitVector.multiply(sampleAmplitude)
					var segmentPosition = from.add(lineVector.multiply(sampleIndex / (numberOfSamples - 1)))
					segments.push(new Segment(segmentPosition.add(waveVector)))
				}
				touchBurst.segments = segments
			}})
		]

		afterDuration(leewayBetweenTouchAndBeat, function() {
			touchBurst.parent = undefined
			touchBurst.behaviors = []
			touchBursts.splice(touchBursts.indexOf(touchBurst), 1)	
		})
	} else {
		// TODO: Define what happens if all beats are already paired.
	}
}

function beatBehavior(beat) {
	var t = Timestamp.currentTimestamp()
	if (beat.lastMovementTimestamp !== undefined) {
		beat.y += (t - beat.lastMovementTimestamp) * beatVelocity
	}
	beat.lastMovementTimestamp = t


	if (beat.y > beatLineYPosition + beatDiameter / 3.0 && beat.burst === undefined) {
		if (t - beat.pairedTime < 0.3) {
			beat.animators.scale.target = new Point({x: 60, y: 60})
			beat.animators.alpha.target = 0
			new Sound({name: pitches[beat.pitch]}).play()
		} else {
			addBurstEmitter(beat)
		}
		beat.burst = true
	}

	if (beat.emitter !== undefined) {
		beat.emitter.position = bottomHalf.convertGlobalPointToLocalPoint(beat.parent.convertLocalPointToGlobalPoint(beat.position))
	}

	if (beat.y > Layer.root.height) {
		beat.parent = undefined
		beat.behaviors = []
		activeBeats.splice(activeBeats.indexOf(beat), 1)
	}
}

function nearestUnpairedBeatToPoint(point) {
	var nearestBeat = undefined
	var nearestBeatDistance = Number.MAX_VALUE
	for (var beat of activeBeats) {
		var beatDistance = point.distanceToPoint(beat.position)
		if (beatDistance < nearestBeatDistance &&
			(beat.pairedTime === undefined || (Timestamp.currentTimestamp() - beat.pairedTime > leewayBetweenTouchAndBeat * 1.5)) &&
			beat.burst === undefined) {
			nearestBeatDistance = beatDistance
			nearestBeat = beat
		}
	}

	return nearestBeat
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