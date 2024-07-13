import { fork } from "child_process"
import WebSocket from "ws"
import { Bounds, Coordinate, FORK_OPTIONS, type Message } from "./types"
import { isTileWithinBoundingBox } from "./utils/coordinates"
import type { CustomClient } from "./websockets"

export async function setupTileCacher(wss) {
    // Start TileCacher
    const tileCacher = fork("./src/TileCacher/index.ts", [], FORK_OPTIONS)

    tileCacher.on("error", (error) => {
        console.error("TileCacher Error: ", error)
    })

    tileCacher.on("message", ({ cmd, data }: Message) => {
        console.log(data)
        if (cmd == "tileUpdated") {
            const { tileCoord, tileName } = JSON.parse(data)

            wss.clients.forEach((client: CustomClient) => {
                console.log("gonna send", client.readyState)
                if (
                    client.readyState === WebSocket.OPEN &&
                    client.boundingBox
                ) {
                    if (
                        isTileWithinBoundingBox(tileCoord, client.boundingBox)
                    ) {
                        const msg = JSON.stringify({
                            cmd: "tileChanged",
                            data: { tileName, timestamp: Date.now() },
                        })
                        client.send(msg)
                        console.log(
                            "sent:",
                            JSON.stringify({
                                cmd: "tileChanged",
                                data: tileName,
                            }),
                        )
                    } else {
                        console.log("not in boundingbox")
                    }
                }
            })
        }
    })

    tileCacher.send({ cmd: "start" })
}
