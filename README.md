## Config

`config.json`

```jsonc
{
    "wss": {
        "port": 3000 // websocket port to serve message stream
    },
    "amqp": {
        // rabbitmq creds
        "url": "localhost",
        "user": "user",
        "password": "password",
        "messageQueueName": "firehose-message" // queue name to receive messages from
    }
}
```
