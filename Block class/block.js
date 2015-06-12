//
// block.js
//
// This class has a reusable brick/block implementation. Just copy the functions below and paste them where you need them.


//-------------------------------------------------
// Bricks
//-------------------------------------------------

/** 
	Create a brick with the given arguments object. Valid arguments are:

	length: how many blocks are in this brick? Must be >= 1.
	isUnified: a boolean to indicate if the brick looks like one unified brick or individual blocks in a row. defaults to blocks in a row if you don't specify.
	isEmpty: a boolean to indicate if the brick starts "empty" (all its blocks are clear and just have dashed outline). Use this for gathering. If not specified, it defaults to false.
	
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
	var isEmpty = args.isEmpty ? args.isEmpty : false
	
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
		container.backgroundColor = isEmpty ? Color.clear : color
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

		block.backgroundColor = isEmpty ? Color.clear : color


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
	
	
	var nextBlockIndex = 0
	this.animateInNextBlock = function() {
		if (nextBlockIndex >= self.length()) { return }
		
		var block = self.blocks[nextBlockIndex]
	
		// TODO: let the blocks have a dashed border...I'll have to make them shapelayers, but then they lose touch handling?
		block.backgroundColor = color
		// block.fillColor = block.strokeColor
		// block.dashLength = undefined
		
		
		block.animators.scale.target = new Point({x: 1, y: 1})
		var velocity = 4
		block.animators.scale.velocity = new Point({x: velocity, y: velocity})
		
		nextBlockIndex++
		
		
		var index = nextBlockIndex - 1
		var allFlowersCompleted = index + 1 == length
		
		// numbersToSounds[index].play()
		
		// This should really happen in the "afterDuration" call below, but it seems I can use an animator in that?
		if (allFlowersCompleted) {
			container.animators.scale.target = new Point({x: 1, y: 1})
			container.animators.scale.velocity = new Point({x: velocity * 4, y: velocity * 4})
			
		}
		
		// TODO: add back sounds
		// afterDuration(0.5, function() {
		// 	flowerSounds[index + 1 == 1 ? 0 : 1].play()
		// 	if (allFlowersCompleted) {
		// 		// we've shown all the blocks, play success!
		// 		afterDuration(0.5, function() {
		// 			successSound.play()
		// 		})
		// 	}
		// })
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


//---------------------------------------
// Test code (you don't need to copy this)
//---------------------------------------
var brick = new Brick({
	length: 3,
	color: Color.purple
})

brick.container.moveToCenterOfParentLayer()