import { events, Account, type BigNumberish, CallData, Contract, RpcProvider, num } from "starknet"
import ToriiSql from "../lib/ToriiSql.ts"
import type { Message } from "../types.ts"
import { getCoreActionsAddresses } from "../utils/getAddresses.ts"
import { sleep } from "../utils/sleep.ts"
import { SqliteDb } from "./db.ts"

// Approx Blocktime so we can minimize submitting items early
const BLOCKTIME_MS = 3000
export const QUEUE_SCHEDULED_KEY_EVENT = "0x6f1bfc5633f122d8c9434781122815472902eb371ac9a3c6531bc78bdb17b7a"
export const QUEUE_STARTED_KEY_EVENT = "0x1c4fa7f75d1ea055adccbf8f86b75224181a3036d672762185805e0b999ad65"
export const QUEUE_FINISHED_KEY_EVENT = "0x16c4dd771da9a5cb32846fbb15c1b614da08fb5267af2fcce902a4c416e76cf"

export interface QueueItem {
    id: string
    timestamp: number
    called_system: string
    selector: string
    calldata: string[]
}

let handler: QueueHandler
let running = true

class QueueHandler {
    nodeUrl: string
    toriiUrl: string
    storageDir: string
    provider: RpcProvider
    account: Account
    coreAddress: string
    worldAddress: string
    coreContract: Contract
    db: SqliteDb
    toriiSql: ToriiSql

    constructor(nodeUrl: string, toriiUrl: string, address: string, private_key: string, storageDir: string) {
        this.toriiSql = new ToriiSql(toriiUrl)
        this.nodeUrl = nodeUrl
        this.provider = new RpcProvider({ nodeUrl })
        this.toriiUrl = toriiUrl
        this.storageDir = storageDir
        this.account = new Account(this.provider, address, private_key)
        this.db = new SqliteDb(`${storageDir}/QueueHandler.sqlite`)
    }

    async getEvents() {
        const now = Math.floor(Date.now() / 1000)

        try {
            await this.db.open()

            let last_scheduled_rowid = await this.db.getSystemNumericValue("last_scheduled_rowid")
            let last_processed_rowid = await this.db.getSystemNumericValue("last_processed_rowid")

            const scheduled_events = await this.toriiSql.getNewScheduled(last_scheduled_rowid)
            const processed_events = await this.toriiSql.getNewProcessed(last_processed_rowid)

            for (const ev of scheduled_events) {
                await this.db.setQueueItemPending({
                    id: num.toHex(ev.id as BigNumberish),
                    timestamp: Number(ev.timestamp),
                    called_system: num.toHex(ev.called_system as BigNumberish),
                    selector: num.toHex(ev.selector as BigNumberish),
                    // @ts-ignore because we're sure that calldata is always an array.
                    calldata: JSON.parse(ev.calldata).map((e) => num.toHex(e)),
                } as QueueItem)
                console.log(await this.db.getQueueItemPending(0))
                if (ev.rowid > last_scheduled_rowid) last_scheduled_rowid = ev.rowid
            }

            for (const ev of processed_events) {
                await this.db.removeQueueItemPending(num.toHex(ev.id as BigNumberish))
                if (ev.rowid > last_processed_rowid) last_processed_rowid = ev.rowid
                console.log("removed")
            }

            const pendingFromDb = await this.db.getQueueItemPending(now)

            const testedItems = []
            for (const item of pendingFromDb) {
                try {
                    await this.account.estimateFee(
                        {
                            contractAddress: this.coreAddress,
                            entrypoint: "process_queue",
                            calldata: [
                                item.id,
                                item.timestamp,
                                item.called_system,
                                item.selector,
                                item.calldata.length,
                                ...item.calldata,
                            ],
                        },
                        {},
                    )
                    testedItems.push(item)
                } catch (e) {
                    log(`QueueItem failed: ${e.message}`)
                    if (e.message.includes("timestamp still in the future")) {
                        log("QueueItem was posted early")
                    } else {
                        try {
                            // This one fails, move it to error
                            await this.db.movePendingToError(item.id, e.message)
                        } catch (ea) {
                            log(`movePendingToError db error: ${ea.message}`)
                        }
                    }
                }
            }

            if (testedItems.length > 0) {
                console.log("executing", testedItems.length)
                const result = await this.account.execute(
                    testedItems.map((item) => {
                        return {
                            contractAddress: this.coreAddress,
                            entrypoint: "process_queue",
                            calldata: [
                                item.id,
                                item.timestamp,
                                item.called_system,
                                item.selector,
                                item.calldata.length,
                                ...item.calldata,
                            ],
                        }
                    }),
                    undefined,
                    {},
                )
            }

            // Mark the retrieved latest blocknumber as done
            await this.db.setSystemNumericValue("last_scheduled_rowid", last_scheduled_rowid)
            await this.db.setSystemNumericValue("last_processed_rowid", last_processed_rowid)

            console.log("done")
        } catch (e) {
            // TODO Handle this general error
            console.error(e)
            log(`getEvents failed: ${e.message}`)
        } finally {
            await this.db.close()
            console.log("closed")
        }
    }

    static async create(
        nodeUrl: string,
        toriiUrl: string,
        worldAddress: string,
        address: string,
        private_key: string,
        storageDir: string,
    ): Promise<QueueHandler> {
        const handler = new QueueHandler(nodeUrl, toriiUrl, address, private_key, storageDir)

        const { coreAddress } = await getCoreActionsAddresses(toriiUrl)
        handler.worldAddress = worldAddress
        handler.coreAddress = coreAddress

        const { abi: coreAbi } = await handler.provider.getClassAt(coreAddress)
        if (coreAbi === undefined) throw new Error("no abi.")

        handler.coreContract = new Contract(coreAbi, coreAddress, handler.provider)

        return handler
    }
}

async function loop(handler: QueueHandler) {
    while (running) {
        try {
            await handler.getEvents()
        } catch (e) {
            log(`QueueHandler failed: ${e.message}`)
        }
        await sleep(3000)
    }
}

function log(message: string) {
    if (process.send) {
        process.send({ cmd: "message", data: message })
    } else {
        console.log(message)
    }
}

process.on("message", async (message: Message) => {
    if (message.cmd === "start") {
        running = true
        try {
            handler = await QueueHandler.create(
                process.env["RPC_URL"] ?? "http://127.0.0.1:5050",
                process.env["TORII_URL"] ?? "http://127.0.0.1:8080",
                process.env["WORLD_ADDRESS"] ?? "0x0",
                process.env["ACCOUNT_ADDRESS"] ?? "0x003c4dd268780ef738920c801edc3a75b6337bc17558c74795b530c0ff502486",
                process.env["ACCOUNT_PK"] ?? "0x2bbf4f9fd0bbb2e60b0316c1fe0b76cf7a4d0198bd493ced9b8df2a3a24d68a",
                process.env["STORAGE_DIR"] ?? "./storage",
            )
            await loop(handler)
        } catch (err) {
            console.error("Failed to start QueueBot", err)
        }
    } else if (message.cmd === "stop") {
        running = false
    }
})

async function main() {
    handler = await QueueHandler.create(
        process.env["RPC_URL"] ?? "http://127.0.0.1:5050",
        process.env["TORII_URL"] ?? "http://127.0.0.1:8080",
        process.env["WORLD_ADDRESS"] ?? "0x0",
        process.env["ACCOUNT_ADDRESS"] ?? "0x003c4dd268780ef738920c801edc3a75b6337bc17558c74795b530c0ff502486",
        process.env["ACCOUNT_PK"] ?? "0x2bbf4f9fd0bbb2e60b0316c1fe0b76cf7a4d0198bd493ced9b8df2a3a24d68a",
        process.env["STORAGE_DIR"] ?? "./storage",
    )
    await loop(handler)
}

if (!process.send) main()
