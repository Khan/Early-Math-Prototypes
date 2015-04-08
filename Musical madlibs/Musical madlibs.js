if (Layer.root.width != 1024) {
	throw "This prototype is meant to be run in landscape on an iPad!"
}


var firstTrackSlotX = 146
var trackCenterY = 195
var trackSlotWidth = 146
var trackLength = 5


Layer.root.image = new Image({name: "bg"})

var lastPlayTime = Timestamp.currentTimestamp()
var beatIndex = 0

var trackEntries = new Map()

var soundEnabled = true
if (!soundEnabled) {
	Sound.prototype.play = function() {}
}

// Using an action behavior instead of a heartbeat because heartbeats still don't dispose properly on reload. :/
Layer.root.behaviors = [
	new ActionBehavior({handler: function() {
		var beatLength = 0.3
		var currentTimestamp = Timestamp.currentTimestamp()
		if (currentTimestamp - lastPlayTime > beatLength) {
			trackEntries.forEach(function (value, key) {
				var beatWithinSnippet = beatIndex - value
				if (beatWithinSnippet >= 0 && beatWithinSnippet < key.blockCount && key.samples !== undefined) {
					// var sound = new Sound({name: (beatIndex < 5 ? "ta" : "tee")})
					var sound = new Sound({name: key.samples[beatWithinSnippet]})
					sound.play()
				}
			})

			lastPlayTime += beatLength

			beatIndex = (beatIndex + 1) % 8
		}
	}})
]

var threeSnippet = makeSnippet("3 Brick", 3, ["cat_e", "cat_gsharp", "cat_b"])
threeSnippet.layer.position = Layer.root.position

var twoSnippet = makeSnippet("2 Brick", 2, ["cat_gsharp", "cat_e"])
twoSnippet.layer.position = Layer.root.position
twoSnippet.layer.y += 200

var highestSnippetZ = 0

function makeSnippet(name, size, samples) {
	var layer = new Layer({imageName: name})
	var snippet = {layer: layer, blockCount: size, samples: samples}

	layer.animators.scale.springSpeed = 40
	layer.animators.scale.springBounciness = 4
	layer.animators.position.springSpeed = 40
	layer.animators.position.springBounciness = 3

	layer.touchBeganHandler = function(sequence) {
		highestSnippetZ++
		layer.zPosition = highestSnippetZ
		layer.animators.scale.target = new Point({x: 1.05, y: 1.05})
	}
	layer.touchMovedHandler = function(sequence) {
		layer.position = layer.position.add(sequence.currentSample.globalLocation.subtract(sequence.previousSample.globalLocation))
	}
	layer.touchEndedHandler = function(sequence) {
		var snippetOrigin = new Point({x: layer.position.x - layer.width / 2.0, y: layer.position.y - layer.height / 2.0})
		var slot = trackSlotForSnippetOrigin(snippetOrigin, layer.bounds.size, size)
		if (slot !== undefined) {
			var newOrigin = originForTrackSlot(slot, layer.bounds.size, size)
			if (canPutSnippetAtSlot(snippet, slot)) {
				trackEntries.set(snippet, slot)
			} else {
				trackEntries.delete(snippet)
				var snippetCenter = snippetOrigin.y + layer.height / 2.0
				var newOriginY = null
				if (snippetCenter > trackCenterY) {
					newOriginY = trackCenterY + 65
				} else {
					newOriginY = trackCenterY - 65 - layer.height
				}
				newOrigin = new Point({x: snippetOrigin.x, y: newOriginY})
			}
			layer.animators.position.target = new Point({x: newOrigin.x + layer.width / 2.0, y: newOrigin.y + layer.height / 2.0})
		} else {
			trackEntries.delete(snippet)
		}
		layer.animators.scale.target = new Point({x: 1.0, y: 1.0})
	}

	return snippet
}

function canPutSnippetAtSlot(snippet, slot) {
	var result = true
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
	if (snippetOrigin.y > 60 && (snippetOrigin.y + snippetSize.height) < 330 && snippetOrigin.x > 130 && (snippetOrigin.x + snippetSize.width) < 900) {
		var shiftWithinSlot = offsetWithinTrackSlot(snippetSize.width, blockCount)
		var distanceFromTrackStart = Math.max(snippetOrigin.x - firstTrackSlotX, 0)
		var trackSlot = Math.round((distanceFromTrackStart - shiftWithinSlot) / trackSlotWidth)
		if (trackSlot >= 0 && trackSlot <= (trackLength - blockCount)) {
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