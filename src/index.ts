import express from 'express';
import {fork} from 'child_process';
import {Message} from "./QueueHandler";

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
const port: number = parseInt(process.env["SERVER_PORT"]) ?? 3000;


app.use('/', express.static(process.env["WEB_DIR"]));

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

queueHandler.send({cmd: 'start'});
