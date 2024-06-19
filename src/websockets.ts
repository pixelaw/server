
import WebSocket from 'ws';
import {Bounds} from "./types";
export interface CustomClient extends WebSocket {
    boundingBox: Bounds;
}

function isValidJson(str: string): boolean {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
export async function setupWebsockets(server) {

    const wss = new WebSocket.Server({noServer: true});

    wss.on('connection', (ws: CustomClient) => {
        console.log("connection")
        // Add boundingBox property to ws
        ws.boundingBox = null;

        // Handle messages from clients
        ws.on('message', (message) => {
            console.log("message")
            if(isValidJson(message.toString())){
                const msg = JSON.parse(message.toString());
                if (msg.cmd === 'subscribe' && msg.data.hasOwnProperty("boundingBox")) {
                    ws.boundingBox = msg.data.boundingBox;
                    console.log("We got a subscriber!", msg.data.boundingBox)
                }else{
                    console.log("some other stuff", msg)
                }
            }else{
                console.log("Received non-json", message)
            }

        });
        ws.on('error', (err) => {
            console.error('WebSocket error:', err);
        });
    });

    server.on('upgrade', (request, socket, head) => {
        if (request.url === '/tiles') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    return wss
}