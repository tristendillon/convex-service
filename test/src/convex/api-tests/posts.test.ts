import { describe, it, expect } from 'vitest'
import { PostService } from '../schema'

describe('Post Service API Tests', () => {
  it('should have correct table name', () => {
    expect(PostService.tableName).toBe('posts')
  })

  it('should have correct indexes configuration', () => {
    const exportedConfig = PostService.export()

    expect(exportedConfig.indexes).toHaveLength(6)

    const indexNames = exportedConfig.indexes.map(
      (index) => index.indexDescriptor
    )
    expect(indexNames).toContain('by_slug')
    expect(indexNames).toContain('by_authorId')
    expect(indexNames).toContain('by_categoryId')
    expect(indexNames).toContain('by_author')
    expect(indexNames).toContain('by_category')
    expect(indexNames).toContain('by_published_views')
  })

  it('should have correct unique constraints configuration', () => {
    const exportedConfig = PostService.export()

    expect(exportedConfig.state.uniques).toHaveLength(1)
    expect(exportedConfig.state.uniques[0].fields).toBe('slug')
  })

  it('should have correct relations configuration', () => {
    const exportedConfig = PostService.export()

    expect(exportedConfig.state.relations).toHaveProperty('authorId')
    expect(exportedConfig.state.relations).toHaveProperty('categoryId')

    expect(exportedConfig.state.relations.authorId).toEqual({
      path: 'authorId',
      table: 'users',
      onDelete: 'cascade',
    })

    expect(exportedConfig.state.relations.categoryId).toEqual({
      path: 'categoryId',
      table: 'categories',
      onDelete: 'restrict',
    })
  })

  it('should have correct search indexes configuration', () => {
    const exportedConfig = PostService.export()

    const indexNames = exportedConfig.searchIndexes.map(
      (index) => index.indexDescriptor
    )
    expect(indexNames).toContain('by_title_content')
    const byTitleContent = exportedConfig.searchIndexes.find(
      (index) => index.indexDescriptor === 'by_title_content'
    )
    expect(byTitleContent).toEqual({
      indexDescriptor: 'by_title_content',
      searchField: 'title',
      filterFields: ['published', 'authorId', 'content'],
    })
  })

  it('should have correct vector indexes configuration', () => {
    const exportedConfig = PostService.export()

    const indexNames = exportedConfig.vectorIndexes.map(
      (index) => index.indexDescriptor
    )
    expect(indexNames).toContain('by_embedding')
    const byEmbedding = exportedConfig.vectorIndexes.find(
      (index) => index.indexDescriptor === 'by_embedding'
    )
    expect(byEmbedding).toEqual({
      indexDescriptor: 'by_embedding',
      vectorField: 'embedding',
      dimensions: 1536,
      filterFields: ['published'],
    })
  })

  it('should have validation enabled', () => {
    const exportedConfig = PostService.export()
    expect(exportedConfig.state.validate).toBeDefined()
    expect(exportedConfig.state.validate.schema).toBeDefined()
  })

  it('should have correct schema field types', () => {
    const exportedConfig = PostService.export()
    if (exportedConfig.documentType.type !== 'object') {
      throw new Error(
        `Expected documentType to be of type 'object', but got '${exportedConfig.documentType.type}'`
      )
    }
    const fields = exportedConfig.documentType.value

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
    const exportedConfig = PostService.export()
    expect(exportedConfig.state.defaults).toEqual({})
  })
})
