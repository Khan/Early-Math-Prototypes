//
// Colour mixer
//	based on Prototope 5d81b57
//
// A few different ideas on how to do a colour mixer! Obviously lots of programmer art here :)
// Currently using RGB because it's simpler to model than RYB, but that's one are of improvement.


//----------------------
// Some global setup
//----------------------

var mixer = new Layer()

// This structure holds the numbers that make up the colour components.
var color = {
	red: 0.,
	green: 0.,
	blue: 0.
}


/** Get the current colour to be used as output. */
function currentColor() {
	return new Color({red: color.red, green: color.green, blue: color.blue})
}


/** Colours used in the interface. */
var colorConstants = {
	red: new Color({hex: "e65b4c"}),
	green: new Color({hex: "83c066"}),
	blue: new Color({hex: "29abca"}),
	grey: new Color({hex: "EEEEEE"})
}


mixer.updateBackgroundColor = function() {
	mixer.backgroundColor = colorConstants.grey
	mixer.border = new Border({color: new Color({hex: "555555"}), width: 8})
}


/** Makes one of the squares that holds bricks, and associated methods. */
function makeSquare(bgColor, colorName) {
	var layer = new Layer()
	
	var size = 150
	layer.size = new Size({width: size, height: size})
	layer.backgroundColor = colorConstants.grey
	layer.cornerRadius = 8
	layer.border = new Border({color: bgColor, width: 8})


	layer.refreshColor = function() {		
		color[colorName] = layer.totalColor()
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


	layer.removeAllBricks = function() {
		layer.bricks = []
		layer.refreshColor()
	}


	/** Returns if the layer contains the given brick. */
	layer.containsBrick = function(brick) { return layer.bricks.indexOf(brick) >= 0 }

	/** Returns the total count of blocks in all this container's bricks. */
	layer.totalCount = function() {
		var total = 0
		for (var index = 0; index < layer.bricks.length; index++) {
			total += layer.bricks[index].length()
		}

		return total
	}


	/** Returns a colour value, usually from 0 to 1, based on how many total blocks there are. This may go over 1, but values over 1 are ignored when the final colour is made. */
	layer.totalColor = function() {
		return layer.totalCount() / 10.0
	}


	/** Rotates the bricks 90 degrees so they can "fit down the pipe." */
	layer.rotateBricks = function () {
		for (var index = 0; index < layer.bricks.length; index++) {
			var brick = layer.bricks[index]
			brick.animators.rotationRadians.target = Math.PI / 2.0
		}
	}


	/** Moves and fades the bricks into the mixer. */
	layer.moveToMixer = function () {
		for (var index = 0; index < layer.bricks.length; index++) {
			var brick = layer.bricks[index]
			brick.animators.position.target = new Point({x: layer.x, y: mixer.y})
			brick.animators.alpha.target = 0
			brick.animators.scale.target = new Point({x: 0.01, y: 0.01})
		}
	}


	
	return layer
}

function makePipe(colorName) {
	var layer = new Layer({imageName: colorName})
	return layer
}


/** The grinder is the lever on the side. We might want to update this to be more direct (e.g., pull the lever).. right now you just tap it. This object has methods for making the "colour mixing process" happen. */
function makeGrinder(args) {
	var layer = new Layer({imageName: "lever"})

	layer.touchEndedHandler = function(touchSequence) {
		new Sound({name: "beep-boop"}).play()
		rotateColors()
		afterDuration(0.25, function() {
			moveColors()
		})
		afterDuration(1.50, function() {
			dripColors()
		})
	}


	function rotateColors() {
		red.rotateBricks()
		green.rotateBricks()
		blue.rotateBricks()
	}


	function moveColors() {
		red.moveToMixer()
		green.moveToMixer()
		blue.moveToMixer()
	}

	function dripColors() {
		var bgColor = currentColor()
		var totalCount = red.totalCount() + green.totalCount() + blue.totalCount()
		var totalDripDuration = 2 // seconds
		var timeIntervalBetweenDrips = totalDripDuration / totalCount


		for (var counter = 0; counter < totalCount; counter++) {
			afterDuration(counter * timeIntervalBetweenDrips, function() {
				var drip = new Layer()
				var size = 24
				drip.size = new Size({width: size, height: size})
				drip.cornerRadius = drip.height / 2.0
				drip.backgroundColor = bgColor
				drip.scale = 0.01
				drip.position = new Point({x: args.tap.frameMaxX, y: args.tap.frameMaxY})

				drip.animators.scale.target = new Point({x: 1, y: 1})
				drip.animators.position.target = new Point({x: args.bowl.x, y: args.bowl.y + 20})
			})
		}
		red.removeAllBricks()
		green.removeAllBricks()
		blue.removeAllBricks()
	}

	return layer
}


//----------------------------------------------------
// Setup everything else
//----------------------------------------------------

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

var redPipe = makePipe("red")
var greenPipe = makePipe("green")
var bluePipe = makePipe("blue")

redPipe.x = red.x
greenPipe.x = green.x
bluePipe.x = blue.x

redPipe.moveBelowSiblingLayer({siblingLayer: red, margin: -8})
greenPipe.moveBelowSiblingLayer({siblingLayer: green, margin: -8})
bluePipe.moveBelowSiblingLayer({siblingLayer: blue, margin: -8})

var tap = new Layer({imageName: "tap"})
tap.moveToCenterOfParentLayer()
tap.moveToRightOfSiblingLayer({siblingLayer: mixer, margin: -1})

var bowl = new Layer({imageName: "bowl"})
bowl.moveBelowSiblingLayer({siblingLayer: mixer, margin: 50})
bowl.moveToRightOfSiblingLayer({siblingLayer: mixer, margin: -50})

var grinder = makeGrinder({tap: tap, bowl})
grinder.moveToCenterOfParentLayer()
grinder.moveToLeftOfSiblingLayer({siblingLayer: mixer, margin: -8})


var toolboxLayer = new Layer()
toolboxLayer.size = new Size({width: Layer.root.width, height: Layer.root.height - 580})
toolboxLayer.originX = 0
toolboxLayer.originY = 590
toolboxLayer.backgroundColor = colorConstants.grey
toolboxLayer.cornerRadius = 8

var blockSize = 25

for (var index = 0; index < 5; index++) {

	var redBrick = makeBrick({length: index + 1, color: colorConstants.red, target: red})
	var greenBrick = makeBrick({length: index + 1, color: colorConstants.green, target: green})
	var blueBrick = makeBrick({length: index + 1, color: colorConstants.blue, target: blue})

	redBrick.x = red.x
	greenBrick.x = green.x
	blueBrick.x = blue.x

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


function randomIntBetween(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}