import {Bounds, Coordinate, MAX_UINT32} from "../types";


const MAX_BOX = 100000
export function isTileWithinBoundingBox(coordinate: Coordinate, boundingBox: Bounds): boolean {
    let [x, y] = coordinate
    let [[left, top], [right, bottom]] = boundingBox

    if(left > right){
        // wrapping X
        right += MAX_UINT32
        if(x < MAX_BOX) x += MAX_UINT32
    }
    if(top > bottom){
        // wrapping X
        bottom += MAX_UINT32
        if(y < MAX_BOX) y += MAX_UINT32
    }

    return (
            (x >= left && x <= right)
        )
        && (
            (y >= top && y <= bottom)
        )
}
