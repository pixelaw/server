import { type Bounds, type Coordinate, MAX_DIMENSION, MAX_UINT32 } from "../types.ts"

const MAX_BOX = 100000
export function isTileWithinBoundingBox(coordinate: Coordinate, boundingBox: Bounds): boolean {
    // console.log("isTileWithinBoundingBox", coordinate, JSON.stringify(boundingBox))
    let [x, y] = coordinate
    let [[left, top], [right, bottom]] = boundingBox

    if (left > right) {
        // wrapping X
        right += MAX_DIMENSION
        if (x < MAX_BOX) x += MAX_DIMENSION
    }
    if (top > bottom) {
        // wrapping X
        bottom += MAX_DIMENSION
        if (y < MAX_BOX) y += MAX_DIMENSION
    }

    return x >= left && x <= right && y >= top && y <= bottom
}
