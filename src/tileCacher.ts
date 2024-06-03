import {fork} from "child_process";
import {Bounds, Coordinate, FORK_OPTIONS, Message} from "./types";

function isTileWithinBoundingBox(coordinate: Coordinate, boundingBox: Bounds): boolean {
    const [x, y] = coordinate;
    const [[left, top], [right, bottom]] = boundingBox;

    return x >= left && x <= right && y >= top && y <= bottom;
}

export async function setupTileCacher(wss) {

// Start TileCacher
    const tileCacher = fork('./src/TileCacher/index.ts', [], FORK_OPTIONS);

    tileCacher
        .on('error', (error) => {
            console.error('TileCacher Error: ', error);
        })
        .on('message', ({cmd, data}: Message) => {
            if (cmd == "tileUpdated") {
                const tileCoord: Coordinate = JSON.parse(data)

                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        if (
                            client.boundingBox
                            && isTileWithinBoundingBox(tileCoord, client.boundingBox)
                        ) {
                            client.send(tileCoord);
                        }
                    }
                })
            }
        })
        .send({cmd: 'start'});

}