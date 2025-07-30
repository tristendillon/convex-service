import { describe, it, expect } from 'vitest'
import { tags } from '../convex/schema'

describe('Tag Service API Tests', () => {
  it('should have correct table name', () => {
    expect(tags.tableName).toBe('tags')
  })

  it('should have correct indexes configuration', () => {
    const config = tags.$config

    expect(Object.keys(config.indexes)).toHaveLength(2)

    expect(config.indexes).toContain('by_name')
    expect(config.indexes).toContain('by_usage_count')
  })

  it('should have correct unique constraints configuration', () => {
    const config = tags.$config

    expect(config.state.uniques).toHaveLength(1)
    expect(config.state.uniques[0].fields).toBe('name')
  })

  it('should have correct default values configuration', () => {
    const config = tags.$config

    expect(config.state.defaults).toEqual({
      usage_count: 0,
    })
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
    const validator = tags.validator
    if (validator.kind !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${validator.kind}'`
      )
    }
    const fields = validator.fields

    expect(fields.name.type).toBe('string')
    expect(fields.color.isOptional).toBe(true)
    expect(fields.usage_count.type).toBe('number')
  })

  it('should have no validation enabled by default', () => {
    const config = tags.$config
    expect(config.state.validate).toEqual({})
  })
})
