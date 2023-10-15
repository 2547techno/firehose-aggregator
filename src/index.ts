import { WebSocketServer } from "ws";
import amqplib from "amqplib/callback_api";
import { config } from "./lib/config";
import { sendDemoMessage } from "./demo";
import { db } from "./lib/db";

const wss = new WebSocketServer({
    port: config.wss.port,
});
const QUEUE_NAME = config.amqp.messageQueueName;
const messages: string[] = [];
const authenticatedSockets: WebSocket[] = [];

wss.on("listening", () => {
    console.log("[WSS] Listening");
});

wss.on("connection", (socket: WebSocket) => {
    console.log("[WSS] Socket Connected");

    // if not authenticated after timeout, close socket
    const authTimeout = setTimeout(() => {
        socket.close();
    }, config.wss.authTimeout);

    socket.addEventListener("close", () => {
        authenticatedSockets.splice(authenticatedSockets.indexOf(socket), 1);
        console.log("[WSS] Socket Disconnected");
    });

    socket.addEventListener("message", async (event: MessageEvent<string>) => {
        // ignore messages from authed sockets
        // only message listening for is auth message
        if (authenticatedSockets.includes(socket)) {
            return;
        }

        let message: {
            [key: string]: any;
        } = {};
        try {
            message = JSON.parse(event.data);
        } catch (err) {
            console.log(err);
            return;
        }

        // no auth field
        if (!message.auth) {
            return;
        }

        try {
            const rows: any[] = await db.pool.query(
                `SELECT * FROM ${config.db.database}.API_KEYS WHERE \`key\` = ?`,
                message.auth
            );
            if (rows.length <= 0) {
                return socket.send(
                    JSON.stringify({
                        error: "invalid key",
                    })
                );
            }
        } catch (err) {
            console.log(err);
            return;
        }

        clearTimeout(authTimeout);
        authenticatedSockets.push(socket);
        socket.send(
            JSON.stringify({
                success: "authenticated socket",
            })
        );
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
    if (msgs.length == 0) return;

    for (const socket of authenticatedSockets) {
        socket.send(JSON.stringify(msgs));
    }

    sendDemoMessage(msgs);
}, 500);
