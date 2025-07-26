import { describe, it, expect } from 'vitest'
import { ProfileService } from '../schema'

describe('Profile Service API Tests', () => {
  it('should have correct table name', () => {
    expect(ProfileService.tableName).toBe('profiles')
  })

  it('should have correct indexes configuration', () => {
    const exportedConfig = ProfileService.export()

    const indexNames = exportedConfig.indexes.map(
      (index) => index.indexDescriptor
    )
    expect(indexNames).toContain('by_name')
  })

  it('should have correct search indexes configuration', () => {
    const exportedConfig = ProfileService.export()

    const indexNames = exportedConfig.searchIndexes.map(
      (index) => index.indexDescriptor
    )
    expect(indexNames).toContain('by_bio')
    const byBio = exportedConfig.searchIndexes.find(
      (index) => index.indexDescriptor === 'by_bio'
    )
    expect(byBio).toEqual({
      indexDescriptor: 'by_bio',
      searchField: 'bio',
      filterFields: [],
    })
  })

  it('should have no vector indexes', () => {
    const exportedConfig = ProfileService.export()
    expect(exportedConfig.vectorIndexes).toHaveLength(0)
  })

  it('should have correct state configuration', () => {
    const exportedConfig = ProfileService.export()

    expect(exportedConfig.state.defaults).toEqual({})
    expect(exportedConfig.state.uniques).toEqual([])
    expect(exportedConfig.state.relations).toEqual({})
  })

  it('should have correct schema validation', () => {
    const exportedConfig = ProfileService.export()
    if (exportedConfig.documentType.type !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${exportedConfig.documentType.type}'`
      )
    }
    const fields = exportedConfig.documentType.value
    expect(fields.name.fieldType.type).toBe('string')
    expect(fields.age.fieldType.type).toBe('number')
    expect(fields.bio.fieldType.type).toBe('string')
    expect(fields.avatar.fieldType.type).toBe('string')
  })

  it('should validate required fields in schema', () => {
    const exportedConfig = ProfileService.export()
    if (exportedConfig.documentType.type !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${exportedConfig.documentType.type}'`
      )
    }
    const fields = exportedConfig.documentType.value

    expect(fields.name.fieldType.type).toBe('string')
    expect(fields.age.fieldType.type).toBe('number')
    expect(fields.bio.optional).toBe(true)
    expect(fields.avatar.optional).toBe(true)
  })
})
