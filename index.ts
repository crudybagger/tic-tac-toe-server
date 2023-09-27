import { randomUUID } from "crypto";

type WebSocketData = {
    createdAt: number;
    channelId: string;
    userId: string;
};

const allChannels = new Map<string, any[]>();
const currentTurn = new Map<any, number>();
const nextTurn = (userId : string, sockets : any) => {
    // if(currentTurn.has(sockets)) {
    currentTurn.set(sockets, currentTurn.get(sockets) || 0 + 1);
    return sockets[currentTurn.get(sockets) || 0].data.userId === userId;
    // }
    // currentTurn.set(sockets, 0);
    // return 
};
// TypeScript: specify the type of `data`
Bun.serve<WebSocketData>({
fetch(req, server) {
    // console.log(JSON.stringify(allChannels));
    const url = new URL(req.url);
    let channelId = url.pathname.slice(url.pathname.search((/\/([0-9a-zA-Z])*$/)) + 1);
    server.upgrade(req, {
    // this object must conform to WebSocketData
    data: {
        createdAt: Date.now(),
        channelId,
        userId: randomUUID(),
    },
    });

    return new Response(JSON.stringify(allChannels));
},
websocket: {
    // handler called when a message is received
    async message(ws, message) {
        console.log(message);
        
        const {type, channelId, payload} = JSON.parse(message.toString());
        console.log(type);
        if(allChannels.has(channelId)) {
            allChannels.get(channelId)?.forEach(socket => {
                if(socket.data.userId === ws.data.userId) return;
                socket.send(JSON.stringify({
                    type,
                    payload : {...payload , isPlayerTurn : nextTurn(socket.data.userId, allChannels.get(channelId))}
                }));
            });
        }
    },
    open(ws) {
        if(allChannels.has(ws.data.channelId)) {
            console.log(ws.data.userId);
            allChannels.get(ws.data.channelId)?.push(ws);
        } else {
            allChannels.set(ws.data.channelId, [ws]);
        }
    },
    close(ws) {
        allChannels.set(ws.data.channelId, allChannels.get(ws.data.channelId)?.filter(user => user !== String(ws.data.userId)) || [""]);
        console.log(allChannels);
    },
},
});
