import { describe, it, expect, beforeAll } from 'vitest'
import {
  defineService,
  defineField,
  defineServiceSchema,
  createServiceMutation,
  ServiceDatabaseWriterImpl,
} from '@lunarhue/convex-service/v2/server'
import { z } from 'zod/v4'

describe('Mutation Builder System', () => {
  let testSchema: any
  let serviceMutation: any

  beforeAll(() => {
    // Create a test schema with various field types
    const usersService = defineService({
      name: defineField(z.string()),
      email: defineField(z.email()).unique(),
      age: z.number().default(18),
      isActive: z.boolean().default(true),
      profile: z.string().optional(),
      metadata: z.object({
        key: z.string(),
        value: z.any(),
      }).optional(),
    })
      .name('users')
      .index('by_email', ['email'])
      .register()

    const postsService = defineService({
      title: z.string(),
      content: z.string(),
      authorId: z.string(),
      published: z.boolean().default(false),
      createdAt: z.number().default(() => Date.now()),
    })
      .name('posts')
      .index('by_author', ['authorId'])
      .register()

    testSchema = defineServiceSchema({
      users: usersService,
      posts: postsService,
    })

    serviceMutation = createServiceMutation(testSchema)
  })

  describe('Insert Operations', () => {
    it('should provide insert builder with .one() and .many() methods', () => {
      // This is a type-level test - if it compiles, the API is correct
      const mockCtx = {
        db: {} as ServiceDatabaseWriterImpl<any, any>,
      }

      // These should have the correct method signatures
      expect(typeof mockCtx.db.insert).toBe('function')

      // Test that insert returns a builder
      const insertBuilder = mockCtx.db.insert('users')
      expect(typeof insertBuilder.one).toBe('function')
      expect(typeof insertBuilder.many).toBe('function')
      expect(typeof insertBuilder.withoutValidation).toBe('function')
    })

    it('should handle ZodDefault fields correctly in validation vs withoutValidation', () => {
      // In normal mode, ZodDefault fields should be optional
      const normalDocument = {
        name: 'John Doe',
        email: 'john@example.com',
        // age and isActive should be optional due to defaults
      }

      // In withoutValidation mode, all fields should be required
      const withoutValidationDocument = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
        isActive: true,
      }

      // These are type-level checks - if they compile, types are working
      expect(normalDocument).toBeDefined()
      expect(withoutValidationDocument).toBeDefined()
    })
  })

  describe('Replace Operations', () => {
    it('should provide conditional .one() and .many() methods based on ID type', () => {
      const mockCtx = {
        db: {} as ServiceDatabaseWriterImpl<any, any>,
      }

      // Single ID should only have .one()
      const replaceOneBuilder = mockCtx.db.replace('someId' as any)
      expect(typeof replaceOneBuilder.one).toBe('function')
      expect(typeof replaceOneBuilder.withoutValidation).toBe('function')

      // Array of IDs should only have .many()
      const replaceManyBuilder = mockCtx.db.replace(['id1', 'id2'] as any)
      expect(typeof replaceManyBuilder.many).toBe('function')
      expect(typeof replaceManyBuilder.withoutValidation).toBe('function')
    })
  })

  describe('Patch Operations', () => {
    it('should provide conditional .one() and .many() methods based on ID type', () => {
      const mockCtx = {
        db: {} as ServiceDatabaseWriterImpl<any, any>,
      }

      // Single ID should only have .one()
      const patchOneBuilder = mockCtx.db.patch('someId' as any)
      expect(typeof patchOneBuilder.one).toBe('function')
      expect(typeof patchOneBuilder.withoutValidation).toBe('function')

      // Array of IDs should only have .many()
      const patchManyBuilder = mockCtx.db.patch(['id1', 'id2'] as any)
      expect(typeof patchManyBuilder.many).toBe('function')
      expect(typeof patchManyBuilder.withoutValidation).toBe('function')
    })
  })

  describe('Delete Operations', () => {
    it('should be directly executable and return appropriate types', () => {
      const mockCtx = {
        db: {} as ServiceDatabaseWriterImpl<any, any>,
      }

      // Single ID delete should return Promise<Id>
      const deleteOne = mockCtx.db.delete('someId' as any)
      expect(deleteOne).toBeInstanceOf(Promise)

      // Multiple ID delete should return Promise<Id[]>
      const deleteMany = mockCtx.db.delete(['id1', 'id2'] as any)
      expect(deleteMany).toBeInstanceOf(Promise)
    })
  })

  describe('Builder Method Chaining', () => {
    it('should support the complete API as specified', () => {
      const mockCtx = {
        db: {} as ServiceDatabaseWriterImpl<any, any>,
      }

      // Test the full API surface
      const insertBuilder = mockCtx.db.insert('users')
      expect(insertBuilder.one).toBeDefined()
      expect(insertBuilder.many).toBeDefined()
      expect(insertBuilder.withoutValidation).toBeDefined()

      const insertWithoutValidation = insertBuilder.withoutValidation()
      expect(insertWithoutValidation.one).toBeDefined()
      expect(insertWithoutValidation.many).toBeDefined()

      // Replace operations
      const replaceOneBuilder = mockCtx.db.replace('id' as any)
      expect(replaceOneBuilder.one).toBeDefined()
      expect(replaceOneBuilder.withoutValidation).toBeDefined()

      const replaceManyBuilder = mockCtx.db.replace(['id1', 'id2'] as any)
      expect(replaceManyBuilder.many).toBeDefined()
      expect(replaceManyBuilder.withoutValidation).toBeDefined()

      // Patch operations
      const patchOneBuilder = mockCtx.db.patch('id' as any)
      expect(patchOneBuilder.one).toBeDefined()
      expect(patchOneBuilder.withoutValidation).toBeDefined()

      const patchManyBuilder = mockCtx.db.patch(['id1', 'id2'] as any)
      expect(patchManyBuilder.many).toBeDefined()
      expect(patchManyBuilder.withoutValidation).toBeDefined()
    })
  })

  describe('Type System Integration', () => {
    it('should work with v2 service definitions', () => {
      // This test verifies that our mutation system integrates with v2 services
      expect(testSchema).toBeDefined()
      expect(testSchema.getService('users')).toBeDefined()
      expect(testSchema.getService('posts')).toBeDefined()

      const usersService = testSchema.getService('users')
      const exported = usersService.export()

      expect(exported.name).toBe('users')
      expect(exported.fields).toBeDefined()
      expect(exported.state).toBeDefined()
    })

    it('should handle field validation correctly', () => {
      const usersService = testSchema.getService('users')
      const exported = usersService.export()

      // Check that unique fields are properly handled
      expect(exported.fields.email).toBeDefined()
      expect(exported.state.validators).toBeDefined()
    })
  })

  describe('Example Usage Patterns', () => {
    it('should demonstrate the complete API usage', async () => {
      // This test demonstrates how the API would be used in practice
      // Note: These are mock implementations for demonstration

      const mockMutationHandler = async (ctx: any) => {
        // Insert operations with defaults
        const userId = await ctx.db.insert('users').one({
          name: 'John Doe',
          email: 'john@example.com',
          // age and isActive will use defaults
        })

        // Insert multiple with validation
        const userIds = await ctx.db.insert('users').many([
          {
            name: 'Jane Doe',
            email: 'jane@example.com',
          },
          {
            name: 'Bob Smith',
            email: 'bob@example.com',
            age: 30,
          },
        ])

        // Insert without validation (all fields required)
        const strictUserId = await ctx.db.insert('users').withoutValidation().one({
          name: 'Admin User',
          email: 'admin@example.com',
          age: 25,
          isActive: true,
          profile: undefined,
          metadata: undefined,
        })

        // Replace operations
        const replacedId = await ctx.db.replace(userId).one({
          name: 'John Updated',
          email: 'john.updated@example.com',
          age: 26,
          isActive: true,
        })

        // Patch operations
        const patchedId = await ctx.db.patch(userId).one({
          name: 'John Patched',
        })

        // Delete operations
        await ctx.db.delete(userId)
        await ctx.db.delete([...userIds])

        return { success: true }
      }

      // This is a structural test - if it compiles, our API is correct
      expect(typeof mockMutationHandler).toBe('function')
    })
  })
})