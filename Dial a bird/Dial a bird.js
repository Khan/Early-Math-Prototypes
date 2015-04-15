
Layer.root.backgroundColor = new Color({hex: "9cdceb"})
Layer.root.image = new Image({name: "bg"})

//-------------------------
// Initial objects
//-------------------------


var scrollLayer = new ScrollLayer()
scrollLayer.backgroundColor = new Color({hex: "F7F7F7"})
scrollLayer.frame = new Rect({x: 0, y: 0, width: 130, height: 165})
scrollLayer.showsVerticalScrollIndicator = false

var numberStrip = new Layer({imageName: 'number-strip', parent: scrollLayer})
numberStrip.origin = Point.zero

var heightPerNumberCell = numberStrip.height / 9

// easter egg here would lead to the scrollable size including the easter egg
scrollLayer.updateScrollableSizeToFitSublayers()
// NOW add easter egg
// or don't call updateScrollableSizeToFitSublayers and instead manually set the scrollableSize to be what you want

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


scrollLayer.behaviors = [new ActionBehavior({handler: function() {
	var currentDigit = Math.round(scrollLayer.bounds.origin.y / heightPerNumberCell) + 1
	var clippedDigit = clip({value: currentDigit, min: 1, max: 9})
	
	if (birds.length < clippedDigit) {
		addBird()
	} else if (birds.length > clippedDigit) {
		killBird()
	}

	
	label.text = currentDigit.toString()
}})]

// Make the scroll layer always land evenly on a number. Maybe this common-case implementation should become API at some point.
scrollLayer.decelerationRetargetingHandler = function(velocity, target) {
	var roundingFunction = velocity.y == 0 ? Math.round : (velocity.y > 0 ? Math.ceil : Math.floor)
	var roundedTargetY = roundingFunction(target.y / heightPerNumberCell) * heightPerNumberCell
	var clippedTargetY = clip({value: roundedTargetY, min: 0, max: scrollLayer.scrollableSize.height})
	return new Point({x: target.x, y: clippedTargetY})
}