"use strict";

/* 

Generate lots of things, see the count go up
	still riffing off of Counting by touch count!
	built on Prototope @cf00c1f

Future direction:
	Things that fly! 
	Maybe you can pop things or chase them off the screen and see the number subtract!

*/

Layer.root.backgroundColor = new Color({hue: 0.0, saturation: 0.0, brightness: 1.0})

// TODO: you currently can't attach touch handlers to the root layer. oops.
var touchCatchingLayer = new Layer()
touchCatchingLayer.frame = Layer.root.bounds

var touchLayers = [];
var kacolors = [];

kacolors[0] = new Color({hue: 0.78, saturation: 0.41, brightness: 0.61})
kacolors[1] = new Color({hue: 0.96, saturation: 0.60, brightness: 0.71})
kacolors[2] = new Color({hue: 0.01, saturation: 0.66, brightness: 0.98})
kacolors[3] = new Color({hue: 0.08, saturation: 0.67, brightness: 0.91})
kacolors[4] = new Color({hue: 0.28, saturation: 0.55, brightness: 0.72})
kacolors[5] = new Color({hue: 0.45, saturation: 0.60, brightness: 0.78})
kacolors[6] = new Color({hue: 0.53, saturation: 0.67, brightness: 0.79})
kacolors[7] = new Color({hue: 0.57, saturation: 0.41, brightness: 0.58})


var z = 0
touchCatchingLayer.touchBeganHandler = function(touchSequence) {

	console.log(touchSequence.currentSample.globalLocation.x)
	
	makeCircleLayer(touchSequence.currentSample.globalLocation, touchSequence.currentSample.globalLocation.zPosition)

	return true
}

touchCatchingLayer.touchEndedHandler = touchCatchingLayer.touchCancelledHandler = function(touchSequence) {

}

function makeCircleLayer(position, zposition) {

	var touchCircleLayer = new Layer()
	touchCircleLayer.position = position
	touchCircleLayer.width = touchCircleLayer.height = 75
	touchCircleLayer.cornerRadius = touchCircleLayer.width / 2.0
	var randomNum = Math.random()
	var randomIndex = Math.floor(map({value: randomNum, fromInterval: [0,1], toInterval: [0, kacolors.length - 1]}))
	touchCircleLayer.backgroundColor = kacolors[randomIndex]
	touchCircleLayer.zPosition = zposition

}
