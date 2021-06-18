import {pipe} from 'ramda'
import express, {Router} from 'express'
import {Message as KMessage} from 'kafkajs'
import {OutboxRecordDocument, OutboxRecordModel} from '../models/outbox-record'

const log =
  <T>(message: string) =>
  (values: T) => {
    console.log(message, values)
    return values
  }

type TopicMessage = {recordId: string; message: KMessage}
type MapOfTopics = Map<string, TopicMessage[]>

const toMapByTopic = (
  acc: MapOfTopics,
  {_id, topic, aggregate_id, payload}: OutboxRecordDocument
): MapOfTopics =>
  acc.set(topic, [
    ...(acc.get(topic) ?? []),
    {
      recordId: _id,
      message: {
        key: aggregate_id,
        value: JSON.stringify(payload),
      },
    },
  ])

const outBoxRecordsToTopicsMap = (records: OutboxRecordDocument[]): MapOfTopics =>
  records.reduce<MapOfTopics>(toMapByTopic, new Map())

const mapToArray = <K, V>(map: Map<K, V>): [K, V][] => Array.from(map.entries())

function createClearOutboxRoute(
  publishMessages: (topic: string, messages: KMessage[]) => Promise<unknown>
): Router {
  async function publishAndClean(topic: string, topicMessages: TopicMessage[]) {
    const msgsToPublish = topicMessages.map(({message: {key, value}}): KMessage => ({key, value}))
    const idsToDelete = topicMessages.map(m => m.recordId)

    await publishMessages(topic, msgsToPublish)
    await OutboxRecordModel.deleteMany({
      _id: {$in: idsToDelete},
    })
  }

  const publishAndCleanMessages = (msgsByTopic: [string, TopicMessage[]][]): Promise<void>[] =>
    msgsByTopic.map(([topic, messages]) => publishAndClean(topic, messages))

  return express.Router().post('/outbox', (req, res) =>
    OutboxRecordModel.find()
      .limit(1000)
      .then(log('Found records to publish: '))
      .then(pipe(outBoxRecordsToTopicsMap, mapToArray, publishAndCleanMessages)) // List<OutboxRecords> -> Map { topic: List<Messages> } -> List<[topic, List<Messages>]> -> List<Promise>
      .then(Promise.allSettled) // Run non blocking in parallel
      .then(log('Records processed. Results: '))
      .then(() => res.status(200).json({result: 'ok'}))
      .catch(error => res.status(500).json({error: error.toString()}))
  )
}

export {createClearOutboxRoute}
