import { describe, it, expect } from 'vitest'
import { UserService, users } from '../convex/schema'

describe('User Service API Tests', () => {
  it('should have correct table name', () => {
    expect(users.tableName).toBe('users')
  })

  it('should have correct indexes configuration', () => {
    UserService.export()
    console.log(users)
    const config = users.$config

    console.log(config.indexes)
    expect(Object.keys(config.indexes)).toHaveLength(5)
    expect(config.indexes).toContain('by_username')
    expect(config.indexes).toContain('by_email')
    expect(config.indexes).toContain('by_profileId')
    expect(config.indexes).toContain('by_email')
    expect(config.indexes).toContain('by_age')
    expect(config.indexes).toContain('by_active_age')
  })

  it('should have correct unique constraints configuration', () => {
    const config = users.$config

    expect(config.state.uniques).toHaveLength(2)
    expect(config.state.uniques[0].fields).toBe('username')
    expect(config.state.uniques[1].fields).toBe('email')
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
    expect(config.searchIndexes).toContain('by_name_username')
    expect(config.searchIndexes).toContain('by_name_username')
  })

  it('should have no vector indexes', () => {
    const config = users.$config
    expect(Object.keys(config.vectorIndexes)).toHaveLength(0)
  })

  it('should have validation enabled', () => {
    const config = users.$config
    expect(config.state.validate).toBeDefined()
    expect(config.state.validate.schema).toBeDefined()
  })

  it('should have correct schema field types', () => {
    const validator = users.validator
    const fields = validator.fields

    expect(fields.username.type).toBe('string')
    expect(fields.name.type).toBe('string')
    expect(fields.email.type).toBe('string')
    expect(fields.age.type).toBe('number')
    expect(fields.isActive.type).toBe('boolean')
    expect(fields.profileId.type).toBe('id')
    expect(fields.metadata.isOptional).toBe(true)
  })
})
