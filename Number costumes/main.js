

/* 

Number Costumes
	built on Prototope @cf00c1f

This is a mess and severely unfinished.

*/

Layer.root.backgroundColor = new Color({hue: (44.0/360.0), saturation: 0.1, brightness: 1.0})

// TODO: you currently can't attach touch handlers to the root layer. oops.
var touchLayer = new Layer()
touchLayer.frame = Layer.root.bounds

// Global thangs
var bgColor = new Color({hex: "C45E73"})
var size = new Size({width: 44, height: 44})

var _2Layer = makeTextLayer("2")
var _twoLayer = makeTextLayer("two")


function makeTextLayer(text) {
	var numberLayer = new TextLayer()
	numberLayer.text = text
	numberLayer.font = "Avenir-Heavy"
	numberLayer.fontSize = 50
	numberLayer.position = touchLayer.position
	numberLayer.textColor = bgColor
	
	return numberLayer
}

var blocksLayer = new Layer()
blocksLayer.backgroundColor = new Color({hue: 0.1, saturation: 0.5, brightness: 1.0})
blocksLayer.size = new Size({width: 150, height: 150})
blocksLayer.x = 200
blocksLayer.y = 200


function makeBlock() {
	var block = new Layer()
	block.backgroundColor = bgColor
	block.size = size
	block.parent = blocksLayer
	
	return block
}

var leftBlock = makeBlock()
var rightBlock = makeBlock()

leftBlock.frameMinX = 10
leftBlock.frameMinY = 10

rightBlock.moveToRightOfSiblingLayer({siblingLayer: leftBlock, margin: 5})
rightBlock.frameMinY = leftBlock.frameMinY


var dotsLayer = new Layer()
dotsLayer.backgroundColor = Color.black

function makeDot() {
	var dot = new Layer()
	dot.backgroundColor = bgColor
	dot.size = size
	dot.cornerRadius = dot.height / 2.0
	dot.parent = dotsLayer
	
	return dot
}

var leftDot = makeDot()
var rightDot = makeDot()

function lineupSublayers(parent) {
	
	var layerX = 5
	var layerHeight = 0
	for (var i = 0; i < parent.sublayers.length; i++) {
		var layer = parent.sublayers[i]
		layer.frameMinX = layerX
		layer.frameMinY = 5
		layerX = layer.frameMaxX + 5
		layerHeight = layer.height
	}
	
	parent.size = new Size({width: layerX, height: layerHeight + 10})
}

lineupSublayers(blocksLayer)
lineupSublayers(dotsLayer)


var numberLayer = new Layer()
// numberLayer.backgroundColor = Color.purple

function makeLayerDragable(layer) {
	
	layer.touchMovedHandler = function(touchSequence) {
		layer.position = touchSequence.currentSample.globalLocation
	}

}

function makeLayerTappable(layer, handler) {
	layer.gestures = [ new TapGesture({handler: handler}) ]
}

var showingPicker = false
// makeLayerDragable(numberLayer)
makeLayerTappable(numberLayer, function() {
	if (showingPicker) {
		
	} else {
		showPicker()
	}
	
	// showingPicker = !showingPicker
})

var lineLayer = new Layer()
lineLayer.backgroundColor = bgColor
lineLayer.size = new Size({width: 300, height: 3})

var thumbLayer = new Layer({imageName: "triangle"})
thumbLayer.touchMovedHandler = function(touchSequence) {
	var location = touchSequence.currentSample.locationInLayer(thumbLayer)
	
	thumbLayer.x = location.x
}

var costumes = [_2Layer, _twoLayer, blocksLayer, dotsLayer]
var currentCostume = _2Layer

function setupNumberLayers() {
	for (var index in costumes) {
		var costume = costumes[index]
		costume.parent = numberLayer
		costume.moveToCenterOfParentLayer()
		// TODO(jb): It'd be nice to have a hidden property, but this'll do.
		costume.alpha = costume == currentCostume
	}
	
	lineLayer.parent = numberLayer
	lineLayer.moveToHorizontalCenterOfParentLayer()
	lineLayer.moveBelowSiblingLayer({siblingLayer: currentCostume, margin: 15})
	
	thumbLayer.parent = lineLayer
	thumbLayer.moveToCenterOfParentLayer()
}

setupNumberLayers()

function showPicker() {
	
}

numberLayer.moveToCenterOfParentLayer()

