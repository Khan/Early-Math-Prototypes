/*

Basic Mechanix
	
This prototype is intended to test out the basic mechanisms
of walking, gathering numbers, and laying them down.

We'll just focus on the forest for now.

*/

//setting up some strings to point to assets so that they are all in one place
const strBgLayer = "trees"
const numFirstBGLayer = 0
const numBGLayers = 4
const strCharLayer = "placeholderkid"
const numFirstCharLayer = 0
const numCharLayers = 1;

Layer.root.backgroundColor = new Color({hue: 0.52, saturation: 0.17, brightness: 0.94})



//set up BG layers
var bgParentLayer = new Layer({name:"bgParent"}) 
for (let i = numFirstBGLayer; i < numFirstBGLayer+numBGLayers; i++) {
	const bgLayerName = strBgLayer + i
	var bgLayer = new Layer({parent: bgParentLayer, imageName: bgLayerName})
	bgLayer.x = bgLayer.width/2 
	bgLayer.y = bgLayer.height/2
}

const touchCatchingLayer = new Layer()
touchCatchingLayer.frame = Layer.root.bounds

//set up initial character layer (no static animation yet. eventually: at least blinking!)
const charLayerName = strCharLayer + numFirstCharLayer
var charParentLayer = new Layer({name:"charParent"}) 
var charLayer = new Layer({parent: charParentLayer, imageName: charLayerName})
charParentLayer.x = 170
charParentLayer.y = 555

//setting up a basic tap to parallax test with basic touch handler
touchCatchingLayer.touchBeganHandler = function(touchSequence) { 
 
	let i = 0;
	for (let layerIndex in bgParentLayer.sublayers) {
		const layer = bgParentLayer.sublayers[layerIndex]
		layer.x = layer.x - (50*(i+1)); 
		i++ 
	}


}



//-------------------------------------------------
// Bricks
//-------------------------------------------------

var orangeBrick = new Brick({
	length: 5,
	isUnified: true,
	size: 30,
	color: new Color({hex: "EFAC5E"}),
	borderColor: new Color({hex: "BF7C35"}),
	borderWidth: 1,
	cornerRadius: 4
})


var greenBrick = new Brick({
	length: 4,
	isUnified: true,
	size: 30,
	isVertical: true,
	color: new Color({hex: "A6CF8B"}),
	borderColor: new Color({hex: "53893E"}),
	borderWidth: 1,
	cornerRadius: 4
})

orangeBrick.container.moveToCenterOfParentLayer()
greenBrick.container.moveToCenterOfParentLayer()
greenBrick.container.moveAboveSiblingLayer({siblingLayer: orangeBrick.container})

/** 
	Create a brick with the given arguments object. Valid arguments are:

	length: how many blocks are in this brick? Must be >= 1.
	isUnified: a boolean to indicate if the brick looks like one unified brick or individual blocks in a row. defaults to blocks in a row if you don't specify.
	
	color: what colour are the blocks?
	borderColor: what colour is the border? will use `color` if none is provided.
	borderWidth: defaults to 0 if you don't provide one.
	
	size: how big is each block? defaults to 50 if you don't provide one. (note: this is just one number because blocks are square)
	isVertical: is the brick vertical? if false/unspecified, defaults to horizontal
	cornerRadius: defaults to 8 if you don't provide one.
	
	blocks: an array of existing blocks. defaults to undefined, in that case blocks are generated. If you provide your own, those blocks are used instead.

	The returned brick already has drag and drop enabled and will do the right thing to stay under the finger as it is dragged.

	You can optionally provide a dragDidBeginHandler, dragDidMoveHandler, and/or a dragDidEndHandler to get a callback on those events to do whatever you please. For example, you might want to check if the brick was dropped in a certain location.
	
	NOTE: The returned Brick object is *not* a Layer itself, but it *has* a layer you can access with `.container` property. So if you need to treat a brick like a layer, you've first got to ask it for its container and then work with that. I don't know how to javascript this better.
*/
function Brick(args) {
	
	var length = args.length
	var isUnified = args.isUnified ? args.isUnified : false
	
	var color = args.color
	var borderColor = args.borderColor ? args.borderColor : color
	var borderWidth = args.borderWidth ? args.borderWidth : 0
	
	var size = args.size ? args.size : 50
	var isVertical = args.isVertical ? args.isVertical : false
	var cornerRadius = args.cornerRadius ? args.cornerRadius : 8

	// It doesn't really make sense to make a brick of 0 blocks, does it?
	if (length < 1) { return }
	
	
	// lol what is scope
	var self = this
	
	
	var container = new Layer({name: "brick"})
	if (isUnified) {
		container.backgroundColor = color
		container.cornerRadius = cornerRadius
		container.border = new Border({width: borderWidth, color: borderColor})
	}
	var blocks = args.blocks || []
	
	
	// "public" properties
	// these have to be here because javascript can't do things out of order
	this.container = container
	this.blocks = blocks
	
	
	if (blocks.length < 1) {
		for (var index = 0; index < length; index++) {
			var color = color
			var block = makeBlock({color: color, size: size, cornerRadius: cornerRadius})
			

			blocks.push(block)
		}
	}
	
	/** Gets the number of blocks in this brick. Use this over the local variable length because it might get outdated. */
	this.length = function() { return blocks.length }
	
	var blockMargin = isUnified ? 0 : 2
	this.resizeBrickToFitBlocks = function() {
		var origin = container.origin
		
		var longSide = size * self.length() + (self.length() - 1) * blockMargin
		var shortSide = size
		
		var width = isVertical ? shortSide : longSide
		var height = isVertical ? longSide : shortSide
		
	
		container.size = new Size({width: width, height: height})
		container.origin = origin
	}
	
	this.layoutBlocks = function(args) {
		var animated = args ? args.animated : false
		
		var max = 0
		for (var index = 0; index < self.length(); index++) {

			var block = blocks[index]
			
			block.parent = container
			
			var x = isVertical ? 0: max + blockMargin
			var y = isVertical ? max + blockMargin : 0
			
			
			var origin = new Point({x: x, y: y})
			if (animated) {
				block.animators.origin.target = origin
			} else {
				// disable the position animator, which might be going if you quickly move the splitter and drop it before animation settles down.
				block.animators.position.stop()
				block.origin = origin
			}
			
			
			if (isUnified) {
				var line = block.lineLayer
				line.width = isVertical ? block.width : borderWidth
				line.height = isVertical ? borderWidth : block.height

				line.originY = 0
				if (isVertical) {
					line.originX = 0
				} else {
					line.moveToRightSideOfParentLayer()
				}
			}

			max += block.width + blockMargin
		}
		
	}
	
	this.resizeBrickToFitBlocks()
	this.layoutBlocks()
	

	// Privately, make a block
	function makeBlock(args) {
		var color = args.color
		var size = args.size
		var cornerRadius = isUnified ? 0 : args.cornerRadius
		
		var rect = new Rect({x: 50, y: 50, width: size, height: size})
		var block = new Layer({name: "block"})
		block.frame = rect
		
		if (isUnified) {
			// each block has a line layer, positioned in layoutBlocks
			var lineLayer = new Layer({parent: block})
			lineLayer.backgroundColor = borderColor
			block.lineLayer = lineLayer
		} else {
			block.border = new Border({color: borderColor, width: borderWidth})
		}
		block.cornerRadius = cornerRadius

		block.backgroundColor = color


		return block
	}


	this.setDragDidBeginHandler = function(handler) { self.dragDidBeginHandler = handler }
	this.setDragDidMoveHandler = function(handler) { self.dragDidMoveHandler = handler }
	this.setDragDidEndHandler = function(handler) { self.dragDidEndHandler = handler }
	
	
	/** Split this brick at the index point. Creates a new brick and moves the blocks after the split into the new brick. Returns the new brick. */
	this.splitAtIndex = function(index) {
		
		// this logic is so hairy..
		var newArgs = args
		
		
		
		// split the blocks apart given the index. index is the block *before* the split.
		var lengthOfNewBrick = self.length() - (index + 1)
		newArgs.length = lengthOfNewBrick
		newArgs.blocks = blocks.splice(index + 1, lengthOfNewBrick)
		
		// we just split this block but we don't want it to still think it's split
		self.container.splitPoint = undefined
		
		var newBrick = new Brick(newArgs)
		
		self.resizeBrickToFitBlocks()
		// newBrick.container.frame = self.container.frame
		// newBrick.resizeBrickToFitBlocks()
		
		newBrick.container.moveToRightOfSiblingLayer({siblingLayer: self.container, margin: 15})
		newBrick.container.y = self.container.y
		// newBrick.container.origin = new Point({x: self.container.frameMaxX + 10, y: newBrick.container.originY})
		
		newBrick.setDragDidBeginHandler(self.dragDidBeginHandler)
		newBrick.setDragDidMoveHandler(self.dragDidMoveHandler)
		newBrick.setDragDidEndHandler(self.dragDidEndHandler)
		
		
		return newBrick
	}


	container.becomeDraggable = function() {

		var initialPositionInContainer = new Point()
		container.touchBeganHandler = function(touchSequence) {
			initialPositionInContainer = touchSequence.currentSample.locationInLayer(container)
			container.comeToFront()
			if (self.dragDidBeginHandler) {
				self.dragDidBeginHandler()
			}
		}
	
		container.touchMovedHandler = function(touchSequence) {

			var position = touchSequence.currentSample.globalLocation
			container.origin = position.subtract(initialPositionInContainer)

			if (self.dragDidMoveHandler) {
				self.dragDidMoveHandler()
			}
		}

		container.touchEndedHandler = function(touchSequence) {
			if (self.dragDidEndHandler) {
				self.dragDidEndHandler()
			}
		}
	}

	container.becomeDraggable()

}


//-----------------------------------------
// Helpers
//-----------------------------------------
function log(obj) {
	console.log(JSON.stringify(obj, null, 4))
}

