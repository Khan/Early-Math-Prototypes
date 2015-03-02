/* 

Balloons floatin, as they do.



Most of this is learning from Nefaur's excellent ForcePull demo...physics feels like magic to me.
*/

Layer.root.backgroundColor = new Color({hue: (44.0/360.0), saturation: 0.1, brightness: 1.0})

// TODO: you currently can't attach touch handlers to the root layer. oops.
var touchLayer = new Layer()
touchLayer.frame = Layer.root.bounds


var balloonLayer = new Layer({imageName: "balloon"})
balloonLayer.position = new Point({x: 300, y: 300})


function Force(name, updateFunction) {
	
	var name = name
	this.enabled = true
	
	// Eventually this should have its own heartbeat
	this.update = function(dt) {
		forceVector = updateFunction(dt)
	}
	
	
	// The vector of this force..ignore if not enabled
	var forceVector = new Point()
	this.getForceVector = function() {
		return forceVector
	}
	
}

function PhysicalNode() {
	this.layer = balloonLayer;
	var forces = [];
	
	this.getForces = function() {
		return forces
	}
	
	// The mass of the layer
	var mass = 100
	
	var velocity = new Point()
	this.getVelocity = function() {
		return velocity
	}
	var impulse = new Point()
	
	this.applyImpulse = function(newImpulse) {
		impulse = new Point({x: impulse.x + newImpulse.x, y: impulse.y + newImpulse.y})
		// console.log("impulse! y=" + impulse.y)
	}
	
	// Timekeeping
	var lastTimestamp = Timestamp.currentTimestamp()
	
	var netForceF = function() {
		var netForce = new Point()
		for (var i = 0; i < forces.length; i++) {
			var currentForce = forces[i].getForceVector()
			netForce = new Point({x: netForce.x + currentForce.x, y: netForce.y + currentForce.y})
		}
		
		return netForce
	}
	
	
	function updateForcesWithDT(dt) {
		for (var i = 0; i < forces.length; i++) {
			forces[i].update(dt)
		}
	}
	
	// TODO(jb): probably want to replace this with an actual Heartbeat object...
	this.renderer = new ActionBehavior({handler: function(layer) {
		var now = Timestamp.currentTimestamp()
		var dt = now - lastTimestamp
		lastTimestamp = now
		
		updateForcesWithDT(dt)
		
		
		var netForce = netForceF()
		netForce = new Point({x: netForce.x + impulse.x, y: netForce.y + impulse.y})
		
		var acceleration = new Point({x: netForce.x / mass, y: netForce.y / mass})
		velocity = velocity.add(new Point({x: acceleration.x * dt, y: acceleration.y * dt}))
		
		var newVelocity = new Point({x: velocity.x * dt, y: velocity.y})
		layer.position = layer.position.add(newVelocity)
		// console.log("velocity: " + velocity.y)
		
		if (layer.position.y < -200 || layer.position.y > 1000) {
			// Just keeps speeding up :)
			layer.position = new Point({x: layer.position.x, y: 300})
		}
		
		impulse = new Point()
	}})
	
	this.layer.behaviors = [this.renderer]
	

}

var node = new PhysicalNode()

var gravity = new Force("Gravity", function(dt) {
	return new Point({x: 0, y: 500})
})

var floorLayer = new Layer()
floorLayer.backgroundColor = Color.purple
floorLayer.size = new Size({width: 1020, height: 20})
floorLayer.position = new Point({x: 1024/2, y: 768})

var floor = new Force("Floor", function(dt) {
	var y = 0
	if (balloonLayer.y >= 500) {
		// y = -1800
		node.applyImpulse(new Point({x: 0, y: -node.getVelocity().y * 11500}))
	}
	return new Point({x: 0, y: 0})
})

// var floorCollision = new CollisionBehavior({with: floorLayer, handler: function(kind) {
// 
//     if (kind === CollisionBehaviorKind["Entering"]) {
//         node.applyImpulse(new Point({x: 0, y: -3000}))
//     }
// }})

// balloonLayer.behaviors = balloonLayer.behaviors.concat([floorCollision])

node.getForces().push(gravity)
node.getForces().push(floor)
