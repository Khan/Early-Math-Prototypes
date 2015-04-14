/*

Draw around blocks to count them
	built on Prototope @ 005119b47e

This prototype uses finger drawing as a way to select blocks in order to count them.
Inspired a little bit by Kirby on the Nintendo DS (draw a path for Kirby to roll on)

Still need to figure out how to prompt kids to actually sketch around objects...there aren't any hints at present.

*/


if (Layer.root.width !== 1024) {
	throw "This prototype wants to be run in landscape on an iPad!"
}


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


//-------------------------
// Setting up initial objects
//-------------------------

var statusLabel = new TextLayer()
statusLabel.fontSize = 100
statusLabel.fontName = "Avenir-Heavy"
statusLabel.hidden = true

function updateStatusLabelWithText(text, color) {
	statusLabel.text = text
	statusLabel.moveToHorizontalCenterOfParentLayer()
	statusLabel.alpha = 1
	statusLabel.textColor = color
	
	statusLabel.animators.scale.target = new Point({x: 1.0, y: 1.0})
	statusLabel.animators.scale.velocity = new Point({x: 10, y: 10})
}

var blocks = []
for (var counter = 0; counter < 15; counter++) {
	var block = makeBlock()
	
	// make sure the blocks don't overlap
	while (blockOverlapsAnotherBlock(block)) {
		block.position = randomPosition()
	}
	
	blocks.push(block)
}

var fingerPath = new ShapeLayer()
fingerPath.fillColor = undefined
fingerPath.strokeColor = kagreys[5]
fingerPath.strokeWidth = 20
fingerPath.lineCapStyle = LineCapStyle.Round


//---------------
// Selection logic
//---------------

Layer.root.touchBeganHandler = function(touchSequence) {
	fingerPath.addPoint(touchSequence.currentSample.globalLocation)
}

Layer.root.touchMovedHandler = function(touchSequence) {
	fingerPath.addPoint(touchSequence.currentSample.globalLocation)
}

Layer.root.touchEndedHandler = Layer.root.touchCancelledHandler = function(touchSequence) {
	fingerPath.closed = true
	var selectedBlocks = []
	for (var index = 0; index < blocks.length; index++) {
		var block = blocks[index]
		
		// reset the block's background color
		block.backgroundColor = kagreys[5]
		
		// see if the block is enclosed by the shape...
		if (fingerPath.enclosesPoint(block.position)) {
			selectedBlocks.push(block)
		}
	}
	
	var count = selectedBlocks.length
	if (count > 0) {
		var colorIndex = count - 1
		if (colorIndex >= kacolors.length) {
			colorIndex = kacolors.length - 1
		}
		var color = kacolors[colorIndex]
		
		updateStatusLabelWithText("" + count, color)
		for (var index = 0; index < selectedBlocks.length; index++) {
			var block = selectedBlocks[index]
			block.animators.backgroundColor.springSpeed = 20
			block.animators.backgroundColor.target = color
			block.animators.scale.target = new Point({x: 1.0, y: 1.0})
			block.animators.scale.velocity = new Point({x: 4, y: 4})
			// block.backgroundColor = color
		}
	} else {
		updateStatusLabelWithText("0", kagreys[5])
	}
	
	fingerPath.segments = []
	fingerPath.closed = false
}



//-------------------
// Helpers
//-------------------


function makeBlock() {
	var block = new Layer()
	block.width = block.height = 60
	block.cornerRadius = 15
	block.backgroundColor = kagreys[5]
	block.position = randomPosition()
	
	return block
}


function randomPosition() {
	var x = Math.floor((Math.random() * (1024 - 100)) + 50);
	var y = Math.floor((Math.random() * 550) + 150)
	return new Point({x: x, y: y})
}

function blockOverlapsAnotherBlock(block) {
	for (var index = 0; index < blocks.length; index++) {
		var otherBlock = blocks[index]
		if (block.frame.intersectsRect(otherBlock.frame)) {
			return true
		}
	}
	
	return false
}

