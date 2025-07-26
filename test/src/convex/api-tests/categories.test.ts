import { describe, it, expect } from 'vitest'
import { CategoryService } from '../schema'

describe('Category Service API Tests', () => {
  it('should have correct table name', () => {
    expect(CategoryService.tableName).toBe('categories')
  })

  it('should have correct indexes configuration', () => {
    const exportedConfig = CategoryService.export()

    expect(exportedConfig.indexes).toHaveLength(4)

    const indexNames = exportedConfig.indexes.map(
      (index) => index.indexDescriptor
    )
    expect(indexNames).toContain('by_name')
    expect(indexNames).toContain('by_parentId')
    expect(indexNames).toContain('by_sort_order')
    expect(indexNames).toContain('by_parent')
  })

  it('should have correct unique constraints configuration', () => {
    const exportedConfig = CategoryService.export()

    expect(exportedConfig.state.uniques).toHaveLength(1)
    expect(exportedConfig.state.uniques[0].fields).toBe('name')
  })

  it('should have correct default values configuration', () => {
    const exportedConfig = CategoryService.export()

    expect(exportedConfig.state.defaults).toEqual({
      sortOrder: 0,
    })
  })

  it('should have correct relations configuration', () => {
    const exportedConfig = CategoryService.export()

    expect(exportedConfig.state.relations).toHaveProperty('parentId')
    expect(exportedConfig.state.relations.parentId).toEqual({
      path: 'parentId',
      table: 'categories',
      onDelete: 'cascade',
    })
  })

  it('should have no search indexes', () => {
    const exportedConfig = CategoryService.export()
    expect(exportedConfig.searchIndexes).toHaveLength(0)
  })

  it('should have no vector indexes', () => {
    const exportedConfig = CategoryService.export()
    expect(exportedConfig.vectorIndexes).toHaveLength(0)
  })

  it('should have correct schema field types', () => {
    const exportedConfig = CategoryService.export()
    if (exportedConfig.documentType.type !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${exportedConfig.documentType.type}'`
      )
    }
    const fields = exportedConfig.documentType.value

    expect(fields.name.fieldType.type).toBe('string')
    expect(fields.description.optional).toBe(true)
    expect(fields.parentId.optional).toBe(true)
    expect(fields.color.optional).toBe(true)
    expect(fields.sortOrder.fieldType.type).toBe('number')
  })

  it('should have no validation enabled by default', () => {
    const exportedConfig = CategoryService.export()
    expect(exportedConfig.state.validate).toEqual({})
  })
})
