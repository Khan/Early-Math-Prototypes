
//
// Gather by counting
//	based on Prototope 1a7f868
//
// Tap the flowers to gather some bricks
// success sound from https://www.freesound.org/people/grunz/sounds/109662/


Layer.root.backgroundColor = new Color({hex: "eaeaea"})

//-------------------------
// Sounds
//-------------------------
var numbersToSounds = []
for (var i = 1; i <= 8; i++) {
	numbersToSounds.push(new Sound({name: i.toString()}))
}

var flowerSounds = [new Sound({name: "Flower"}), new Sound({name: "Flowers"})]
var successSound = new Sound({name: "success"})


//------------------------
// Colours
//------------------------

var colors = [
	{
		name: "gold",
		hex: "d2933d"
	},{
		name: "purple",
		hex: "644172"
	},{
		name: "red",
		hex: "ca3132"
	}
]


//-----------------------
// Layers
//-----------------------

var grassLayer = new Layer()
grassLayer.bounds = Layer.root.bounds
grassLayer.position = Layer.root.position
grassLayer.y -= 100
grassLayer.backgroundColor = new Color({hex: "e9f5df"})
grassLayer.cornerRadius = 20


var blockSize = 50 // this constant has to be here because Javascript is a terrible language


var flowerSize = new Size({width: 50, height: 140})
function makeFlower(args) {
	
	
	var name = args.color.name
	var brick = args.brick
	var shadowBrick = args.shadowBrick
	
	
    var container = new Layer()
    container.size = flowerSize
    
    var stem = new Layer({parent: container})
    stem.width = 5
    stem.height = 100
    stem.backgroundColor = new Color({hex: "66a54a"})
    stem.moveToBottomSideOfParentLayer()
    stem.moveToHorizontalCenterOfParentLayer()

	
    var leaf = new Layer({imageName: "tulip-petal-front-" + name, parent: container})
    leaf.moveAboveSiblingLayer({siblingLayer: stem})
    leaf.x = stem.x
    
    
    leaf.beenTapped = false
    leaf.gestures = [
    		new TapGesture({handler: function() {
	    		if (leaf.beenTapped) { return }
	    		leaf.beenTapped = true
	    		
	    		var left = new Layer({imageName: "tulip-petal-sides-" + name, parent: container})
	    		var right = new Layer({imageName: "tulip-petal-sides-" + name, parent: container})
	    		
	    		bringLayerToFront(leaf)
	    		
	    		left.frame = right.frame = leaf.frame
	    		
	    		var degrees = 45
	    		left.animators.rotationRadians.target = degreesToRadians(-degrees)
	    		right.animators.rotationRadians.target = degreesToRadians(degrees)
	    		
	    		brick.showIfNeeded()
	    		brick.animateInNextBlock()
	    		if (brick.completed()) {
		    		// show the shadow brick
		    		shadowBrick.animators.alpha.target = 1
		    		brick.becomeDraggable()
	    		}
    		}})
    ]
    
    return container
}


function makeFlowerPatchForFlowerCount(flowerCount) {
	
	var shadowBrick = makeBrick({length: flowerCount, isShadow: true})
	shadowBrick.position = new Point({x: 200 * flowerCount, y: 720})
	shadowBrick.alpha = 0
	
	var brick = makeBrick({length: flowerCount, isShadow: false})
	brick.alpha = 0
	brick.originY = 692
	brick.shadowBrick = shadowBrick
	
	
	
	var flowerContainer = new Layer()
	flowerContainer.width = flowerSize.width * flowerCount
	flowerContainer.height = flowerSize.height
	
	var maxX = 0
	for (var index = 0; index < flowerCount; index++) {
		
		var flower = makeFlower({color: colors[flowerCount - 1], brick: brick, shadowBrick: shadowBrick})
		flower.parent = flowerContainer
		
		flower.originX = maxX
		flower.originY = 0
		maxX = flower.frameMaxX
	}
	
	bringLayerToFront(brick)
	
	flowerContainer.repositionBrick = function() {
		brick.position = flowerContainer.position
		brick.moveAboveSiblingLayer({siblingLayer: flowerContainer, margin: 30})
	}
	
	return flowerContainer
}


var twoPatch = makeFlowerPatchForFlowerCount(2)
twoPatch.moveToCenterOfParentLayer()

var onePatch = makeFlowerPatchForFlowerCount(1)
onePatch.moveToCenterOfParentLayer()
onePatch.moveToLeftOfSiblingLayer({siblingLayer: twoPatch, margin: 100})

var threePatch = makeFlowerPatchForFlowerCount(3)
threePatch.moveToCenterOfParentLayer()
threePatch.moveToRightOfSiblingLayer({siblingLayer: twoPatch, margin: 100})

onePatch.repositionBrick()
twoPatch.repositionBrick()
threePatch.repositionBrick()


function makeEmptyBlock(args) {
	var color = args.color
	var isShadow = args.isShadow
	
	var rect = new Rect({x: 50, y: 50, width: blockSize, height: blockSize})
	var block = new ShapeLayer.Rectangle({rectangle: rect, cornerRadius: 8})
	
	block.fillColor = isShadow ? new Color({hex: color}) : undefined
	block.strokeColor = new Color({hex: color})
	block.strokeWidth = 2
	block.dashLength = isShadow ? undefined : 5
	
	return block
}

function makeBrick(args) {
	var length = args.length
	var isShadow = args.isShadow
	
	if (length < 1) { return }
	
	var container = new Layer()
	container.size = new Size({width: (blockSize + 2) * length, height: blockSize})
	container.blocks = []
	
	var maxX = 0
	for (var index = 0; index < length; index++) {
		var color = isShadow ? "d5d5d5" : colors[length - 1].hex
		var block = makeEmptyBlock({color: color, isShadow: isShadow})
		block.parent = container
		block.originX = maxX + 2
		block.originY = 0
		
		maxX = block.frameMaxX
		
		container.blocks.push(block)
	}
	
	
	container.showIfNeeded = function() {
		if (container.alpha == 1) { return }
		
		container.alpha = 1
		container.scale = 0.01
		container.animators.scale.target = new Point({x: 1, y: 1})
	}
	
	container.completed = function() { return container.nextBlockIndex == length }
	
	container.nextBlockIndex = 0
	container.animateInNextBlock = function() {
		if (container.nextBlockIndex >= length) { return }
		
		var block = container.blocks[container.nextBlockIndex]
		block.fillColor = block.strokeColor
		block.dashLength = undefined
		
		
		block.animators.scale.target = new Point({x: 1, y: 1})
		var velocity = 4
		block.animators.scale.velocity = new Point({x: velocity, y: velocity})
		
		container.nextBlockIndex++
		
		
		var index = container.nextBlockIndex - 1
		var allFlowersCompleted = index + 1 == length
		
		numbersToSounds[index].play()
		
		// This should really happen in the "afterDuration" call below, but it seems I can use an animator in that?
		if (allFlowersCompleted) {
			container.animators.scale.target = new Point({x: 1, y: 1})
			container.animators.scale.velocity = new Point({x: velocity * 4, y: velocity * 4})
			
			// container.animators.position.target = new Point({x: 100, y: 720})
		}
		
		afterDuration(0.5, function() {
			flowerSounds[index + 1 == 1 ? 0 : 1].play()
			if (allFlowersCompleted) {
				// we've shown all the blocks, play success!
				afterDuration(0.5, function() {
					successSound.play()
				})
			}
		})
	}
	
	
	container.becomeDraggable = function() {
		container.touchMovedHandler = function(touchSequence) {
			container.position = touchSequence.currentSample.globalLocation
		}
		
		container.touchEndedHandler = function(touchSequence) {
			// see where the touch is, and if it's close to the shadow brick, then accept the drop
			if (container.frame.intersectsRect(container.shadowBrick.frame)) {
				container.animators.frame.target = container.shadowBrick.frame
				container.animators.frame.velocity
			}
		}
	}
	
	return container
}


//------------------
// Utilities
//------------------


function degreesToRadians(degrees) {
	return degrees * Math.PI / 180
}


// Hack to bring a layer to the front...this should be a part of prototope!
function bringLayerToFront(layer) {
	var parent = layer.parent
	layer.parent = undefined
	layer.parent = parent
}
