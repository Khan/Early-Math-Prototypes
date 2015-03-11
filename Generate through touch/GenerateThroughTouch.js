"use strict";

/* 

Generate lots of things, see the count go up

Future direction:
	Things that fly! 
	Maybe you can pop things or chase them off the screen and see the number subtract!

Bugs:
	For some reason you can't catch + throw the dots

*/

Layer.root.backgroundColor = new Color({hue: 0.0, saturation: 0.0, brightness: 1.0})

// make a screen sized layer to catch all the touches in lieu of root catching all touches for now
var touchCatchingLayer = new Layer()
touchCatchingLayer.frame = Layer.root.bounds

// ka color set up
var kacolors = [];

kacolors[0] = new Color({hue: 0.78, saturation: 0.41, brightness: 0.61})
kacolors[1] = new Color({hue: 0.96, saturation: 0.60, brightness: 0.71})
kacolors[2] = new Color({hue: 0.01, saturation: 0.66, brightness: 0.98})
kacolors[3] = new Color({hue: 0.08, saturation: 0.67, brightness: 0.91})
kacolors[4] = new Color({hue: 0.28, saturation: 0.55, brightness: 0.72})
kacolors[5] = new Color({hue: 0.45, saturation: 0.60, brightness: 0.78})
kacolors[6] = new Color({hue: 0.53, saturation: 0.67, brightness: 0.79})
kacolors[7] = new Color({hue: 0.57, saturation: 0.41, brightness: 0.58})

var kagreys = []

kagreys[0] = new Color({hue: 0.0, saturation: 0.0, brightness: 0.07})
kagreys[1] = new Color({hue: 0.0, saturation: 0.0, brightness: 0.20})
kagreys[2] = new Color({hue: 0.0, saturation: 0.0, brightness: 0.33})
kagreys[3] = new Color({hue: 0.0, saturation: 0.0, brightness: 0.60})
kagreys[4] = new Color({hue: 0.0, saturation: 0.0, brightness: 0.67})
kagreys[5] = new Color({hue: 0.0, saturation: 0.0, brightness: 0.87})
kagreys[6] = new Color({hue: 0.0, saturation: 0.0, brightness: 0.93})

// array to keep the generated layers
var touchLayers = [];
var touchLayerVelocity = [];
var countFromLayer = {}

// some variables to regulate behavior
var frictionConstant = 0.999
var minMaxInitialVelocity = 5

var numberLayer = new TextLayer()
makeCountLayer();

// make circles when you touch anywhere

var z = 0
touchCatchingLayer.touchBeganHandler = function(touchSequence) {
	
	makeCircleLayer(touchSequence.currentSample.globalLocation, touchSequence.currentSample.globalLocation.zPosition)

	return true
}

touchCatchingLayer.touchEndedHandler = touchCatchingLayer.touchCancelledHandler = function(touchSequence) {
	//really the thing shouldn't start to animate perhaps until after your finger has lifted?
}

var causeFriction = new ActionBehavior({handler:function(layer) {
		for (var i = 0; i < touchLayers.length; i++) {

			var newVelocityWithFriction = touchLayerVelocity[i].multiply(frictionConstant)
			//hee hee, this is doing strange things. i really need to check for a *direction change*
			 
			touchLayerVelocity[i] = newVelocityWithFriction
		}

	}
})

touchCatchingLayer.behaviors = [causeFriction] 

function makeCircleLayer(position, zposition) {

	var touchCircleLayer = new Layer({name:(touchLayers.length.toString())})
	touchCircleLayer.position = position
	touchCircleLayer.width = touchCircleLayer.height = 75
	touchCircleLayer.cornerRadius = touchCircleLayer.width / 2.0
	var randomNum = Math.random()
	var randomIndex = Math.floor(map({value: randomNum, fromInterval: [0,1], toInterval: [0, kacolors.length - 1]}))
	touchCircleLayer.backgroundColor = kacolors[randomIndex]
	touchCircleLayer.zPosition = zposition

	var randomX = Math.random()
	var randomY = Math.random()
	var randomXVelocity = map({value: randomX, fromInterval: [0,1], toInterval: [-minMaxInitialVelocity, minMaxInitialVelocity]})
	var randomYVelocity = map({value: randomY, fromInterval: [0,1], toInterval: [-minMaxInitialVelocity, minMaxInitialVelocity]})
	var randomVelocity = new Point({x: randomXVelocity, y: randomYVelocity})

	touchLayers.push(touchCircleLayer)
	updateCountLayer()
	touchLayerVelocity.push (randomVelocity)
	countFromLayer[touchCircleLayer.name] = touchLayers.length - 1

	var drift = new ActionBehavior({handler:function(layer) {
		var layerIndex = countFromLayer[layer.name]
		var newPosition = layer.position.add(touchLayerVelocity[layerIndex]) //this is a really dumb long way around
		layer.position = newPosition
		if ((newPosition.x + layer.width/2 > Layer.root.width)||(newPosition.x - layer.width/2 < 0)) {
			var tempPoint = new Point({x: (0 - touchLayerVelocity[layerIndex].x), y: touchLayerVelocity[layerIndex].y})
			touchLayerVelocity[layerIndex] = tempPoint
		}
		if ((newPosition.y + layer.height/2 > Layer.root.height)||(newPosition.y - layer.height/2 < 0)) {
			var tempPoint = new Point({x: touchLayerVelocity[layerIndex].x, y: (0 - touchLayerVelocity[layerIndex].y)})
			touchLayerVelocity[layerIndex] = tempPoint
		}
		//the stuff for checking how things bump into each other, which I have not done a good job of below
		//however now I am yak shaving. NEXT PROTO
		// for (var i = 0; i < touchLayers.length; i++) {
		// 	if (i != layerIndex) {
		// 		var absPositionDiffX = Math.abs((touchLayers[i].position.subtract(newPosition).x))
		// 		var absPositionDiffY = Math.abs((touchLayers[i].position.subtract(newPosition).y))
		// 		if ((absPositionDiffX < layer.width)&&(absPositionDiffY < layer.width)) {s
		// 			var tempPoint = new Point({x: (0 - touchLayerVelocity[layerIndex].x), y: (0 - touchLayerVelocity[layerIndex].y)})
		// 			touchLayerVelocity[layerIndex] = tempPoint
					
		// 		}
		// 	}
		// }	


		//console.log(layerIndex)
	}})

	touchCircleLayer.behaviors = [drift];

	touchCircleLayer.touchBeganHandler = function(touchSequence) {
		touchCircleLayer.behaviors = [];
	}

	touchCircleLayer.touchMovedHandler = function(touchSequence) {
		touchCircleLayer.position = touchCircleLayer.position.add(touchSequence.currentSample.globalLocation.subtract(touchSequence.previousSample.globalLocation))
	}

	touchCircleLayer.touchEndedHandler = function(touchSequence) {
		var newVelocity = touchSequence.currentGlobalVelocity()
		var layerIndex = countFromLayer[touchCircleLayer.name]
		// touchLayerVelocity contains velocity per frame; Prototope gives us velocity per *second*.
		touchLayerVelocity[layerIndex] = newVelocity.multiply(1/60)
		touchCircleLayer.behaviors = [drift]; 
	}
}


function makeCountLayer() {
 
	numberLayer.textColor = kagreys[2]
	numberLayer.fontName = "Avenir-Heavy"
	numberLayer.fontSize = 45
	numberLayer.text = touchLayers.length.toString()
	numberLayer.zPosition = 100000
	numberLayer.x = Layer.root.x
	numberLayer.y = 125

	return numberLayer
}

function updateCountLayer() {
	numberLayer.text = (touchLayers.length - 1).toString() + " + 1 = " + touchLayers.length.toString()
	numberLayer.x = Layer.root.x
}



