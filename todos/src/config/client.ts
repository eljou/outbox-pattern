import Joi from 'joi'

interface ConfigInfo {
  NODE_ENV: string
  PORT: number
  DB_URI: string
  KAFKA_MESSAGE_BROKERS: string[]
  KAFKA_PUB_TIMEOUT: number
}

function loadConfig() {
  const configSchema = Joi.object<ConfigInfo>({
    NODE_ENV: Joi.string().valid('development', 'production').required(),
    PORT: Joi.number().required(),
    DB_URI: Joi.string().uri().required(),
    KAFKA_MESSAGE_BROKERS: Joi.string().required(),
    KAFKA_PUB_TIMEOUT: Joi.number().required(),
  })

  const {error, value} = configSchema.validate(process.env, {
    allowUnknown: true,
  })
  console.log('Environment variables loaded...')
  if (error) throw error
  return {
    ...value,
    KAFKA_MESSAGE_BROKERS: value.KAFKA_MESSAGE_BROKERS.split(','),
  } as ConfigInfo
}

export {loadConfig}
