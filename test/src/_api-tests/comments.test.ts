import { describe, it, expect } from 'vitest'
import { comments } from '../convex/schema'

describe('Comment Service API Tests', () => {
  it('should have correct table name', () => {
    expect(comments.tableName).toBe('comments')
  })

  it('should have correct indexes configuration', () => {
    const config = comments.$config

    expect(Object.keys(config.indexes)).toHaveLength(7)

    expect(config.indexes).toContain('by_postId')
    expect(config.indexes).toContain('by_authorId')
    expect(config.indexes).toContain('by_parentId')
    expect(config.indexes).toContain('by_post')
    expect(config.indexes).toContain('by_author')
    expect(config.indexes).toContain('by_parent')
    expect(config.indexes).toContain('by_post_approved')
  })

  it('should have correct default values configuration', () => {
    const config = comments.$config

    expect(config.state.defaults).toEqual({
      approved: false,
      likes: 0,
    })
  })

  it('should have correct relations configuration', () => {
    const config = comments.$config

    expect(config.state.relations).toHaveProperty('postId')
    expect(config.state.relations).toHaveProperty('authorId')
    expect(config.state.relations).toHaveProperty('parentId')

    expect(config.state.relations.postId).toEqual({
      path: 'postId',
      table: 'posts',
      onDelete: 'cascade',
    })

    expect(config.state.relations.authorId).toEqual({
      path: 'authorId',
      table: 'users',
      onDelete: 'cascade',
    })

    expect(config.state.relations.parentId).toEqual({
      path: 'parentId',
      table: 'comments',
      onDelete: 'cascade',
    })
  })

  it('should have no unique constraints', () => {
    const config = comments.$config
    expect(config.state.uniques).toHaveLength(0)
  })

  it('should have no search indexes', () => {
    const config = comments.$config
    expect(config.searchIndexes).toHaveLength(0)
  })

  it('should have no vector indexes', () => {
    const config = comments.$config
    expect(config.vectorIndexes).toHaveLength(0)
  })

  it('should have correct schema field types', () => {
    const validator = comments.validator
    if (validator.kind !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${validator.kind}'`
      )
    }
    const fields = validator.fields

    expect(fields.postId.type).toBe('id')
    expect(fields.authorId.type).toBe('id')
    expect(fields.parentId.isOptional).toBe(true)
    expect(fields.content.type).toBe('string')
    expect(fields.approved.type).toBe('boolean')
    expect(fields.likes.type).toBe('number')
  })

  it('should have no validation enabled by default', () => {
    const config = comments.$config
    expect(config.state.validate).toEqual({})
  })
})
