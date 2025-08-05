import { describe, it, expect } from 'vitest'
import { ServiceSchema } from '../convex/schema'

const comments = ServiceSchema.services.comments

describe('Comment Service API Tests', () => {
  it('should have correct table name', () => {
    expect(comments.tableName).toBe('comments')
  })

  it('should have correct indexes configuration', () => {
    const config = comments.$config

    expect(Object.keys(config.indexes)).toHaveLength(4)

    expect(config.indexes).toHaveProperty('by_postId')
    expect(config.indexes).toHaveProperty('by_authorId')
    expect(config.indexes).toHaveProperty('by_parentId')
    expect(config.indexes).toHaveProperty('by_post_approved')
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
    expect(config.state.uniques).toEqual({})
  })

  it('should have no search indexes', () => {
    const config = comments.$config
    expect(Object.keys(config.searchIndexes)).toHaveLength(0)
  })

  it('should have no vector indexes', () => {
    const config = comments.$config
    expect(Object.keys(config.vectorIndexes)).toHaveLength(0)
  })

  it('should have correct schema field types', () => {
    const validator = comments.$validatorJSON
    if (validator.type !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${validator.type}'`
      )
    }
    const fields = validator.value

    expect(fields.postId.fieldType.type).toBe('id')
    expect(fields.authorId.fieldType.type).toBe('id')
    expect(fields.parentId.optional).toBe(true)
    expect(fields.content.fieldType.type).toBe('string')
    expect(fields.approved.fieldType.type).toBe('boolean')
    expect(fields.likes.fieldType.type).toBe('number')
  })

  it('should have validation enabled', () => {
    const config = comments.$config
    expect(config.state.validate).toBeDefined()
  })
})
