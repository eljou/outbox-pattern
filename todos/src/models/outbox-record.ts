import mongoose, {Schema, Document, Model} from 'mongoose'

interface OutboxRecord {
  aggregate_id: string
  aggregate_type: string
  topic: string
  payload: object
  created_at: Date
}

const OutboxRecordSchemaFields: Record<keyof OutboxRecord, any> = {
  aggregate_id: {type: String, required: true, unique: true, index: true},
  aggregate_type: {type: String, required: true},
  topic: {type: String, required: true},
  payload: {type: Object, default: {}},
  created_at: {type: Date, default: Date.now},
}

const OutboxRecordSchema = new Schema(OutboxRecordSchemaFields, {
  versionKey: false,
})

interface OutboxRecordCreationAttr {
  aggregate_id: string
  aggregate_type: string
  topic: string
  payload: object
}
OutboxRecordSchema.static('of', function (args: OutboxRecordCreationAttr) {
  return new OutboxRecordModel({...args})
})

interface OutboxRecordDocument extends OutboxRecord, Document {}
interface OutboxRecordModelType extends Model<OutboxRecordDocument> {
  of: (args: OutboxRecordCreationAttr) => OutboxRecordDocument
}

const OutboxRecordModel = mongoose.model<OutboxRecordDocument, OutboxRecordModelType>('Outbox', OutboxRecordSchema)

export {OutboxRecord, OutboxRecordModel, OutboxRecordDocument}
