if (Layer.root.width !== 1024) {
	throw "This prototype is meant to be run in landscape on an iPad"
}

// where the ghost blocks start
const ghostContainerX = 610
const ghostContainerY = 578

// where the non-ghost blocks are
const blockContainerX = 346
const blockContainerY = 280

const totalGhostBlockCount = 6

const blockWidth = 42
const lineWidth = 1
const ghostStrokeColor = new Color({white: 0.8})

const bg = new Layer({imageName: "bg"})
bg.userInteractionEnabled = false
bg.position = Layer.root.position

// Make the ghost blocks.
for (let blockIndex = 0; blockIndex < totalGhostBlockCount; blockIndex++) {
	var block = makeGhostBlock(6 - blockIndex)
	block.originX = ghostContainerX + blockIndex * (blockWidth + 6)
	block.originY = ghostContainerY - block.height
}

let highestBlockZPosition = 0

function makeGhostBlock(count) {
	const blockContainer = new Layer()
	blockContainer.width = blockWidth
	blockContainer.height = (blockWidth + lineWidth) * count

	const block = new ShapeLayer.Rectangle({
		parent: blockContainer,
		rectangle: new Rect({x: 0, y: 0, width: blockWidth, height: (blockWidth + lineWidth) * count})
	})
	block.dashLength = 8
	block.strokeColor = ghostStrokeColor
	block.strokeWidth = 3
	block.fillColor = Color.white

	// Draw lines separating each block
	for (var blockIndex = 0; blockIndex < count; blockIndex++) {
		if (blockIndex > 0) {
			const y = blockIndex * (blockWidth + lineWidth)
			const line = new ShapeLayer.Line({
				from: new Point({x: 0, y: y}),
				to: new Point({x: block.width, y: y}),
				parent: blockContainer
			})
			line.strokeWidth = block.strokeWidth
			line.dashLength = block.dashLength
			line.strokeColor = block.strokeColor
		}
	}

	blockContainer.animators.scale.springSpeed = 20
	blockContainer.animators.scale.springBounciness = 8
	blockContainer.animators.position.springSpeed = 30
	blockContainer.animators.position.springBounciness = 0

	blockContainer.touchBeganHandler = () => {
		highestBlockZPosition += 1
		blockContainer.zPosition = highestBlockZPosition
	}

	blockContainer.touchMovedHandler = touchSequence => {
		blockContainer.position = blockContainer.position.add(touchSequence.currentSample.globalLocation.subtract(touchSequence.previousSample.globalLocation))
	}

	blockContainer.touchEndedHandler = blockContainer.touchCancelledHandler = () => {
		blockContainer.animators.scale.target = new Point({x: 1, y: 1})
		const slot = stairContainerSlotForBlockContainerFrame(blockContainer.frame)
		if (slot !== undefined) {
			// Snap to a block
			const position = new Point({
				x: xPositionForSlotIndex(slot) + blockWidth / 2.0 + (slot + 1) * lineWidth,
				y: blockContainerY + clip({
					value: Math.round((blockContainer.originY - blockContainerY) / (blockWidth + lineWidth)),
					min: 0, max: Number.MAX_VALUE
				}) * (blockWidth + lineWidth) + blockContainer.height / 2.0
			})
			blockContainer.animators.position.target = position
		}
	}

	return blockContainer
}

function stairContainerSlotForBlockContainerFrame(frame) {
	var slotIndex = Math.round((frame.minX - blockContainerX) / blockWidth)
	if (slotIndex < 0 || slotIndex >= totalGhostBlockCount) {
		return undefined
	} else {
		return slotIndex
	}
}

function xPositionForSlotIndex(slotIndex) {
	return blockContainerX + slotIndex * (blockWidth + lineWidth)
}