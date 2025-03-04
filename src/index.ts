import http from "http"

import cors from "cors"
import express from "express"

import dotenv from "dotenv"
dotenv.config()

import { setupQueueHandler } from "./queueHandler.ts"
import { setupRoutes } from "./routes.ts"
import { setupTileCacher } from "./tileCacher.ts"
import { setupWebsockets } from "./websockets.ts"

const app = express()
const server = http.createServer(app)

app.use(cors()) // Use cors middleware

const port: number = Number.parseInt(process.env["SERVER_PORT"]) ?? 3000

setupRoutes(app)

// setupQueueHandler()

setupWebsockets(server).then((wss) => {
    setupTileCacher(wss)
})

server.listen(port, () => {
    console.log(`Webserver listening on port ${port}`)
})
