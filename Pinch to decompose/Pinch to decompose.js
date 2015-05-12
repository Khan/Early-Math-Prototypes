const blockWidth = 60
const lineWidth = 1.5
const splittingThreshold = blockWidth * 2

let blockContainer = makeBlock(8)
blockContainer.position = Layer.root.position

var draggingPartGesture = new PanGesture({cancelsTouchesInLayer: false, handler: (phase, centroidSequence) => {
	if (!blockContainer.isSplit) { return }
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
		}
	} else if (phase === ContinuousGesturePhase.Changed) {
		for (let blockIndex = 0; blockIndex < blockContainer.blocks.length; blockIndex++) {
			if ((draggingPartGesture.hitPartIndex === 0 && blockIndex <= blockContainer.splitPoint)||
				(draggingPartGesture.hitPartIndex === 1 && blockIndex > blockContainer.splitPoint)) {
				const block = blockContainer.blocks[blockIndex]
				block.position = block.position.add(centroidSequence.currentSample.globalLocation.subtract(centroidSequence.previousSample.globalLocation))
			}
		}
	} else {
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
			blockContainer.isSplit = false
		} else {
			blockContainer.isSplit = true
		}
		draggingPartGesture.hitPartIndex = undefined
	}
}})

draggingPartGesture.shouldRecognizeSimultaneouslyWithGesture = () => { return true }
Layer.root.gestures = [draggingPartGesture]

Layer.root.touchBeganHandler = touchSequence => {
	// TODO highlight
}

Layer.root.touchEndedHandler = blockContainer.touchCancelledHandler = () => {
	// TODO highlight
}

function makeBlock(count) {
	const blockContainer = new Layer()
	blockContainer.width = blockWidth * count
	blockContainer.height = blockWidth

	blockContainer.blocks = []
	for (var blockIndex = 0; blockIndex < count; blockIndex++) {
		const block = new Layer({parent: blockContainer})
		block.backgroundColor = new Color({hue: 0.08, saturation: 0.67, brightness: 0.91})
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

	blockContainer.gestures = [
		new PanGesture({cancelsTouchesInLayer: false, handler: (phase, centroidSequence) => {
			if (!blockContainer.isSplit && phase === ContinuousGesturePhase.Changed) {
				blockContainer.position = blockContainer.position.add(centroidSequence.currentSample.globalLocation.subtract(centroidSequence.previousSample.globalLocation))
			}
		}}),
		new PinchGesture({cancelsTouchesInLayer: false, handler: (phase, sampleSequence) => {
			if (blockContainer.isSplit) { return }

			if (phase === ContinuousGesturePhase.Began) {
				let firstBlockIndex, firstSequenceID, secondBlockIndex, secondSequenceID
				for (let key in blockContainer.activeTouchSequences) {
					let sequence = blockContainer.activeTouchSequences[key]
					let blockIndex = blockIndexHitInBlockContainer(blockContainer, sequence.currentSample.globalLocation)
					if (firstBlockIndex === undefined) {
						firstBlockIndex = blockIndex
						firstSequenceID = sequence.id
					} else if (secondBlockIndex === undefined) {
						secondBlockIndex = blockIndex
						secondSequenceID = sequence.id
					}
				}

				// Some very lazy coding here:
				blockContainer.firstBlockIndex = Math.min(firstBlockIndex, secondBlockIndex)
				blockContainer.secondBlockIndex = Math.max(firstBlockIndex, secondBlockIndex)
				blockContainer.firstSequenceID = (blockContainer.firstBlockIndex === firstBlockIndex) ? firstSequenceID : secondSequenceID
				blockContainer.secondSequenceID = (blockContainer.firstBlockIndex === firstBlockIndex) ? secondSequenceID : firstSequenceID
				blockContainer.splitPoint = Math.floor((firstBlockIndex + secondBlockIndex) / 2)
			} else if (phase === ContinuousGesturePhase.Ended || phase === ContinuousGesturePhase.Cancelled) {
				if (splitDistanceInBlockContainer(blockContainer) < splittingThreshold) {
					for (let blockIndex = 0; blockIndex < blockContainer.blocks.length; blockIndex++) {
						blockContainer.blocks[blockIndex].animators.position.target = new Point({x: blockIndex * (blockWidth + lineWidth) + blockWidth / 2.0, y: blockWidth / 2.0})
					}
					blockContainer.isSplit = false
				} else {
					blockContainer.isSplit = true
				}
				blockContainer.previousSamples = undefined
			} else if (phase === ContinuousGesturePhase.Changed) {
				if (blockContainer.activeTouchSequences[blockContainer.firstSequenceID] === undefined || blockContainer.activeTouchSequences[blockContainer.secondSequenceID] === undefined) {
					// This shouldn't really be an issue--it looks like we're still getting a changed action when one touch lifts.
					return
				}

				if (blockContainer.previousSamples === undefined) {
					blockContainer.previousSamples = [blockContainer.activeTouchSequences[blockContainer.firstSequenceID].previousSample, blockContainer.activeTouchSequences[blockContainer.secondSequenceID].previousSample]
				}
				for (let blockIndex = 0; blockIndex < blockContainer.blocks.length; blockIndex++) {
					const sequenceID = (blockIndex <= blockContainer.splitPoint) ? blockContainer.firstSequenceID : blockContainer.secondSequenceID
					const previousSampleIndex = (sequenceID === blockContainer.firstSequenceID) ? 0 : 1 // lazy lazy
					const sequence = blockContainer.activeTouchSequences[sequenceID]
					const block = blockContainer.blocks[blockIndex]
					block.position = block.position.add(sequence.currentSample.globalLocation.subtract(blockContainer.previousSamples[previousSampleIndex].globalLocation))
				}

				blockContainer.previousSamples = [blockContainer.activeTouchSequences[blockContainer.firstSequenceID].currentSample, blockContainer.activeTouchSequences[blockContainer.secondSequenceID].currentSample]
			}
		}})
	]
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