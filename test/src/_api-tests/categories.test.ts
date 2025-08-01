import { describe, it, expect } from 'vitest'
import { categories } from '../convex/schema'

describe('Category Service API Tests', () => {
  it('should have correct table name', () => {
    expect(categories.tableName).toBe('categories')
  })

  it('should have correct indexes configuration', () => {
    const config = categories.$config

    expect(Object.keys(config.indexes)).toHaveLength(3)

    expect(config.indexes).toHaveProperty('by_name')
    expect(config.indexes).toHaveProperty('by_parentId')
    expect(config.indexes).toHaveProperty('by_sort_order')
  })

  it('should have correct unique constraints configuration', () => {
    const config = categories.$config

    expect(config.state.uniques).toHaveProperty('by_name')
    expect(config.state.uniques.by_name.fields).toBe('name')
  })

  it('should have correct default values configuration', () => {
    const config = categories.$config

    expect(config.state.defaults.sortOrder).toBe(0)
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
    expect(Object.keys(config.searchIndexes)).toHaveLength(0)
  })

  it('should have no vector indexes', () => {
    const config = categories.$config
    expect(Object.keys(config.vectorIndexes)).toHaveLength(0)
  })

  it('should have correct schema field types', () => {
    const validator = categories.$validatorJSON
    if (validator.type !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${validator.type}'`
      )
    }
    const fields = validator.value

    expect(fields.name.fieldType.type).toBe('string')
    expect(fields.description.optional).toBe(true)
    expect(fields.parentId.optional).toBe(true)
    expect(fields.color.optional).toBe(true)
    expect(fields.sortOrder.fieldType.type).toBe('number')
  })

  it('should have no validation enabled by default', () => {
    const config = categories.$config
    expect(config.state.validate).toBeDefined()
  })
})
