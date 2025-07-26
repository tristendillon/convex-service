import { describe, it, expect } from 'vitest'
import { CommentService } from '../schema'

describe('Comment Service API Tests', () => {
  it('should have correct table name', () => {
    expect(CommentService.tableName).toBe('comments')
  })

  it('should have correct indexes configuration', () => {
    const exportedConfig = CommentService.export()

    expect(exportedConfig.indexes).toHaveLength(7)

    const indexNames = exportedConfig.indexes.map(
      (index) => index.indexDescriptor
    )
    expect(indexNames).toContain('by_postId')
    expect(indexNames).toContain('by_authorId')
    expect(indexNames).toContain('by_parentId')
    expect(indexNames).toContain('by_post')
    expect(indexNames).toContain('by_author')
    expect(indexNames).toContain('by_parent')
    expect(indexNames).toContain('by_post_approved')
  })

  it('should have correct default values configuration', () => {
    const exportedConfig = CommentService.export()

    expect(exportedConfig.state.defaults).toEqual({
      approved: false,
      likes: 0,
    })
  })

  it('should have correct relations configuration', () => {
    const exportedConfig = CommentService.export()

    expect(exportedConfig.state.relations).toHaveProperty('postId')
    expect(exportedConfig.state.relations).toHaveProperty('authorId')
    expect(exportedConfig.state.relations).toHaveProperty('parentId')

    expect(exportedConfig.state.relations.postId).toEqual({
      path: 'postId',
      table: 'posts',
      onDelete: 'cascade',
    })

    expect(exportedConfig.state.relations.authorId).toEqual({
      path: 'authorId',
      table: 'users',
      onDelete: 'cascade',
    })

    expect(exportedConfig.state.relations.parentId).toEqual({
      path: 'parentId',
      table: 'comments',
      onDelete: 'cascade',
    })
  })

  it('should have no unique constraints', () => {
    const exportedConfig = CommentService.export()
    expect(exportedConfig.state.uniques).toHaveLength(0)
  })

  it('should have no search indexes', () => {
    const exportedConfig = CommentService.export()
    expect(exportedConfig.searchIndexes).toHaveLength(0)
  })

  it('should have no vector indexes', () => {
    const exportedConfig = CommentService.export()
    expect(exportedConfig.vectorIndexes).toHaveLength(0)
  })

  it('should have correct schema field types', () => {
    const exportedConfig = CommentService.export()
    if (exportedConfig.documentType.type !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${exportedConfig.documentType.type}'`
      )
    }
    const fields = exportedConfig.documentType.value

    expect(fields.postId.fieldType.type).toBe('id')
    expect(fields.authorId.fieldType.type).toBe('id')
    expect(fields.parentId.optional).toBe(true)
    expect(fields.content.fieldType.type).toBe('string')
    expect(fields.approved.fieldType.type).toBe('boolean')
    expect(fields.likes.fieldType.type).toBe('number')
  })

  it('should have no validation enabled by default', () => {
    const exportedConfig = CommentService.export()
    expect(exportedConfig.state.validate).toEqual({})
  })
})
