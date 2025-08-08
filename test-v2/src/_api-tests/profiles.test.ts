import { describe, it, expect } from 'vitest'
import { ServiceSchema } from '../convex/schema'

const profiles = ServiceSchema.services.profiles

describe('Profile Service API Tests', () => {
  it('should have correct table name', () => {
    expect(profiles.tableName).toBe('profiles')
  })

  it('should have correct indexes configuration', () => {
    const config = profiles.$config

    expect(Object.keys(config.indexes)).toHaveLength(1)
    expect(config.indexes).toHaveProperty('by_name')
  })

  it('should have correct search indexes configuration', () => {
    const config = profiles.$config

    expect(Object.keys(config.searchIndexes)).toHaveLength(1)
    expect(config.searchIndexes).toHaveProperty('by_bio')
  })

  it('should have no vector indexes', () => {
    const config = profiles.$config
    expect(Object.keys(config.vectorIndexes)).toHaveLength(0)
  })

  it('should have correct state configuration', () => {
    const config = profiles.$config

    expect(config.state.defaults).toEqual({})
    expect(config.state.uniques).toEqual({})
    expect(config.state.relations).toEqual({})
  })

  it('should have validation enabled', () => {
    const config = profiles.$config

    expect(config.state.validate).toBeDefined()
  })

  it('should validate required fields in schema', () => {
    const validator = profiles.$validatorJSON
    if (validator.type !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${validator.type}'`
      )
    }
    const fields = validator.value
    expect(fields.name.fieldType.type).toBe('string')
    expect(fields.age.fieldType.type).toBe('number')
    expect(fields.bio.fieldType.type).toBe('string')
    expect(fields.avatar.fieldType.type).toBe('string')
  })
})
