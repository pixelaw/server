import {PNG} from 'pngjs';
import fs from 'fs';

import {
    Contract,
    RpcProvider,
} from 'starknet';
import {SqliteDb} from "./db";
import {sleep} from '../utils/sleep';
import {getAddresses} from "../utils/getAddresses";
import {Message} from "../types";
import path from "path";


export const PIXEL_CHANGED_EVENT = "0x1a2f334228cee715f1f0f54053bb6b5eac54fa336e0bc1aacf7516decb0471d"

// TODO proper parameterization for this, and handle more scalefactors
const TILE_1_SIZE: number = parseInt(process.env["TILE_1_SIZE"] ?? "100")
const scaleFactor = 1


let handler: TileCacher
let running = true

const TILE_TEMPLATE_DIR = path.join(process.cwd(),"assets/tiles/")

class TileCacher {
    nodeUrl: string
    toriiUrl: string
    storageDir: string
    tileDir: string
    provider: RpcProvider
    coreAddress: string
    worldAddress: string
    coreContract: Contract
    db: SqliteDb

    constructor(
        nodeUrl: string,
        toriiUrl: string,
        storageDir: string,
        tileDir: string
    ) {
        this.nodeUrl = nodeUrl
        this.toriiUrl = toriiUrl
        this.storageDir = storageDir
        this.tileDir = tileDir
        this.db = new SqliteDb(`${storageDir}/TileCacher.sqlite`)
        this.provider = new RpcProvider({nodeUrl})
    }


    async getEvents() {

        await this.db.open()

        const lastProcessedBlocknumber = await this.db.getLastBlockNumber()
        const {block_number: lastBlocknumber} = await this.provider.getBlockLatestAccepted()

        if (lastProcessedBlocknumber == lastBlocknumber) return

        log(`getEvents: chainBlockNr: ${lastBlocknumber} lastProcessedBlocknr: ${lastProcessedBlocknumber}`)

        try {

            const eventsList = await this.provider.getEvents({
                address: this.worldAddress,
                from_block: {block_number: lastProcessedBlocknumber + 1},
                to_block: {block_number: lastBlocknumber},
                keys: [[PIXEL_CHANGED_EVENT]],
                chunk_size: 1000,
            });


            for (let {data} of eventsList.events) {

                // TODO doublecheck if this value indeed means "Pixel" model change
                if (data[0] != "0x506978656c") continue

                const x = parseInt(data[2], 16)
                const y = parseInt(data[3], 16)

                const color = data[8]

                console.log(x, y, color)

                // TODO determine the tile(s) to update
                // TODO For now we only do scaleFactor=1 tiles, later maybe also scalefactor=10, but that needs interpolation or something
                const tileX = x - (x % TILE_1_SIZE)
                const tileY = y - (y % TILE_1_SIZE)


                let png;
                const tileName = `${scaleFactor}_${TILE_1_SIZE}_${tileX}_${tileY}`
                const filePath = `${this.tileDir}/${tileName}.png`;

                if (fs.existsSync(filePath)) {
                    // Load the existing PNG
                    png = PNG.sync.read(fs.readFileSync(filePath));
                } else {
                    // Create a new PNG
                    fs.copyFileSync(`${TILE_TEMPLATE_DIR}/${scaleFactor}_${TILE_1_SIZE}_template.png`, filePath);
                    png = PNG.sync.read(fs.readFileSync(filePath));
                }

                // Extract color components from color string
                const colorInt = parseInt(color, 16);
                const r = (colorInt >> 24) & 255;
                const g = (colorInt >> 16) & 255;
                const b = (colorInt >> 8) & 255;
                const a = colorInt & 255;

                // Update the pixel at (x, y)
                const idx = (png.width * y + x) << 2;
                png.data[idx] = r;       // Red
                png.data[idx + 1] = g;   // Green
                png.data[idx + 2] = b;   // Blue
                png.data[idx + 3] = 255;   // Alpha TODO, now hardcoded to 255

                // Save the updated PNG
                fs.writeFileSync(filePath, PNG.sync.write(png));

                // Post a message to TileCacher websocket subscribers
                if (process.send) {
                    const message: Message = {
                        cmd: "tileUpdated",
                        data: JSON.stringify({tileCoord: [tileX, tileY], tileName})
                    };
                    process.send(message);
                } else {
                    console.log("notsending")
                }
            }

            // Mark the retrieved latest blocknumber as done
            await this.db.setLastBlockNumber(lastBlocknumber)

        } catch (e) {
            // TODO Handle this general error
            console.error(e)
            log(`getEvents failed: ${e.message}`)
        } finally {
            await this.db.close()
        }
    }

    static async create(
        nodeUrl: string,
        toriiUrl: string,
        storageDir: string,
        tilesDir: string
    ): Promise<TileCacher> {
        const handler = new TileCacher(nodeUrl, toriiUrl, storageDir, tilesDir);

        const {worldAddress, coreAddress} = await getAddresses(toriiUrl)
        handler.worldAddress = worldAddress
        handler.coreAddress = coreAddress

        const {abi: coreAbi} = await handler.provider.getClassAt(coreAddress);
        if (coreAbi === undefined) throw new Error('no abi.');

        handler.coreContract = new Contract(coreAbi, coreAddress, handler.provider);

        if (!fs.existsSync(tilesDir)) {
            fs.mkdirSync(tilesDir, { recursive: true });
        }

        const filePath = `${tilesDir}/${scaleFactor}_${TILE_1_SIZE}_template.png`;

        if (!fs.existsSync(filePath)) {
            generateTemplateTile(TILE_1_SIZE, `${tilesDir}/${scaleFactor}_${TILE_1_SIZE}_template.png`);
        }

        return handler
    }

}

function generateTemplateTile(tileSize: number, filePath: string) {
    const png = new PNG({width: tileSize, height: tileSize, fill: true});

    // Fill the PNG with black color and full alpha
    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
            const idx = (png.width * y + x) << 2;
            png.data[idx] = 0;     // Red
            png.data[idx + 1] = 0;   // Green
            png.data[idx + 2] = 0;   // Blue
            png.data[idx + 3] = 0; // Alpha
        }
    }

    // Write the PNG to disk
    fs.writeFileSync(filePath, PNG.sync.write(png));
}


async function loop(handler: TileCacher) {
    while (running) {
        try {
            await handler.getEvents()
        } catch (e) {
            log(`TileCacher failed: ${e.message}`)
        }
        await sleep(1000)
    }
}

function log(message: string) {
    if (process.send) {
        process.send({cmd: 'message', data: message});

    } else {
        console.log(message)
    }
}


process.on('message', async (message: Message) => {
    if (message.cmd === 'start') {
        running = true;
        try {
            const nodeUrl = process.env["STARKNET_RPC"] ?? "http://127.0.0.1:5050"
            const toriiUrl = process.env["TORII_URL"] ?? "http://127.0.0.1:8080"
            const storageDir = process.env["STORAGE_DIR"] ?? './storage'
            const tilesDir = process.env["TILES_DIR"] ?? `${storageDir}/tiles`

            handler = await TileCacher.create(nodeUrl, toriiUrl, storageDir, tilesDir)
            await loop(handler);

        } catch (err) {
            console.error('Failed to start QueueBot', err);
        }
    } else if (message.cmd === 'stop') {
        running = false;
    }
});


async function main() {
    handler = await TileCacher.create(
        process.env["STARKNET_RPC"] ?? "http://127.0.0.1:5050",
        process.env["TORII_URL"] ?? "http://127.0.0.1:8080",
        process.env["STORAGE_DIR"] ?? './storage',
        process.env["TILES_DIR"] ?? './storage',
    )
    await loop(handler)
}

if (!process.send) main()