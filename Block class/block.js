//
// block.js
//
// This class has a reusable brick/block implementation. Just copy the functions below and paste them where you need them.


//-------------------------------------------------
// Bricks
//-------------------------------------------------

/** 
	Create a brick with the given arguments object. Valid arguments are:

	length: how many blocks are in this brick?
	color: what colour are the blocks?
	size: how big is each block? defaults to 50 if you don't provide one. (note: this is just one number because blocks are square)
	cornerRadius: defaults to 8 if you don't provide one.

	The returned brick already has drag and drop enabled and will do the right thing to stay under the finger as it is dragged.

	You can optionally provide a dragDidBeginHandler, dragDidMoveHandler, and/or a dragDidEndHandler to get a callback on those events to do whatever you please. For example, you might want to check if the brick was dropped in a certain location.
*/
function Brick(args) {
	var length = args.length
	var color = args.color
	var size = args.size ? args.size : 50
	var cornerRadius = args.cornerRadius ? args.cornerRadius : 8

	// It doesn't really make sense to make a brick of 0 blocks, does it?
	if (length < 1) { return }

	var container = new Layer()
	container.size = new Size({width: (size + 2) * length, height: size})
	var blocks = []

	var maxX = 0
	for (var index = 0; index < length; index++) {
		var color = color
		var block = makeBlock({color: color, size: size, cornerRadius: cornerRadius})
		
		block.parent = container
		block.originX = maxX + 2
		block.originY = 0

		maxX = block.frameMaxX

		blocks.push(block)
	}

	// Privately, make a block
	function makeBlock(args) {
		var color = args.color
		var size = args.size
		var cornerRadius = args.cornerRadius

		var rect = new Rect({x: 50, y: 50, width: size, height: size})
		var block = new Layer()
		block.frame = rect
		block.cornerRadius = cornerRadius

		block.backgroundColor = color


		return block
	}


	/** Gets the number of blocks in this brick. */
	this.length = function() { return blocks.length }

	container.becomeDraggable = function() {

		var initialPositionInContainer = new Point()
		container.touchBeganHandler = function(touchSequence) {
			initialPositionInContainer = touchSequence.currentSample.locationInLayer(container)
			if (this.dragDidBeginHandler) {
				this.dragDidBeginHandler()
			}
		}
	
		container.touchMovedHandler = function(touchSequence) {
			var position = touchSequence.currentSample.globalLocation
			container.origin = position.subtract(initialPositionInContainer)
			if (this.dragDidMoveHandler) {
				this.dragDidMoveHandler()
			}
		}

		container.touchEndedHandler = function(touchSequence) {
			if (this.dragDidEndHandler) {
				this.dragDidEndHandler()
			}
		}
	}

	container.becomeDraggable()
	this.container = container
}


//-----------------------------------------
// Helpers
//-----------------------------------------
function log(obj) {
	console.log(JSON.stringify(obj, null, 4))
}


// Hack to bring a layer to the front...this should be a part of prototope!
// Seems to break drag and drop :\
function bringLayerToFront(layer) {
	var parent = layer.parent
	layer.parent = undefined
	layer.parent = parent
}


//---------------------------------------
// Test code (you don't need to copy this)
//---------------------------------------
var brick = new Brick({
	length: 3,
	color: Color.purple
})

brick.container.moveToCenterOfParentLayer()