import express from 'express'
import mongoose from 'mongoose'
import {OutboxRecordModel} from '../models/outbox-record'
import {TodoDocument, TodoModel} from '../models/todo'

interface PublishingModel {
  description: string
  status: boolean
  created_on: number
}

const mapToPublishingModel = (todo: TodoDocument): PublishingModel => ({
  description: todo.description,
  status: todo.status,
  created_on: todo.created_at.getTime(),
})

const router = express.Router()
router.post('/todos', async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()
  console.log(' - initiated transaction...')
  try {
    const todo = TodoModel.of(req.body)
    const outboxRecord = OutboxRecordModel.of({
      aggregate_id: todo._id,
      aggregate_type: 'todo',
      topic: 'todo.created',
      payload: mapToPublishingModel(todo),
    })

    await todo.save({session})
    await outboxRecord.save({session})
    await session.commitTransaction()
    console.log(' - committed transaction...')
    res.status(201).json(todo)
  } catch (error) {
    await session.abortTransaction()
    console.log(' - aborted transaction...')
    res.status(500).json({error: error.toString()})
  } finally {
    session.endSession()
  }
})

export {router as createTodoRoute}
