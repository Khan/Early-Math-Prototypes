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

polygon.behaviors = [
	new ActionBehavior({handler: () => {
		if (polygon.targetSegments !== undefined) {
			let segments = new Array(4)
			for (let segmentIndex = 0; segmentIndex < 4; segmentIndex++) {
				segments[segmentIndex] = new Segment(polygon.segments[segmentIndex].point.add(polygon.targetSegments[segmentIndex].point.subtract(polygon.segments[segmentIndex].point).multiply(0.2)))
			}
			polygon.segments = segments
		}
	}})
]

let edge = new ShapeLayer()
edge.segments = [
	new Segment(new Point({x: 0, y: shapeSize / 2.0})),
	new Segment(new Point({x: shapeSize, y: shapeSize / 2.0}))
]
edge.width = shapeSize
edge.height = shapeSize
edge.strokeColor = polygon.strokeColor
edge.strokeWidth = polygon.strokeWidth
edge.fillColor = undefined

edge.animators.position.springSpeed = 20
edge.animators.position.springBounciness = 0

edge.position = Layer.root.position
edge.y += 300
edge.x += 300

polygon.segments = polygonTargetSegments(false)

let hitLayer = undefined
Layer.root.touchBeganHandler = sequence => {
	hitLayer = edge.frame.inset({horizontal: 0, vertical: shapeSize / 4.0}).contains(sequence.currentSample.globalLocation) ? edge : polygon
}

Layer.root.touchMovedHandler = sequence => {
	hitLayer.position = hitLayer.position.add(sequence.currentSample.globalLocation.subtract(sequence.previousSample.globalLocation))
	if (polygon.caughtEdge && hitLayer === polygon) {
		edge.position = edge.position.add(sequence.currentSample.globalLocation.subtract(sequence.previousSample.globalLocation))	
	}
	polygon.targetSegments = polygonTargetSegments(polygonIsOpenForEdgePosition(edge.position))
}

Layer.root.touchEndedHandler = sequence => {
	if (polygonIsOpenForEdgePosition(edge.position)) {
		edge.animators.position.target = polygon.position.add(new Point({x: 0, y: shapeSize / 2.0}))
		polygon.caughtEdge = true
	} else {
		polygon.caughtEdge = false
	}
}

function polygonIsOpenForEdgePosition(position) {
	return (position.distanceToPoint(polygon.position) < shapeSize / 1.5)
}

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