var mixer = new Layer()

var color = {
	red: 0.2,
	green: 0.2,
	blue: 0.2
}


mixer.updateBackgroundColor = function() {
	log(color)
	mixer.backgroundColor = new Color({red: color.red, green: color.green, blue: color.blue})
}

log(color["red"])
function makeSquare(bgColor, colorName) {
	var layer = new Layer()
	
	var size = 150
	layer.size = new Size({width: size, height: size})
	layer.backgroundColor = bgColor
	layer.cornerRadius = 8
	
	layer.gestures = [new TapGesture({handler: function() {
		color[colorName] += 0.1
		mixer.updateBackgroundColor()
	}})]
	
	return layer
}

// Using RGB for now because modelling RYB on a computer seemed like a rabit hole not worth going down quite yet...
var red = makeSquare(Color.red, "red")
var blue = makeSquare(Color.blue, "blue")
var green = makeSquare(Color.green, "green")

green.moveToHorizontalCenterOfParentLayer()
red.moveToLeftOfSiblingLayer({siblingLayer: green, margin: 100})
blue.moveToRightOfSiblingLayer({siblingLayer: green, margin: 100})

green.y = red.y = blue.y = 200



mixer.width = blue.frameMaxX - red.originX
mixer.height = 150
mixer.cornerRadius = 8
mixer.moveToCenterOfParentLayer()
mixer.updateBackgroundColor()


function log(obj) {
	console.log(JSON.stringify(obj, null, 4))
	
}