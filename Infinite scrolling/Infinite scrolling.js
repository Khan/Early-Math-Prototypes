/*

Infinite scrolling
	built on Prototope@532852a3

Explore really big numbers and exponential growth through a simple scrolling interaction.

Each order of magnitude or major figure could be illustrated by an example of
something a child might see of that size. For instance: 10 cookies on a plate;
100 legs on a centipede; 1000 bricks in a wall, etc. It may also be worth
providing abstract pictorial representations of these figures (e.g. 100 dots
arranged in a grid).

*/

if (Layer.root.width != 1024) {
	throw "This prototype wants to be run in landscape on an iPad"
}

//============================================================================================

var layerScaleFactor = 0.1

var root = addSet(1000, function(n) {
	var hundreds = n * 100
	return addSet(hundreds, function(n) {
		var tens = n * 10
		return addSet(tens, function(n) {
			var ones = n
			return makeNumberLayer(tens - 10 + n)
		})
	})	
})

root.parent = Layer.root
root.position = Layer.root.position
root.y -= 120 // nudge nudge

// We're going to put the anchor point at the center of "1", way in the lower left. That way, when we zoom up, we'll zoom up on that.
var oneLayer = root.descendentNamed("1")
var oldOrigin = root.origin // gotta save and reapply the root's origin before/after changing its anchor point to keep it in the same place
var oneLayerPositionInGlobalSpace = oneLayer.convertLocalPointToGlobalPoint(oneLayer.position)
var oneLayerPositionInRootLayerSpace = root.convertGlobalPointToLocalPoint(oneLayerPositionInGlobalSpace)
root.anchorPoint = new Point({x: oneLayerPositionInRootLayerSpace.x / root.width, y: oneLayerPositionInRootLayerSpace.y / root.height})
root.origin = oldOrigin

// Make a scrolling layer. We don't actually need to make the root layer a child of this: we'll just modify it according to 
var scroller = new ScrollLayer()
scroller.scrollableSize = new Size({width: Layer.root.width * 3.32, height: Layer.root.height})
scroller.frame = Layer.root.bounds
scroller.behaviors = [new ActionBehavior({handler: function() {
	// Start at scale = 200, scale down by layerScaleFactor every screen width...
	root.scale = 200 * Math.exp(Math.log(layerScaleFactor) / Layer.root.width * scroller.bounds.origin.x)
}})]

//============================================================================================

function makeNumberLayer(n) {
	var layer = new TextLayer({parent: undefined, name: n.toString()})
	layer.text = n.toString()
	layer.fontName = "Futura"
	layer.fontSize = 500
	return layer
}

function addSet(base, childGenerator) {
	var baseLayer = makeNumberLayer(base)
	for (var childIndex = 1; childIndex < 10; childIndex++) {
		var childLayer = childGenerator(childIndex)
		childLayer.parent = baseLayer
		childLayer.x = baseLayer.x + (childIndex - 5) * 110
		childLayer.scale = layerScaleFactor
		childLayer.originY = baseLayer.frameMaxY - 20
	}
	return baseLayer
}