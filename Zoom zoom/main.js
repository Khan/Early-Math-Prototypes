

/* 

Zoom zoom
	built on Prototope @cf00c1f

Playing with zooming layers.

*/

Layer.root.backgroundColor = new Color({hue: (44.0/360.0), saturation: 0.1, brightness: 1.0})

// TODO: you currently can't attach touch handlers to the root layer. oops.
var touchLayer = new Layer()
touchLayer.frame = Layer.root.bounds

// Global thangs
var bgColor = new Color({hex: "CCE9FF"})
var originalZoomedSize = new Size({width: 100, height: 75})

var zoomLayerIsOpen = false


var zoomedImageLayer = new Layer({imageName: "zoomed"})

var zoomLayer = new Layer()
zoomLayer.backgroundColor = bgColor
zoomLayer.size = originalZoomedSize
zoomLayer.cornerRadius = 5
zoomLayer.position = touchLayer.position

// The zoom layer has the same asepct ratio as the display, so we get the scale
var scale = touchLayer.width / zoomLayer.width

// scale down the image layer
// zoomedImageLayer.scale = 1.0/scale
zoomedImageLayer.parent = zoomLayer
zoomedImageLayer.size = originalZoomedSize
zoomedImageLayer.moveToCenterOfParentLayer()


zoomLayer.gestures = [
	new TapGesture({
		handler: function() {
			if (zoomLayerIsOpen) {
				closeZoomView(undefined)
			} else {
				openZoomView(undefined)
			}
			
		}
	}),
	
	new PinchGesture({
		handler: function(phase, sequence) {
			var pinchScale = sequence.currentSample.scale
			zoomLayer.scale = pinchScale

			if (phase === ContinuousGesturePhase["Ended"]) {
				// Not really sure about this logic...prototype!
				if (zoomLayerIsOpen && pinchScale < 0.5) {
					closeZoomView(sequence.currentSample.velocity)
				} else {
					openZoomView(sequence.currentSample.velocity)
				}
			}
		}
	})
]

function openZoomView(pinchVelocity) {
	// Corner radius
	zoomLayer.animators.cornerRadius.target = 0
	var cornerVelocity = 1
	zoomLayer.animators.cornerRadius.velocity = cornerVelocity
	zoomLayer.animators.cornerRadius.springBounciness = 0
	zoomLayer.animators.cornerRadius.springSpeed = 0
	
	// Scale
	zoomLayer.animators.scale.target = new Point({x: scale, y: scale})
	
	
	var velocity = tunable({default: 8.22, name: "Velocity", min: 0, max: 500})
	if (pinchVelocity !== undefined) {
		velocity = pinchVelocity
	}
	zoomLayer.animators.scale.velocity = new Point({x: velocity, y: velocity})
	zoomLayer.animators.scale.springSpeed = tunable({default: 2.42, name: "Speed", min: 0, max: 30})
	zoomLayer.animators.scale.springBounciness = tunable({default: 10.16, name: "Bounciness", min: 0, max: 30})
	
	
	// Position
	zoomLayer.animators.position.target = touchLayer.position
	
	
	zoomLayer.animators.scale.completionHandler = function() {
		zoomLayer.scale = 1.0
		zoomLayer.bounds = touchLayer.bounds
		showTappyLayer()
	}
	
	zoomLayerIsOpen = true
}


function closeZoomView(pinchVelocity) {
	
	// Corner radius
	zoomLayer.cornerRadius = 5

	
	
	// Scale the layer down
	var inverseScale = 1.0 / scale
	zoomLayer.animators.scale.target = new Point({x: inverseScale, y: inverseScale})
	
	
	var velocity = tunable({default: 8.22, name: "Velocity", min: 0, max: 500})
	if (pinchVelocity !== undefined) {
		velocity = pinchVelocity
	}
	zoomLayer.animators.scale.velocity = new Point({x: velocity, y: velocity})
	zoomLayer.animators.scale.springSpeed = tunable({default: 4.64, name: "Speed-down", min: 0, max: 30})
	zoomLayer.animators.scale.springBounciness = tunable({default: 2.71, name: "Bounciness-down", min: 0, max: 30})
	
	
	// Position
	zoomLayer.animators.position.target = touchLayer.position
	
	
	zoomLayer.animators.scale.completionHandler = function() {
		zoomLayer.size = originalZoomedSize
		zoomLayer.scale = 1.0
		hideTappyLayer()
	}
	
	zoomLayerIsOpen = false

}


function showTappyLayer() {
	tappyLayer.parent = zoomLayer
	tappyLayer.moveToCenterOfParentLayer()
	
	zoomedImageLayer.parent = undefined
}


function hideTappyLayer() {
	zoomedImageLayer.parent = zoomLayer
	zoomedImageLayer.frame = zoomLayer.bounds
	zoomedImageLayer.moveToCenterOfParentLayer()
	tappyLayer.parent = undefined
}


function setupTappyLayer() {
	var layer = new Layer()
	layer.backgroundColor = bgColor
	layer.frame = touchLayer.bounds
	
	// 7 col, 5 row
	for (var row = 0; row < 5; row++) {
		for (var col = 0; col < 7; col++) {
			var square = gimmeSquare()
			var tapMe = gimmeTapMe()
			
			square.parent = layer
			tapMe.parent = layer
			
			var xFirstOffset = 42
			var xInterCellMargin = 40
			
			var yFirstOffset = 40
			var yInterCellMargin = 40
			var rowHeight = 105
			
			square.frameMinX = xFirstOffset + (col * square.width) + ((col) * xInterCellMargin)
			square.frameMinY = yFirstOffset + (row * rowHeight) + ((row) * yInterCellMargin)
			
			tapMe.x = square.x
			tapMe.moveBelowSiblingLayer({siblingLayer: square, margin: 0})
		}
	}
	return layer
}


function gimmeSquare() {
	var square = new Layer()
	var blue = new Color({hex: "4A90E2"})
	square.backgroundColor = blue
	square.cornerRadius = 5
	square.size = originalZoomedSize
	
	// tap handler...
	square.gestures = [
		new TapGesture({handler: function() {
			square.animators.backgroundColor.target = new Color({hex: "D0021B"})
			square.animators.backgroundColor.springBounciness = 0
			
			afterDuration(2, function() {
				square.animators.backgroundColor.target = blue
			})
		}})
	]
	
	return square
}


function gimmeTapMe() {
	var text = new TextLayer()
	text.text = "tap me"
	text.fontName = "Avenir"
	text.fontSize = 25
	text.textColor = new Color({hex: "4A4A4A"})
	
	return text
}

var tappyLayer = setupTappyLayer()
hideTappyLayer()
