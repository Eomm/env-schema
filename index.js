'use strict'

const Ajv = require('ajv')
const ajv = new Ajv({ removeAdditional: true, useDefaults: true, coerceTypes: true })

const optsSchema = {
  type: 'object',
  required: [ 'schema' ],
  properties: {
    schema: { type: 'object', additionalProperties: true },
    data: {
      oneOf: [
        { type: 'array', items: { type: 'object' }, minItems: 1 },
        { type: 'object' }
      ],
      default: {}
    },
    env: { type: 'boolean', default: true },
    dotenv: { type: ['boolean', 'object'], default: false }
  }
}
const optsSchemaValidator = ajv.compile(optsSchema)

function loadAndValidateEnvironment (opts) {
  const isOptionValid = optsSchemaValidator(opts)
  if (!isOptionValid) {
    const error = new Error(optsSchemaValidator.errors.map(e => e.message))
    error.errors = optsSchemaValidator.errors
    throw error
  }

  const schema = opts.schema
  schema.additionalProperties = false

  let data = opts.data
  if (!Array.isArray(opts.data)) {
    data = [data]
  }

  if (opts.dotenv) {
    require('dotenv').config(Object.assign({}, opts.dotenv))
  }

  if (opts.env) {
    data.unshift(process.env)
  }

  const merge = {}
  data.forEach(d => Object.assign(merge, d))

  const valid = ajv.validate(schema, merge)
  if (!valid) {
    const error = new Error(ajv.errors.map(e => e.message).join('\n'))
    error.errors = ajv.errors
    throw error
  }

  return merge
}

module.exports = loadAndValidateEnvironment
