/*

Drag to match cards
	built on Prototope @ 7093cfe206

Here we're building 1-to-1 relationships between the counters and the
numerals, and reinforcing the idea of conservation: by moving a token from one
circle to the other, we lower the number on the right side by 1 and increase
the number on the left side by 1.

Key weaknesses here:
	the prompt isn't really inherently fun / creative / discovery-ish. 
	not sure the use of color on the tokens isn't more confusing than useful

*/

if (Layer.root.width !== 1024) {
	throw "This prototype wants to be run in landscape on an iPad!"
}

//============================================================================================

// these are the early math riffs off of the KA color palette *for now*
// it would be nice to have these pulled off of something central eventually!

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

//============================================================================================

// Game state:
var leftTargetCount = 5
var rightTargetCount = 3
var leftInitialCount = 2
var rightInitialCount = 6
var hasWon = false

var counterDiameter = 65
var leftSideColor = kacolors[2]
var rightSideColor = kacolors[6]

Layer.root.image = new Image({name: "BG"})

var label1 = makeCurrentCountLabel()
var label2 = makeCurrentCountLabel()

label1.originY = label2.originY = 30
label1.x = Layer.root.x - 53
label2.x = Layer.root.x + 53


// Generate the counters
var leftSideRect = new Rect({x: 0, y: 135, width: 504, height: 422})
var rightSideRect = new Rect({x: 520, y: 135, width: 504, height: 422})
var sidePaddingX = 50 + counterDiameter / 2
var sidePaddingTopY = 150 + counterDiameter / 2
var sidePaddingBottomY = 250 + counterDiameter / 2
populateSide(insetRect(leftSideRect, counterDiameter), 2, leftSideColor)
populateSide(insetRect(rightSideRect, counterDiameter), 6, rightSideColor)

label1.text = leftInitialCount.toString()
label1.textColor = leftSideColor

label2.text = rightInitialCount.toString()
label2.textColor = rightSideColor

function populateSide(frame, counterCount, counterColor) {
	var counters = []
	for (var i = 0; i < counterCount; i++) {
		var counter = makeCounter()
		counter.backgroundColor = counterColor

		while (true) {
			// Put it somewhere in the side.
			counter.position = new Point({
				x: Math.floor(Math.random() * (frame.maxX - frame.minX) + frame.minX),
				y: Math.floor(Math.random() * (frame.maxY - frame.minY) + frame.minY)
			})

			// Try again if it hit a counter we've already put down.
			var hitOtherCounter = false
			for (var otherCounterIndex in counters) {
				var otherCounter = counters[otherCounterIndex]
				if (counter.position.distanceToPoint(otherCounter.position) < otherCounter.width * 1.5) {
					hitOtherCounter = true
					break
				}
			}

			if (!hitOtherCounter) {
				break
			}
		}

		counters.push(counter)
	}
}

function insetRect(rect, inset) {
	return new Rect({
		x: rect.origin.x + inset,
		y: rect.origin.y + inset,
		width: rect.size.width - (inset * 2),
		height: rect.size.height - (inset * 2)
	})
}

function makeCurrentCountLabel() {
	var label = new TextLayer()
	label.fontName = "Futura"
	label.fontSize = 70
	label.textColor = Color.white
	label.text = "0"
	label.zPosition = 10000
	label.shadow = new Shadow({color: Color.white, radius: 0, alpha: 1.0, offset: new Size({width: 1, height: 1})})
	return label
}

function makeCounter() {
	var counter = new Layer()

	var randomHue = Math.random()
	counter.width = counter.height = counterDiameter
	counter.cornerRadius = 15
	counter.animators.scale.springSpeed = 30
	counter.animators.backgroundColor.springSpeed = 40
	counter.animators.backgroundColor.springBounciness = 0
	counter.animators.x.springSpeed = 30
	counter.animators.x.springBounciness = 2

	counter.touchBeganHandler = function(touchSequence) {
		counter.animators.scale.target = new Point({x: 1.5, y: 1.5})
	}
	counter.touchMovedHandler = function(touchSequence) {
		var newPosition = counter.position.add(touchSequence.currentSample.globalLocation.subtract(touchSequence.previousSample.globalLocation))
		var previousSide = sideForCounterPosition(counter.position)
		var currentSide = sideForCounterPosition(newPosition)

		var previousSide1Value = parseInt(label1.text)
		var previousSide2Value = parseInt(label2.text)
		if (previousSide === CounterSide.left && currentSide === CounterSide.right) {
			label1.text = (previousSide1Value - 1).toString()
			label2.text = (previousSide2Value + 1).toString()
			counter.animators.backgroundColor.target = rightSideColor
		} else if (previousSide === CounterSide.right && currentSide === CounterSide.left) {
			label1.text = (previousSide1Value + 1).toString()
			label2.text = (previousSide2Value - 1).toString()
			counter.animators.backgroundColor.target = leftSideColor
		}

		if (parseInt(label1.text) == leftTargetCount && parseInt(label2.text) == rightTargetCount && !hasWon) {
			hasWon = true
			Layer.root.userInteractionEnabled = false
			showYay()
		}

		var clippedPosition = new Point({x: newPosition.x, y: clip({value: newPosition.y, min: leftSideRect.minY, max: leftSideRect.maxY})})
		counter.position = clippedPosition
	}
	counter.touchEndedHandler = counter.touchCancelledHandler = function(touchSequence) {
		if (counter.frameMaxX > leftSideRect.maxX && counter.originX < rightSideRect.minX) {
			counter.animators.x.target = (sideForCounterPosition(counter.position) == CounterSide.left) ? leftSideRect.maxX - (counterDiameter * 2/3) : rightSideRect.minX + (counterDiameter * 2/3)
		}
		counter.animators.scale.target = new Point({x: 1.0, y: 1.0})
	}

	return counter
}

var leftThoughtBubble = makeThoughtBubble("Red", leftTargetCount)
var rightThoughtBubble = makeThoughtBubble("Blue", rightTargetCount)
leftThoughtBubble.y = rightThoughtBubble.y = Layer.root.frameMaxY - leftThoughtBubble.height / 2.0 - 30
leftThoughtBubble.x = (Layer.root.x / 2) + 90
rightThoughtBubble.x = (Layer.root.x * 3 / 2) - 90

var leftThoughtBubbleAux1 = makeFloatingCircle(30)
var leftThoughtBubbleAux2 = makeFloatingCircle(20)
var leftThoughtBubbleAux3 = makeFloatingCircle(10)
leftThoughtBubbleAux1.backgroundColor = leftThoughtBubbleAux2.backgroundColor = leftThoughtBubbleAux3.backgroundColor = leftSideColor
leftThoughtBubbleAux1.position = leftThoughtBubble.origin.add(new Point({x: -10, y: 20}))
leftThoughtBubbleAux2.position = leftThoughtBubble.origin.add(new Point({x: -40, y: 10}))
leftThoughtBubbleAux3.position = leftThoughtBubble.origin.add(new Point({x: -60, y: 25}))

var rightThoughtBubbleAux1 = makeFloatingCircle(30)
var rightThoughtBubbleAux2 = makeFloatingCircle(20)
var rightThoughtBubbleAux3 = makeFloatingCircle(10)
rightThoughtBubbleAux1.backgroundColor = rightThoughtBubbleAux2.backgroundColor = rightThoughtBubbleAux3.backgroundColor = rightSideColor
var rightSideOfRightThoughtBubble = new Point({x: rightThoughtBubble.frameMaxX, y: rightThoughtBubble.originY})
rightThoughtBubbleAux1.position = rightSideOfRightThoughtBubble.add(new Point({x: 0, y: 20}))
rightThoughtBubbleAux2.position = rightSideOfRightThoughtBubble.add(new Point({x: 35, y: 10}))
rightThoughtBubbleAux3.position = rightSideOfRightThoughtBubble.add(new Point({x: 60, y: 25}))

function makeThoughtBubble(imageNameExtension, value) {
	var thoughtBubble = new Layer({imageName: "Cloud-" + imageNameExtension})
	thoughtBubble.position = Layer.root.position

	thoughtBubble.behaviors = [makeFloatingBehavior(0.040, 0.5)]

	var thoughtBubbleLabel = new TextLayer({parent: thoughtBubble})
	thoughtBubbleLabel.textColor = Color.white
	thoughtBubbleLabel.fontName = "Futura"
	thoughtBubbleLabel.fontSize = 60
	thoughtBubbleLabel.text = value.toString()
	thoughtBubbleLabel.x = thoughtBubble.width / 2.0
	thoughtBubbleLabel.y = thoughtBubble.height / 2.0

	return thoughtBubble
}

function makeFloatingCircle(diameter) {
	var circle = new Layer()
	circle.width = circle.height = diameter
	circle.cornerRadius = diameter / 2.0
	circle.behaviors = [makeFloatingBehavior(0.035, 0.40)]
	return circle
}

function makeFloatingBehavior(amplitude, frequency) {
	var floatingSeed = Math.random() * 2 * Math.PI
	return new ActionBehavior({handler: function(layer) {
		layer.y = layer.y + Math.sin((Timestamp.currentTimestamp() + floatingSeed) * frequency) * amplitude
	}})
}

var leftPlaceholderGuy = new Layer({imageName: "placeholder guy"})
var rightPlaceholderGuy = new Layer({imageName: "placeholder guy"})
leftPlaceholderGuy.y = rightPlaceholderGuy.y = Layer.root.frameMaxY - leftPlaceholderGuy.height / 2.0 + 35
leftPlaceholderGuy.originX = 80
rightPlaceholderGuy.originX = Layer.root.frameMaxX - rightPlaceholderGuy.width - 80
rightPlaceholderGuy.scaleX = -1

var CounterSide = {
	left: 0,
	right: 1
}
function sideForCounterPosition(position) {
	return (position.x < Layer.root.x) ? CounterSide.left : CounterSide.right
}

function showYay() {
	var yay = new TextLayer()
	yay.fontName = "Futura"
	yay.fontSize = 500
	yay.textColor = kacolors[5]
	yay.text = "YAY"
	yay.scale = 0.01
	yay.position = Layer.root.position
	yay.animators.scale.target = new Point({x: 1, y: 1})
}
