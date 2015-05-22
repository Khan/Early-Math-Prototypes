var mixer = new Layer()

var color = {
	red: 0.2,
	green: 0.2,
	blue: 0.2
}


var colorConstants = {
	red: new Color({hex: "e65b4c"}),
	green: Color.green,
	blue: Color.blue
}


mixer.updateBackgroundColor = function() {
	mixer.backgroundColor = new Color({red: color.red, green: color.green, blue: color.blue})
}


function makeSquare(bgColor, colorName) {
	var layer = new Layer()
	
	var size = 150
	layer.size = new Size({width: size, height: size})
	layer.backgroundColor = new Color({hex: "EEEEEE"})
	layer.cornerRadius = 8

	var innerLayer = new Layer({parent: layer})
	innerLayer.backgroundColor = bgColor
	innerLayer.size = new Size({width: 50, height: 50})
	innerLayer.cornerRadius = 4
	innerLayer.moveToCenterOfParentLayer()
	
	layer.gestures = [new TapGesture({handler: function() {
		layer.addMoreColor()
	}})]


	layer.addMoreColor = function() {		
		color[colorName] += 0.1
		mixer.updateBackgroundColor()
		innerLayer.animators.scale.target = new Point({x: 1, y: 1})
		innerLayer.animators.scale.velocity = new Point({x: 4, y: 4})
	}

	layer.innerLayer = innerLayer
	
	return layer
}

// Using RGB for now because modelling RYB on a computer seemed like a rabit hole not worth going down quite yet...
var red = makeSquare(colorConstants.red, "red")
var blue = makeSquare(colorConstants.blue, "blue")
var green = makeSquare(colorConstants.green, "green")

green.moveToHorizontalCenterOfParentLayer()
red.moveToLeftOfSiblingLayer({siblingLayer: green, margin: 100})
blue.moveToRightOfSiblingLayer({siblingLayer: green, margin: 100})

green.y = red.y = blue.y = 200



mixer.width = blue.frameMaxX - red.originX
mixer.height = 150
mixer.cornerRadius = 8
mixer.moveToCenterOfParentLayer()
mixer.updateBackgroundColor()

var blockSize = 25
var redBrick = makeBrick({length: 3, color: colorConstants.red, target: red})
var greenBrick = makeBrick({length: 3, color: colorConstants.green, target: green})
var blueBrick = makeBrick({length: 3, color: colorConstants.blue, target: blue})

//-------------------------------------------------
// Bricks
//-------------------------------------------------

function makeEmptyBlock(args) {
	var color = args.color

	var rect = new Rect({x: 50, y: 50, width: blockSize, height: blockSize})
	var block = new Layer()
	block.frame = rect
	block.cornerRadius = 8

	block.backgroundColor = color


	return block
}

function makeBrick(args) {
	var length = args.length

	if (length < 1) { return }

	var container = new Layer()
	container.size = new Size({width: (blockSize + 2) * length, height: blockSize})
	container.blocks = []

	var maxX = 0
	for (var index = 0; index < length; index++) {
		var color = args.color
		var block = makeEmptyBlock({color: color})
		
		block.parent = container
		block.originX = maxX + 2
		block.originY = 0

		maxX = block.frameMaxX

		container.blocks.push(block)
	}


	container.showIfNeeded = function() {
		if (container.alpha == 1) { return }

		container.alpha = 1
		container.scale = 0.01
		container.animators.scale.target = new Point({x: 1, y: 1})
	}


	var target = args.target
	container.becomeDraggable = function() {

		var initialPositionInContainer = new Point()
		container.touchBeganHandler = function(touchSequence) {
			initialPositionInContainer = touchSequence.currentSample.locationInLayer(container)
		}
	
		container.touchMovedHandler = function(touchSequence) {
			var position = touchSequence.currentSample.globalLocation
			container.origin = position.subtract(initialPositionInContainer)
		}

		container.touchEndedHandler = function(touchSequence) {
			if (target.frame.contains(touchSequence.currentSample.globalLocation)) {
				target.addMoreColor()
				container.animators.scale.target = new Point({x: 0.01, y: 0.01})
				container.animators.scale.velocity = new Point({x: 5, y: 5})
				container.animators.scale.springBounciness = 2

				container.animators.position.target = target.convertLocalPointToGlobalPoint(target.innerLayer.position)
			}
		}
	}

	container.becomeDraggable()
	return container
}


//-----------------------------------------
// Helpers
//-----------------------------------------
function log(obj) {
	console.log(JSON.stringify(obj, null, 4))
}


// Hack to bring a layer to the front...this should be a part of prototope!
function bringLayerToFront(layer) {
	var parent = layer.parent
	layer.parent = undefined
	layer.parent = parent
}