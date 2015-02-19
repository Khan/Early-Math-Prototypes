

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

var zoomLayer = new Layer()
zoomLayer.backgroundColor = bgColor
zoomLayer.size = new Size({width: 100, height: 75})
zoomLayer.cornerRadius = 35
zoomLayer.x = 200
zoomLayer.y = 200

zoomLayer.gestures = [
	new TapGesture({
		handler: function() {
			
			// Corner radius
			zoomLayer.animators.cornerRadius.target = 0
			var cornerVelocity = 1
			zoomLayer.animators.cornerRadius.velocity = cornerVelocity//new Point({x: cornerVelocity, y: cornerVelocity})
			zoomLayer.animators.cornerRadius.springBounciness = 0
			zoomLayer.animators.cornerRadius.springSpeed = 0
			
			// Scale
			var xScale = touchLayer.width / zoomLayer.width
			var yScale = touchLayer.height / zoomLayer.height
			
			zoomLayer.animators.scale.target = new Point({x: xScale, y: yScale})
			var velocity = tunable({default: 121.71, name: "Velocity", min: 0, max: 500})
			zoomLayer.animators.scale.velocity = new Point({x: velocity, y: velocity})
			zoomLayer.animators.scale.springSpeed = tunable({default: 2.42, name: "Speed", min: 0, max: 30})
			zoomLayer.animators.scale.springBounciness = tunable({default: 10.16, name: "Bounciness", min: 0, max: 30})
			
			
			// Position
			zoomLayer.animators.position.target = touchLayer.position
			
			
			zoomLayer.animators.scale.completionHandler = function() {
				zoomLayer.scale = 1.0
				zoomLayer.bounds = touchLayer.bounds
			}
		}
	})
]


