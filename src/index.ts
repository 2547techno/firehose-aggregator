import { WebSocketServer } from "ws";
import EventEmitter from "events";
import amqplib from "amqplib/callback_api";
import { config } from "./lib/config";

const wss = new WebSocketServer({
    port: config.wss.port,
});
const messageEvent = new EventEmitter();
const QUEUE_NAME = "firehose-message";
const messages: string[] = [];

wss.on("listening", () => {
    console.log("[WSS] Listening");
});

wss.on("connection", (socket: WebSocket) => {
    console.log("[WSS] Socket Connected");
    messageEvent.on("messages", (messages: string[]) => {
        socket.send(JSON.stringify(messages));
    });

    socket.addEventListener("close", () => {
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
    messageEvent.emit("messages", messages.splice(0));
}, 500);
