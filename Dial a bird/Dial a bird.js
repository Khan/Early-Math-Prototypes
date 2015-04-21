
Layer.root.backgroundColor = new Color({hex: "9cdceb"})
Layer.root.image = new Image({name: "bg"})

//-------------------------
// Initial objects
//-------------------------

var scrollerHeight = 165
var tens = makeDialsForUnits(10)
var ones = makeDialsForUnits(1)

ones.container.moveToCenterOfParentLayer()
tens.container.moveToCenterOfParentLayer()
tens.container.moveToLeftOfSiblingLayer({siblingLayer: ones.container})


function makeDialsForUnits(unit /* 1, 10, 100, etc. */) {
	
	var container = new Layer()
	var grippyLayer = new Layer({imageName: "grippy", parent: container})
	
	var scrollerWidth = 130
	var numberOfScrollers = lengthOfUnit(unit)
	container.width = scrollerWidth * numberOfScrollers
	container.height = scrollerHeight + grippyLayer.height
	
	grippyLayer.origin = Point.zero
	grippyLayer.moveToHorizontalCenterOfParentLayer()
	grippyLayer.position = new Point({x: scrollerWidth / 2.0, y: grippyLayer.position.y})
	
	var scrollLayers = []
	
	for (var counter = 0; counter < numberOfScrollers; counter++) {
		var scrollLayer = new ScrollLayer({parent: container})
		scrollLayer.backgroundColor = new Color({hex: "F7F7F7"})
		scrollLayer.frame = new Rect({x: scrollerWidth * counter, y: 0, width: 130, height: scrollerHeight})
		scrollLayer.showsVerticalScrollIndicator = false
		scrollLayer.moveBelowSiblingLayer({siblingLayer: grippyLayer, margin: -8})
		scrollLayer.cornerRadius = 8
		
		makeScrollNumbersForScrollLayer(scrollLayer, unit)
		scrollLayer.updateScrollableSizeToFitSublayers()
		makeScrollLayerLandEvenly(scrollLayer)
		
		scrollLayers.push(scrollLayer)
		
	}
	
	
	makeScrollLayerDraggable(container, grippyLayer)
	
	return {
		container: container,
		scrollLayers: scrollLayers
	}
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

var oneScroller = ones.scrollLayers[0]
oneScroller.behaviors = [new ActionBehavior({handler: function() {
	var currentDigit = Math.round(oneScroller.bounds.origin.y / oneScroller.height)
	var clippedDigit = clip({value: currentDigit, min: 0, max: 9})
	
	if (birds.length < clippedDigit) {
		addBird()
	} else if (birds.length > clippedDigit) {
		killBird()
	}

	
	label.text = currentDigit.toString()
}})]

function makeScrollLayerDraggable(container, dragger) {
	
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


function makeScrollNumbersForScrollLayer(layer, base) {
	var y = 0
	for (var counter = 0; counter < 10; counter++) {
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

function lengthOfUnit(unit) {
	return unit.toString().length
}
