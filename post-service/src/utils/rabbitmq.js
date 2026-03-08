const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";

async function connectToRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    logger.info("Connected to RabbitMQ!");

    return channel;
  } catch (error) {
    logger.error("Error connecting to RabbitMQ", error);
  }
}

// function to publish events to the exchange with a specific routing key
// routing key can be something like "post.created", "post.updated", "post.deleted" etc.
// eventData is the data related to the event, which will be sent as a message to the queue
// this function can be called from the controllers whenever an event occurs that we want to publish to other services
async function publishEvent(routingKey, eventData) {
  if (!channel) {
    await connectToRabbitMQ();
  }

  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(eventData)),
  );
  logger.info(`Event published to RabbitMQ with routing key: ${routingKey}`);
}

module.exports = { connectToRabbitMQ, publishEvent };

// Note: In a production application, you would want to handle connection errors and reconnection logic more robustly. You might also want to consider using a library like "amqp-connection-manager" which provides automatic reconnection and other features out of the box.
