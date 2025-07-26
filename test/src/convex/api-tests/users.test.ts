import { describe, it, expect } from 'vitest'
import { UserService } from '../schema'

describe('User Service API Tests', () => {
  it('should have correct table name', () => {
    expect(UserService.tableName).toBe('users')
  })

  it('should have correct indexes configuration', () => {
    const exportedConfig = UserService.export()

    expect(exportedConfig.indexes).toHaveLength(6)

    const indexNames = exportedConfig.indexes.map(
      (index) => index.indexDescriptor
    )
    expect(indexNames).toContain('by_username')
    expect(indexNames).toContain('by_email')
    expect(indexNames).toContain('by_profileId')
    expect(indexNames).toContain('by_email')
    expect(indexNames).toContain('by_age')
    expect(indexNames).toContain('by_active_age')
  })

  it('should have correct unique constraints configuration', () => {
    const exportedConfig = UserService.export()

    expect(exportedConfig.state.uniques).toHaveLength(2)
    expect(exportedConfig.state.uniques[0].fields).toBe('username')
    expect(exportedConfig.state.uniques[1].fields).toBe('email')
  })

  it('should have correct default values configuration', () => {
    const exportedConfig = UserService.export()

    expect(exportedConfig.state.defaults).toEqual({
      age: 18,
      isActive: true,
    })
  })

  it('should have correct relations configuration', () => {
    const exportedConfig = UserService.export()

    expect(exportedConfig.state.relations).toHaveProperty('profileId')
    expect(exportedConfig.state.relations.profileId).toEqual({
      path: 'profileId',
      table: 'profiles',
      onDelete: 'cascade',
    })
  })

  it('should have correct search indexes configuration', () => {
    const exportedConfig = UserService.export()

    const indexNames = exportedConfig.searchIndexes.map(
      (index) => index.indexDescriptor
    )
    expect(indexNames).toContain('by_name_username')
    const byNameUsername = exportedConfig.searchIndexes.find(
      (index) => index.indexDescriptor === 'by_name_username'
    )
    expect(byNameUsername).toBeDefined()
    expect(byNameUsername).toEqual({
      indexDescriptor: 'by_name_username',
      searchField: 'name',
      filterFields: ['isActive'],
    })
  })

  it('should have no vector indexes', () => {
    const exportedConfig = UserService.export()
    expect(exportedConfig.vectorIndexes).toHaveLength(0)
  })

  it('should have validation enabled', () => {
    const exportedConfig = UserService.export()
    expect(exportedConfig.state.validate).toBeDefined()
    expect(exportedConfig.state.validate.schema).toBeDefined()
  })

  it('should have correct schema field types', () => {
    const exportedConfig = UserService.export()
    if (exportedConfig.documentType.type !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${exportedConfig.documentType.type}'`
      )
    }
    const fields = exportedConfig.documentType.value

    expect(fields.username.fieldType.type).toBe('string')
    expect(fields.name.fieldType.type).toBe('string')
    expect(fields.email.fieldType.type).toBe('string')
    expect(fields.age.fieldType.type).toBe('number')
    expect(fields.isActive.fieldType.type).toBe('boolean')
    expect(fields.profileId.fieldType.type).toBe('id')
    expect(fields.metadata.optional).toBe(true)
  })
})
