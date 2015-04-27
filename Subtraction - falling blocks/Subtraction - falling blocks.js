if (Layer.root.width !== 1024) {
	throw "This prototype is meant to be run in landscape on an iPad"
}

var beatLineYPosition = 515
var beatVelocity = 300 // points per second
var timeBetweenEmission = 3.0 // in seconds
var beatDiameter = 50
var leewayBetweenTouchAndBeat = 0.4 // in seconds
var pitches = ["cat_e", "cat_fsharp", "cat_gsharp", "cat_a", "cat_b"]
var song = [0, 1, 2, 3, 4, 3, 2, 4, 1, 0]

// Doing this the stupid way (like everything else in this prototype):
var partitions = {
	1: [[1]],
	2: [[1, 1], [2]],
	3: [[1, 1, 1], [1, 2], [3]],
	4: [[1, 1, 1, 1], [1, 3], [1, 1, 2], [2, 2], [4]],
	5: [[1, 1, 1, 1, 1], [1, 4], [1, 1, 3], [1, 1, 1, 2], [2, 3], [2, 2, 1], [5]]
}

var bottomHalf = new Layer()
bottomHalf.frame = new Rect({x: 0, y: beatLineYPosition, width: Layer.root.width, height: Layer.root.height - beatLineYPosition})
bottomHalf.backgroundColor = Color.white

var topHalf = new Layer()
topHalf.frame = new Rect({x: 0, y: 0, width: Layer.root.width, height: beatLineYPosition})
topHalf.backgroundColor = new Color({white: 0.97})
topHalf.cornerRadius = 1 // Hack to make the top half clip to bounds. TODO(andy): make real Prototope API for this

var lastBeatEmissionTime = Timestamp.currentTimestamp() - timeBetweenEmission
var lastTouchSequence = null

var activeBeatGroups = []
var currentNote = 0

var currentToolbar = null

var currentTargetBeatGroup = undefined

const maximumNumberOfDotsInALine = 8

Layer.root.behaviors = [
	new ActionBehavior({handler: function() {
		var t = Timestamp.currentTimestamp()
		if (t > lastBeatEmissionTime + timeBetweenEmission) {
			var pitch = song[currentNote]
			if (pitch !== null) {
				const potentialAdditionalBeats = Math.min(5, maximumNumberOfDotsInALine - pitch - 1)
				const additionalBeats = Math.ceil(Math.random() * potentialAdditionalBeats)
				const fallingBeatCount = pitch + additionalBeats + 1

				if (currentToolbar !== null) {
					currentToolbar.parent = undefined
				}

				var availablePartitions = partitions[pitch + 1]
				var partitioning = availablePartitions[Math.floor(Math.random() * availablePartitions.length)]
				makeToolbar([1, 2, 3, 4, 5])

				var beatGroup = new Layer({parent: topHalf})
				beatGroup.frame = new Rect({x: 0, y: -beatDiameter, width: Layer.root.width, height: beatDiameter})
				beatGroup.beats = []
				beatGroup.pitch = pitch
				beatGroup.additionalBeats = additionalBeats

				for (var beatIndex = 0; beatIndex < fallingBeatCount; beatIndex++) {
					var beat = makeBeat(true)
					beat.parent = beatGroup
					beat.x = beatIndex * (beatGroup.width * 0.75 / (maximumNumberOfDotsInALine - 1)) + beatGroup.width * 0.125
					beatGroup.beats.push(beat)
				}

				currentTargetBeatGroup = new Layer()
				currentTargetBeatGroup.frame = new Rect({x: 0, y: beatLineYPosition - beatDiameter / 2.0, width: Layer.root.width, height: beatDiameter})
				currentTargetBeatGroup.beats = []

				for (var beatIndex = 0; beatIndex <= pitch; beatIndex++) {
					var beat = makeBeat(false)
					beat.parent = currentTargetBeatGroup
					beat.x = beatIndex * (beatGroup.width * 0.75 / (maximumNumberOfDotsInALine - 1)) + beatGroup.width * 0.125
					currentTargetBeatGroup.beats.push(beat)
				}

				var line = new ShapeLayer.Line({
					from: new Point({x: beatGroup.beats[0].x, y: beatDiameter / 2.0}),
					to: new Point({x: beatGroup.beats[beatGroup.beats.length - 1].x, y: beatDiameter / 2.0}),
					parent: beatGroup
				})
				line.strokeColor = Color.orange
				line.strokeWidth = 4
				line.zPosition = -1

				var targetLine = new ShapeLayer.Line({
					from: new Point({x: beatGroup.beats[0].x, y: beatDiameter / 2.0}),
					to: new Point({x: currentTargetBeatGroup.beats[currentTargetBeatGroup.beats.length - 1].x, y: beatDiameter / 2.0}),
					parent: currentTargetBeatGroup
				})
				targetLine.strokeColor = Color.orange
				targetLine.strokeWidth = 4
				targetLine.zPosition = -1
				currentTargetBeatGroup.line = targetLine


				beatGroup.behaviors = [new ActionBehavior({handler: function() { beatBehavior(beatGroup) }})]
				activeBeatGroups.push(beatGroup)
			}

			currentNote = (currentNote + 1) % song.length
			lastBeatEmissionTime = t
		}
	}})
]

var touchBursts = []

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

	var isPastBurstingLine = beatGroup.y > currentTargetBeatGroup.y + beatDiameter / 3.0
	if (isPastBurstingLine && beatGroup.burst === undefined) {
		var matchedBeatCount = 0
		for (var beatIndex in beatGroup.beats) {
			beatIndex = parseInt(beatIndex)
			var beat = beatGroup.beats[beatIndex]
			if (beat.pairedTime !== undefined) {
				matchedBeatCount++
				if (beatIndex <= beatGroup.pitch) {
					addBurstEmitter(beat)					
				}
			} else {
				if (beatIndex > beatGroup.pitch) {
					addBurstEmitter(beat)					
				}
			}
		}

		if (matchedBeatCount === beatGroup.additionalBeats) {
			// new Sound({name: pitches[beatGroup.beats.length - 1]}).play()
			for (var beat of currentTargetBeatGroup.beats) {
				beat.animators.scale.target = new Point({x: 30, y: 30})
				beat.animators.alpha.target = 0
			}

			beatGroup.parent = undefined
			beatGroup.behaviors = []
			activeBeatGroups.splice(activeBeatGroups.indexOf(beatGroup), 1)

			currentTargetBeatGroup.line.parent = undefined
		} else {
			currentTargetBeatGroup.parent = undefined
		}

		beatGroup.burst = true
	}

	if (beatGroup.y > Layer.root.height) {
		beatGroup.parent = undefined
		beatGroup.behaviors = []
		activeBeatGroups.splice(activeBeatGroups.indexOf(beatGroup), 1)
	}
}

function nearestUnpairedBeatToPoint(point) {
	var beatGroup = activeBeatGroups[0] // only use the oldest beat group; assume that first element is oldest
	if (!beatGroup.burst) {
		for (let beatIndex = beatGroup.beats.length - 1; beatIndex >= 0; beatIndex--) {
			const beat = beatGroup.beats[beatIndex]
			if (beat.pairedTime === undefined) {
				return beat
			}
		}
	}

	return undefined
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

const availableButtons = 5

function makeToolbar(dotCounts) {
	var toolbarParent = bottomHalf
	var toolbarContainer = new Layer({parent: toolbarParent})
	toolbarContainer.width = toolbarParent.width
	toolbarContainer.height = 150
	toolbarContainer.originX = 0
	toolbarContainer.moveToBottomSideOfParentLayer()

	for (const dotCount of dotCounts) {
		makeToolbarButton(toolbarContainer, dotCount)
	}

	currentToolbar = toolbarContainer
}

function makeToolbarButton(toolbarContainer, dotCount) {
	const buttonIndex = dotCount - 1
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
		var dots = buttonContainer.sublayers
		for (let dotIndex = numberOfDots - 1; dotIndex >= 0; dotIndex--) {
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

		buttonContainer.parent = undefined
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

function makeBeat(inverted) {
	let beat = new Layer({parent: topHalf})
	beat.width = beat.height = beatDiameter
	const color = Color.orange
	if (inverted) {
		beat.border = new Border({width: 5, color: color})
		beat.backgroundColor = Color.white
	} else {
		beat.backgroundColor = color
	}
	beat.cornerRadius = beat.width / 2.0
	beat.origin = Point.zero
	beat.animators.alpha.springBounciness = 0
	beat.animators.alpha.springSpeed = 5
	beat.animators.scale.springBounciness = 0
	beat.animators.scale.springSpeed = 5
	return beat
}
