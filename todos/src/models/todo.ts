import mongoose, {Schema, Document, Model} from 'mongoose'

interface Todo {
  description: string
  status: boolean
  created_at: Date
}

const TodoSchemaFields: Record<keyof Todo, any> = {
  description: {type: String, required: true},
  status: {type: Boolean, default: false},
  created_at: {type: Date, default: Date.now},
}

const TodoSchema = new Schema(TodoSchemaFields, {versionKey: false})
interface TodoCreationAttr {
  description: string
}
TodoSchema.static('of', function (args: TodoCreationAttr) {
  return new TodoModel({description: args.description})
})

interface TodoDocument extends Todo, Document {}
interface TodoModelType extends Model<TodoDocument> {
  of: (args: TodoCreationAttr) => TodoDocument
}

const TodoModel = mongoose.model<TodoDocument, TodoModelType>('Todo', TodoSchema)

export {Todo, TodoModel, TodoDocument}
