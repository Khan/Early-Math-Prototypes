const shapeSize = 300

let polygon = new ShapeLayer()
polygon.width = shapeSize // I shouldn't have to do this!
polygon.height = shapeSize
polygon.position = Layer.root.position
polygon.strokeWidth = 6
polygon.lineCapStyle = LineCapStyle.Round
polygon.lineJoinStyle = LineJoinStyle.Round
polygon.strokeColor = Color.orange
polygon.fillColor = new Color({red: 1, green: 0.5, blue: 0, alpha: 0.2})
polygon.segments = polygonTargetSegments(false)

// We make two handles (the "dots" that appear when you drag the line near it)
// for the polygon. 0 and 3 here refer to the two segment indices which
// overlap when the polygon's a triangle (see polygonTargetSegments())
polygon.leftHandle = makeHandle(polygon)
polygon.leftHandle.position = polygon.segments[0].point
polygon.rightHandle = makeHandle(polygon)
polygon.rightHandle.position = polygon.segments[3].point

// The polygon's continuously animating its handles and segments to some target.
polygon.behaviors = [
	new ActionBehavior({handler: () => {
		if (polygon.targetSegments !== undefined) {
			let segments = new Array(4)
			for (let segmentIndex = 0; segmentIndex < 4; segmentIndex++) {
				// Exponential decay:
				const delta = polygon.targetSegments[segmentIndex].point.subtract(polygon.segments[segmentIndex].point)
				segments[segmentIndex] = new Segment(polygon.segments[segmentIndex].point.add(delta.multiply(0.2)))
			}
			// Copy pasta on the exponential decay here; being lazy:
			polygon.leftHandle.position = polygon.leftHandle.position.add(polygon.targetSegments[0].point.subtract(polygon.segments[0].point).multiply(0.2))
			polygon.rightHandle.position = polygon.rightHandle.position.add(polygon.targetSegments[3].point.subtract(polygon.segments[3].point).multiply(0.2))
			polygon.segments = segments
		}
	}})
]

// This is the extra edge you can drag onto the polygon:
let edge = new ShapeLayer()
edge.segments = [
	new Segment(new Point({x: 0, y: shapeSize / 2.0})),
	new Segment(new Point({x: shapeSize, y: shapeSize / 2.0}))
]
edge.width = shapeSize
edge.height = shapeSize
edge.strokeColor = polygon.strokeColor
edge.strokeWidth = polygon.strokeWidth
edge.lineCapStyle = LineCapStyle.Round
edge.fillColor = undefined

edge.leftHandle = makeHandle(edge)
edge.leftHandle.y += shapeSize / 2.0

edge.rightHandle = makeHandle(edge)
edge.rightHandle.x += shapeSize
edge.rightHandle.y = edge.leftHandle.y

edge.animators.position.springSpeed = 20
edge.animators.position.springBounciness = 0

edge.position = Layer.root.position
edge.y += 300
edge.x += 300

let hitLayer = undefined
Layer.root.touchBeganHandler = sequence => {
	hitLayer = edge.frame.inset({horizontal: 0, vertical: shapeSize / 4.0}).contains(sequence.currentSample.globalLocation) ? edge : polygon
	if (hitLayer === edge) {
		edge.leftHandle.animators.scale.target = new Point({x: 1, y: 1})
		edge.rightHandle.animators.scale.target = new Point({x: 1, y: 1})
	}
}

Layer.root.touchMovedHandler = sequence => {
	hitLayer.position = hitLayer.position.add(sequence.currentSample.globalLocation.subtract(sequence.previousSample.globalLocation))
	if (polygon.caughtEdge && hitLayer === polygon) {
		// The edge moves along with the polygon when it's "caught" on the polygon.
		edge.position = edge.position.add(sequence.currentSample.globalLocation.subtract(sequence.previousSample.globalLocation))	
	}

	const polygonIsOpen = polygonIsOpenForEdgePosition(edge.position)
	polygon.targetSegments = polygonTargetSegments(polygonIsOpen)

	if (hitLayer === edge) {
		const scale = polygonIsOpen ? new Point({x: 1, y: 1}) : new Point({x: 0.001, y: 0.001})
		polygon.leftHandle.animators.scale.target = scale
		polygon.rightHandle.animators.scale.target = scale
	}
}

Layer.root.touchEndedHandler = sequence => {
	if (polygonIsOpenForEdgePosition(edge.position)) {
		edge.animators.position.target = polygon.position.add(new Point({x: 0, y: shapeSize / 2.0}))
		// Make the edge move with the polygon until it's "detached":
		polygon.caughtEdge = true
	} else {
		polygon.caughtEdge = false
	}

	if (hitLayer === edge) {
		edge.leftHandle.animators.scale.target = new Point({x: 0.001, y: 0.001})
		edge.rightHandle.animators.scale.target = new Point({x: 0.001, y: 0.001})
		polygon.leftHandle.animators.scale.target = new Point({x: 0.001, y: 0.001})
		polygon.rightHandle.animators.scale.target = new Point({x: 0.001, y: 0.001})
	}
}

function polygonIsOpenForEdgePosition(position) {
	return (position.distanceToPoint(polygon.position) < shapeSize / 1.5)
}

// The polygon's "open" when `edge` will form the bottom side.
function polygonTargetSegments(isOpen) {
	if (isOpen) {
		return [
			new Segment(new Point({x: 0, y: shapeSize})),
			new Segment(new Point({x: 0, y: 0})),
			new Segment(new Point({x: shapeSize, y: 0})),
			new Segment(new Point({x: shapeSize, y: shapeSize})),
		]
	} else {
		return [
			new Segment(new Point({x: 0, y: shapeSize})),
			new Segment(new Point({x: shapeSize / 2.0, y: 0})),
			new Segment(new Point({x: shapeSize, y: shapeSize})),
			new Segment(new Point({x: 0, y: shapeSize})),
		]
	}
}

// Makes the little circular handle thing on the vertices.
function makeHandle(parent) {
	const handle = new ShapeLayer.Circle({parent: parent, center: Point.zero, radius: 10})
	handle.strokeColor = undefined
	handle.fillColor = Color.orange
	handle.animators.scale.springSpeed = 20
	handle.animators.scale.springBounciness = 0
	handle.scale = 0.001	
	return handle
}