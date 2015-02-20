

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

var zoomLayer = new Layer()
zoomLayer.backgroundColor = bgColor
zoomLayer.size = originalZoomedSize
zoomLayer.cornerRadius = 5
zoomLayer.position = touchLayer.position

// The zoom layer has the same asepct ratio as the display, so we get the scale
var scale = touchLayer.width / zoomLayer.width


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
	}
	
	zoomLayerIsOpen = false

}


