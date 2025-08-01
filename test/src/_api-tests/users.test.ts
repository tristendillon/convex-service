import { describe, it, expect } from 'vitest'
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
    const config = users.$config

    expect(config.state.uniques.by_username.fields).toEqual('username')
    expect(config.state.uniques.by_email.fields).toEqual('email')
    expect(config.state.uniques.by_email_username.fields).toEqual([
      'email',
      'username',
    ])
    expect(config.state.uniques.by_email_username.onConflict).toBe('replace')
  })

  it('should have correct default values configuration', () => {
    const config = users.$config

    expect(config.state.defaults.age).toBe(18)
    expect(config.state.defaults.isActive).toBe(true)
  })

  it('should have correct relations configuration', () => {
    const config = users.$config

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
