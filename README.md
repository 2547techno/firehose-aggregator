![diagram](https://github.com/2547techno/firehose-node/assets/109011672/f5a4b51d-86ac-42e6-9ca0-a5ad460805f4)

## Config

`config.json`

```jsonc
{
    "demoWss": {
        "port": 2999 // websocket port to server demo stream
    },
    "wss": {
        "port": 3000, // websocket port to serve message stream
        "authTimeout": 10000 // how long sockets and be unauthenticated before being closed
    },
    "amqp": {
        // rabbitmq creds
        "url": "localhost",
        "user": "user",
        "password": "password",
        "messageQueueName": "firehose-message" // queue name to receive messages from
    },
    "db": {
        // db creds
        "host": "127.0.0.1",
        "user": "user",
        "password": "password",
        "database": "DB_NAME"
    }
}
```
