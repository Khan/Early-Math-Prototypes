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
for (let i = numFirstBGLayer; i < numFirstBGLayer+numBGLayers; i++) {
	const bgLayerName = strBgLayer + i
	var bgLayer = new Layer({imageName: bgLayerName})
	bgLayer.x = bgLayer.width/2 
	bgLayer.y = bgLayer.height/2
}

//set up character
const charLayerName = strCharLayer + numFirstCharLayer
var charLayer = new Layer({imageName: charLayerName})
charLayer.x = 170
charLayer.y = 555
