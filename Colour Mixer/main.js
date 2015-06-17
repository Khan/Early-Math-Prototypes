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
	yellow: 0.,
	blue: 0.
}


/** Get the current colour to be used as output. */
function currentColor() {
	const maxColor = Math.max(color.red, color.yellow, color.blue)
	const normalizedCMY = [color.red / maxColor, color.yellow / maxColor, color.blue / maxColor, 0.0]
	const rgbValues = cmyk2rgb(normalizedCMY)
	return new Color({red: rgbValues[0], green: rgbValues[1], blue: rgbValues[2]})
}


/** Colours used in the interface. */
var colorConstants = {
	red: new Color({hex: "00ffff"}),
	yellow: new Color({hex: "ff00ff"}),
	blue: new Color({hex: "ffff00"}),
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
		yellow.rotateBricks()
		blue.rotateBricks()
	}


	function moveColors() {
		red.moveToMixer()
		yellow.moveToMixer()
		blue.moveToMixer()
	}

	function dripColors() {
		var bgColor = currentColor()
		var totalCount = red.totalCount() + yellow.totalCount() + blue.totalCount()
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
		yellow.removeAllBricks()
		blue.removeAllBricks()
	}

	return layer
}


//----------------------------------------------------
// Setup everything else
//----------------------------------------------------

var red = makeSquare(colorConstants.red, "red")
var blue = makeSquare(colorConstants.blue, "blue")
var yellow = makeSquare(colorConstants.yellow, "yellow")

yellow.moveToHorizontalCenterOfParentLayer()
red.moveToLeftOfSiblingLayer({siblingLayer: yellow, margin: 100})
blue.moveToRightOfSiblingLayer({siblingLayer: yellow, margin: 100})

yellow.y = red.y = blue.y = 200



mixer.width = blue.frameMaxX - red.originX
mixer.height = 150
mixer.cornerRadius = 8
mixer.moveToCenterOfParentLayer()
mixer.updateBackgroundColor()

var redPipe = makePipe("red")
var yellowPipe = makePipe("yellow")
var bluePipe = makePipe("blue")

redPipe.x = red.x
yellowPipe.x = yellow.x
bluePipe.x = blue.x

redPipe.moveBelowSiblingLayer({siblingLayer: red, margin: -8})
yellowPipe.moveBelowSiblingLayer({siblingLayer: yellow, margin: -8})
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
	var yellowBrick = makeBrick({length: index + 1, color: colorConstants.yellow, target: yellow})
	var blueBrick = makeBrick({length: index + 1, color: colorConstants.blue, target: blue})

	redBrick.x = red.x
	yellowBrick.x = yellow.x
	blueBrick.x = blue.x

	var originY = 600 + index * (blockSize + 10)
	redBrick.originY = originY
	yellowBrick.originY = originY
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


// Adapted from https://github.com/bahamas10/ryb/blob/gh-pages/js/RXB.js#L252-L330
// Implemented in JS by Dave Eddy <dave@daveeddy.com>
// MIT License

/**
* ryb2rgb, the motherload, convert a RYB array to RGB
*
* @param ryb   {array} RYB values in the form of [0, 255, 0]
* @param limit {int}   [optional] max value of the color, defaults to 255
* @param magic {array} An array of magic colors to use in the color space interpolation
*
* returns an array of the RGB values
*/

var MAGIC_COLORS = [
[1,     1,     1],
[1,     1,     0],
[1,     0,     0],
[1,     0.5,   0],
[0.163, 0.373, 0.6],
[0.0,   0.66,  0.2],
[0.5,   0.0,   0.5],
[0.2,   0.094, 0.0]
];

var cmyk2rgb = function(color) {
	return [
	(1 - color[0]) * (1 - color[3]),
	(1 - color[1]) * (1 - color[3]),
	(1 - color[2]) * (1 - color[3])
	]
}

var ryb2rgb = (function() {
    // see http://threekings.tk/mirror/ryb_TR.pdf
    function cubicInt(t, A, B){
    	var weight = t * t * (3 - 2 * t);
    	return A + weight * (B - A);
    }

    function getR(iR, iY, iB, magic) {
    	magic = magic || MAGIC_COLORS;
      // red
      var x0 = cubicInt(iB, magic[0][0], magic[4][0]);
      var x1 = cubicInt(iB, magic[1][0], magic[5][0]);
      var x2 = cubicInt(iB, magic[2][0], magic[6][0]);
      var x3 = cubicInt(iB, magic[3][0], magic[7][0]);
      var y0 = cubicInt(iY, x0, x1);
      var y1 = cubicInt(iY, x2, x3);
      return cubicInt(iR, y0, y1);
  }

  function getG(iR, iY, iB, magic) {
  	magic = magic || MAGIC_COLORS;
      // green
      var x0 = cubicInt(iB, magic[0][1], magic[4][1]);
      var x1 = cubicInt(iB, magic[1][1], magic[5][1]);
      var x2 = cubicInt(iB, magic[2][1], magic[6][1]);
      var x3 = cubicInt(iB, magic[3][1], magic[7][1]);
      var y0 = cubicInt(iY, x0, x1);
      var y1 = cubicInt(iY, x2, x3);
      return cubicInt(iR, y0, y1);
  }

  function getB(iR, iY, iB, magic) {
  	magic = magic || MAGIC_COLORS;
      // blue
      var x0 = cubicInt(iB, magic[0][2], magic[4][2]);
      var x1 = cubicInt(iB, magic[1][2], magic[5][2]);
      var x2 = cubicInt(iB, magic[2][2], magic[6][2]);
      var x3 = cubicInt(iB, magic[3][2], magic[7][2]);
      var y0 = cubicInt(iY, x0, x1);
      var y1 = cubicInt(iY, x2, x3);
      return cubicInt(iR, y0, y1);
  }

  function ryb2rgb(color, limit, magic) {
  	limit = limit || 255;
  	magic = magic || MAGIC_COLORS;
  	var R = color[0] / limit;
  	var Y = color[1] / limit;
  	var B = color[2] / limit;
  	var R1 = getR(R, Y, B, magic);
  	var G1 = getG(R, Y, B, magic);
  	var B1 = getB(R, Y, B, magic);
  	return [
  	Math.ceil(R1 * limit),
  	Math.ceil(G1 * limit),
  	Math.ceil(B1 * limit)
  	];
  }
  return ryb2rgb;
})();
