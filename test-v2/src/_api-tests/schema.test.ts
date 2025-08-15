import { describe, it, expect } from 'vitest'
import {
  defineService,
  defineField,
  defineServiceSchema,
  ServiceSchema,
} from '@lunarhue/convex-service/v2/server'
import { z } from 'zod/v4'

describe('ServiceSchema', () => {
  describe('Schema Creation', () => {
    it('should create a schema with single service', () => {
      const userService = defineService({
        name: z.string(),
        email: z.email(),
      })
        .name('users')
        .register()

      const schema = defineServiceSchema({
        users: userService,
      })

      expect(schema).toBeInstanceOf(ServiceSchema)
    })

    it('should create a schema with multiple services', () => {
      const userService = defineService({
        name: z.string(),
        email: z.email(),
      })
        .name('users')
        .register()

      const postService = defineService({
        title: z.string(),
        content: z.string(),
        authorId: z.string(),
      })
        .name('posts')
        .register()

      const schema = defineServiceSchema({
        users: userService,
        posts: postService,
      })

      expect(schema).toBeInstanceOf(ServiceSchema)
    })

    it('should create a schema with complex services', () => {
      const userService = defineService({
        email: defineField(z.email()).unique(),
        name: z.string(),
        age: z.number().optional(),
        metadata: z.object({
          preferences: z.array(z.string()),
          settings: z.record(z.string(), z.any()),
        }),
      })
        .name('users')
        .index('by_email', ['email'])
        .compositeUnique(['email', 'name'], 'fail')
        .register()

      const postService = defineService({
        title: z.string(),
        content: z.string(),
        authorId: z.string(),
        tags: z.array(z.string()).default([]),
        published: z.boolean().default(false),
        createdAt: z.number().default(() => Date.now()),
      })
        .name('posts')
        .index('by_author', ['authorId'])
        .index('by_published', ['published'])
        .searchIndex('search_content', {
          searchField: 'content',
          filterFields: ['published'],
        })
        .register()

      const schema = defineServiceSchema({
        users: userService,
        posts: postService,
      })

      expect(schema).toBeInstanceOf(ServiceSchema)
    })
  })

  describe('Service Name Validation', () => {
    it('should throw error when service name mismatch', () => {
      const userService = defineService({
        name: z.string(),
        email: z.email(),
      })
        .name('users')
        .register()

      expect(() => {
        defineServiceSchema({
          wrongName: userService, // Key doesn't match service name
        })
      }).toThrow(/Service name wrongName does not match exported name users/)
    })

    it('should pass when service names match', () => {
      const userService = defineService({
        name: z.string(),
        email: z.email(),
      })
        .name('users')
        .register()

      expect(() => {
        defineServiceSchema({
          users: userService, // Key matches service name
        })
      }).not.toThrow()
    })

    it('should validate all services in schema', () => {
      const userService = defineService({
        name: z.string(),
      })
        .name('users')
        .register()

      const postService = defineService({
        title: z.string(),
      })
        .name('posts')
        .register()

      const commentService = defineService({
        content: z.string(),
      })
        .name('comments')
        .register()

      expect(() => {
        defineServiceSchema({
          users: userService,
          posts: postService,
          comments: commentService,
        })
      }).not.toThrow()
    })
  })

  describe('Service Retrieval', () => {
    it('should retrieve service by name', () => {
      const userService = defineService({
        name: z.string(),
        email: z.email(),
      })
        .name('users')
        .register()

      const schema = defineServiceSchema({
        users: userService,
      })

      const retrievedService = schema.getService('users')
      expect(retrievedService).toBe(userService)
    })

    it('should retrieve multiple services', () => {
      const userService = defineService({
        name: z.string(),
      })
        .name('users')
        .register()

      const postService = defineService({
        title: z.string(),
      })
        .name('posts')
        .register()

      const schema = defineServiceSchema({
        users: userService,
        posts: postService,
      })

      expect(schema.getService('users')).toBe(userService)
      expect(schema.getService('posts')).toBe(postService)
    })

    it('should throw error for non-existent service', () => {
      const userService = defineService({
        name: z.string(),
      })
        .name('users')
        .register()

      const schema = defineServiceSchema({
        users: userService,
      })

      expect(() => {
        schema.getService('nonexistent')
      }).toThrow(/Service nonexistent not found/)
    })
  })

  describe('Service Registration Verification', () => {
    it('should ensure all services are registered', () => {
      const userService = defineService({
        email: defineField(z.email()).unique(),
        name: z.string(),
        role: z.enum(['admin', 'user']).default('user'),
      })
        .name('users')
        .index('by_email', ['email'])
        .index('by_role', ['role'])
        .register()

      const postService = defineService({
        title: z.string(),
        content: z.string(),
        authorId: z.string(),
        status: z.enum(['draft', 'published']).default('draft'),
      })
        .name('posts')
        .index('by_author', ['authorId'])
        .index('by_status', ['status'])
        .compositeUnique(['title', 'authorId'], 'fail')
        .register()

      const commentService = defineService({
        content: z.string(),
        postId: z.string(),
        authorId: z.string(),
        createdAt: z.number().default(() => Date.now()),
      })
        .name('comments')
        .index('by_post', ['postId'])
        .index('by_author', ['authorId'])
        .register()

      const schema = defineServiceSchema({
        users: userService,
        posts: postService,
        comments: commentService,
      })

      // Verify all services can be retrieved
      expect(schema.getService('users')).toBeDefined()
      expect(schema.getService('posts')).toBeDefined()
      expect(schema.getService('comments')).toBeDefined()
    })

    it('should handle services with hooks and RLS', () => {
      const userService = defineService({
        email: defineField(z.email())
          .unique()
          .hooks((hooks) => {
            hooks.before(async (operation) => {
              return operation.value.toLowerCase()
            })
          }),
        name: defineField(z.string()).hooks((hooks) => {
          hooks.after(async () => {
            // Post-processing (after hooks return void)
          })
        }),
      })
        .name('users')
        .register()

      const schema = defineServiceSchema({
        users: userService,
      })

      const retrievedService = schema.getService('users')
      const exported = retrievedService.export()

      expect(exported.name).toBe('users')
      expect(exported.fields).toBeDefined()
      expect(exported.state).toBeDefined()
    })
  })

  describe('Static Methods', () => {
    it('should get all services from schema', () => {
      const userService = defineService({
        name: z.string(),
      })
        .name('users')
        .register()

      const postService = defineService({
        title: z.string(),
      })
        .name('posts')
        .register()

      const schema = defineServiceSchema({
        users: userService,
        posts: postService,
      })

      const allServices = ServiceSchema.getAllServices(schema)

      expect(allServices).toBeDefined()
      expect(allServices.users).toBe(userService)
      expect(allServices.posts).toBe(postService)
      expect(Object.keys(allServices)).toHaveLength(2)
    })

    it('should return empty object for empty schema', () => {
      const schema = defineServiceSchema({})

      const allServices = ServiceSchema.getAllServices(schema)
      expect(allServices).toEqual({})
    })
  })

  describe('Complex Schema Scenarios', () => {
    it('should handle schema with services having different configurations', () => {
      // Simple service
      const categoryService = defineService({
        name: z.string(),
        slug: z.string(),
      })
        .name('categories')
        .index('by_slug', ['slug'])
        .register()

      // Service with unique fields
      const userService = defineService({
        email: defineField(z.email()).unique(),
        username: defineField(z.string()).unique(),
      })
        .name('users')
        .register()

      // Service with complex indexes and constraints
      const postService = defineService({
        title: z.string(),
        slug: z.string(),
        content: z.string(),
        authorId: z.string(),
        categoryId: z.string(),
        published: z.boolean().default(false),
        publishedAt: z.number().optional(),
        tags: z.array(z.string()).default([]),
      })
        .name('posts')
        .index('by_author', ['authorId'])
        .index('by_category', ['categoryId'])
        .index('by_published_date', ['published', 'publishedAt'])
        .searchIndex('search_content', {
          searchField: 'content',
          filterFields: ['published', 'categoryId'],
        })
        .compositeUnique(['slug', 'authorId'], 'fail')
        .register()

      const schema = defineServiceSchema({
        categories: categoryService,
        users: userService,
        posts: postService,
      })

      expect(schema.getService('categories')).toBe(categoryService)
      expect(schema.getService('users')).toBe(userService)
      expect(schema.getService('posts')).toBe(postService)
    })

    it('should maintain service state through schema operations', () => {
      const userService = defineService({
        email: defineField(z.email()).unique(),
        profile: z.object({
          firstName: z.string(),
          lastName: z.string(),
          bio: z.string().optional(),
        }),
        settings: z.record(z.string(), z.any()).default({}),
      })
        .name('users')
        .index('by_email', ['email'])
        .register()

      const schema = defineServiceSchema({
        users: userService,
      })

      const retrievedService = schema.getService('users')
      const exported = retrievedService.export()

      // Verify state is maintained
      expect(exported.state.validators).toBeDefined()
      expect(exported.fields).toBeDefined()
      expect(exported.name).toBe('users')

      expect(retrievedService).toBeDefined()
    })
  })
})
