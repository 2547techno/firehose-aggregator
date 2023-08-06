import { WebSocketServer } from "ws";
import { config } from "./lib/config";
import { parse } from "irc-message-ts";

const demoSockets: WebSocket[] = [];

const demoWss = new WebSocketServer({
    port: config.demoWss.port,
});

demoWss.on("listening", () => {
    console.log("[DEMO WSS] Listening");
});

demoWss.on("connection", (socket: WebSocket) => {
    console.log("[DEMO WSS] Socket Connected");
    demoSockets.push(socket);

    socket.addEventListener("close", () => {
        demoSockets.splice(demoSockets.indexOf(socket), 1);
        console.log("[DEMO WSS] Socket Disconnected");
    });
});

export function sendDemoMessage(msgs: string[]) {
    const randomMsgRaw = msgs[Math.floor(Math.random() * msgs.length)];
    const randomMessage = parse(randomMsgRaw);
    if (!randomMessage) return;

    const minimalMessage: any = {
        emotes: randomMessage.tags.emotes,
        message: randomMessage.trailing,
        channel: randomMessage.param.slice(1),
        from: randomMessage.tags["display-name"],
    };

    for (const socket of demoSockets) {
        socket.send(JSON.stringify(minimalMessage));
    }

    // "message": "\u0001ACTION TierraDelFuego2 lost 1000 points in roulette and now has 536483 points! xqcSmash\u0001",
}
