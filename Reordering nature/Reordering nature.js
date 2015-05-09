if (Layer.root.width !== 1024) {
	throw "This prototype is meant to be run in landscape on an iPad"
}

const stairContainerX = 569
const stairContainerMaxY = 590
const stairContainerSlotCount = 7
const blockWidth = 42
const lineWidth = 1.5

const bg = new Layer({imageName: "bg"})
bg.userInteractionEnabled = false
bg.moveToBottomSideOfParentLayer()
bg.originX = 0

let indexOrder = []
for (let blockIndex = 0; blockIndex < stairContainerSlotCount; blockIndex++) {
	indexOrder.push(blockIndex)
}
// Fisher-Yates shuffle
for (let blockIndex = indexOrder.length - 1; blockIndex >= 1; blockIndex--) {
	const destinationIndex = Math.round(Math.random() * blockIndex)
	const swap = indexOrder[destinationIndex]
	indexOrder[destinationIndex] = indexOrder[blockIndex]
	indexOrder[blockIndex] = swap
}
for (let blockIndex = 0; blockIndex < stairContainerSlotCount; blockIndex++) {
	var block = makeBlock(indexOrder[blockIndex] + 1)
	block.originX = stairContainerX - 25 + blockIndex * (blockWidth + 5)
	block.originY = 200 + Math.random() * 100 - 50
}

let highestBlockZPosition = 0

let slotBlocks = []
slotBlocks.fill(null, 0, stairContainerSlotCount)

function makeBlock(count) {
	const blockContainer = new Layer()
	blockContainer.width = blockWidth
	blockContainer.height = blockWidth * count
	blockContainer.floating = true

	for (var blockIndex = 0; blockIndex < count; blockIndex++) {
		const block = new Layer({parent: blockContainer})
		block.backgroundColor = Color.orange
		block.width = blockWidth
		block.height = blockWidth
		block.originX = 0
		block.originY = blockIndex * blockWidth
		if (blockIndex > 0) {
			const line = new ShapeLayer.Line({
				from: new Point({x: 0, y: block.originY}),
				to: new Point({x: block.width, y: block.originY}),
				parent: blockContainer
			})
			line.strokeWidth = lineWidth
			line.strokeColor = Color.white
		}
	}

	const outline = new Layer({parent: blockContainer})
	outline.border = new Border({width: lineWidth, color: Color.white})
	outline.frame = blockContainer.bounds.inset({value: -lineWidth})

	addFloatingBehavior(blockContainer, 0.1, 2)

	blockContainer.animators.scale.springSpeed = 20
	blockContainer.animators.scale.springBounciness = 8
	blockContainer.animators.position.springSpeed = 30
	blockContainer.animators.position.springBounciness = 0

	blockContainer.touchBeganHandler = () => {
		blockContainer.animators.scale.target = new Point({x: 1.1, y: 1.1})
		blockContainer.floating = false

		highestBlockZPosition += 1
		blockContainer.zPosition = highestBlockZPosition

		var currentSlot = slotBlocks.indexOf(blockContainer)
		if (currentSlot !== undefined) {
			slotBlocks[currentSlot] = undefined
		}
	}

	blockContainer.touchMovedHandler = touchSequence => {
		blockContainer.position = blockContainer.position.add(touchSequence.currentSample.globalLocation.subtract(touchSequence.previousSample.globalLocation))
		const slot = stairContainerSlotForBlockContainerFrame(blockContainer.frame)
		if (slot !== undefined) {
			const newSlotArray = slotArrayByInsertingSpace(slotBlocks, slot)
			for (var slotIndex = 0; slotIndex < newSlotArray.length; slotIndex++) {
				const blockInSlot = newSlotArray[slotIndex]
				if (blockInSlot !== undefined) {
					const position = new Point({
						x: xPositionForSlotIndex(slotIndex) + blockWidth / 2.0 + (slotIndex + 1) * lineWidth,
						y: stairContainerMaxY - blockInSlot.height / 2.0 - 1
					})
					blockInSlot.animators.position.target = position
				}
			}
			slotBlocks = newSlotArray
		}
	}

	blockContainer.touchEndedHandler = blockContainer.touchCancelledHandler = () => {
		blockContainer.animators.scale.target = new Point({x: 1, y: 1})
		const slot = stairContainerSlotForBlockContainerFrame(blockContainer.frame)
		if (slot !== undefined) {
			const position = new Point({
				x: xPositionForSlotIndex(slot) + blockWidth / 2.0 + (slot + 1) * lineWidth,
				y: stairContainerMaxY - blockContainer.height / 2.0 - 1
			})
			blockContainer.animators.position.target = position

			slotBlocks[slot] = blockContainer
		} else {
			blockContainer.floating = true
		}
	}

	return blockContainer
}

function slotArrayByInsertingSpace(oldArray, index) {
	const newArray = new Array(oldArray.length)
	let spaceIndex = undefined
	// Start by trying to find the nearest open slot before the target slot.
	for (var oldArrayIndex = index; oldArrayIndex >= 0; oldArrayIndex--) {
		if (oldArray[oldArrayIndex] === undefined) {
			spaceIndex = oldArrayIndex
			break
		}
	}
	// Then look for a space after the target slot.
	for (var oldArrayIndex = index + 1; oldArrayIndex < stairContainerSlotCount; oldArrayIndex++) {
		if (oldArray[oldArrayIndex] === undefined) {
			// Use it if it's closer.
			if (spaceIndex === undefined || (Math.abs(oldArrayIndex - index) < Math.abs(spaceIndex - index))) {
				spaceIndex = oldArrayIndex
			}
			break
		}
	}

	if (spaceIndex === undefined) {
		throw "Couldn't find space!"
	}

	for (var oldArrayIndex = 0, newArrayIndex = 0; newArrayIndex < stairContainerSlotCount; newArrayIndex++) {
		if (oldArrayIndex === spaceIndex) {
			oldArrayIndex++
		}
		if (newArrayIndex !== index) {
			newArray[newArrayIndex] = oldArray[oldArrayIndex]
			oldArrayIndex++
		}
	}

	return newArray
}

function stairContainerSlotForBlockContainerFrame(frame) {
	if (Math.abs(frame.maxY - stairContainerMaxY) < blockWidth) {
		var slotIndex = Math.round((frame.minX - stairContainerX) / blockWidth)
		if (slotIndex < 0 || slotIndex >= stairContainerSlotCount) {
			return undefined
		} else {
			return slotIndex
		}
	} else {
		return undefined
	}
}

function xPositionForSlotIndex(slotIndex) {
	return stairContainerX + slotIndex * blockWidth
}

//============================================================================================

function addFloatingBehavior(layer, amplitude, frequency) {
	var floatingSeed = Math.random() * 2 * Math.PI
	layer.behaviors = [new ActionBehavior({handler: () => {
		if (layer.floating) {
			layer.y = layer.y + Math.sin((Timestamp.currentTimestamp() + floatingSeed) * frequency) * amplitude
		}
	}})]
}