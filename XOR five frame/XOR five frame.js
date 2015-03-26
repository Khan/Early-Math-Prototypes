
// these are the early math riffs off of the KA color palette *for now*
// it would be nice to have these pulled off of something central eventually!

var kacolors = [];

kacolors[0] = new Color({hue: 0.78, saturation: 0.41, brightness: 0.61})
kacolors[1] = new Color({hue: 0.96, saturation: 0.60, brightness: 0.71})
kacolors[2] = new Color({hue: 0.01, saturation: 0.66, brightness: 0.98})
kacolors[3] = new Color({hue: 0.08, saturation: 0.67, brightness: 0.91})
kacolors[4] = new Color({hue: 0.28, saturation: 0.55, brightness: 0.72})
kacolors[5] = new Color({hue: 0.45, saturation: 0.60, brightness: 0.78})
kacolors[6] = new Color({hue: 0.53, saturation: 0.67, brightness: 0.79})
kacolors[7] = new Color({hue: 0.57, saturation: 0.41, brightness: 0.58})

var kagreys = []

kagreys[0] = new Color({hue: 0.0, saturation: 0.0, brightness: 0.07})
kagreys[1] = new Color({hue: 0.0, saturation: 0.0, brightness: 0.20})
kagreys[2] = new Color({hue: 0.0, saturation: 0.0, brightness: 0.33})
kagreys[3] = new Color({hue: 0.0, saturation: 0.0, brightness: 0.60})
kagreys[4] = new Color({hue: 0.0, saturation: 0.0, brightness: 0.67})
kagreys[5] = new Color({hue: 0.0, saturation: 0.0, brightness: 0.87})
kagreys[6] = new Color({hue: 0.0, saturation: 0.0, brightness: 0.93})

//============================================================================

var borderWidth = 0.5
var blockSize = 125

function makeBlock(solid, mask) {
	var color = kacolors[5]
	var block = new Layer()
	block.width = block.height = blockSize
	block.backgroundColor = solid ? color : (mask ? Color.clear : Color.white)
	if (!mask) {
		block.border = new Border({width: borderWidth, color: solid ? Color.white : color})
	}
	return block
}

function makeBlockSequence(quantity, sequenceSize, inverted, mask) {
	var container = new Layer()
	container.width = blockSize * sequenceSize
	container.height = blockSize
	for (var blockIndex = 0; blockIndex < sequenceSize; blockIndex++) {
		var solid = (blockIndex < quantity) ? !inverted : inverted
		var block = makeBlock(solid, mask)
		if (!mask) {
			block.width = block.height = block.width - (borderWidth * 2)
		}
		block.originX = (block.width + borderWidth * (mask ? -1 : 1)) * blockIndex
		block.originY = 0
		block.parent = container
	}
	return container
}

var firstCount = 2
var secondCount = 5
var frameSize = 5

var first = makeBlockSequence(firstCount, frameSize, false, false)
first.x = Layer.root.x
first.y = Layer.root.y * 0.75

var second = makeBlockSequence(secondCount, frameSize, false, false)
second.x = Layer.root.x
second.y = Layer.root.y * 1.25

var secondInverse = makeBlockSequence(secondCount, frameSize, true, false)
secondInverse.parent = second
secondInverse.origin = Point.zero

var secondInverseMask = makeBlockSequence(firstCount, frameSize, false, true)
secondInverseMask.origin = Point.zero
secondInverse.maskLayer = secondInverseMask

first.gestures = [makeMoveGesture(first)]
second.gestures = [makeMoveGesture(second)]

function makeMoveGesture(sequence) {
	return new PanGesture({handler: function(phase, centroidSequence) {
		if (phase == ContinuousGesturePhase.Changed) {
			sequence.position = sequence.position.add(centroidSequence.currentSample.globalLocation.subtract(centroidSequence.previousSample.globalLocation))
			updateMaskPosition(secondInverseMask, second, first)
		}
	}})
}

function updateMaskPosition(maskLayer, maskedLayer, otherLayer) {
	var otherLayerGlobalOrigin = otherLayer.convertLocalPointToGlobalPoint(Point.zero)
	var maskedLayerLocalOrigin = maskedLayer.convertGlobalPointToLocalPoint(otherLayerGlobalOrigin)
	maskLayer.origin = maskedLayerLocalOrigin
}

updateMaskPosition(secondInverseMask, second, first)