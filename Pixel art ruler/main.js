/*

Pixel Art Ruler
	built on Prototope@7093cfe20

Draw with blocks; the blocks' lengths count up and are displayed on screen.

Open questions:
	How should colors work?
	How should the numbers behave, especially when dragging vertically?
	What should happen if you overlap an existing drawing?
	Should there be any structure here? e.g. trace an existing drawing?

*/

var pixelGridSize = 64
var outerRulerCapSize = 10
var innerRulerCapSize = 5
var innerRulerPadding = 5

var touchCatchingLayer = new Layer()
touchCatchingLayer.frame = Layer.root.bounds

makeGrid()

var activeTouchID = null
var touchedBlock = null

var horizontalLabelLayer = null
var verticalLabelLayer = null

touchCatchingLayer.touchBeganHandler = function(touchSequence) {
	if (activeTouchID === null) {
		activeTouchID = touchSequence.id
		var randomHue = Math.random()
		var activeColor = new Color({hue: randomHue, saturation: 0.4, brightness: 1.0})

		var blockGridOrigin = roundPoint(touchSequence.currentSample.globalLocation)
		var block = makeBlock(blockGridOrigin.x, blockGridOrigin.y) 
		block.backgroundColor = activeColor
		touchedBlock = block

		horizontalLabelLayer = makeLabelLayer()
		horizontalLabelLayer.alpha = 0
		horizontalLabelLayer.animators.alpha.target = 1
		applyRulerLayout(horizontalLabelLayer, layoutHorizontalRulerOutside(block.frame), false)

		verticalLabelLayer = makeLabelLayer()
		verticalLabelLayer.alpha = 0
		verticalLabelLayer.animators.alpha.target = 1
		applyRulerLayout(verticalLabelLayer, layoutVerticalRulerOutside(block.frame), false)

		block.scale = 0.001
		block.animators.scale.target = new Point({x: 1, y: 1})
	}
}

touchCatchingLayer.touchMovedHandler = function(touchSequence) {
	if (activeTouchID === touchSequence.id) {
		var newBlockOrigin = roundPoint(touchSequence.currentSample.globalLocation)
		var firstBlockOrigin = roundPoint(touchSequence.firstSample.globalLocation)

		var newX = Math.min(newBlockOrigin.x, firstBlockOrigin.x)
		var newY = Math.min(newBlockOrigin.y, firstBlockOrigin.y)

		var newFrame = new Rect({
			x: newX,
			y: newY,
			width: Math.max(newBlockOrigin.x, firstBlockOrigin.x) - newX + pixelGridSize,
			height: Math.max(newBlockOrigin.y, firstBlockOrigin.y) - newY + pixelGridSize
		})

		touchedBlock.animators.frame.target = newFrame
		applyRulerLayout(horizontalLabelLayer, layoutHorizontalRulerOutside(newFrame), true)
		applyRulerLayout(verticalLabelLayer, layoutVerticalRulerOutside(newFrame), true)

		horizontalLabelLayer.label.text = (newFrame.size.width / pixelGridSize).toString()
		verticalLabelLayer.label.text = (newFrame.size.height / pixelGridSize).toString()
	}
}

touchCatchingLayer.touchEndedHandler = touchCatchingLayer.touchCancelledHandler = function(touchSequence) {
	if (activeTouchID === touchSequence.id) {
		var finalModelBlockSize = touchedBlock.animators.frame.target || touchedBlock.frame

		horizontalLabelLayer.sublayerNamed("label").scale = 0.3
		applyRulerLayout(horizontalLabelLayer, layoutHorizontalRulerInside(finalModelBlockSize), true)

		verticalLabelLayer.sublayerNamed("label").scale = 0.3
		applyRulerLayout(verticalLabelLayer, layoutVerticalRulerInside(finalModelBlockSize), true)

		activeTouchID = null
		touchedBlock = null
	}
}

function makeBlock(originX, originY) {
	var block = new Layer({parent: touchCatchingLayer})
	block.width = block.height = pixelGridSize
	block.originX = originX
	block.originY = originY

	block.animators.scale.springSpeed = 50
	block.animators.scale.springBounciness = 6
	block.animators.frame.springSpeed = 50
	block.animators.frame.springBounciness = 2

	return block
}

function roundPoint(point) {
	return new Point({x: Math.floor(point.x / pixelGridSize) * pixelGridSize, y: Math.floor(point.y / pixelGridSize) * pixelGridSize})
}

function makeGrid() {
	for (var row = 0; row < Layer.root.height / pixelGridSize; row++) {
		for (var column = 0; column < Layer.root.width / pixelGridSize; column++) {
			var gridBlock = new Layer()
			gridBlock.width = gridBlock.height = pixelGridSize
			gridBlock.originX = column * pixelGridSize
			gridBlock.originY = row * pixelGridSize
			gridBlock.border = new Border({color: Color.white, width: 1})
			gridBlock.alpha = 0.4
			gridBlock.userInteractionEnabled = false
		}
	}
}

function makeLabelLayer() {
	var container = new Layer()

	var labelLayer = new TextLayer({parent: container, name: "label"})
	labelLayer.fontName = "Futura"
	labelLayer.fontSize = 50
	labelLayer.text = "1"
	labelLayer.textColor = Color.black
	container.label = labelLayer

	var labelGuideColor = Color.black

	var minCap = new Layer({parent: container, name: "minCap"})
	minCap.backgroundColor = labelGuideColor

	var maxCap = new Layer({parent: container, name: "maxCap"})
	maxCap.backgroundColor = labelGuideColor

	var line = new Layer({parent: container, name: "line"})
	line.backgroundColor = labelGuideColor

	var springSpeed = 30;
	var springBounciness = 7;
	for (var sublayerIndex in container.sublayers) {
		container.sublayers[sublayerIndex].animators.position.springSpeed = springSpeed
		container.sublayers[sublayerIndex].animators.frame.springSpeed = springSpeed

		container.sublayers[sublayerIndex].animators.position.springBounciness = springBounciness
		container.sublayers[sublayerIndex].animators.frame.springBounciness = springBounciness
	}

	return container
}

var rulerLineOffset = 18

function layoutHorizontalRulerOutside(blockFrame) {
	return {
		labelPosition: new Point({
			x: blockFrame.midX,
			y: blockFrame.minY - pixelGridSize / 2.0 - rulerLineOffset
		}),
		minCapFrame: new Rect({
			x: blockFrame.minX,
			y: blockFrame.minY - (pixelGridSize - outerRulerCapSize) / 2.0 - outerRulerCapSize + rulerLineOffset,
			width: 1,
			height: outerRulerCapSize
		}),
		maxCapFrame: new Rect({
			x: blockFrame.maxX,
			y: blockFrame.minY - (pixelGridSize - outerRulerCapSize) / 2.0 - outerRulerCapSize + rulerLineOffset,
			width: 1,
			height: outerRulerCapSize
		}),
		lineFrame: new Rect({
			x: blockFrame.minX,
			y: blockFrame.minY - pixelGridSize / 2.0 + rulerLineOffset,
			width: blockFrame.size.width,
			height: 1
		})
	}
}

function layoutVerticalRulerOutside(blockFrame) {
	return {
		labelPosition: new Point({
			x: blockFrame.minX - pixelGridSize / 2.0 - rulerLineOffset,
			y: blockFrame.midY
		}),
		minCapFrame: new Rect({
			x: blockFrame.minX - (pixelGridSize - outerRulerCapSize) / 2.0 - outerRulerCapSize + rulerLineOffset,
			y: blockFrame.minY,
			width: outerRulerCapSize,
			height: 1
		}),
		maxCapFrame: new Rect({
			x: blockFrame.minX - (pixelGridSize - outerRulerCapSize) / 2.0 - outerRulerCapSize + rulerLineOffset,
			y: blockFrame.maxY,
			width: outerRulerCapSize,
			height: 1
		}),
		lineFrame: new Rect({
			x: blockFrame.minX - pixelGridSize / 2.0 + rulerLineOffset,
			y: blockFrame.minY,
			width: 1,
			height: blockFrame.size.height
		})
	}
}

function layoutHorizontalRulerInside(blockFrame) {
	return {
		labelPosition: new Point({
			x: blockFrame.midX,
			y: blockFrame.minY + rulerLineOffset
		}),
		minCapFrame: new Rect({
			x: blockFrame.minX + innerRulerCapSize + innerRulerPadding * 2.0,
			y: blockFrame.minY + innerRulerPadding,
			width: 1,
			height: innerRulerCapSize
		}),
		maxCapFrame: new Rect({
			x: blockFrame.maxX - innerRulerPadding,
			y: blockFrame.minY + innerRulerPadding,
			width: 1,
			height: innerRulerCapSize
		}),
		lineFrame: new Rect({
			x: blockFrame.minX + innerRulerCapSize + innerRulerPadding * 2.0,
			y: blockFrame.minY + innerRulerPadding + innerRulerCapSize / 2.0 - 0.5,
			width: blockFrame.size.width - (innerRulerCapSize + innerRulerPadding * 3.0),
			height: 1
		})
	}
}

function layoutVerticalRulerInside(blockFrame) {
	return {
		labelPosition: new Point({
			x: blockFrame.minX + rulerLineOffset,
			y: blockFrame.midY
		}),
		minCapFrame: new Rect({
			x: blockFrame.minX + innerRulerPadding,
			y: blockFrame.minY + innerRulerCapSize + innerRulerPadding * 2.0,
			width: innerRulerCapSize,
			height: 1
		}),
		maxCapFrame: new Rect({
			x: blockFrame.minX + innerRulerPadding,
			y: blockFrame.maxY - innerRulerPadding,
			width: innerRulerCapSize,
			height: 1
		}),
		lineFrame: new Rect({
			x: blockFrame.minX + innerRulerPadding + innerRulerCapSize / 2.0 - 0.5,
			y: blockFrame.minY + innerRulerCapSize + innerRulerPadding * 2.0,
			width: 1,
			height: blockFrame.size.height - (innerRulerCapSize + innerRulerPadding * 3.0)
		})
	}
}

function applyRulerLayout(ruler, layout, animated) {
	if (animated) {
		ruler.sublayerNamed("label").animators.position.target = layout.labelPosition
		ruler.sublayerNamed("minCap").animators.frame.target = layout.minCapFrame
		ruler.sublayerNamed("maxCap").animators.frame.target = layout.maxCapFrame
		ruler.sublayerNamed("line").animators.frame.target = layout.lineFrame
	} else {
		ruler.sublayerNamed("label").position = layout.labelPosition
		ruler.sublayerNamed("minCap").frame = layout.minCapFrame
		ruler.sublayerNamed("maxCap").frame = layout.maxCapFrame
		ruler.sublayerNamed("line").frame = layout.lineFrame
	}
}