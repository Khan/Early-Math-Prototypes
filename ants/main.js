/**
 * Get a number of ants to work together to lift an object (maybe a candy?) back to their hill. Total rip off of Pikmin!
 */

Layer.root.backgroundColor = new Color({hue: (44.0/360.0), saturation: 0.1, brightness: 1.0})

var hillLayer = new Layer({imageName: "hill"})
hillLayer.position = new Point({x: 200, y: 600})

var pelletLayer = new Layer({imageName: "pellet"})
pelletLayer.position = new Point({x: 800, y: 200})

var ants = []
for (var index = 0; index < 7; index++) {
	var ant = new Ant()
	
	ants.push(ant)
}


function randomPosition() {
	var x = Math.floor((Math.random() * 600) + 1);
	var y = Math.floor((Math.random() * 600) + 1)
	return new Point({x: x, y: y})
}

function Ant() {
	
	var layer = new Layer({imageName: "ant"})
	this.getLayer = function() {
		return layer
	}
	
	layer.position = randomPosition()
	
	var horizontallyFlipped = Math.floor((Math.random() * 1000) + 1) % 2 == 0
	layer.scaleX = horizontallyFlipped ? -1 : 1
	
	this.getHorizontallyFlipped = function() { return horizontallyFlipped }
	
	
	var paused = false
	
	var drives = []
	this.addDrive = function(drive) {
		drives.push(drive)
		
		// Sort them by importance... should be most important to least important
		drives.sort(function(a, b) { 
			return b.importance - a.importance
		})
	}
	
	
	this.flipHorizontally = function() {
		horizontallyFlipped = !horizontallyFlipped
		layer.scaleX = horizontallyFlipped ? -1 : 1
	}
	
	var update = function(dt) {
		if (paused) { return }
		// depending on the current state, do something!
		// wander(dt)
		
		for (var index = 0; index < drives.length; index++) {
			var drive = drives[index]
			
			// Update the first drive that should update
			if (drive.shouldUpdate()) {
				drive.update(dt)
				break
			}
		}
		
	}
	
	// Timekeeping
	var lastTimestamp = Timestamp.currentTimestamp()
	
	// TODO(jb): probably want to replace this with an actual Heartbeat object...
	this.renderer = new ActionBehavior({handler: function(layer) {

		var now = Timestamp.currentTimestamp()
		var dt = now - lastTimestamp
		lastTimestamp = now
		update(dt)
	}})
	
	layer.behaviors = [this.renderer]
	
	
	// Touches
	layer.touchesBeganHandler = function(touchSequences) {
		paused = true
	}
	
	layer.touchMovedHandler = function(touchSequence) {
		layer.position = touchSequence.currentSample.globalLocation
	}
	
	
	layer.touchCancelledHandler = layer.touchEndedHandler = function(touchSequence) {
		paused = false
	}
}


/** A Drive is a desire or behaviour of an object for what it should do. */
function Drive(args) {
	this.object = args.object
	
	// Automatically attach the drive
	this.object.addDrive(this)
	
	var name = args.name
	this.importance = args.importance
	
	this.vars = args.vars ? args.vars : {}
	
	/** Returns if the Drive should be considered. */
	this.shouldUpdate = args.shouldUpdate ? args.shouldUpdate : function() { return true; }
	
	/** The Drive will run and update itself with this function. */
	this.update = args.update ? args.update : function(dt) {}
}

// Drives: Wander, Ponder, Find food, Carry food

var wander = new Drive({
	object: ants[0],
	name: "Wander",
	importance: 5, // arbitrary
	
	// The last time it either paused or started wandering
	vars: {
		lastChangeTime: Timestamp.currentTimestamp(),
		paused: false
	},
	
	shouldUpdate: function() {
		
		// In this function we check to see when the drive was last paused or started, and toggle if it's at least X seconds old.
		var now = Timestamp.currentTimestamp()
		var timeSinceLastChange = now - this.vars.lastChangeTime
		
		if (timeSinceLastChange > 5) {
			this.vars.lastChangeTime = now
			this.vars.paused = !this.vars.paused
		}
		
		return this.vars.paused
	},
	
	
	/** Wander, just a leeeetle bit. */
	update: function(dt) {

		var layer = this.object.getLayer()
		
		var speed = 100
		var wanderLust = this.object.getHorizontallyFlipped() ? 1 : -1
		layer.originX += wanderLust * dt * speed
		
		if (layer.originX < 10 || layer.originX + layer.width > Layer.root.width) {
			this.object.flipHorizontally()
		}
	}
})

