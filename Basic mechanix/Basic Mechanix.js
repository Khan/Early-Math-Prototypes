/*

Basic Mechanix
	
This prototype is intended to test out the basic mechanisms
of walking, gathering numbers, and laying them down.

We'll just focus on the forest for now.

*/

//setting up some strings to point to assets so that they are all in one place
const strBgLayer = "trees"
const numFirstBGLayer = 0
const numLayers = 4

Layer.root.backgroundColor = new Color({hue: 0.52, saturation: 0.17, brightness: 0.94})

for (let i = numFirstBGLayer; i < numFirstBGLayer+numLayers; i++) {
	const bgLayerName = strBgLayer + i
	var bgLayer = new Layer({imageName: bgLayerName})
	bgLayer.x = bgLayer.width/2 
	bgLayer.y = bgLayer.height/2
}

// const bgLayer0 = new Layer({imageName: strBgLayer0})
// const bgLayer1 = new Layer({imageName: strBgLayer1})
// bgLayer0.x = bgLayer0.width/2 
// bgLayer0.y = bgLayer0.height/2
// bgLayer1.x = bgLayer1.width/2 
// bgLayer1.y = bgLayer1.height/2


 