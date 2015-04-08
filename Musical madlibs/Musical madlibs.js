if (Layer.root.width != 1024) {
	throw "This prototype is meant to be run in landscape on an iPad!"
}

Layer.root.image = new Image({name: "bg"})

var lastPlayTime = Timestamp.currentTimestamp()
var beatIndex = 0

var soundEnabled = false
if (!soundEnabled) {
	Sound.prototype.play = function() {}
}

// Using an action behavior instead of a heartbeat because heartbeats still don't dispose properly on reload. :/
Layer.root.behaviors = [
	new ActionBehavior({handler: function() {
		var beatLength = 0.5
		var currentTimestamp = Timestamp.currentTimestamp()
		if (currentTimestamp - lastPlayTime > beatLength) {
			var sound = new Sound({name: (beatIndex < 5 ? "ta" : "tee")})
			sound.play()
			lastPlayTime += beatLength

			beatIndex = (beatIndex + 1) % 8
		}
	}})
]

var threeSnippet = makeSnippet("3 Brick", 3)
threeSnippet.position = Layer.root.position

var twoSnippet = makeSnippet("2 Brick", 2)
twoSnippet.position = Layer.root.position
twoSnippet.y += 200

function makeSnippet(name, size) {
	var layer = new Layer({imageName: name})
	layer.animators.scale.springSpeed = 40
	layer.animators.scale.springBounciness = 4
	layer.animators.position.springSpeed = 40
	layer.animators.position.springBounciness = 3
	layer.touchBeganHandler = function(sequence) {
		layer.animators.scale.target = new Point({x: 1.05, y: 1.05})
	}
	layer.touchMovedHandler = function(sequence) {
		layer.position = layer.position.add(sequence.currentSample.globalLocation.subtract(sequence.previousSample.globalLocation))
	}
	layer.touchEndedHandler = function(sequence) {
		var newOrigin = snapOriginToTrack(new Point({x: layer.position.x - layer.width / 2.0, y: layer.position.y - layer.height / 2.0}), layer.bounds.size, size)
		layer.animators.position.target = new Point({x: newOrigin.x + layer.width / 2.0, y: newOrigin.y + layer.height / 2.0})
		layer.animators.scale.target = new Point({x: 1.0, y: 1.0})
	}
	return layer
}

var firstTrackSlotX = 146
var trackSlotWidth = 146

function snapOriginToTrack(origin, size, blockCount) {
	if (origin.y > 60 && (origin.y + size.height) < 330 && origin.x > 130 && (origin.x + size.width) < 900) {
		var distanceFromTrackStart = Math.max(origin.x - firstTrackSlotX, 0)
		var shiftWithinSlot = ((blockCount * trackSlotWidth) - size.width) / 2.0
		var roundedSlotOriginX = Math.round((distanceFromTrackStart - shiftWithinSlot) / trackSlotWidth) * trackSlotWidth + firstTrackSlotX
		// Center within its slots
		var originX = roundedSlotOriginX + shiftWithinSlot
		return new Point({x: originX, y: 145})
	} else {
		return origin
	}
}