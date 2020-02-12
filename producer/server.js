const kafka = require('kafka-node');
const bodyParser = require('body-parser');
const userModel = require('./userModel');
const express = require('express');
const mongoose = require('mongoose');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
try {

    /**
     * Kafka Producer Configuration
     */
    const Producer = kafka.Producer;
    const Consumer = kafka.Consumer;
    const client = new kafka.KafkaClient('localhost:2181')
    const producer = new Producer(client);
    let consumer = new Consumer(
        client,
        [{ topic: 'feed-service', partition: 0 }],
        {
            autoCommit: true,
            fetchMaxWaitMs: 1000,
            fetchMaxBytes: 1024 * 1024,
            encoding: 'utf8',
            fromOffset: false
        }
    );

    // for producer
    const kafka_topic = 'feed-service';

    producer.on('ready', async function () {

        console.log('Kafka Producer is Ready');
    })

    producer.on('error', function (err) {
        console.log(err);
        console.log('[kafka-producer -> ' + kafka_topic + ']: connection errored');
        throw err;
    });

    // Consumer
    consumer.on('message', async function (message) {
        const consumerdata = JSON.parse(message.value);

        console.log("===>", consumerdata);

        if (consumerdata.type === 'INSERT_POST') {
            console.log(typeof (consumerdata.data));
            console.log("Post Inserted Successfully");
        }
    });
    consumer.on('error', function (err) {
        console.log('error', err);
    });

    mongoose.connect(`mongodb://localhost:27017/nodekafka`, { useNewUrlParser: true }).then((err, res) => {

        console.log('MongoDB connected successfully');

        require('./routes')(app, producer, kafka_topic);

    })



}
catch (e) {

    console.log(e);
}


app.listen(4567, () => {
    console.log('app is listening to port 4567')
})



