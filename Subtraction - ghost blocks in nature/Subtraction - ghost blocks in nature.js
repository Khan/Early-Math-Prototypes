if (Layer.root.width !== 1024) {
	throw "This prototype is meant to be run in landscape on an iPad"
}

const ghostContainerX = 610
const blockContainerX = 346
const ghostContainerY = 578
const stairContainerSlotCount = 6
const blockWidth = 42
const lineWidth = 1
const ghostStrokeColor = new Color({white: 0.8})

const bg = new Layer({imageName: "bg"})
bg.userInteractionEnabled = false
bg.moveToBottomSideOfParentLayer()
bg.originX = 0

for (let blockIndex = 0; blockIndex < stairContainerSlotCount; blockIndex++) {
	var block = makeBlock(6 - blockIndex)
	block.originX = ghostContainerX + blockIndex * (blockWidth + 6)
	block.originY = ghostContainerY - block.height
}

let highestBlockZPosition = 0

let slotBlocks = []
slotBlocks.fill(null, 0, stairContainerSlotCount)

function makeBlock(count) {
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

		var currentSlot = slotBlocks.indexOf(blockContainer)
		if (currentSlot !== undefined) {
			slotBlocks[currentSlot] = undefined
		}
	}

	blockContainer.touchMovedHandler = touchSequence => {
		blockContainer.position = blockContainer.position.add(touchSequence.currentSample.globalLocation.subtract(touchSequence.previousSample.globalLocation))
	}

	blockContainer.touchEndedHandler = blockContainer.touchCancelledHandler = () => {
		blockContainer.animators.scale.target = new Point({x: 1, y: 1})
		const slot = stairContainerSlotForBlockContainerFrame(blockContainer.frame)
		if (slot !== undefined) {
			const position = new Point({
				x: xPositionForSlotIndex(slot) + blockWidth / 2.0 + (slot + 1) * lineWidth,
				y: 280 + clip({
					value: Math.round((blockContainer.originY - 280) / (blockWidth + lineWidth)),
					min: 0, max: Number.MAX_VALUE
				}) * (blockWidth + lineWidth) + blockContainer.height / 2.0
			})
			blockContainer.animators.position.target = position

			slotBlocks[slot] = blockContainer
		}
	}

	return blockContainer
}

function stairContainerSlotForBlockContainerFrame(frame) {
	var slotIndex = Math.round((frame.minX - blockContainerX) / blockWidth)
	if (slotIndex < 0 || slotIndex >= stairContainerSlotCount) {
		return undefined
	} else {
		return slotIndex
	}
}

function xPositionForSlotIndex(slotIndex) {
	return blockContainerX + slotIndex * (blockWidth + lineWidth)
}