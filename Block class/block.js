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
function makeBrick(args) {
	var length = args.length
	var color = args.color
	var size = args.size ? args.size : 50
	var cornerRadius = args.cornerRadius ? args.cornerRadius : 8

	if (length < 1) { return }

	var container = new Layer()
	container.size = new Size({width: (size + 2) * length, height: size})
	container.blocks = []

	var maxX = 0
	for (var index = 0; index < length; index++) {
		var color = color
		var block = makeBlock({color: color, size: size, cornerRadius: cornerRadius})
		
		block.parent = container
		block.originX = maxX + 2
		block.originY = 0

		maxX = block.frameMaxX

		container.blocks.push(block)
	}


	container.length = function() { return container.blocks.length }


	container.becomeDraggable = function() {

		var initialPositionInContainer = new Point()
		container.touchBeganHandler = function(touchSequence) {
			initialPositionInContainer = touchSequence.currentSample.locationInLayer(container)
			bringLayerToFront(container)

			if (container.dragDidBeginHandler) {
				container.dragDidBeginHandler()
			}
		}
	
		container.touchMovedHandler = function(touchSequence) {
			var position = touchSequence.currentSample.globalLocation
			container.origin = position.subtract(initialPositionInContainer)

			if (container.dragDidMoveHandler) {
				container.dragDidMoveHandler()
			}
		}

		container.touchEndedHandler = function(touchSequence) {
			if (container.dragDidEndHandler) {
				container.dragDidEndHandler()
			}
		}
	}

	container.becomeDraggable()
	return container
}


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