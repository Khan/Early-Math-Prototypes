var cameraLayer = new CameraLayer()
cameraLayer.width = Layer.root.width
cameraLayer.height = Layer.root.height
cameraLayer.cameraPosition = CameraPosition.Back
cameraLayer.x = Layer.root.x
cameraLayer.y = Layer.root.y

// layer that shows how many things you've counted through the camera
var thingCount = new TextLayer()
thingCount.fontName = "Futura"
thingCount.fontSize = 30
thingCount.text = "Tap to count!"
thingCount.x = Layer.root.x
thingCount.y = 100
thingCount.animators.alpha.springBounciness = 0
thingCount.animators.alpha.springSpeed = 20

// array to keep the generated layers
var touchLayers = [];
var z = 0
var newCircleLayer = null

Layer.root.touchBeganHandler = function(touchSequence) {
	 newCircleLayer = makeCircleLayer(touchSequence.currentSample.globalLocation, z)
	z += 1
	return true

}
Layer.root.touchEndedHandler = function(touchSequence) {
	 
}  

function makeCircleLayer(position, zposition) {
	var touchCircleLayer = new Layer({name:(touchLayers.length.toString())})
	touchCircleLayer.position = position
	touchCircleLayer.width = touchCircleLayer.height = 150
	touchCircleLayer.cornerRadius = touchCircleLayer.width / 2.0
	//touchCircleLayer.border = 5
	var randomNum = Math.random()
	var randomIndex = Math.floor(map({value: randomNum, fromInterval: [0,1], toInterval: [0, kacolors.length - 1]}))
	touchCircleLayer.backgroundColor = kacolors[randomIndex]
	touchCircleLayer.alpha = 0.5
	touchCircleLayer.zPosition = zposition
	touchLayers.push(touchCircleLayer)
	updateCountLayer()
}

function updateCountLayer() {
	thingCount.text = (touchLayers.length != 1)? (touchLayers.length).toString() + " things!" : (touchLayers.length).toString() + " thing!"
	thingCount.x = Layer.root.x
}


// ka color set up
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


