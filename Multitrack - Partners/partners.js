//
// Mulittrack Sequencer for partners
//	- remixed from Musical Madlibs

if (Layer.root.width != 1024) {
	throw "This prototype is meant to be run in landscape on an iPad!"
}

// Global sound switch: disable to avoid annoyance during development!
var soundEnabled = true
var tickEnabled = false // controls the ticking sound
if (!soundEnabled) { Sound.prototype.play = function() {} }

var blockSettings = {
	size: 87,
	cornerRadius: 22.5
}

var blockColors = {
	blue: new Color({hex: "59C4DD"}),
	orange: new Color({hex: "EFAC5F"})
}

// hack to check against these values later
blockColors.blue.name = "blue"
blockColors.orange.name = "orange"

// The empty slot, if any, under a brick being dragged.
var slotUnderBrick = undefined

var trackCenterY = 69
var trackSlotWidth = 87
var dotBaseline = 25
var firstTrackSlotX = 80


var kittyTrack =  makeSoundtrackLayer({
	name: "kitty",
	blueSound: "cat_a",
	orangeSound: "cat_b"
})

var beeTrack = makeSoundtrackLayer({
	name: "bee",
	blueSound: "dog_b",
	orangeSound: "dog_e"
})

var dogTrack = makeSoundtrackLayer({
	name: "dog",
	blueSound: "dog_fsharp",
	orangeSound: "dog_gsharp"
})

var trackLayers = [kittyTrack, beeTrack, dogTrack]


function columnIsFull(index) {
	for (var counter = 0; counter < trackLayers.length; counter++) {
		var track = trackLayers[counter]
		if (!track.slotAtIndexIsOccupied(index)) {
			return false
		}
	}

	return true
}


function playHarmonyForColumn(index) {
	for (var counter = 0; counter < trackLayers.length; counter++) {
		var track = trackLayers[counter]
		track.playSoundForSlotAtIndex(index)
	}
}

var topMargin = 40
kittyTrack.originY = topMargin
kittyTrack.moveToHorizontalCenterOfParentLayer()
beeTrack.moveToHorizontalCenterOfParentLayer()
beeTrack.moveBelowSiblingLayer({siblingLayer: kittyTrack})
dogTrack.moveToHorizontalCenterOfParentLayer()
dogTrack.moveBelowSiblingLayer({siblingLayer: beeTrack})

var toolbox = makeToolbox()

function makeSoundtrackLayer(args) {
	var layer = new Layer()

	var imageLayer = new Layer({imageName: args.name, parent: layer})
	imageLayer.originX = 0
	imageLayer.originY = 0
	var track = makeTrackNotesLayer()
	track.parent = layer
	track.y = imageLayer.y
	track.moveToRightOfSiblingLayer({siblingLayer: imageLayer})

	layer.size = new Size({width: track.frameMaxX, height: imageLayer.height})

	layer.track = track
	layer.imageLayer = imageLayer

	var blueSound = new Sound({name: args.blueSound})
	var orangeSound = new Sound({name: args.orangeSound})

	layer.makeSlotsUnswell = function() {
		track.makeSlotsUnswell()
	}

	layer.slotAtIndexIsOccupied = function(index) {
		return track.noteSlots[index].isEmpty() !== true
	}

	layer.playSoundForSlotAtIndex = function(index) {
		if (track.slotAtIndex(index).brick.blocks[0].name == "blue") {
			blueSound.play()
		} else {
			orangeSound.play()
		}
	}

	return layer
}


function makeTrackNotesLayer() {
	var numberOfNotes = 8

	var trackNotesLayer = new Layer()
	trackNotesLayer.noteSlots = []

	var maxX = 0
	var margin = 10
	for (var counter = 0; counter < numberOfNotes; counter++) {
		var noteSlot = makeNoteSlot()
		noteSlot.parent = trackNotesLayer

		noteSlot.originX = maxX
		noteSlot.originY = 0

		maxX = noteSlot.frameMaxX + margin

		trackNotesLayer.noteSlots.push(noteSlot)
	}

	trackNotesLayer.size = new Size({width: maxX, height: trackNotesLayer.noteSlots[0].height})

	trackNotesLayer.slotAtIndex = function(index) { return trackNotesLayer.noteSlots[index] }
	trackNotesLayer.makeSlotsUnswell = function() {
		for (var index = 0; index < trackNotesLayer.noteSlots.length; index++) {
			var slot = trackNotesLayer.noteSlots[index]
			slot.unswell()
		}
	}


	return trackNotesLayer
}


function makeNoteSlot() {
	var slot = new Layer()
	slot.border = beatBorder(true)
	
	slot.width = slot.height = blockSettings.size
	slot.cornerRadius = blockSettings.cornerRadius

	slot.swell = function () {
		var size = 1.1
		slot.animators.scale.target = new Point({x: size, y: size})
	}

	slot.unswell = function() {
		slot.animators.scale.target = new Point({x: 1, y: 1})
	}

	slot.isEmpty = function() { return slot.brick === undefined }
	slot.dropBrick = function(brick) {
		brick.container.animators.position.target = slot.globalPosition
		slot.brick = brick
		brick.slot = slot
	}

	slot.removeBrick = function() {
		slot.brick.slot = undefined
		slot.brick = undefined
	}
	return slot
}


function beatBorder() {
	var beatBorderColorSelected = new Color({white: 0.92})
	return new Border({width: 4, color: beatBorderColorSelected})
}


function makeToolbox() {
	var layer = new Layer()
	layer.size = new Size({width: Layer.root.width, height: 250})
	layer.moveToBottomSideOfParentLayer()

	layer.originX = 0
	layer.originY += 25
	layer.backgroundColor = new Color({white: 0.92})
	layer.cornerRadius = 25


	var blueOriginY = 560
	makeBricks({
		color: blockColors.blue, 
		origin: new Point({x: 40, y: blueOriginY})
	})

	makeBricks({
		color: blockColors.orange, 
		origin: new Point({x: 40, y: blueOriginY + blockSettings.size + 20})
	})


	return layer
}


function updateSlotsForBrick(brickContainer) {
	var globalPoint = brickContainer.position

	var targetSlot = undefined // we may not be over any slots
	for (var index = 0; index < trackLayers.length; index++) {
		var track = trackLayers[index]
		if (!track.containsGlobalPoint(globalPoint)) { 
			track.makeSlotsUnswell()
			continue 
		}

		for (var slotIndex = 0; slotIndex < track.track.noteSlots.length; slotIndex++) {
			var slot = track.track.noteSlots[slotIndex]
			if (slot.containsGlobalPoint(globalPoint) && slot.isEmpty()) {
				slot.swell()
				targetSlot = slot
			} else {
				slot.unswell()
			}

		}
	}

	slotUnderBrick = targetSlot
}

function dropBrick(brick) {
	if (slotUnderBrick) {
		slotUnderBrick.unswell()
		slotUnderBrick.dropBrick(brick)
	}
	slotUnderBrick = undefined
}

function log(obj) {
	console.log(JSON.stringify(obj, null, 4))
}

function makeSlotDots(args) {
	var totalLength = args.totalLength

	var slotDots = []
	for (var slotIndex = 0; slotIndex < totalLength; slotIndex++) {
		var dot = new Layer()
		dot.backgroundColor = Color.gray
		dot.width = dot.height = 13
		dot.cornerRadius = dot.width / 2.0
		dot.scale = 0.001
		dot.alpha = 0
		dot.y = dotBaseline

		var noteSlot = trackLayers[0].track.noteSlots[slotIndex]
		dot.x = noteSlot.globalPosition.x



		dot.animators.scale.springSpeed = 60
		dot.animators.scale.springBounciness = 0
		dot.animators.y.springSpeed = 50
		dot.animators.y.springBounciness = 0
		dot.animators.alpha.springSpeed = 40
		dot.animators.alpha.springBounciness = 0
		slotDots.push(dot)
	}
	return slotDots
}


//------------------------------------------------------
// Audio playback
//------------------------------------------------------


// Using an action behavior instead of a heartbeat because heartbeats still don't dispose properly on reload. :/
var slotDots = makeSlotDots({totalLength: 8})
var beatIndex = 0
var lastPlayTime = Timestamp.currentTimestamp()

Layer.root.behaviors = [
	new ActionBehavior({handler: function() {
		var totalNumberOfBeats = 8
		var totalTrackLength = 8

		var beatLength = 0.3
		var dotAnimationLength = 0.18
		var currentTimestamp = Timestamp.currentTimestamp()

		var beatIndexWithinTrack = beatIndex % totalTrackLength
		var fullColumn = columnIsFull(beatIndexWithinTrack)

		if (currentTimestamp - lastPlayTime > beatLength - dotAnimationLength) {
			var currentDot = slotDots[beatIndexWithinTrack]
			currentDot.animators.scale.target = new Point({x: 1, y: 1})
			currentDot.animators.y.target = dotBaseline + 30
			currentDot.animators.alpha.target = 1


			var lastBeatIndex = beatIndex - 1
			if (lastBeatIndex < 0) {
				lastBeatIndex = totalNumberOfBeats - 1
			}

			var lastDot = slotDots[lastBeatIndex % totalTrackLength]
			lastDot.animators.scale.target = new Point({x: 0, y: 0})
			lastDot.animators.y.target = dotBaseline
			lastDot.animators.alpha.target = 0
		}
		if (currentTimestamp - lastPlayTime > beatLength) {
			var foundSound = false
			if (fullColumn) {
				playHarmonyForColumn(beatIndexWithinTrack)
			}

			if (!foundSound && tickEnabled) {

				var sound = new Sound({name: "ta"})
				sound.play()
			}

			lastPlayTime += beatLength
			beatIndex = (beatIndex + 1) % totalNumberOfBeats
		}
	}})
]



//-------------------------------------------------
// Bricks
//-------------------------------------------------

/** This function makes bricks that go along the bottom toolbox area. It also configures them so they properly fit into empty slots. */
function makeBricks(args) {
	var color = args.color
	var origin = args.origin
	var length = 8

	var maxX = origin.x
	for (var index = 0; index < length; index++) {
		var brick = new Brick({
			length: 1,
			color: color,
			size: blockSettings.size,
			cornerRadius: blockSettings.cornerRadius
		})
		var container = brick.container
		container.originX = maxX
		container.originY = origin.y

		maxX = container.frameMaxX + 20

		setupTouchForBrick(brick)
	}


	function setupTouchForBrick(brick) {
		brick.setDragDidBeginHandler(function() {
			if (brick.slot) {
				brick.slot.removeBrick()
			}
		})

		brick.setDragDidMoveHandler(function() {
			updateSlotsForBrick(brick.container)
		})

		brick.setDragDidEndHandler(function() {
			dropBrick(brick)
		})
	}
}

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
	var name = color.name ? color.name : "block"

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
		var block = new Layer({name: name})
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