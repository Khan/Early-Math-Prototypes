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

var counterDiameter = 44

Layer.root.backgroundColor = new Color({hue: 0.7, saturation: 0.2, brightness: 1.0})

var label1 = makeCurrentCountLabel()
var label2 = makeCurrentCountLabel()

label1.originY = label2.originY = 40
label1.x = Layer.root.x / 2
label2.x = Layer.root.x * 3/2

var target1 = 5
var target2 = 3
var hasWon = false

// Generate the counters
var sidePaddingX = 50 + counterDiameter / 2
var sidePaddingY = 100 + counterDiameter / 2
populateSide(new Rect({x: sidePaddingX, y: sidePaddingY, width: Layer.root.width / 2 - sidePaddingX * 2, height: Layer.root.height - sidePaddingY * 2}), 2)
populateSide(new Rect({x: Layer.root.width / 2 + sidePaddingX, y: sidePaddingY, width: Layer.root.width / 2 - sidePaddingX * 2, height: Layer.root.height - sidePaddingY * 2}), 6)

label1.text = "2"
label2.text = "6"

// Draw a line in the middle
var centerLine = new Layer()
centerLine.backgroundColor = Color.white
centerLine.frame = Layer.root.bounds
centerLine.width = 1

// var targetCard = new Layer()
// targetCard.backgroundColor = Color.white
// targetCard.x = Layer.root.x
// targetCard.y = Layer.root.frameMaxY - 100
// targetCard.width = 700
// targetCard.height = 350
// targetCard.cornerRadius = 60
// targetCard.alpha = 0

function makeTargetCircle() {
	var circle = new Layer()
	circle.border = new Border({color: Layer.root.backgroundColor, width: 3})
	circle.width = circle.height = 180
	circle.cornerRadius = circle.width / 2.0
	circle.y = targetCard.y - 30
	return circle
}

function makeTargetLabel(targetValue, position) {
	var label = new TextLayer()
	label.fontName = "Futura"
	label.fontSize = 60
	label.textColor = Layer.root.backgroundColor
	label.text = targetValue.toString()
	label.position = position
	label.userInteractionEnabled = false
}

// var targetCircle1 = makeTargetCircle()
// targetCircle1.x = targetCard.x - targetCircle1.width / 2.0 - 25
// targetCircle1.touchBeganHandler = function() {
// 	circle1.animators.scale.target = new Point({x: 1.15, y: 1.15})
// }
// targetCircle1.touchEndedHandler = targetCircle1.touchCancelledHandler = function() {
// 	circle1.animators.scale.target = new Point({x: 1, y: 1})
// }
// makeTargetLabel(target1, targetCircle1.position)

// var targetCircle2 = makeTargetCircle()
// targetCircle2.x = targetCard.x + targetCircle2.width / 2.0 + 25
// targetCircle2.touchBeganHandler = function() {
// 	circle2.animators.scale.target = new Point({x: 1.15, y: 1.15})
// }
// targetCircle2.touchEndedHandler = targetCircle1.touchCancelledHandler = function() {
// 	circle2.animators.scale.target = new Point({x: 1, y: 1})
// }
// makeTargetLabel(target2, targetCircle2.position)

function populateSide(frame, counterCount) {
	var counters = []
	for (var i = 0; i < counterCount; i++) {
		var counter = makeCounter()

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

function makeCurrentCountLabel() {
	var label = new TextLayer()
	label.fontName = "Futura"
	label.fontSize = 60
	label.textColor = Color.white
	label.text = "0"
	label.zPosition = 10000
	return label
}

function makeCounter() {
	var counter = new Layer()

	var randomHue = Math.random()
	counter.backgroundColor = new Color({hue: randomHue, saturation: 0.4, brightness: 1.0})
	counter.width = counter.height = counterDiameter
	counter.cornerRadius = counter.width / 2.0
	counter.animators.scale.springSpeed = 30

	counter.touchBeganHandler = function(touchSequence) {
		counter.animators.scale.target = new Point({x: 1.5, y: 1.5})
	}
	counter.touchMovedHandler = function(touchSequence) {
		var previousSide = sideForCounterPosition(touchSequence.previousSample.globalLocation)
		var currentSide = sideForCounterPosition(touchSequence.currentSample.globalLocation)

		var previousSide1Value = parseInt(label1.text)
		var previousSide2Value = parseInt(label2.text)
		if (previousSide === CounterSide.left && currentSide === CounterSide.right) {
			label1.text = (previousSide1Value - 1).toString()
			label2.text = (previousSide2Value + 1).toString()
		} else if (previousSide === CounterSide.right && currentSide === CounterSide.left) {
			label1.text = (previousSide1Value + 1).toString()
			label2.text = (previousSide2Value - 1).toString()
		}

		if (parseInt(label1.text) == target1 && parseInt(label2.text) == target2 && !hasWon) {
			hasWon = true
			Layer.root.userInteractionEnabled = false
			showYay()
		}

		counter.position = counter.position.add(touchSequence.currentSample.globalLocation.subtract(touchSequence.previousSample.globalLocation))
	}
	counter.touchEndedHandler = counter.touchCancelledHandler = function(touchSequence) {
		counter.animators.scale.target = new Point({x: 1.0, y: 1.0})
	}

	return counter
}

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
	yay.textColor = new Color({hue: 0.2, saturation: 0.2, brightness: 1.0})
	yay.text = "YAY"
	yay.scale = 0.01
	yay.position = Layer.root.position
	yay.animators.scale.target = new Point({x: 1, y: 1})
}
