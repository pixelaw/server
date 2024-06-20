import http from 'http';

import express from 'express';
import cors from 'cors';

import dotenv from 'dotenv';
dotenv.config();

import {setupTileCacher} from "./tileCacher";
import {setupQueueHandler} from "./queueHandler";
import {setupWebsockets} from "./websockets";
import {setupRoutes} from "./routes";


const app = express();
const server = http.createServer(app);

app.use(cors()); // Use cors middleware

const port: number = parseInt(process.env["SERVER_PORT"]) ?? 3000;

setupRoutes(app)

setupQueueHandler()

setupWebsockets(server).then(wss => {
    setupTileCacher(wss);
});

server.listen(port, () => {
    console.log(`Webserver listening on port ${port}`);
});