// scissors icon by Jack Hone https://thenounproject.com/term/scissors/5334/

const blockWidth = 80
const lineWidth = 1.5
const splittingThreshold = blockWidth * 2
const blockColor = new Color({hue: 0.08, saturation: 0.67, brightness: 0.91})
const sliceColor = Color.lightGray
const sliceHandleRadius = 7

let blockContainer = makeBlock(8)
blockContainer.position = Layer.root.position

// Have to put the scissors in a container because touches don't yet work on shapes! Yuuuuuuck.
let scissorsContainer = new Layer()
let scissors = new ShapeLayer({parent: scissorsContainer})
scissors.segments = [
	new Segment(new Point({x: 25, y: 0})),
	new Segment(new Point({x: 0, y: 100})),
	new Segment(new Point({x: 50, y: 100}))
]
scissors.strokeColor = undefined
scissors.fillColor = Color.lightGray
scissors.origin = Point.zero
scissorsContainer.originX = 20
scissorsContainer.originY = Layer.root.height - scissors.height - 30
scissorsContainer.width = 50
scissorsContainer.height = 100
scissorsContainer.animators.y.springSpeed = 15
scissorsContainer.animators.y.springBounciness = 0
scissorsContainer.touchBeganHandler = () => {
	scissors.animators.scale.target = new Point({x: 1.1, y: 1.1})
}
scissorsContainer.touchMovedHandler = touchSequence => {
	scissorsContainer.position = scissorsContainer.position.add(touchSequence.currentSample.globalLocation.subtract(touchSequence.previousSample.globalLocation))

	if (blockContainer.isSplit) { return }

	const containerLocation = blockContainer.convertGlobalPointToLocalPoint(new Point({x: scissorsContainer.x, y: scissorsContainer.originY}))

	if (blockContainer.bounds.inset({value: -20}).contains(containerLocation)) {
		const blockLeftIndex = clip({value: Math.round(containerLocation.x / blockWidth), min: 1, max: blockContainer.blocks.length - 1})
		for (let blockIndex = 0; blockIndex < blockContainer.blocks.length; blockIndex++) {
			blockContainer.blocks[blockIndex].animators.position.target = new Point({x: blockIndex * (blockWidth + lineWidth) + (blockIndex < blockLeftIndex ? -15 : 15) + blockWidth / 2.0, y: blockWidth / 2.0})
		}
		const blockYIndex = clip({value: Math.round(containerLocation.y / blockWidth), min: 0, max: 1})
		blockContainer.splitPoint = blockLeftIndex - 1		
	} else {
		blockContainer.splitPoint = undefined
	}

	for (let blockIndex = 0; blockIndex < blockContainer.blocks.length; blockIndex++) {
		const splitAmount = (blockContainer.splitPoint === undefined) ? 0 : 15
		blockContainer.blocks[blockIndex].animators.position.target = new Point({x: blockIndex * (blockWidth + lineWidth) + (blockIndex <= blockContainer.splitPoint ? -splitAmount : splitAmount) + blockWidth / 2.0, y: blockWidth / 2.0})
	}
}
scissorsContainer.touchEndedHandler = () => {	
	scissors.animators.scale.target = new Point({x: 1, y: 1})

	if (blockContainer.isSplit) { return }

	const didSplit = blockContainer.splitPoint !== undefined
	for (let blockIndex = 0; blockIndex < blockContainer.blocks.length; blockIndex++) {
		const splitAmount = didSplit ? 50 : 0
		blockContainer.blocks[blockIndex].animators.position.target = new Point({x: blockIndex * (blockWidth + lineWidth) + (blockIndex <= blockContainer.splitPoint ? -splitAmount : splitAmount) + blockWidth / 2.0, y: blockWidth / 2.0})
	}

	if (didSplit) {
		scissorsContainer.animators.y.target = blockContainer.frameMaxY + 110
	}
	blockContainer.isSplit = didSplit
}

var draggingPartGesture = new PanGesture({cancelsTouchesInLayer: false, handler: (phase, centroidSequence) => {
	if (blockContainer.isSplit) {
		if (phase === ContinuousGesturePhase.Began) {
			// Find the block we're hitting
			let hitBlockIndex = undefined
			for (let blockIndex = 0; blockIndex < blockContainer.blocks.length; blockIndex++) {
				if (blockContainer.blocks[blockIndex].containsGlobalPoint(centroidSequence.currentSample.globalLocation)) {
					hitBlockIndex = blockIndex
				}
			}
			if (hitBlockIndex !== undefined) {
				draggingPartGesture.hitPartIndex = (hitBlockIndex <= blockContainer.splitPoint) ? 0 : 1

				let connectionLine = new ShapeLayer({parent: blockContainer})
				connectionLine.segments = [new Segment(blockContainer.blocks[blockContainer.splitPoint].position), new Segment(blockContainer.blocks[blockContainer.splitPoint + 1].position)]
				connectionLine.strokeColor = blockColor
				connectionLine.strokeWidth = 0
				blockContainer.connectionLine = connectionLine
			}
		} else if (phase === ContinuousGesturePhase.Changed) {
			if (draggingPartGesture.hitPartIndex === undefined) { return }

			for (let blockIndex = 0; blockIndex < blockContainer.blocks.length; blockIndex++) {
				if ((draggingPartGesture.hitPartIndex === 0 && blockIndex <= blockContainer.splitPoint)||
					(draggingPartGesture.hitPartIndex === 1 && blockIndex > blockContainer.splitPoint)) {
					const block = blockContainer.blocks[blockIndex]
					block.position = block.position.add(centroidSequence.currentSample.globalLocation.subtract(centroidSequence.previousSample.globalLocation))
				}
			}

			blockContainer.connectionLine.segments = [new Segment(blockContainer.blocks[blockContainer.splitPoint].position), new Segment(blockContainer.blocks[blockContainer.splitPoint + 1].position)]
			blockContainer.connectionLine.strokeWidth = clip({value: map({fromInterval: [blockWidth, splittingThreshold], toInterval: [10, 0], value: splitDistanceInBlockContainer(blockContainer)}), min: 0, max: 100})
		} else {
			if (draggingPartGesture.hitPartIndex === undefined) { return }
			if (splitDistanceInBlockContainer(blockContainer) < splittingThreshold) {
				let offset = undefined
				if (draggingPartGesture.hitPartIndex == 0) {
					const lastBlock = blockContainer.blocks[blockContainer.blocks.length - 1]
					offset = new Point({x: lastBlock.frameMaxX - (blockWidth + lineWidth) * blockContainer.blocks.length, y: lastBlock.originY})
				} else {
					offset = blockContainer.blocks[0].origin
				}
				blockContainer.animators.position.target = blockContainer.position.add(offset)
				for (let blockIndex = 0; blockIndex < blockContainer.blocks.length; blockIndex++) {
					blockContainer.blocks[blockIndex].animators.position.target = new Point({x: blockIndex * (blockWidth + lineWidth) + blockWidth / 2.0, y: blockWidth / 2.0})
				}

				blockContainer.behaviors = [new ActionBehavior({handler: () => {
					blockContainer.connectionLine.segments = [new Segment(blockContainer.blocks[blockContainer.splitPoint].position), new Segment(blockContainer.blocks[blockContainer.splitPoint + 1].position)]
					blockContainer.connectionLine.strokeWidth = clip({value: map({fromInterval: [blockWidth, splittingThreshold], toInterval: [10, 0], value: splitDistanceInBlockContainer(blockContainer)}), min: 0, max: 100})
					blockContainer.connectionLine.alpha = map({fromInterval: [blockWidth, splittingThreshold], toInterval: [0, 1], value: splitDistanceInBlockContainer(blockContainer)})
					if (blockContainer.connectionLine.alpha <= 0.1) {
						blockContainer.behaviors = []
						blockContainer.connectionLine.parent = undefined
						blockContainer.connectionLine = undefined
						blockContainer.isSplit = false
					}
				}})]
			} else {
				blockContainer.isSplit = true
			}
			draggingPartGesture.hitPartIndex = undefined
		}
	} else {
		if (phase === ContinuousGesturePhase.Began) {
			draggingPartGesture.hitBlockContainer = blockContainer.containsGlobalPoint(centroidSequence.currentSample.globalLocation)
		} else if (phase === ContinuousGesturePhase.Changed && draggingPartGesture.hitBlockContainer) {
			blockContainer.position = blockContainer.position.add(centroidSequence.currentSample.globalLocation.subtract(centroidSequence.previousSample.globalLocation))
		} else {
			draggingPartGesture.hitBlockContainer = undefined
		}
	}
}})

draggingPartGesture.shouldRecognizeSimultaneouslyWithGesture = () => { return true }
Layer.root.gestures = [draggingPartGesture]

function makeBlock(count) {
	const blockContainer = new Layer()
	blockContainer.width = blockWidth * count
	blockContainer.height = blockWidth

	blockContainer.blocks = []
	for (var blockIndex = 0; blockIndex < count; blockIndex++) {
		const block = new Layer({parent: blockContainer})
		block.backgroundColor = blockColor
		block.width = blockWidth
		block.height = blockWidth
		block.originX = blockIndex * (blockWidth + lineWidth)
		block.originY = 0
		blockContainer.blocks.push(block)

		block.animators.position.springSpeed = 30
		block.animators.position.springBounciness = 0
	}

	blockContainer.animators.position.springSpeed = 30
	blockContainer.animators.position.springBounciness = 0
	blockContainer.animators.scale.springSpeed = 20
	blockContainer.animators.scale.springBounciness = 8

	return blockContainer
}

function splitDistanceInBlockContainer(blockContainer) {
	const leftSplitBlock = blockContainer.blocks[blockContainer.splitPoint]
	const rightSplitBlock = blockContainer.blocks[blockContainer.splitPoint + 1]
	return leftSplitBlock.position.distanceToPoint(rightSplitBlock.position)
}
