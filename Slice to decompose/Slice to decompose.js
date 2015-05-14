// scissors icon by Nathan Thomson https://thenounproject.com/term/scissors/2521/

const blockWidth = 80
const lineWidth = 1.5
const splittingThreshold = blockWidth * 2
const blockColor = new Color({hue: 0.08, saturation: 0.67, brightness: 0.91})
const sliceColor = Color.lightGray
const sliceHandleRadius = 7

let blockContainer = makeBlock(8)
blockContainer.position = Layer.root.position

let toolbar = new Layer()
toolbar.zPosition = 100
toolbar.width = Layer.root.width
toolbar.height = 100
toolbar.originX = 0
toolbar.originY = Layer.root.height - toolbar.height
toolbar.backgroundColor = new Color({white: 0.9})

let scissors = new Layer({imageName: "scissors", parent: toolbar})
setScissorsSelected(true)
scissors.originX = 20
scissors.touchBeganHandler = () => {
	scissors.animators.scale.target = new Point({x: 1.1, y: 1.1})
}
scissors.touchEndedHandler = () => {
	scissors.animators.scale.target = new Point({x: 1, y: 1})
	setScissorsSelected(!scissors.selected)
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
			if (!draggingPartGesture.hitPartIndex) { return }

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
			if (!draggingPartGesture.hitPartIndex) { return }
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
		if (scissors.selected) {
			return
		} else {
			if (phase === ContinuousGesturePhase.Changed) {
				blockContainer.position = blockContainer.position.add(centroidSequence.currentSample.globalLocation.subtract(centroidSequence.previousSample.globalLocation))
			}
		}
	}
}})

draggingPartGesture.shouldRecognizeSimultaneouslyWithGesture = () => { return true }
Layer.root.gestures = [draggingPartGesture]

Layer.root.touchBeganHandler = sequence => {
	if (blockContainer.isSplit || !scissors.selected) { return }

	const containerLocation = blockContainer.convertGlobalPointToLocalPoint(sequence.currentSample.globalLocation)

	if (!blockContainer.bounds.inset({value: -20}).contains(containerLocation)) {
		return
	}

	const blockLeftIndex = clip({value: Math.round(containerLocation.x / blockWidth), min: 1, max: blockContainer.blocks.length - 1})
	for (let blockIndex = 0; blockIndex < blockContainer.blocks.length; blockIndex++) {
		blockContainer.blocks[blockIndex].animators.position.target = new Point({x: blockIndex * (blockWidth + lineWidth) + (blockIndex < blockLeftIndex ? -15 : 15) + blockWidth / 2.0, y: blockWidth / 2.0})
	}
	const blockYIndex = clip({value: Math.round(containerLocation.y / blockWidth), min: 0, max: 1})

	const firstHandleCircle = new ShapeLayer.Circle({parent: blockContainer, center: new Point({x: blockContainer.blocks[blockLeftIndex].originX, y: blockYIndex * blockWidth}), radius: sliceHandleRadius})
	firstHandleCircle.fillColor = sliceColor
	firstHandleCircle.strokeColor = undefined
	blockContainer.firstHandleCircle = firstHandleCircle

	const secondHandleCircle = new ShapeLayer.Circle({parent: blockContainer, center: new Point({x: blockContainer.blocks[blockLeftIndex].originX, y: blockYIndex * blockWidth}), radius: sliceHandleRadius})
	secondHandleCircle.fillColor = sliceColor
	secondHandleCircle.strokeColor = undefined
	blockContainer.secondHandleCircle = secondHandleCircle

	const connectingLine = new ShapeLayer({parent: blockContainer})
	connectingLine.segments = [new Segment(firstHandleCircle.position)]
	connectingLine.strokeWidth = 1
	connectingLine.strokeColor = sliceColor
	blockContainer.connectingLine = connectingLine

	blockContainer.splitPoint = blockLeftIndex - 1
}

Layer.root.touchMovedHandler = sequence => {
	if (blockContainer.isSplit || !scissors.selected || !blockContainer.firstHandleCircle) { return }

	blockContainer.secondHandleCircle.position = blockContainer.secondHandleCircle.position.add(sequence.currentSample.globalLocation.subtract(sequence.previousSample.globalLocation))
	blockContainer.connectingLine.segments = [
		blockContainer.connectingLine.segments[0],
		new Segment(blockContainer.secondHandleCircle.position)
	]
}

Layer.root.touchEndedHandler = blockContainer.touchCancelledHandler = sequence => {
	if (blockContainer.isSplit || !scissors.selected || !blockContainer.firstHandleCircle) { return }

	const firstHandleCircle = blockContainer.firstHandleCircle
	blockContainer.firstHandleCircle = undefined
	const secondHandleCircle = blockContainer.secondHandleCircle
	blockContainer.secondHandleCircle = undefined
	const connectingLine = blockContainer.connectingLine
	blockContainer.connectingLine = undefined
	Layer.animate({
		duration: 0.1,
		animations: () => {
			firstHandleCircle.alpha = 0
			secondHandleCircle.alpha = 0
			connectingLine.alpha = 0
		},
		completionHandler: () => {
			firstHandleCircle.parent = undefined
			secondHandleCircle.parent = undefined
			connectingLine.parent = undefined
		}
	})

	const didSplit = (firstHandleCircle.position.y == 0) ? (secondHandleCircle.position.y > blockWidth) : (secondHandleCircle.position.y < blockWidth)
	for (let blockIndex = 0; blockIndex < blockContainer.blocks.length; blockIndex++) {
		const splitAmount = didSplit ? 25 : 0
		blockContainer.blocks[blockIndex].animators.position.target = new Point({x: blockIndex * (blockWidth + lineWidth) + (blockIndex <= blockContainer.splitPoint ? -splitAmount : splitAmount) + blockWidth / 2.0, y: blockWidth / 2.0})
	}
	blockContainer.isSplit = didSplit
	setScissorsSelected(!didSplit)
}

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

function blockIndexHitInBlockContainer(blockContainer, globalLocation) {
	return Math.floor(blockContainer.convertGlobalPointToLocalPoint(globalLocation).x / blockWidth)
}

function setScissorsSelected(selected) {
	if (!(selected && blockContainer.isSplit)) {
		scissors.selected = selected
		scissors.shadow = new Shadow({color: Color.orange, alpha: scissors.selected ? 1.0 : 0.0, radius: 10})
	}
}