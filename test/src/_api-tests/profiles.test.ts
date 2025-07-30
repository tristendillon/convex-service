import { describe, it, expect } from 'vitest'
import { profiles } from '../convex/schema'

describe('Profile Service API Tests', () => {
  it('should have correct table name', () => {
    expect(profiles.tableName).toBe('profiles')
  })

  it('should have correct indexes configuration', () => {
    const config = profiles.$config

    expect(Object.keys(config.indexes)).toHaveLength(1)
    expect(config.indexes).toContain('by_name')
  })

  it('should have correct search indexes configuration', () => {
    const config = profiles.$config

    expect(Object.keys(config.searchIndexes)).toHaveLength(1)
    expect(config.searchIndexes).toContain('by_bio')
  })

  it('should have no vector indexes', () => {
    const config = profiles.$config
    expect(Object.keys(config.vectorIndexes)).toHaveLength(0)
  })

  it('should have correct state configuration', () => {
    const config = profiles.$config

    expect(config.state.defaults).toEqual({})
    expect(config.state.uniques).toEqual([])
    expect(config.state.relations).toEqual({})
  })

  it('should have correct schema validation', () => {
    const validator = profiles.validator
    if (validator.kind !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${validator.kind}'`
      )
    }
    const fields = validator.fields
    expect(fields.name.type).toBe('string')
    expect(fields.age.type).toBe('number')
    expect(fields.bio.type).toBe('string')
    expect(fields.avatar.type).toBe('string')
  })

  it('should validate required fields in schema', () => {
    const validator = profiles.validator
    if (validator.kind !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${validator.kind}'`
      )
    }
    const fields = validator.fields

    expect(fields.name.type).toBe('string')
    expect(fields.age.type).toBe('number')
    expect(fields.bio.isOptional).toBe(true)
    expect(fields.avatar.isOptional).toBe(true)
  })
})
