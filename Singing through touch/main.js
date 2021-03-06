"use strict";

/* 

Singing through touch count
	riffing off of Counting by touch count
	built on Prototope @cf00c1f

Sing through your fingers! 

Weaknesses right now:
	- my voice
	- what do we do for > 8? or < 1?

Future directions:
	- try the sound of two voices singing two, three voices singing three?

Things to learn from this:
	– do the notes change the learner's incentive to put 3 fingers down right away to get that note?

*/

Layer.root.backgroundColor = new Color({hue: 0.0, saturation: 0.0, brightness: 1.0})

// TODO: you currently can't attach touch handlers to the root layer. oops.
var touchLayer = new Layer()
touchLayer.frame = Layer.root.bounds

var touchesToCircleLayers = {}
var numbersToNumberLayers = {} 
var touchLayers = [];
var kacolors = [];

var numbersToSounds = {}
for (var i = 1; i <= 8; i++) {
	numbersToSounds[i] = new Sound({name: i.toString()})
}
var lastNumberSpoken = undefined

kacolors[0] = new Color({hue: 0.78, saturation: 0.41, brightness: 0.61})
kacolors[1] = new Color({hue: 0.96, saturation: 0.60, brightness: 0.71})
kacolors[2] = new Color({hue: 0.01, saturation: 0.66, brightness: 0.98})
kacolors[3] = new Color({hue: 0.08, saturation: 0.67, brightness: 0.91})
kacolors[4] = new Color({hue: 0.28, saturation: 0.55, brightness: 0.72})
kacolors[5] = new Color({hue: 0.45, saturation: 0.60, brightness: 0.78})
kacolors[6] = new Color({hue: 0.53, saturation: 0.67, brightness: 0.79})
kacolors[7] = new Color({hue: 0.57, saturation: 0.41, brightness: 0.58})


var z = 0
touchLayer.touchesBeganHandler = function(touchSequences) {
	for (var index in touchSequences) {
		var touchSequence = touchSequences[index]

		if (touchLayers.length < 8) {

			var number = touchLayers.length + 1
			z += 1

			var touchCircleLayer = new Layer()
			touchCircleLayer.position = touchSequence.currentSample.globalLocation
			touchCircleLayer.width = touchCircleLayer.height = 50
			touchCircleLayer.cornerRadius = touchCircleLayer.width / 2.0
			touchCircleLayer.backgroundColor = kacolors[touchLayers.length]
			touchCircleLayer.zPosition = z
			touchCircleLayer.userInteractionEnabled = false
			touchesToCircleLayers[touchSequence.id] = touchCircleLayer
			touchLayers.push(touchCircleLayer)

			touchCircleLayer.animators.scale.target = new Point({x: 4, y: 4})
			var velocity = tunable({default: 121.71, name: "Velocity", min: 0, max: 500})
			touchCircleLayer.animators.scale.velocity = new Point({x: velocity, y: velocity})
			touchCircleLayer.animators.scale.springSpeed = tunable({default: 2.42, name: "Speed", min: 0, max: 30})
			touchCircleLayer.animators.scale.springBounciness = tunable({default: 10.16, name: "Bounciness", min: 0, max: 30})

			var numberLayer = createNumberLayer(number)
			numberLayer.position = touchCircleLayer.position
			numberLayer.animators.position.target = positionForNumberLayer(number)
			numbersToNumberLayers[number] = numberLayer
		}
	}

	scheduleNumberSpeech()
	return true
}

touchLayer.touchMovedHandler = function(touchSequence) {
	if (touchesToCircleLayers[touchSequence.id] != undefined) {
		touchesToCircleLayers[touchSequence.id].position = touchSequence.currentSample.globalLocation
	}	
}

touchLayer.touchEndedHandler = touchLayer.touchCancelledHandler = function(touchSequence) {
	var number = touchLayers.length
	var circleLayer = touchesToCircleLayers[touchSequence.id]
	if (circleLayer != undefined) {
		var numberLayer = numbersToNumberLayers[number]
		var animateLayerOut = function(layer) {
			layer.animators.scale.target = new Point({x: 0, y: 0})
			layer.animators.scale.velocity = new Point({x: 0, y: 0}) // don't understand why this is necessary
			layer.animators.scale.springBounciness = 0
			layer.animators.scale.springSpeed = 20
			layer.animators.scale.completionHandler = function () {
				layer.parent = undefined
			}
		}
		animateLayerOut(circleLayer)
		animateLayerOut(numberLayer)

		delete touchesToCircleLayers[touchSequence.id]
		delete numbersToNumberLayers[number]
		touchLayers.splice(touchLayers.indexOf(circleLayer), 1)

		scheduleNumberSpeech()
	}
}

function scheduleNumberSpeech() {
	afterDuration(0.050, function () {
		var currentNumber = touchLayers.length
		if (currentNumber !== lastNumberSpoken && currentNumber > 0) {
			numbersToSounds[currentNumber].play()
		}
		lastNumberSpoken = currentNumber
	})
}

function colorForNumber(number) {
	return new Color({hue: (number * 0.7 + 0.2) % 1.0, saturation: (0.8 + Math.sin(number * 2) * 0.2), brightness: 0.9})
}

function positionForNumberLayer(number) {
	var maxWidth = Layer.root.width - 50
	var y = 75
	var x = 50
	for (var i = 1; i < number; i++) {
		x += 125
		if (x >= maxWidth) {
			x = 50
			y += 100
		}
	}
	return new Point({x: x, y: y})
}

function createNumberLayer(number) {
	var numberLayer = new TextLayer()
	numberLayer.textColor = kacolors[number-1]
	numberLayer.fontName = "Avenir-Heavy"
	numberLayer.fontSize = 95
	numberLayer.text = number.toString()
	numberLayer.animators.position.springBounciness = 3
	numberLayer.animators.position.springSpeed = 18
	numberLayer.zPosition = 100000
	numberLayer.shadow = new Shadow({color: Layer.root.backgroundColor, alpha: 1.0, radius: 1})

	numberLayer.behaviors = [
		new ActionBehavior({handler: function() {
			numberLayer.y += Math.sin(Timestamp.currentTimestamp() * 1.5 + number * 60) * 0.05
		}})
	]
	return numberLayer
}

