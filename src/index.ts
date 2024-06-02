import express from 'express';
import {fork} from 'child_process';
import {Message} from "./QueueHandler";
import cors from 'cors'; // Import cors

const fse = require('fs-extra');
const path = require('path');

import dotenv from 'dotenv';

dotenv.config();

const options = {
    execArgv: [
        '-r', 'ts-node/register',
        // '--inspect-brk=9230'
    ]
};

const queueHandler = fork('./src/QueueHandler/index.ts', [], options);


const app = express();
app.use(cors()); // Use cors middleware

const port: number = parseInt(process.env["SERVER_PORT"]) ?? 3000;
const EMPTY_PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a4944415408d76360000000020001e221bc330000000049454e44ae426082', 'hex');


app.use('/', express.static(process.env["WEB_DIR"]));

app.get('/tiles/:filename.png', async (req, res) => {
    
    const filePath = path.join(process.cwd(), '/assets/tiles/', req.params.filename + '.png');

    try {
        const exists = await fse.pathExists(filePath);
        if (exists) {
            res.sendFile(filePath);
        } else {
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': EMPTY_PNG.length
            });
            res.end(EMPTY_PNG);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});



app.listen(port, () => {
    console.log(`Webserver listening on port ${port}`);
});

// Start QueueHandler
queueHandler.on('message', (message: Message) => {
    console.log('QueueHandler: ', message.data);
});

queueHandler.on('error', (error) => {
    console.error('QueueHandler Error: ', error);
});

// queueHandler.send({cmd: 'start'});
