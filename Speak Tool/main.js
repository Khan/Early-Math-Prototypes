/* 

Speak tool
	

Drag the speaker icon over something to hear about it.

*/

Layer.root.backgroundColor = new Color({hue: (44.0/360.0), saturation: 0.1, brightness: 1.0})

// TODO: you currently can't attach touch handlers to the root layer. oops.
var touchLayer = new Layer()
touchLayer.frame = Layer.root.bounds

var speakerLayer = new Layer({imageName: "speaker"})
speakerLayer.zPosition = 999


speakerLayer.touchMovedHandler = function(touchSequence) {
	speakerLayer.position = touchSequence.currentSample.globalLocation
}


var zeroLayer = new Layer({imageName: "0"})
zeroLayer.position = new Point({x: 300, y: 300})
// zeroLayer.name = "zero"

var oneLayer = new Layer({imageName: "1"})
oneLayer.position = new Point({x: 450, y: 300})
// oneLayer.name = "one"


var speakableLayers = [zeroLayer, oneLayer]
var behaviors = []

for (var index = 0; index < speakableLayers.length; index++) {
	var speakableLayer = speakableLayers[index]
	
	var collision = makeCollision(speakableLayer)
	behaviors.push(collision)
}


function makeCollision(layer) {
	return new CollisionBehavior({with: layer, handler: function(kind) {
		if (kind === CollisionBehaviorKind["Entering"]) {
			Speech.say({text: layer.name});
		}
	}})
}

speakerLayer.behaviors = behaviors
