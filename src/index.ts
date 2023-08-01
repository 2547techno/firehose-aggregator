import { WebSocketServer } from "ws";
import amqplib from "amqplib/callback_api";
import { config } from "./lib/config";

const wss = new WebSocketServer({
    port: config.wss.port,
});
const QUEUE_NAME = config.amqp.messageQueueName;
const messages: string[] = [];
const sockets: WebSocket[] = [];

wss.on("listening", () => {
    console.log("[WSS] Listening");
});

wss.on("connection", (socket: WebSocket) => {
    console.log("[WSS] Socket Connected");
    sockets.push(socket);

    socket.addEventListener("close", () => {
        sockets.splice(sockets.indexOf(socket), 1);
        console.log("[WSS] Socket Disconnected");
    });
});

amqplib.connect(
    `amqp://${config.amqp.user}:${config.amqp.password}@${config.amqp.url}`,
    (err, conn: amqplib.Connection) => {
        if (err) throw err;
        console.log("[AMQP] Connected to server");

        conn.createChannel((err, channel: amqplib.Channel) => {
            if (err) throw err;
            console.log("[AMQP] Connected to queue", QUEUE_NAME);

            channel.assertQueue(QUEUE_NAME);

            channel.consume(QUEUE_NAME, (message) => {
                if (!message) return;

                messages.push(message.content.toString());
                channel.ack(message);
            });
        });
    }
);

setInterval(() => {
    const msgs = messages.splice(0);
    for (const socket of sockets) {
        socket.send(JSON.stringify(msgs));
    }
}, 500);
