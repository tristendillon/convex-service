import { describe, it, expect } from 'vitest'
import { posts } from '../convex/schema'

describe('Post Service API Tests', () => {
  it('should have correct table name', () => {
    expect(posts.tableName).toBe('posts')
  })

  it('should have correct indexes configuration', () => {
    const config = posts.$config

    expect(Object.keys(config.indexes)).toHaveLength(6)

    expect(config.indexes).toContain('by_slug')
    expect(config.indexes).toContain('by_authorId')
    expect(config.indexes).toContain('by_categoryId')
    expect(config.indexes).toContain('by_author')
    expect(config.indexes).toContain('by_category')
    expect(config.indexes).toContain('by_published_views')
  })

  it('should have correct unique constraints configuration', () => {
    const exportedConfig = posts.$config

    expect(exportedConfig.state.uniques).toHaveLength(1)
    expect(exportedConfig.state.uniques[0].fields).toBe('slug')
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
      onDelete: 'restrict',
    })
  })

  it('should have correct search indexes configuration', () => {
    const config = posts.$config

    expect(Object.keys(config.searchIndexes)).toHaveLength(2)

    expect(config.searchIndexes).toContain('by_title_content')
    expect(config.searchIndexes).toContain('by_published_views')
  })

  it('should have correct vector indexes configuration', () => {
    const config = posts.$config

    expect(Object.keys(config.vectorIndexes)).toHaveLength(2)

    expect(config.vectorIndexes).toContain('by_embedding')
    expect(config.vectorIndexes).toContain('by_published_views')
  })

  it('should have validation enabled', () => {
    const config = posts.$config
    expect(config.state.validate).toBeDefined()
    expect(config.state.validate.schema).toBeDefined()
  })

  it('should have correct schema field types', () => {
    const validator = posts.validator
    if (validator.kind !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${validator.kind}'`
      )
    }
    const fields = validator.fields

    expect(fields.title.type).toBe('string')
    expect(fields.content.type).toBe('string')
    expect(fields.authorId.type).toBe('id')
    expect(fields.categoryId.type).toBe('id')
    expect(fields.tags.type).toBe('array')
    expect(fields.published.type).toBe('boolean')
    expect(fields.views.type).toBe('number')
    expect(fields.embedding.isOptional).toBe(true)
    expect(fields.slug.type).toBe('string')
  })

  it('should have no default values', () => {
    const config = posts.$config
    expect(config.state.defaults).toEqual({})
  })
})
