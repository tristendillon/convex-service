import { describe, it, expect } from 'vitest'
import { users } from '../convex/schema'
import { users } from '../convex/schema'

describe('User Service API Tests', () => {
  it('should have correct table name', () => {
    expect(users.tableName).toBe('users')
  })

  it('should have correct indexes configuration', () => {
    const config = users.$config

    expect(Object.keys(config.indexes)).toHaveLength(6)
    expect(config.indexes).toHaveProperty('by_username')
    expect(config.indexes).toHaveProperty('by_email')
    expect(config.indexes).toHaveProperty('by_email_username')
    expect(config.indexes).toHaveProperty('by_profileId')
    expect(config.indexes).toHaveProperty('by_age')
    expect(config.indexes).toHaveProperty('by_active_age')
  })

  it('should have correct unique constraints configuration', () => {
    const state = users.$config.state

    expect(state.uniques).toHaveLength(3)
    expect(state.uniques[0].fields).toBe('username')
    expect(state.uniques[1].fields).toBe('email')
  })

  it('should have correct default values configuration', () => {
    const config = users.$config

    expect(config.state.defaults).toEqual({
      age: 18,
      isActive: true,
    })
  })

  it('should have correct relations configuration', () => {
    const config = users.$config

    expect(config.state.relations).toHaveProperty('profileId')
    expect(config.state.relations.profileId).toEqual({
      path: 'profileId',
      table: 'profiles',
      onDelete: 'cascade',
    })
  })

  it('should have correct search indexes configuration', () => {
    const config = users.$config

    expect(Object.keys(config.searchIndexes)).toHaveLength(1)
    expect(config.searchIndexes).toHaveProperty('by_name_username')
  })

  it('should have no vector indexes', () => {
    const config = users.$config
    expect(Object.keys(config.vectorIndexes)).toHaveLength(0)
  })

  it('should have validation enabled', () => {
    const config = users.$config
    expect(config.state.validate).toBeDefined()
  })

  it('should have correct schema field types', () => {
    const validator = users.$validatorJSON
    if (validator.type !== 'object') {
      throw new Error('Validator is not an object')
    }
    const fields = validator.value

    expect(fields.username.fieldType.type).toBe('string')
    expect(fields.name.fieldType.type).toBe('string')
    expect(fields.email.fieldType.type).toBe('string')
    expect(fields.age.fieldType.type).toBe('number')
    expect(fields.isActive.fieldType.type).toBe('boolean')
    expect(fields.profileId.fieldType.type).toBe('id')
    expect(fields.metadata.optional).toBe(true)
  })
})
