//"use strict";

/* 
TBD
	built on Prototope @4e590b754f27dd79da75cbbd53a315226ffad485

*/

Layer.root.backgroundColor = new Color({hue: 0.7, saturation: 0.8, brightness: 0.15})

var rootSize = Layer.root.size

var exampleLayer = new Layer()
exampleLayer.size = new Size({width: rootSize.width*0.5, height: 400})
exampleLayer.backgroundColor = Color.red
exampleLayer.originX = 0
exampleLayer.originY = 0

var targetLayer = new Layer()
targetLayer.size = exampleLayer.size
targetLayer.backgroundColor = Color.yellow
targetLayer.originX = exampleLayer.originX + exampleLayer.width
targetLayer.originY = exampleLayer.originX

var exampleTokens = new Array()

createExampleTokens()

function popExampleTokens() {
	for (var i=0; i<exampleTokens.length; i++) {
		var token = exampleTokens[i]

		afterDuration(0.3*i, function (t) {
			return function() {
				t.animators.scale.target = new Point({x: 1, y: 1})
				t.animators.scale.velocity = new Point({x: 20, y: 20})
			}
		}(token))
		
		token = undefined
	}
	
	afterDuration(7, function() { popExampleTokens() })
}

afterDuration(1, function() {
	popExampleTokens()
})

createTargetTokens()

///////////////////////////////////////

function tokenTouchesBegan(t) {
	return function(touchSequences) {
		t.animators.scale.target = new Point({x:0.75, y:0.75})
		t.animators.scale.springSpeed = 20
		t.animators.scale.velocity = new Point({x:-10, y:-10})
		return true
	}
}

function tokenTouchesEnded(t) {
	return function(touchSequences) {
		t.animators.scale.target = new Point({x:1, y:1})
		t.animators.scale.velocity = new Point({x:10, y:10})
		return true
	}
}

function createExampleTokens() {

	function exampleTokenHandler(t) {
		return function(phase, centroidSequence) {
			if (phase == ContinuousGesturePhase.Began) {
				t.animators.position.target = undefined
			} else if (phase == ContinuousGesturePhase.Changed) {
				var finger = centroidSequence.currentSample.globalLocation
				t.position = finger
				t.zPosition = 10
			} else if (phase == ContinuousGesturePhase.Ended) {
				var velocity = centroidSequence.currentGlobalVelocity()
				t.animators.position.velocity = velocity
				t.animators.position.target = t["originalPosition"]
				t.animators.position.springSpeed = 10
			}
		}
	}	
	
	var numberOfTokens = 7
	
	for (var i = 0; i < numberOfTokens; i++) {
		var token = createToken()
		exampleTokens.push(token)
		
		token.backgroundColor = Color.green

		token.originX = 8 + i*(token.width+8)
		while (token.originX + token.width > exampleLayer.width) {
			token.originY += 8 + token.height
			token.originX -= 8 + exampleLayer.width-token.width
		}
		
		token["originalPosition"] = token.position

		var gesture = new PanGesture({handler: exampleTokenHandler(token), cancelsTouchesInLayer: false })
		token.gestures = [gesture]
		
		token.touchesBeganHandler = tokenTouchesBegan(token)
		token.touchesEndedHandler = tokenTouchesEnded(token)
		
		token = undefined
	}
}

function createTargetTokens() {
	function targetTokenHandler(t) {
		return function(phase, centroidSequence) {
			if (phase == ContinuousGesturePhase.Began) {
				t.animators.position.target = undefined
			} else if (phase == ContinuousGesturePhase.Changed) {
				var finger = centroidSequence.currentSample.globalLocation
				t.position = finger
				t.zPosition = 10
			} else if (phase == ContinuousGesturePhase.Ended) {
				var velocity = centroidSequence.currentGlobalVelocity()
				t.animators.position.velocity = velocity
				t.animators.position.target = t["targetPosition"]
				t.animators.position.springSpeed = 10
			}
		}
	}	
	
	var numberOfTokens = 7
	
	for (var i = 0; i < numberOfTokens; i++) {
		var token = createToken()
		token.backgroundColor = Color.blue

		//calculate the target position
		token.originX = targetLayer.frame.minX + 8 + i*(token.width+8)
		while (token.originX + token.width > targetLayer.frame.maxX) {
			token.originY += 8 + token.height
			token.originX -= 8 + exampleLayer.width-token.width
		}
		
		token["targetPosition"] = token.position
		
		//actually, scatter the tokens
		token.x = Math.random() * Layer.root.width
		token.y = targetLayer.height + token.height + Math.random() * (Layer.root.height - targetLayer.height - 2*token.height)
		

		var gesture = new PanGesture({handler: targetTokenHandler(token), cancelsTouchesInLayer: false })
		token.gestures = [gesture]

		token.touchesBeganHandler = tokenTouchesBegan(token)
		token.touchesEndedHandler = tokenTouchesEnded(token)
		
		token = undefined
	}
}


function createToken() {
	var tokenSize = tunable({default: 80, name: "Token Size", min: 44, max: 120})
	
	var tokenLayer = new Layer()
	tokenLayer.border = new Border({color: Color.black, width: 2})
	tokenLayer.size = new Size({width: tokenSize, height: tokenSize})
	tokenLayer.cornerRadius = tokenLayer.size.width*0.5
	return tokenLayer
}