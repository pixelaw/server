import http from "http"

import cors from "cors"
import express from "express"

import dotenv from "dotenv"
dotenv.config()

import { setupQueueHandler } from "./queueHandler"
import { setupRoutes } from "./routes"
import { setupTileCacher } from "./tileCacher"
import { setupWebsockets } from "./websockets"

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
