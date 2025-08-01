import { describe, it, expect } from 'vitest'
import { tags } from '../convex/schema'

describe('Tag Service API Tests', () => {
  it('should have correct table name', () => {
    expect(tags.tableName).toBe('tags')
  })

  it('should have correct indexes configuration', () => {
    const config = tags.$config

    expect(Object.keys(config.indexes)).toHaveLength(2)

    expect(config.indexes).toHaveProperty('by_name')
    expect(config.indexes).toHaveProperty('by_usage_count')
  })

  it('should have correct unique constraints configuration', () => {
    const config = tags.$config

    expect(config.state.uniques).toHaveProperty('by_name')
    expect(config.state.uniques.by_name.fields).toBe('name')
  })

  it('should have correct default values configuration', () => {
    const config = tags.$config

    expect(config.state.defaults.usage_count).toBe(0)
  })

  it('should have no relations', () => {
    const config = tags.$config
    expect(config.state.relations).toEqual({})
  })

  it('should have no search indexes', () => {
    const config = tags.$config
    expect(Object.keys(config.searchIndexes)).toHaveLength(0)
  })

  it('should have no vector indexes', () => {
    const config = tags.$config
    expect(Object.keys(config.vectorIndexes)).toHaveLength(0)
  })

  it('should have correct schema field types', () => {
    const validator = tags.$validatorJSON
    if (validator.type !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${validator.type}'`
      )
    }
    const fields = validator.value

    expect(fields.name.fieldType.type).toBe('string')
    expect(fields.color.optional).toBe(true)
    expect(fields.usage_count.fieldType.type).toBe('number')
  })

  it('should have validation enabled', () => {
    const config = tags.$config
    expect(config.state.validate).toBeDefined()
  })
})
