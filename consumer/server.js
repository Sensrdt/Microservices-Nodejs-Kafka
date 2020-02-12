"use strict";

const kafka = require('kafka-node');
const util = require('util');
const express = require('express');
const mongoose = require('mongoose');

const bodyParser = require('body-parser');
const app = express();

const postModel = require('./postModel');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

try {
  console.log("kafka consumer is booting up")
  const Consumer = kafka.Consumer;
  const Producer = kafka.Producer;
  const client = new kafka.KafkaClient('localhost:2181');
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
  const kt = 'feed-service';


  consumer.on('message', async function (message) {
    const consumerdata = JSON.parse(message.value);

    console.log("===>", consumerdata);

    if (consumerdata.type === 'DELETE_USER_POST') {
      console.log(typeof (consumerdata.data));

      const deleteStatus = await postModel.deletePosts(consumerdata.data);
      console.log("deleteStatus", deleteStatus);
      console.log("Post Deleted Successfully");
    } else if (consumerdata.type === 'INSERT_USER') {
      console.log(typeof (consumerdata.data));

      const insert = await postModel.insertPosts(consumerdata.data);
      console.log("insertStatus", insert);
    }
  });
  consumer.on('error', function (err) {
    console.log('error', err);
  });

  // producer

  producer.on('ready', async function () {

    console.log('Kafka Producer is Ready');
  })

  producer.on('error', function (err) {
    console.log(err);
    console.log('[kafka-producer -> ' + kt + ']: connection errored');
    throw err;
  });

  mongoose.connect('mongodb://localhost:27017/node_consumer', { useNewUrlParser: true }).then((err, res) => {

    console.log("mongodb is connected successfuly");

    require('./routes')(app, producer, kt);

  })
    .catch(err => {
      console.log("Error => ", err);
    })


}
catch (e) {
  console.log(e);
}


app.listen(4568, () => {
  console.log("Server is listening to port 4568");
})