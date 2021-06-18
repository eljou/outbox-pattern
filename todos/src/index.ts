import {config} from 'dotenv'
config({path: './env/.vars'})

import express from 'express'
import mongoose from 'mongoose'
import {Kafka, Message} from 'kafkajs'

import {loadConfig} from './config/client'
import {createTodoRoute} from './routes/create-todo'
import {createClearOutboxRoute} from './routes/clear-outbox'
const configParams = loadConfig()

const kafka = new Kafka({
  clientId: 'todos-app',
  brokers: configParams.KAFKA_MESSAGE_BROKERS,
})
const producer = kafka.producer()

async function sendMessages(topic: string, messages: Message[]) {
  await producer.connect()
  await producer.send({
    topic,
    messages,
    timeout: configParams.KAFKA_PUB_TIMEOUT,
  })
  console.log(messages.length, 'messages published')
  await producer.disconnect()
}

const app = express()
app.use(express.json())

app.get('/ping', (_, res) => res.send('pong'))

app.use(createTodoRoute)
app.use(createClearOutboxRoute(sendMessages))

const main = async () => {
  try {
    await mongoose.connect(configParams.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })
    console.log('Connected to db...')

    app.listen(configParams.PORT, () => {
      console.log('App started')
      console.log(`Listening on ${configParams.PORT}.`)
    })
  } catch (error) {
    console.error(error)
  }
}

main()
