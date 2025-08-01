import { describe, it, expect } from 'vitest'
import { posts } from '../convex/schema'

describe('Post Service API Tests', () => {
  it('should have correct table name', () => {
    expect(posts.tableName).toBe('posts')
  })

  it('should have correct indexes configuration', () => {
    const config = posts.$config

    expect(Object.keys(config.indexes)).toHaveLength(5)

    expect(config.indexes).toHaveProperty('by_slug')
    expect(config.indexes).toHaveProperty('by_authorId')
    expect(config.indexes).toHaveProperty('by_categoryId')
    expect(config.indexes).toHaveProperty('by_tags')
    expect(config.indexes).toHaveProperty('by_published_views')
  })

  it('should have correct unique constraints configuration', () => {
    const exportedConfig = posts.$config

    expect(exportedConfig.state.uniques).toHaveProperty('by_slug')
    expect(exportedConfig.state.uniques.by_slug.fields).toEqual('slug')
  })

  it('should have correct relations configuration', () => {
    const config = posts.$config

    expect(config.state.relations).toHaveProperty('authorId')
    expect(config.state.relations).toHaveProperty('categoryId')

    expect(config.state.relations.authorId).toEqual({
      path: 'authorId',
      table: 'users',
      onDelete: 'cascade',
    })

    expect(config.state.relations.categoryId).toEqual({
      path: 'categoryId',
      table: 'categories',
      onDelete: 'fail',
    })
  })

  it('should have correct search indexes configuration', () => {
    const config = posts.$config

    expect(Object.keys(config.searchIndexes)).toHaveLength(1)

    expect(config.searchIndexes).toHaveProperty('by_title_content')
  })

  it('should have correct vector indexes configuration', () => {
    const config = posts.$config

    expect(Object.keys(config.vectorIndexes)).toHaveLength(1)

    expect(config.vectorIndexes).toHaveProperty('by_embedding')
  })

  it('should have validation enabled', () => {
    const config = posts.$config
    expect(config.state.validate).toBeDefined()
  })

  it('should have correct schema field types', () => {
    const validator = posts.$validatorJSON
    if (validator.type !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${validator.type}'`
      )
    }
    const fields = validator.value

    expect(fields.title.fieldType.type).toBe('string')
    expect(fields.content.fieldType.type).toBe('string')
    expect(fields.authorId.fieldType.type).toBe('id')
    expect(fields.categoryId.fieldType.type).toBe('id')
    expect(fields.tags.fieldType.type).toBe('array')
    expect(fields.published.fieldType.type).toBe('boolean')
    expect(fields.views.fieldType.type).toBe('number')
    expect(fields.embedding.optional).toBe(true)
    expect(fields.slug.fieldType.type).toBe('string')
  })

  it('should have no default values', () => {
    const config = posts.$config
    expect(config.state.defaults).toEqual({})
  })
})
