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

async function consumeEvent(routingKey, callback) {
  if (!channel) {
    await connectToRabbitMQ();
  }

  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

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

module.exports = { connectToRabbitMQ, consumeEvent };
