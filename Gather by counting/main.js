
//
// Gather by counting
//	based on Prototope 1a7f868
//
// Tap the flowers to gather some bricks


Layer.root.backgroundColor = new Color({hex: "eaeaea"})

var grassLayer = new Layer()
grassLayer.bounds = Layer.root.bounds
grassLayer.position = Layer.root.position
grassLayer.y -= 100
grassLayer.backgroundColor = new Color({hex: "e9f5df"})
grassLayer.cornerRadius = 20


var blockSize = 50 // this constant has to be here because Javascript is a terrible language
var brick = makeBrickOfLength(3)
brick.alpha = 0
brick.originY = 692

var flowerSize = new Size({width: 50, height: 140})
function makeFlower() {
    var container = new Layer()
    container.size = flowerSize
    
    var stem = new Layer({parent: container})
    stem.width = 5
    stem.height = 100
    stem.backgroundColor = new Color({hex: "66a54a"})
    stem.moveToBottomSideOfParentLayer()
    stem.moveToHorizontalCenterOfParentLayer()
    
    var leaf = new Layer({imageName: "tulip-petal-front-red", parent: container})
    leaf.moveAboveSiblingLayer({siblingLayer: stem})
    leaf.x = stem.x
    
    // leaf.rotationRadians = degreesToRadians(15)
    
    leaf.beenTapped = false
    leaf.gestures = [
    		new TapGesture({handler: function() {
	    		if (leaf.beenTapped) { return }
	    		leaf.beenTapped = true
	    		
	    		var left = new Layer({imageName: "tulip-petal-sides-red", parent: container})
	    		var right = new Layer({imageName: "tulip-petal-sides-red", parent: container})
	    		
	    		// this is a hack to put the left/right leaves behind the centre leaf..we don't have methods to send layers to the back yet
	    		leaf.parent = undefined
	    		leaf.parent = container
	    		
	    		left.frame = right.frame = leaf.frame
	    		
	    		var degrees = 45
	    		left.animators.rotationRadians.target = degreesToRadians(-degrees)
	    		right.animators.rotationRadians.target = degreesToRadians(degrees)
	    		
	    		brick.showIfNeeded()
	    		brick.animateInNextBlock()
    		}})
    ]
    
    return container
}


function makeFlowerPatchForFlowerCount(flowerCount) {
	var flowerContainer = new Layer({parent: grassLayer})
	flowerContainer.width = flowerSize.width * flowerCount
	flowerContainer.height = flowerSize.height
	
	var maxX = 0
	for (var index = 0; index < flowerCount; index++) {
		var flower = makeFlower()
		flower.parent = flowerContainer
		
		flower.originX = maxX
		flower.originY = 0
		maxX = flower.frameMaxX
	}
	
	return flowerContainer
}

var threePatch = makeFlowerPatchForFlowerCount(3)
threePatch.moveToCenterOfParentLayer()


function makeEmptyBlock() {
	var rect = new Rect({x: 50, y: 50, width: blockSize, height: blockSize})
	var block = new ShapeLayer.Rectangle({rectangle: rect, cornerRadius: 8})
	block.fillColor = undefined
	block.strokeColor = new Color({hex: "ca3132"})
	block.strokeWidth = 2
	block.dashLength = 5
	
	return block
}

function makeBrickOfLength(length) {
	if (length < 1) { return }
	
	var container = new Layer()
	container.size = new Size({width: blockSize, height: blockSize * length})
	container.blocks = []
	
	var maxX = 0
	for (var index = 0; index < length; index++) {
		var block = makeEmptyBlock()
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
	}
	
	return container
}

function degreesToRadians(degrees) {
	return degrees * Math.PI / 180
}
