if (Layer.root.width != 1024) {
	throw "This prototype is meant to be run in landscape on an iPad!"
}

// Global sound switch: disable to avoid annoyance during development!
var soundEnabled = false

var firstTrackSlotX = 23
var trackCenterY = 69
var trackSlotWidth = 118
var dotBaseline = trackCenterY - 85

var openTrackLength = 5
var totalTrackLength = 8

var slotDots = []
var trackEntries = new Map()


Layer.root.backgroundColor = new Color({white: 0.886})

var track = makeTrack(openTrackLength, totalTrackLength)

var threeSnippet = makeSnippet("3 Brick - orange - C E G", 3, ["cat_e", "cat_gsharp", "cat_b"])
threeSnippet.layer.position = Layer.root.position
threeSnippet.layer.parent = track

var twoSnippet = makeSnippet("2 Brick - blue - E C", 2, ["dog_gsharp", "dog_e"])
twoSnippet.layer.position = Layer.root.position
twoSnippet.layer.y += 150
twoSnippet.layer.parent = track

var oneSnippet = makeSnippet("1 Brick - orange - C8", 1, ["cat_e8"])
oneSnippet.layer.position = twoSnippet.layer.position
oneSnippet.layer.y += 150
oneSnippet.layer.parent = track

var twoSnippetAlt = makeSnippet("2 Brick - orange - F E", 2, ["cat_a", "cat_gsharp"])
twoSnippetAlt.layer.position = twoSnippet.layer.position
twoSnippetAlt.layer.x += 300
twoSnippetAlt.layer.parent = track

makeSlotDots()

//============================================================================================
// Audio

if (!soundEnabled) { Sound.prototype.play = function() {} }

var lastPlayTime = Timestamp.currentTimestamp()
var beatIndex = 0

// Using an action behavior instead of a heartbeat because heartbeats still don't dispose properly on reload. :/
Layer.root.behaviors = [
	new ActionBehavior({handler: function() {
		var beatLength = 0.3
		var dotAnimationLength = 0.18
		var currentTimestamp = Timestamp.currentTimestamp()

		if (currentTimestamp - lastPlayTime > beatLength - dotAnimationLength) {
			var currentDot = slotDots[beatIndex]
			currentDot.animators.scale.target = new Point({x: 1, y: 1})
			currentDot.animators.y.target = dotBaseline + 30
			currentDot.animators.alpha.target = 1

			var lastBeatIndex = beatIndex - 1
			if (lastBeatIndex < 0) {
				lastBeatIndex = totalTrackLength - 1
			}
			var lastDot = slotDots[lastBeatIndex]
			lastDot.animators.scale.target = new Point({x: 0, y: 0})
			lastDot.animators.y.target = dotBaseline
			lastDot.animators.alpha.target = 0
		}
		if (currentTimestamp - lastPlayTime > beatLength) {
			var foundSound = false
			trackEntries.forEach(function (value, key) {
				var beatWithinSnippet = beatIndex - value
				if (!foundSound && beatWithinSnippet >= 0 && beatWithinSnippet < key.blockCount && key.samples !== undefined) {
					var sound = new Sound({name: key.samples[beatWithinSnippet]})
					sound.play()
					foundSound = true
				}
			})
			if (!foundSound) {
				var sound = new Sound({name: beatIndex < openTrackLength ? "ta" : "tee"})
				sound.play()
			}

			lastPlayTime += beatLength
			beatIndex = (beatIndex + 1) % totalTrackLength
		}
	}})
]


//============================================================================================
// Snippets

var highestSnippetZ = 0
function makeSnippet(name, size, samples) {
	var layer = new Layer({imageName: name})
	var snippet = {layer: layer, blockCount: size, samples: samples}

	layer.animators.scale.springSpeed = 40
	layer.animators.scale.springBounciness = 4
	layer.animators.position.springSpeed = 40
	layer.animators.position.springBounciness = 3

	layer.touchBeganHandler = function(sequence) {
		trackEntries.delete(snippet)
		highestSnippetZ++
		layer.zPosition = highestSnippetZ
		layer.animators.scale.target = new Point({x: 1.05, y: 1.05})
		layer.initialPosition = layer.position
	}
	layer.touchMovedHandler = function(sequence) {
		var newPosition = layer.initialPosition.add(sequence.currentSample.globalLocation.subtract(sequence.firstSample.globalLocation))
		var constrainedPosition = positionConstrainedWithinRect(layer, layer.parent.bounds)
		layer.position = constrainedPosition.add(newPosition.subtract(constrainedPosition).divide(2))
	}
	layer.touchEndedHandler = function(sequence) {
		var snippetOrigin = new Point({x: layer.position.x - layer.width / 2.0, y: layer.position.y - layer.height / 2.0})
		var slot = trackSlotForSnippetOrigin(snippetOrigin, layer.bounds.size, size)
		if (slot !== undefined) {
			var newOrigin = originForTrackSlot(slot, layer.bounds.size, size)
			if (canPutSnippetAtSlot(snippet, slot)) {
				trackEntries.set(snippet, slot)
			} else {
				var snippetCenter = snippetOrigin.y + layer.height / 2.0
				newOrigin = new Point({x: snippetOrigin.x, y: trackCenterY + layer.height * 0.75})
			}
			layer.animators.position.target = new Point({x: newOrigin.x + layer.width / 2.0, y: newOrigin.y + layer.height / 2.0})
		} else {
			layer.animators.position.target = positionConstrainedWithinRect(layer, layer.parent.bounds.inset({value: 20}))
		}
		layer.animators.scale.target = new Point({x: 1.0, y: 1.0})
	}

	return snippet
}

function positionConstrainedWithinRect(layer, rect) {
	var constrainedX = clip({value: layer.position.x, min: rect.origin.x + layer.frame.size.width / 2.0, max: rect.origin.x + rect.size.width - layer.frame.size.width / 2.0})
	var constrainedY = clip({value: layer.position.y, min: rect.origin.y + layer.frame.size.height / 2.0, max: rect.origin.y + rect.size.height - layer.frame.size.height / 2.0})
	return new Point({x: constrainedX, y: constrainedY})
}

//============================================================================================
// Tracks

function makeTrack(openLength, totalLength) {
	var containerMargin = 10
	var container = new Layer()
	container.frame = Layer.root.bounds.inset({value: containerMargin})
	container.backgroundColor = Color.white
	container.cornerRadius = 22.5

	for (var slotIndex = 0; slotIndex < totalLength; slotIndex++) {
		var slot = makeSlot(slotIndex < openLength)
		slot.parent = container
		slot.x = firstTrackSlotX + (slotIndex + 0.5) * trackSlotWidth
		slot.y = trackCenterY
	}

	return container
}

function makeSlot(isOpen) {
	var slot = new Layer()
	if (isOpen) {
		slot.border = new Border({width: 4, color: new Color({white: 0.92})})
	} else {
		slot.backgroundColor = new Color({white: 0.984})
	}
	slot.width = slot.height = 87
	slot.cornerRadius = 22.5
	slot.userInteractionEnabled = false
	return slot
}

function makeSlotDots() {
	for (var slotIndex = 0; slotIndex < totalTrackLength; slotIndex++) {
		var dot = new Layer()
		dot.backgroundColor = Color.gray
		dot.width = dot.height = 13
		dot.cornerRadius = dot.width / 2.0
		dot.scale = 0.001
		dot.alpha = 0
		dot.y = dotBaseline
		dot.x = firstTrackSlotX + trackSlotWidth * (slotIndex + 0.5)
		dot.parent = track

		if (slotIndex >= openTrackLength) {
			dot.border = new Border({width: 1.5, color: dot.backgroundColor})
			dot.backgroundColor = Color.clear
		}

		dot.animators.scale.springSpeed = 60
		dot.animators.scale.springBounciness = 0
		dot.animators.y.springSpeed = 50
		dot.animators.y.springBounciness = 0
		dot.animators.alpha.springSpeed = 40
		dot.animators.alpha.springBounciness = 0
		slotDots.push(dot)
	}
}

//============================================================================================
// Snippet + slot arithmetic

function canPutSnippetAtSlot(snippet, slot) {
	var result = true
	if (slot + snippet.blockCount > openTrackLength) {
		return false
	}
	trackEntries.forEach(function(value, key) {
		if (key === snippet) {
			return
		}
		var isLeftOfCurrentSnippet = (slot + snippet.blockCount) <= value
		var isRightOfCurrentSnippet = slot >= (value + key.blockCount)
		result = result && (isLeftOfCurrentSnippet || isRightOfCurrentSnippet)
	})
	return result
}

function offsetWithinTrackSlot(snippetWidth, blockCount) {
	return ((blockCount * trackSlotWidth) - snippetWidth) / 2.0
}

function trackSlotForSnippetOrigin(snippetOrigin, snippetSize, blockCount) {
	if (snippetOrigin.y > (trackCenterY - snippetSize.height * 1.25) && (snippetOrigin.y + snippetSize.height) < (trackCenterY + snippetSize.height * 1.25)) {
		var shiftWithinSlot = offsetWithinTrackSlot(snippetSize.width, blockCount)
		var distanceFromTrackStart = Math.max(snippetOrigin.x - firstTrackSlotX, 0)
		var trackSlot = Math.round((distanceFromTrackStart - shiftWithinSlot) / trackSlotWidth)
		if (trackSlot >= 0 && trackSlot <= (totalTrackLength - blockCount)) {
			return trackSlot
		} else {
			return undefined
		}
	} else {
		return undefined
	}
}

function originForTrackSlot(trackSlot, size, blockCount) {
	var originX = trackSlot * trackSlotWidth + firstTrackSlotX + offsetWithinTrackSlot(size.width, blockCount)
	return new Point({x: originX, y: trackCenterY - size.height / 2.0})
}