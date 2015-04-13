if (Layer.root.width !== 1024) {
	throw "This prototype is meant to be run in landscape on an iPad"
}

var beatLineYPosition = 300
var beatVelocity = 300 // points per second
var timeBetweenEmission = 1.0 // in seconds
var beatDiameter = 50

var lastBeatEmissionTime = Timestamp.currentTimestamp() - timeBetweenEmission
Layer.root.behaviors = [
	new ActionBehavior({handler: function() {
		var t = Timestamp.currentTimestamp()
		if (t > lastBeatEmissionTime + timeBetweenEmission) {
			var beat = new ShapeLayer.Circle({center: Layer.root.position, radius: beatDiameter / 2.0})
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

	if (beat.y > beatLineYPosition && beat.burst === undefined) {
		beat.burst = true
		addBurstEmitter(beat)
	}
}

var beatLine = new ShapeLayer.Line({
	from: new Point({x: 0, y: beatLineYPosition}),
	to: new Point({x: Layer.root.width, y: beatLineYPosition})
})

var bottomHalf = new Layer()
bottomHalf.frame = new Rect({x: 0, y: beatLineYPosition, width: Layer.root.width, height: Layer.root.height - beatLineYPosition})
bottomHalf.backgroundColor = Color.white
bottomHalf.zPosition = 1000

function addBurstEmitter(layer) {
	var particle = new Particle({imageName: "sparkles"})
	particle.lifetime = 2.0
	particle.alphaSpeed = -2.0
	particle.birthRate = 300
	particle.yAcceleration = 500.0
	particle.velocity = 15
	particle.emissionRange = 2 * Math.PI
	particle.scale = 0.02
	particle.scaleRange = 0.6
	particle.scaleSpeed = 0.01

	var particleEmitter = new ParticleEmitter({particle: particle})
	particleEmitter.shape = "circle"
	particleEmitter.shapeMode = "outline"

	bottomHalf.addParticleEmitter(particleEmitter)
	particleEmitter.size = new Size({width: beatDiameter, height: beatDiameter})
	particleEmitter.position = bottomHalf.convertGlobalPointToLocalPoint(layer.parent.convertLocalPointToGlobalPoint(layer.position))

	afterDuration(0.1, function() {
		particleEmitter.birthRate = 0
		afterDuration(particle.lifetime, function() {
			bottomHalf.removeParticleEmitter(particleEmitter)
		})
	})
}