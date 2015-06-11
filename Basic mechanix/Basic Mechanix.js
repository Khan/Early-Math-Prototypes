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

//setting up a basic tap to move character test with basic touch handlers
touchCatchingLayer.touchBeganHandler = function(touchSequence) {
 
	let i = 0;
	for (let layerIndex in bgParentLayer.sublayers) {
		const layer = bgParentLayer.sublayers[layerIndex]
		layer.x = layer.x - (50*(i+1)); 
		i++ 
	}


}



