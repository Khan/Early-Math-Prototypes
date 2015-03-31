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

if (Layer.root.width != 1024) {
	throw "This prototype wants to be run in landscape on an iPad!"
}

var toolbarColors = [
	new Color({hex: "9B73AB"}),
	new Color({hex: "C55F73"}),
	new Color({hex: "FA6255"}),
	new Color({hex: "EFAC5F"}),
	new Color({hex: "83C166"}),
	new Color({hex: "5CD0B1"}),
	new Color({hex: "4FBAD3"}),
	new Color({hex: "6A8CA6"}),
	new Color({hex: "1F2C35"}),
	new Color({hex: "FEFFFF"})
]

var pixelGridSize = 48
var outerRulerCapSize = 10
var outerRulerLineOffset = 18
var innerRulerCapSize = 5
var innerRulerPadding = 5

var toolbarFirstWellPoint = 95
var toolbarWellWidth = 84
var toolbarSelectionCenter = 38

var touchCatchingLayer = new Layer()
touchCatchingLayer.frame = Layer.root.bounds

var toolbar = makeToolbar()

// State
var activeTouchID = null
var touchedBlock = null
var horizontalLabelLayer = null
var verticalLabelLayer = null
var paintedBlockCount = 0
var activeColor = toolbarColors[0]

touchCatchingLayer.touchBeganHandler = function(touchSequence) {
	if (activeTouchID === null) {
		activeTouchID = touchSequence.id

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
		// Don't let the blocks overlap the toolbar
		var clippedLocation = new Point({
			x: touchSequence.currentSample.globalLocation.x,
			y: clip({
				value: touchSequence.currentSample.globalLocation.y,
				min: 0,
				max: (Math.floor(toolbar.origin.y / pixelGridSize) * pixelGridSize) - pixelGridSize
			})
		})
		var newBlockOrigin = roundPoint(clippedLocation)
		var firstBlockOrigin = roundPoint(touchSequence.firstSample.globalLocation)

		var newX = Math.min(newBlockOrigin.x, firstBlockOrigin.x)
		var newY = Math.min(newBlockOrigin.y, firstBlockOrigin.y)

		var newFrame = new Rect({
			x: newX,
			y: newY,
			width: Math.max(newBlockOrigin.x, firstBlockOrigin.x) - newX + pixelGridSize,
			height: Math.max(newBlockOrigin.y, firstBlockOrigin.y) - newY + pixelGridSize
		})

		if (touchedBlock.grid !== undefined) {
			touchedBlock.grid.parent = undefined
		}
		touchedBlock.grid = makeGrid(touchedBlock, newFrame.size)

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
		setRulerColor(horizontalLabelLayer, (activeColor === toolbarColors[8]) ? Color.white : Color.black)
		applyRulerLayout(horizontalLabelLayer, layoutHorizontalRulerInside(finalModelBlockSize), true)

		verticalLabelLayer.sublayerNamed("label").scale = 0.3
		setRulerColor(verticalLabelLayer, (activeColor === toolbarColors[8]) ? Color.white : Color.black)
		applyRulerLayout(verticalLabelLayer, layoutVerticalRulerInside(finalModelBlockSize), true)

		activeTouchID = null
		touchedBlock = null
		paintedBlockCount++

	}
}

//============================================================================================

function makeBlock(originX, originY) {
	var block = new Layer()
	block.width = block.height = pixelGridSize
	block.originX = originX
	block.originY = originY
	block.userInteractionEnabled = false
	if (activeColor === toolbarColors[9]) {
		block.border = new Border({color: new Color({white: 0.9}), width: 1})
	}

	block.animators.scale.springSpeed = 50
	block.animators.scale.springBounciness = 6
	block.animators.frame.springSpeed = 50
	block.animators.frame.springBounciness = 2

	return block
}

function roundPoint(point) {
	return new Point({x: Math.floor(point.x / pixelGridSize) * pixelGridSize, y: Math.floor(point.y / pixelGridSize) * pixelGridSize})
}

function makeGrid(blockLayer, size) {
	var container = new Layer({parent: blockLayer})
	container.size = size
	container.origin = Point.zero
	for (var row = 0; row <= size.height / pixelGridSize; row++) {
		for (var column = 0; column <= size.width / pixelGridSize; column++) {
			var gridBlock = new Layer({parent: container})
			gridBlock.width = gridBlock.height = pixelGridSize
			gridBlock.originX = column * pixelGridSize
			gridBlock.originY = row * pixelGridSize
			gridBlock.border = new Border({color: Color.white, width: 1})
			gridBlock.alpha = 0.4
			gridBlock.userInteractionEnabled = false
		}
	}
	return container
}

function makeLabelLayer() {
	var container = new Layer()
	container.userInteractionEnabled = false

	var color = Color.black

	var labelLayer = new TextLayer({parent: container, name: "label"})
	labelLayer.fontName = "Futura"
	labelLayer.fontSize = 50
	labelLayer.text = "1"
	labelLayer.textColor = color
	container.label = labelLayer

	var labelGuideColor = color

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

function layoutHorizontalRulerOutside(blockFrame) {
	return {
		labelPosition: new Point({
			x: blockFrame.midX,
			y: blockFrame.minY - pixelGridSize / 2.0 - outerRulerLineOffset
		}),
		minCapFrame: new Rect({
			x: blockFrame.minX,
			y: blockFrame.minY - (pixelGridSize - outerRulerCapSize) / 2.0 - outerRulerCapSize + outerRulerLineOffset,
			width: 1,
			height: outerRulerCapSize
		}),
		maxCapFrame: new Rect({
			x: blockFrame.maxX,
			y: blockFrame.minY - (pixelGridSize - outerRulerCapSize) / 2.0 - outerRulerCapSize + outerRulerLineOffset,
			width: 1,
			height: outerRulerCapSize
		}),
		lineFrame: new Rect({
			x: blockFrame.minX,
			y: blockFrame.minY - pixelGridSize / 2.0 + outerRulerLineOffset,
			width: blockFrame.size.width,
			height: 1
		})
	}
}

function layoutVerticalRulerOutside(blockFrame) {
	return {
		labelPosition: new Point({
			x: blockFrame.minX - pixelGridSize / 2.0 - outerRulerLineOffset,
			y: blockFrame.midY
		}),
		minCapFrame: new Rect({
			x: blockFrame.minX - (pixelGridSize - outerRulerCapSize) / 2.0 - outerRulerCapSize + outerRulerLineOffset,
			y: blockFrame.minY,
			width: outerRulerCapSize,
			height: 1
		}),
		maxCapFrame: new Rect({
			x: blockFrame.minX - (pixelGridSize - outerRulerCapSize) / 2.0 - outerRulerCapSize + outerRulerLineOffset,
			y: blockFrame.maxY,
			width: outerRulerCapSize,
			height: 1
		}),
		lineFrame: new Rect({
			x: blockFrame.minX - pixelGridSize / 2.0 + outerRulerLineOffset,
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
			y: blockFrame.minY + outerRulerLineOffset
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
			x: blockFrame.minX + outerRulerLineOffset,
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

function setRulerColor(ruler, color) {
	ruler.label.textColor = color
	ruler.sublayerNamed("minCap").backgroundColor = color
	ruler.sublayerNamed("maxCap").backgroundColor = color
	ruler.sublayerNamed("line").backgroundColor = color
}

//============================================================================

function makeToolbar() {
	var toolbar = new Layer({imageName: "toolbar"})
	toolbar.x = Layer.root.x
	toolbar.originY = Layer.root.frameMaxY - toolbar.height
	toolbar.zPosition = 100000
  
  	toolbar.selectionDotLayer = makeToolbarSelectionDot(toolbar, 0)

	toolbar.touchBeganHandler = function(touchSequence) {
		var index = clip({
			value: Math.floor((touchSequence.currentSample.globalLocation.x - toolbarFirstWellPoint) / toolbarWellWidth),
			min: 0,
			max: 9
		})
		activeColor = toolbarColors[index]

		toolbar.selectionDotLayer.animators.scale.target = new Point({x: 0, y: 0})
		var oldSelectionDotLayer = toolbar.selectionDotLayer
		toolbar.selectionDotLayer.animators.scale.completionHandler = function() { oldSelectionDotLayer.parent = undefined }
	  	toolbar.selectionDotLayer = makeToolbarSelectionDot(toolbar, index)
	  	toolbar.selectionDotLayer.scale = 0.0001
	  	toolbar.selectionDotLayer.animators.scale.target = new Point({x: 1.2, y: 1.2})
	}

	toolbar.touchEndedHandler = function(touchSequence) {
		toolbar.selectionDotLayer.animators.scale.target = new Point({x: 1, y: 1})
	}
  
  return toolbar
}

function makeToolbarSelectionDot(toolbar, index) {
  var dot = new Layer({parent: toolbar})
  dot.width = dot.height = 40
  dot.backgroundColor = index == 9 ? Color.black : Color.white
  dot.alpha = 0.5
  dot.cornerRadius = dot.width / 2
  dot.y = toolbar.bounds.midY
  dot.x = toolbarFirstWellPoint + toolbarWellWidth * index + toolbarSelectionCenter
  dot.animators.scale.springBounciness = 3
  dot.animators.scale.springSpeed = 20
  return dot
}