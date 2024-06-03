
import WebSocket from 'ws';
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

    wss.on('connection', (ws) => {
        // Add boundingBox property to ws
        ws["boundingBox"] = null;

        // Handle messages from clients
        ws.on('message', (message) => {
            if(isValidJson(message)){
                const data = JSON.parse(message.toString());
                if (data.cmd === 'subscribe' && data.boundingBox) {
                    ws["boundingBox"] = data.boundingBox;
                }
            }else{
                console.log("Received non-json", message)
            }

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