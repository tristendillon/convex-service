import { describe, it, expect } from 'vitest'
import { TagService } from '../schema'

describe('Tag Service API Tests', () => {
  it('should have correct table name', () => {
    expect(TagService.tableName).toBe('tags')
  })

  it('should have correct indexes configuration', () => {
    const exportedConfig = TagService.export()

    expect(exportedConfig.indexes).toHaveLength(2)

    const indexNames = exportedConfig.indexes.map(
      (index) => index.indexDescriptor
    )
    expect(indexNames).toContain('by_name')
    expect(indexNames).toContain('by_usage_count')
  })

  it('should have correct unique constraints configuration', () => {
    const exportedConfig = TagService.export()

    expect(exportedConfig.state.uniques).toHaveLength(1)
    expect(exportedConfig.state.uniques[0].fields).toBe('name')
  })

  it('should have correct default values configuration', () => {
    const exportedConfig = TagService.export()

    expect(exportedConfig.state.defaults).toEqual({
      usage_count: 0,
    })
  })

  it('should have no relations', () => {
    const exportedConfig = TagService.export()
    expect(exportedConfig.state.relations).toEqual({})
  })

  it('should have no search indexes', () => {
    const exportedConfig = TagService.export()
    expect(exportedConfig.searchIndexes).toHaveLength(0)
  })

  it('should have no vector indexes', () => {
    const exportedConfig = TagService.export()
    expect(exportedConfig.vectorIndexes).toHaveLength(0)
  })

  it('should have correct schema field types', () => {
    const exportedConfig = TagService.export()
    if (exportedConfig.documentType.type !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${exportedConfig.documentType.type}'`
      )
    }
    const fields = exportedConfig.documentType.value

    expect(fields.name.fieldType.type).toBe('string')
    expect(fields.color.optional).toBe(true)
    expect(fields.usage_count.fieldType.type).toBe('number')
  })

  it('should have no validation enabled by default', () => {
    const exportedConfig = TagService.export()
    expect(exportedConfig.state.validate).toEqual({})
  })
})
