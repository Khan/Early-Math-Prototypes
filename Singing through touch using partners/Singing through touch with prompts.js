if (Layer.root.width !== 1024) {
	throw "This prototype is meant to be run in landscape on an iPad"
}

var beatLineYPosition = 615
var beatVelocity = 300 // points per second
var timeBetweenEmission = 1.0 // in seconds
var beatDiameter = 50
var leewayBetweenTouchAndBeat = 0.4 // in seconds
var pitches = ["cat_e", "cat_fsharp", "cat_gsharp", "cat_a", "cat_b"]
var song = [0, 0, null, 0, 1, 1, null, null, 2, 2, null, 2, 3, 3, null, 4]

var bottomHalf = new Layer()
bottomHalf.frame = new Rect({x: 0, y: beatLineYPosition, width: Layer.root.width, height: Layer.root.height - beatLineYPosition})
bottomHalf.backgroundColor = Color.white

var topHalf = new Layer()
topHalf.frame = new Rect({x: 0, y: 0, width: Layer.root.width, height: beatLineYPosition})
topHalf.backgroundColor = new Color({white: 0.97})
topHalf.cornerRadius = 1 // Hack to make the top half clip to bounds. TODO(andy): make real Prototope API for this

makeToolbar()

var lastBeatEmissionTime = Timestamp.currentTimestamp() - timeBetweenEmission
var lastTouchSequence = null

var activeBeatGroups = []
var currentNote = 0
Layer.root.behaviors = [
	new ActionBehavior({handler: function() {
		var t = Timestamp.currentTimestamp()
		if (t > lastBeatEmissionTime + timeBetweenEmission) {
			var pitch = song[currentNote]
			if (pitch !== null) {
				var beatGroup = new Layer({parent: topHalf})
				beatGroup.frame = new Rect({x: 0, y: -beatDiameter, width: Layer.root.width, height: beatDiameter})
				beatGroup.beats = []
				beatGroup.pitch = pitch

				for (var beatIndex = 0; beatIndex <= pitch; beatIndex++) {
					var beat = makeBeat()
					beat.parent = beatGroup
					beat.x = beatIndex * (beatGroup.width * 0.75 / (pitches.length - 1)) + beatGroup.width * 0.125
					beatGroup.beats.push(beat)
				}

				var line = new ShapeLayer.Line({
					from: new Point({x: beatGroup.beats[0].x, y: beatDiameter / 2.0}),
					to: new Point({x: beatGroup.beats[beatGroup.beats.length - 1].x, y: beatDiameter / 2.0}),
					parent: beatGroup
				})
				line.strokeColor = Color.orange
				line.strokeWidth = 4
				line.zPosition = -1


				beatGroup.behaviors = [new ActionBehavior({handler: function() { beatBehavior(beatGroup) }})]
				activeBeatGroups.push(beatGroup)
			}

			currentNote = (currentNote + 1) % song.length
			lastBeatEmissionTime = t
		}
	}})
]

var touchBursts = []

bottomHalf.touchBeganHandler = function(touchSequence) {
	var nearestBeat = nearestUnpairedBeatToPoint(touchSequence.firstSample.globalLocation)
	var touchLocationInBottomHalf = bottomHalf.convertGlobalPointToLocalPoint(touchSequence.firstSample.globalLocation)
	if (nearestBeat !== undefined) {
		nearestBeat.pairedTime = Timestamp.currentTimestamp()

		lastTouchSequence = touchSequence
		// TODO(andy): You should be able to resize the frame of a shape layer and make the shape resize. Maybe? I dunno...

		var from = touchLocationInBottomHalf
		var to = new Point({x: nearestBeat.x, y: 0})

		var touchBurst = addSquiggleWave(from, to, leewayBetweenTouchAndBeat * 0.9)
		touchBurst.parent = bottomHalf
		touchBursts.push(touchBurst)
		afterDuration(leewayBetweenTouchAndBeat, function() {
			touchBursts.splice(touchBursts.indexOf(touchBurst), 1)	
		})
	} else {
		var burst = new Layer({parent: bottomHalf})
		burst.position = touchLocationInBottomHalf
		burst.width = burst.height = 1
		burst.border = new Border({width: 2, color: new Color({white: 0.8})})
		burst.behaviors = [
			new ActionBehavior({handler: function() {
				var fizzleTime = 0.4
				var maximumSize = 120
				var unitTime = (Timestamp.currentTimestamp() - touchSequence.firstSample.timestamp) / fizzleTime
				burst.width = burst.height = Math.sin(unitTime * Math.PI) * maximumSize
				burst.cornerRadius = burst.width / 2.0
				if (unitTime >= 1) {
					burst.parent = undefined
					burst.behaviors = []
				}
			}})
		]
	}
}

function beatBehavior(beatGroup) {
	var t = Timestamp.currentTimestamp()
	if (beatGroup.lastMovementTimestamp !== undefined) {
		beatGroup.y += (t - beatGroup.lastMovementTimestamp) * beatVelocity
		for (var beat of beatGroup.beats) {
			if (beat.emitter !== undefined) {
				beat.emitter.position = bottomHalf.convertGlobalPointToLocalPoint(beat.parent.convertLocalPointToGlobalPoint(beat.position))
			}
		}
	}
	beatGroup.lastMovementTimestamp = t

	var isPastBurstingLine = beatGroup.y > beatLineYPosition + beatDiameter / 3.0
	if (isPastBurstingLine && beatGroup.burst === undefined) {
		var activatedSegments = new Set()
		var matchedBeatCount = 0
		for (var beatIndex in beatGroup.beats) {
			beatIndex = parseInt(beatIndex)
			var beat = beatGroup.beats[beatIndex]
			if (t - beat.pairedTime < leewayBetweenTouchAndBeat) {
				matchedBeatCount++
				if (beatIndex > 0) {
					activatedSegments.add(beatIndex - 1)
				}
				if (beatIndex < beatGroup.beats.length - 1) {
					activatedSegments.add(beatIndex)
				}
			} else {
				addBurstEmitter(beat)
			}
		}

		if (matchedBeatCount === beatGroup.beats.length) {
			new Sound({name: pitches[beatGroup.beats.length - 1]}).play()
			for (var beat of beatGroup.beats) {
				beat.animators.scale.target = new Point({x: 30, y: 30})
				beat.animators.alpha.target = 0
			}
		} else {
			for (var activatedSegment of activatedSegments) {
				var fromX = beatGroup.beats[activatedSegment].x
				var toX = beatGroup.beats[activatedSegment + 1].x
				var squiggleWave = addSquiggleWave(new Point({x: fromX, y: topHalf.frameMaxY}), new Point({x: toX, y: topHalf.frameMaxY}), 0.3, 3, 3)
				squiggleWave.strokeColor = Color.orange
			}
		}

		beatGroup.burst = true
	}

	if (beatGroup.y > Layer.root.height) {
		beatGroup.parent = undefined
		beatGroup.behaviors = []
		activeBeatGroups.splice(activeBeatGroups.indexOf(beatGroup), 1)
	}
}

function addSquiggleWave(from, to, duration, amplitude, maximumStrokeWidth) {
	var squiggleWave = new ShapeLayer()
	squiggleWave.fillColor = undefined
	squiggleWave.strokeWidth = 1
	squiggleWave.strokeColor = new Color({white: 0.6})
	squiggleWave.lineCapStyle = LineCapStyle.Round
	squiggleWave.lineJoinStyle = LineCapStyle.Round

	var startTime = Timestamp.currentTimestamp()

	squiggleWave.behaviors = [
		new ActionBehavior({handler: function() {
			var numberOfSamples = 20
			var frequency = 5
			var transverseVelocity = -40
			var effectiveMaximumStrokeWidth = maximumStrokeWidth || 7
			var effectiveAmplitude = amplitude || 20

			var unitTime = clip({value: (Timestamp.currentTimestamp() - startTime) / leewayBetweenTouchAndBeat, min: 0, max: 1})
			var lineVector = to.subtract(from).multiply(1)
			var angle = Math.atan2(lineVector.y, lineVector.x)
			var normalAngle = angle + Math.PI / 2.0
			var waveUnitVector = new Point({x: Math.cos(normalAngle), y: Math.sin(normalAngle)})

			squiggleWave.strokeWidth = Math.sin(unitTime * Math.PI) * effectiveMaximumStrokeWidth
			
			var segments = []
			for (var sampleIndex = 0; sampleIndex < numberOfSamples; sampleIndex++) {
				var unitSampleIndex = sampleIndex / (numberOfSamples - 1)
				var baseSampleAmplitude = effectiveAmplitude * Math.sin(unitSampleIndex * Math.PI)
				var sampleAmplitude = Math.sin(unitSampleIndex * Math.PI * 2.0 * frequency + transverseVelocity * Timestamp.currentTimestamp()) * baseSampleAmplitude
				var waveVector = waveUnitVector.multiply(sampleAmplitude)
				var segmentPosition = from.add(lineVector.multiply(sampleIndex / (numberOfSamples - 1)))
				segments.push(new Segment(segmentPosition.add(waveVector)))
			}
			squiggleWave.segments = segments
		}})
	]

	afterDuration(duration, function() {
		squiggleWave.parent = undefined
		squiggleWave.behaviors = []
	})

	return squiggleWave
}

function nearestUnpairedBeatToPoint(point) {
	var nearestBeat = undefined
	var nearestBeatDistance = Number.MAX_VALUE
	for (var beatGroup of activeBeatGroups) {
		if (beatGroup.burst) {
			continue
		}

		for (var beat of beatGroup.beats) {
			var beatDistance = point.distanceToPoint(beat.position)
			if (beatDistance < nearestBeatDistance &&
				(beat.pairedTime === undefined || (Timestamp.currentTimestamp() - beat.pairedTime > leewayBetweenTouchAndBeat * 1.5))) {
				nearestBeatDistance = beatDistance
				nearestBeat = beat
			}
		}
		
		if (nearestBeat !== undefined) {
			break
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
	particle.color = Color.orange

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

function makeToolbar() {
	var toolbarParent = bottomHalf
	var toolbarContainer = new Layer({parent: toolbarParent})
	toolbarContainer.width = toolbarParent.width
	toolbarContainer.height = 150
	toolbarContainer.originX = 0
	toolbarContainer.originY = 0
	var availableButtons = 5

	for (var buttonIndex = 0; buttonIndex < availableButtons; buttonIndex++) {
		const numberOfDots = buttonIndex + 1

		let buttonContainer = new Layer({parent: toolbarContainer})
		buttonContainer.width = toolbarContainer.width / availableButtons
		buttonContainer.height = toolbarContainer.height
		buttonContainer.originX = buttonIndex * buttonContainer.width
		buttonContainer.originY = 0

		buttonContainer.touchBeganHandler = () => {
			buttonContainer.alpha = 0.5
		}
		buttonContainer.touchEndedHandler = touchSequence => {
			buttonContainer.alpha = 1.0

			var dots = buttonContainer.sublayers
			for (let dotIndex = 0; dotIndex < numberOfDots; dotIndex++) {
				let nearestBeat = nearestUnpairedBeatToPoint(touchSequence.firstSample.globalLocation)
				if (nearestBeat !== undefined) {
					nearestBeat.pairedTime = Timestamp.currentTimestamp()
					let dot = dots[dotIndex]
					dot.position = dot.globalPosition
					dot.parent = Layer.root
					dot.animators.position.target = nearestBeat.globalPosition
					dot.behaviors = [
						new ActionBehavior({with: nearestBeat, handler: () => {
							if (dot.globalPosition.y <= nearestBeat.globalPosition.y) {
								var beatBehaviors = nearestBeat.behaviors || []
								beatBehaviors.push(new ActionBehavior({handler: () => {
									nearestBeat.border = new Border({width: nearestBeat.border.width * 1.2, color: nearestBeat.border.color})
								}}))
								nearestBeat.behaviors = beatBehaviors

								dot.parent = undefined
								dot.behaviors = []
							}
						}})
					]

					lastTouchSequence = touchSequence
					// TODO(andy): You should be able to resize the frame of a shape layer and make the shape resize. Maybe? I dunno...
				}
			}
		}

		const dotSeparation = 10
		const dotDiameter = 20
		const dotsWidth = numberOfDots * dotDiameter + Math.max(0, numberOfDots - 1) * dotSeparation
		for (var dotIndex = 0; dotIndex < numberOfDots; dotIndex++) {
			var dot = new ShapeLayer.Circle({center: Point.zero, radius: dotDiameter / 2.0, parent: buttonContainer})
			dot.fillColor = Color.orange
			dot.strokeColor = undefined
			dot.x = buttonContainer.width / 2.0 - dotsWidth / 2.0 + dotDiameter * (dotIndex + 0.5) + dotSeparation * dotIndex
			dot.y = buttonContainer.height / 2.0
			dot.animators.position.springBounciness = 0
			dot.animators.position.springSpeed = 30
			dot.animators.scale.springBounciness = 2
			dot.animators.scale.springSpeed = 40
		}
	}
}

function makeBeat() {
	var beat = new Layer({parent: topHalf})
	beat.width = beat.height = beatDiameter
	beat.border = new Border({width: 5, color: Color.orange})
	beat.backgroundColor = Color.white
	beat.cornerRadius = beat.width / 2.0
	beat.origin = Point.zero
	beat.animators.alpha.springBounciness = 0
	beat.animators.alpha.springSpeed = 5
	beat.animators.scale.springBounciness = 0
	beat.animators.scale.springSpeed = 5
	return beat
}
