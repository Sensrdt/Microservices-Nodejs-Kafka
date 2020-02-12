
const postModel = require('./postModel');

module.exports = (app, producer, kafka_topic) => {

    app.get('/post/:postId', async (req, res) => {

        try {
            const postId = req.params.postId;

            const postCollection = await postModel.getPostById(postId);

            res.status(200).send({
                success: true,
                data: postCollection,
                error: null
            })

        }
        catch (e) {
            console.log(e);

            res.status(500).send({
                success: false,
                data: null,
                error: e
            })

        }

    })

    app.post('/insertpost', async (req, res) => {

        try {
            console.log("post", req.body);
            const post = {
                title: req.body.title,
                bodyMessage: req.body.bodyMessage,
                userId: req.body.userId
            }


            const postCollection = await postModel.insertPost(post);
            if (postCollection) {
                let payload = [{
                    topic: kafka_topic,
                    messages: JSON.stringify({
                        type: "INSERT_POST",
                        data: postCollection._id
                    })
                }]

                producer.send(payload, (err, data) => {
                    if (err) {
                        console.log('[kafka-producer -> ' + kafka_topic + ']: broker update failed')
                    }

                    console.log('[kafka-producer -> ' + kafka_topic + ']: broker update success');
                })

                res.status(200).send({
                    success: true,
                    data: "INSERTED POST Successfully",
                    error: null
                })

            } else {
                res.status(200).send({
                    success: true,
                    data: postCollection,
                    error: null
                })
            }

        }
        catch (e) {
            console.log(e);

            res.status(500).send({
                success: false,
                data: null,
                error: e
            })

        }

    })


}