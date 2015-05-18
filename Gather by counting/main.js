Layer.root.backgroundColor = new Color({hex: "e9f5df"})

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
    
    leaf.gestures = [
    		new TapGesture({handler: function() {
	    		leaf.image = new Image({name: "tulip-petal-sides-red"})
    		}})
    ]
    
    return container
}


function makeFlowerPatchForFlowerCount(flowerCount) {
	var flowerContainer = new Layer()
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