import { fork } from "node:child_process"
import type { Message } from "./types.ts"

export async function setupQueueHandler() {
    const queueHandler = fork("./src/QueueHandler/index.ts", [])

    queueHandler.on("message", (message: Message) => {
        console.log("QueueHandler: ", message.data)
    })

    queueHandler.on("error", (error) => {
        console.error("QueueHandler Error: ", error)
    })

    queueHandler.send({ cmd: "start" })
}
