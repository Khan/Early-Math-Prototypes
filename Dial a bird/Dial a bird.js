
Layer.root.backgroundColor = new Color({hex: "9cdceb"})
Layer.root.image = new Image({name: "bg"})

//-------------------------
// Initial objects
//-------------------------

var scrollerHeight = 165
var onesScrollLayer = makeGrippyScrollLayer(1)

onesScrollLayer.moveToCenterOfParentLayer()



function makeGrippyScrollLayer(unit /* ones, tens, hundreds, etc. */) {
	
	var container = new Layer()
	var grippyLayer = new Layer({imageName: "grippy", parent: container})
	var scrollLayer = new ScrollLayer({parent: container})
	
	scrollLayer.backgroundColor = new Color({hex: "F7F7F7"})
	
	scrollLayer.frame = new Rect({x: 0, y: 0, width: 130, height: scrollerHeight})
	
	container.width = 130
	container.height = scrollLayer.height + grippyLayer.height
	
	grippyLayer.origin = Point.zero
	grippyLayer.moveToHorizontalCenterOfParentLayer()
	
	scrollLayer.showsVerticalScrollIndicator = false
	scrollLayer.moveBelowSiblingLayer({siblingLayer: grippyLayer, margin: -8})
	scrollLayer.cornerRadius = 8
	
	makeScrollNumbersForScrollLayer(scrollLayer)
	scrollLayer.updateScrollableSizeToFitSublayers()
	makeScrollLayerLandEvenly(scrollLayer)
	makeScrollLayerDraggable(container, grippyLayer)
	
	return container
}

var label = new TextLayer()
label.fontName = "Futura"
label.fontSize = 40
label.position = Layer.root.position

var birds = []

function makeBird() {
	var bird = new Layer({imageName: "bird"})
	bird.animators.scale.target = new Point({x: 1, y: 1})
	bird.animators.scale.velocity = new Point({x: 20, y: 20})
	bird.animators.scale.springBounciness = 1
	bird.animators.scale.springVelocity = 20
	
	return bird
}

function killBird() {
	var bird = birds.pop()
	bird.animators.scale.target = new Point({x: 0.01, y: 0.01})
	bird.animators.scale.velocity = new Point({x: 20, y: 20})
	bird.animators.scale.springBounciness = 1
	bird.animators.scale.springVelocity = 20

}

function addBird() {
	var newBird = makeBird()
	birds.push(newBird)
	newBird.origin = new Point({x: birds.length * newBird.width + 300, y: 275})
}


onesScrollLayer.behaviors = [new ActionBehavior({handler: function() {
	var currentDigit = Math.round(onesScrollLayer.bounds.origin.y / onesScrollLayer.height) + 1
	var clippedDigit = clip({value: currentDigit, min: 1, max: 9})
	
	if (birds.length < clippedDigit) {
		addBird()
	} else if (birds.length > clippedDigit) {
		killBird()
	}

	
	label.text = currentDigit.toString()
}})]

function makeScrollLayerDraggable(container, dragger) {
	
	// dragger.gestures = [
	// 	new PanGesture({handler: function(phase, sequence) {
	// 		container.position = sequence.currentSample.globalLocation
	// 	}})
	// ]
	var initialPositionInContainer = new Point()
	dragger.touchBeganHandler = function(touchSequence) {
		initialPositionInContainer = touchSequence.currentSample.locationInLayer(container)
	}
	
	dragger.touchMovedHandler = function(touchSequence) {
		var position = touchSequence.currentSample.globalLocation
		container.origin = position.subtract(initialPositionInContainer)
	}
}

// Make the scroll layer always land evenly on a number. Maybe this common-case implementation should become API at some point.
function makeScrollLayerLandEvenly(scrollLayer) {
	scrollLayer.decelerationRetargetingHandler = function(velocity, target) {
		var roundingFunction = velocity.y == 0 ? Math.round : (velocity.y > 0 ? Math.ceil : Math.floor)
		var roundedTargetY = roundingFunction(target.y / scrollerHeight) * scrollerHeight
		var clippedTargetY = clip({value: roundedTargetY, min: 0, max: scrollLayer.scrollableSize.height})
		
		return new Point({x: target.x, y: clippedTargetY})
	}
}


function makeScrollNumbersForScrollLayer(layer) {
	var y = 0
	for (var counter = 1; counter < 10; counter++) {
		var textLabel = new TextLayer({parent: layer})
		
		textLabel.text = counter.toString()
		textLabel.textAlignment = TextAlignment.Center
		textLabel.fontName = "Futura"
		textLabel.fontSize = 190
		textLabel.height = layer.height
		textLabel.moveToHorizontalCenterOfParentLayer()
		textLabel.originY = y
		y = textLabel.originY + textLabel.height
	}
}