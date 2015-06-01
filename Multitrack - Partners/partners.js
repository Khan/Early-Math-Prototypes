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

// The empty slot, if any, under a brick being dragged.
var slotUnderBrick = undefined

var trackCenterY = 69
var trackSlotWidth = 87
var dotBaseline = 25
var firstTrackSlotX = 80


var kittyTrack =  makeSoundtrackLayer({
	name: "kitty",
	sound: "cat_a"
})

var beeTrack = makeSoundtrackLayer({
	name: "bee",
	sound: "dog_e" // get it...dog-e
})

var dogTrack = makeSoundtrackLayer({
	name: "dog",
	sound: "dog_e8"// get it...dog-e-8
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

	var sound = new Sound({name: args.sound})

	layer.makeSlotsUnswell = function() {
		track.makeSlotsUnswell()
	}

	layer.slotAtIndexIsOccupied = function(index) {
		return track.noteSlots[index].isEmpty() !== true
	}

	layer.playSoundForSlotAtIndex = function(index) {
		sound.play()
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
		// Can't change the brick's parent because that breaks touch handling right now :\
		// brick.container.parent = slot
		// brick.container.moveToCenterOfParentLayer()
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

	var blockColors = {
		blue: new Color({hex: "59C4DD"}),
		orange: new Color({hex: "EFAC5F"})
	}

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
	var self = this
	this.setDragDidBeginHandler = function(handler) { self.dragDidBeginHandler = handler }
	this.setDragDidMoveHandler = function(handler) { self.dragDidMoveHandler = handler }
	this.setDragDidEndHandler = function(handler) { self.dragDidEndHandler = handler }


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
	this.container = container
}
