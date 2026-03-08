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

// function to consume events from the exchange with a specific routing key
// this function can be used by other services to listen for events published by this service or other services
async function consumeEvent(routingKey, callback) {
  if (!channel) {
    await connectToRabbitMQ();
  }

  // create a temporary queue and bind it to the exchange with the specified routing key
  // and bind the queue to the exchange with the routing key, so that we can receive messages that match the routing key
  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

  // consume messages from the queue and call the callback function with the event data whenever a message is received that matches the routing key
  channel.consume(q.queue, (msg) => {
    if (msg !== null) {
      const eventData = JSON.parse(msg.content.toString());
      logger.info(
        `Event received from RabbitMQ with routing key: ${routingKey}`,
      );
      callback(eventData);
      channel.ack(msg);
    }
  });
}

module.exports = { connectToRabbitMQ, publishEvent, consumeEvent };
