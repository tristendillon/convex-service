import { describe, it, expect } from 'vitest'
import { categories } from '../convex/schema'

describe('Category Service API Tests', () => {
  it('should have correct table name', () => {
    expect(categories.tableName).toBe('categories')
  })

  it('should have correct indexes configuration', () => {
    const config = categories.$config

    expect(Object.keys(config.indexes)).toHaveLength(4)

    expect(config.indexes).toContain('by_name')
    expect(config.indexes).toContain('by_parentId')
    expect(config.indexes).toContain('by_sort_order')
    expect(config.indexes).toContain('by_parent')
  })

  it('should have correct unique constraints configuration', () => {
    const config = categories.$config

    expect(config.state.uniques).toHaveLength(1)
    expect(config.state.uniques[0].fields).toBe('name')
  })

  it('should have correct default values configuration', () => {
    const config = categories.$config

    expect(config.state.defaults).toEqual({
      sortOrder: 0,
    })
  })

  it('should have correct relations configuration', () => {
    const config = categories.$config

    expect(config.state.relations).toHaveProperty('parentId')
    expect(config.state.relations.parentId).toEqual({
      path: 'parentId',
      table: 'categories',
      onDelete: 'cascade',
    })
  })

  it('should have no search indexes', () => {
    const config = categories.$config
    expect(config.searchIndexes).toHaveLength(0)
  })

  it('should have no vector indexes', () => {
    const config = categories.$config
    expect(config.vectorIndexes).toHaveLength(0)
  })

  it('should have correct schema field types', () => {
    const validator = categories.validator
    if (validator.kind !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${validator.kind}'`
      )
    }
    const fields = validator.fields

    expect(fields.name.type).toBe('string')
    expect(fields.description.isOptional).toBe(true)
    expect(fields.parentId.isOptional).toBe(true)
    expect(fields.color.isOptional).toBe(true)
    expect(fields.sortOrder.type).toBe('number')
  })

  it('should have no validation enabled by default', () => {
    const config = categories.$config
    expect(config.state.validate).toEqual({})
  })
})
