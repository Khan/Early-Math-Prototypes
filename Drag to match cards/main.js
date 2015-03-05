/*

Drag to match cards
	built on Prototope @ 7093cfe206

Here we're building 1-to-1 relationships between the counters and the numerals, and reinforcing the idea of conservation: by moving a token from one circle to the other, we lower the number on the right side by 1 and increase the number on the left side by 1.

Key weaknesses here:
	the prompt isn't really inherently fun / creative / discovery-ish. 
	not sure the use of color on the tokens isn't more confusing than useful

*/

if (Layer.root.width !== 1024) {
	throw "This prototype wants to be run in landscape on an iPad!"
}

Layer.root.backgroundColor = new Color({hue: 0.7, saturation: 0.2, brightness: 1.0})

var circle1 = makeCircle()
var label1 = makeCircleLabel()
var circle2 = makeCircle()
var label2 = makeCircleLabel()

circle1.y = circle2.y = Layer.root.y * 0.7
circle1.originX = (Layer.root.x - 50) - circle1.width
circle2.originX = Layer.root.x + 50

label1.x = circle1.x
label2.x = circle2.x
label1.originY = label2.originY = circle1.originY - label1.height - 15

var target1 = 5
var target2 = 3
var hasWon = false

populateCircle(circle1, 2)
label1.text = "2"

populateCircle(circle2, 6)
label2.text = "6"

var targetCard = new Layer()
targetCard.backgroundColor = Color.white
targetCard.x = Layer.root.x
targetCard.y = Layer.root.frameMaxY - 100
targetCard.width = 700
targetCard.height = 350
targetCard.cornerRadius = 60

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
}

var targetCircle1 = makeTargetCircle()
targetCircle1.x = targetCard.x - targetCircle1.width / 2.0 - 25
makeTargetLabel(target1, targetCircle1.position)

var targetCircle2 = makeTargetCircle()
targetCircle2.x = targetCard.x + targetCircle2.width / 2.0 + 25
makeTargetLabel(target2, targetCircle2.position)

function populateCircle(circle, counterCount) {
	var counters = []
	for (var i = 0; i < counterCount; i++) {
		var counter = makeCounter()

		while (true) {
			counter.position = new Point({
				x: Math.floor(Math.random() * (circle.frameMaxX - circle.originX) + circle.originX),
				y: Math.floor(Math.random() * (circle.frameMaxY - circle.originY) + circle.originY)
			})

			if (!circleContainsPoint(circle.position, (circle.width - counter.width) / 2.0, counter.position)) {
				continue;
			}

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

function makeCircle() {
	var circle = new Layer()
	circle.border = new Border({color: Color.white, width: 4})
	circle.width = circle.height = 300
	circle.cornerRadius = circle.width / 2.0
	return circle
}

function makeCircleLabel() {
	var label = new TextLayer()
	label.fontName = "Futura"
	label.fontSize = 60
	label.textColor = Color.white
	label.text = "0"
	return label
}

function makeCounter() {
	var counter = new Layer()

	var randomHue = Math.random()
	counter.backgroundColor = new Color({hue: randomHue, saturation: 0.4, brightness: 1.0})
	counter.border = new Border({color: new Color({hue: randomHue, saturation: 0.4, brightness: 0.9}), width: 2})
	counter.width = counter.height = 44
	counter.cornerRadius = counter.width / 2.0
	counter.animators.scale.springSpeed = 30

	counter.touchBeganHandler = function(touchSequence) {
		counter.animators.scale.target = new Point({x: 1.5, y: 1.5})
	}
	counter.touchMovedHandler = function(touchSequence) {
		var bounceVelocity = -800
		if (circleLayerContainsPoint(circle1, touchSequence.previousSample.globalLocation) &&
			!circleLayerContainsPoint(circle1, touchSequence.currentSample.globalLocation)) {
			var oldCircle1Value = parseInt(label1.text)
			targetCircle1.animators.y.target = targetCircle1.y
			targetCircle1.animators.x.target = targetCircle1.x
			if (oldCircle1Value > target1) {
				targetCircle1.animators.y.velocity = bounceVelocity
				targetCircle1.animators.x.velocity = 0
			} else {
				targetCircle1.animators.x.velocity = bounceVelocity
				targetCircle1.animators.y.velocity = 0
			}
			label1.text = (oldCircle1Value - 1).toString()
		} else if (!circleLayerContainsPoint(circle1, touchSequence.previousSample.globalLocation) &&
			circleLayerContainsPoint(circle1, touchSequence.currentSample.globalLocation)) {
			var oldCircle1Value = parseInt(label1.text)
			targetCircle1.animators.y.target = targetCircle1.y
			targetCircle1.animators.x.target = targetCircle1.x
			if (oldCircle1Value < target1) {
				targetCircle1.animators.y.velocity = bounceVelocity
				targetCircle1.animators.x.velocity = 0
			} else {
				targetCircle1.animators.x.velocity = bounceVelocity
				targetCircle1.animators.y.velocity = 0
			}
			label1.text = (oldCircle1Value + 1).toString()
		}

		// lol copy pasta too tired to think about abstraction
		if (circleLayerContainsPoint(circle2, touchSequence.previousSample.globalLocation) &&
			!circleLayerContainsPoint(circle2, touchSequence.currentSample.globalLocation)) {
			var oldCircle2Value = parseInt(label2.text)
			targetCircle2.animators.y.target = targetCircle2.y
			targetCircle2.animators.x.target = targetCircle2.x
			if (oldCircle2Value > target2) {
				targetCircle2.animators.y.velocity = bounceVelocity
				targetCircle2.animators.x.velocity = 0
			} else {
				targetCircle2.animators.x.velocity = bounceVelocity
				targetCircle2.animators.y.velocity = 0
			}
			label2.text = (oldCircle2Value - 1).toString()
		} else if (!circleLayerContainsPoint(circle2, touchSequence.previousSample.globalLocation) &&
			circleLayerContainsPoint(circle2, touchSequence.currentSample.globalLocation)) {
			var oldCircle2Value = parseInt(label2.text)
			targetCircle2.animators.y.target = targetCircle2.y
			targetCircle2.animators.x.target = targetCircle2.x
			if (oldCircle2Value < target2) {
				targetCircle2.animators.y.velocity = bounceVelocity
				targetCircle2.animators.x.velocity = 0
			} else {
				targetCircle2.animators.x.velocity = bounceVelocity
				targetCircle2.animators.y.velocity = 0
			}
			label2.text = (oldCircle2Value + 1).toString()
		}

		if (parseInt(label1.text) == target1 && parseInt(label2.text) == target2 && !hasWon) {
			hasWon = true

			Layer.root.userInteractionEnabled = false
			var yay = new TextLayer()
			yay.fontName = "Futura"
			yay.fontSize = 500
			yay.textColor = new Color({hue: 0.2, saturation: 0.2, brightness: 1.0})
			yay.text = "YAY"
			yay.scale = 0.01
			yay.position = Layer.root.position
			yay.animators.scale.target = new Point({x: 1, y: 1})
		}

		counter.position = counter.position.add(touchSequence.currentSample.globalLocation.subtract(touchSequence.previousSample.globalLocation))
	}
	counter.touchEndedHandler = counter.touchCancelledHandler = function(touchSequence) {
		counter.animators.scale.target = new Point({x: 1.0, y: 1.0})
	}

	return counter
}

function circleLayerContainsPoint(circle, point) {
	return point.distanceToPoint(circle.position) < (circle.width / 2.0)
}

function circleContainsPoint(position, radius, point) {
	return point.distanceToPoint(position) < radius
}
