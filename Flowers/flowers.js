

var numberOfPetals = 10
var stemSize = new Size({width: 30, height: 400})
var eyeRadius = 100
var petalRadius = 40


Layer.root.image = new Image({name: "flowers"})


var stem = new Layer()
stem.backgroundColor = new Color({hex: "53893e"})
stem.size = stemSize
stem.moveToBottomSideOfParentLayer()
stem.moveToHorizontalCenterOfParentLayer()

var eye = new ShapeLayer.Circle({center: new Point(), radius: eyeRadius})
eye.fillColor = new Color({hex: "efac5e"})
eye.strokeColor = undefined

eye.moveToHorizontalCenterOfParentLayer()
eye.moveAboveSiblingLayer({siblingLayer: stem})

function makePetal() {
	var petal = new ShapeLayer.Circle({center: new Point(), radius: petalRadius})
	petal.fillColor = Color.white
	petal.strokeColor = undefined
	
	return petal
}


var degreesPerPetal = 360 / numberOfPetals
var currentAngleInDegrees = 0

for (var counter = 0; counter < numberOfPetals; counter++) {
	var petal = makePetal()
	
	petal.x = eye.x + eyeRadius * Math.sin(degreesToRadians(currentAngleInDegrees))
	petal.y = eye.y + eyeRadius * Math.cos(degreesToRadians(currentAngleInDegrees))
	
	currentAngleInDegrees += degreesPerPetal
}


function degreesToRadians(degrees) {
	return degrees * Math.PI / 180
}