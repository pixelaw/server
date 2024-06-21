import {fork} from "child_process";
import {FORK_OPTIONS, Message} from "./types";

export async function setupQueueHandler() {

    const queueHandler = fork('./src/QueueHandler/index.ts', [], FORK_OPTIONS);

    queueHandler.on('message', (message: Message) => {
        // console.log('QueueHandler: ', message.data);
    })

    queueHandler.on('error', (error) => {
        console.error('QueueHandler Error: ', error);
    })

    queueHandler.send({cmd: 'start'});


}