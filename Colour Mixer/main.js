var mixer = new Layer()

var color = {
	red: 0.,
	green: 0.,
	blue: 0.
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
	layer.border = new Border({color: bgColor, width: 8})


	layer.refreshColor = function() {		
		color[colorName] = layer.totalColor()
		mixer.updateBackgroundColor()
	}

	layer.animateGulp = function() {
		layer.animators.scale.target = new Point({x: 1, y: 1})
		layer.animators.scale.velocity = new Point({x: 4, y: 4})
	}

	layer.bricks = []


	/** Adds a brick to the layer's data and refreshes the colour. */
	layer.addBrick = function(brick) {
		if (layer.containsBrick(brick)) { return }

 		layer.bricks.push(brick)
		layer.refreshColor()
		layer.animateGulp()
	}


	/** Removes the given brick from the layer's data and updates the colour. */
	layer.removeBrick = function(brick) {
		var indexOfBrick = layer.bricks.indexOf(brick)
		layer.bricks.splice(indexOfBrick, 1) // so obvious that this means "remove the element at the given index." wtf is this shit, javascript??
		layer.refreshColor()
	}


	/** Returns if the layer contains the given brick. */
	layer.containsBrick = function(brick) { return layer.bricks.indexOf(brick) >= 0 }


	layer.totalColor = function() {
		var total = 0
		for (var index = 0; index < layer.bricks.length; index++) {
			total += layer.bricks[index].length()
		}

		return total / 10.0
	}

	
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

for (var index = 0; index < 5; index++) {

	var redBrick = makeBrick({length: index + 1, color: colorConstants.red, target: red})
	var greenBrick = makeBrick({length: index + 1, color: colorConstants.green, target: green})
	var blueBrick = makeBrick({length: index + 1, color: colorConstants.blue, target: blue})

	redBrick.originX = 100
	greenBrick.originX = 300
	blueBrick.originX = 500

	var originY = 600 + index * (blockSize + 10)
	redBrick.originY = originY
	greenBrick.originY = originY
	blueBrick.originY = originY
}

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


	container.length = function() { return container.blocks.length }


	container.showIfNeeded = function() {
		if (container.alpha == 1) { return }

		container.alpha = 1
		container.scale = 0.01
		container.animators.scale.target = new Point({x: 1, y: 1})
	}


	var target = args.target
	container.becomeDraggable = function() {

		var initialPositionInContainer = new Point()
		var startedInContainer = false
		container.touchBeganHandler = function(touchSequence) {
			initialPositionInContainer = touchSequence.currentSample.locationInLayer(container)
			startedInContainer = target.containsBrick(container)
		}
	
		container.touchMovedHandler = function(touchSequence) {
			var position = touchSequence.currentSample.globalLocation
			container.origin = position.subtract(initialPositionInContainer)
		}

		container.touchEndedHandler = function(touchSequence) {
			if (target.frame.contains(touchSequence.currentSample.globalLocation)) {
				target.addBrick(container)

				// in this code I'm trying to get it to animate itself fully into the container..not working yet
				// if (!target.frame.containsRect(container.frame)) {
				// 	var destination = container.frame
				// 	if (destination.origin.x < target.frame.origin.x) {
				// 		destination.x = target.frame.origin.x
				// 	} else if (destination.maxX > target.frame.maxX) {
				// 		destination.x = target.frame.maxX - destination.size.width
				// 	}

				// 	container.frame = destination
				// }
			} else if (startedInContainer) {
				target.removeBrick(container)
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