
import WebSocket from 'ws';

export async function setupWebsockets(server) {

    const wss = new WebSocket.Server({noServer: true});

    wss.on('connection', (ws) => {
        // Add boundingBox property to ws
        ws["boundingBox"] = null;

        // Handle messages from clients
        ws.on('message', (message) => {
            const data = JSON.parse(message.toString());
            if (data.cmd === 'subscribe' && data.boundingBox) {
                ws["boundingBox"] = data.boundingBox;
            }
        });
    });

    server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    })
    return wss
}