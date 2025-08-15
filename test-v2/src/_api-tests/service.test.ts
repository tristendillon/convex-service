import { describe, it, expect } from 'vitest'
import {
  defineService,
  defineField,
  ServiceHooks,
  FieldHooks,
  RlsRules,
  RegisteredService,
} from '@lunarhue/convex-service/v2/server'
import { z } from 'zod/v4'

describe('Service', () => {
  describe('Service Creation', () => {
    it('should create a service with fields', () => {
      const service = defineService({
        name: defineField(z.string()),
        email: defineField(z.email()),
        age: defineField(z.number()),
      })
        .name('users')
        .register()

      expect(service).toBeInstanceOf(RegisteredService)
    })

    it('should create a service with mixed field types', () => {
      const service = defineService({
        name: z.string(),
        email: defineField(z.email()),
        count: z.number().default(0),
      })
        .name('users')
        .register()

      expect(service).toBeInstanceOf(RegisteredService)
    })

    it('should create a service with unique fields', () => {
      const service = defineService({
        email: defineField(z.email()).unique(),
        username: defineField(z.string()).unique(),
      })
        .name('users')
        .register()

      expect(service).toBeInstanceOf(RegisteredService)
    })
  })

  describe('Service Configuration', () => {
    it('should set service name', () => {
      const service = defineService({
        name: z.string(),
      })
        .name('users')
        .register()

      expect(service).toBeInstanceOf(RegisteredService)
    })

    it('should add indexes', () => {
      const service = defineService({
        email: z.email(),
        status: z.string(),
      })
        .name('users')
        .index('by_email', ['email'])
        .index('by_status', ['status'])
        .register()

      expect(service).toBeInstanceOf(RegisteredService)
    })

    it('should add composite unique constraints', () => {
      const service = defineService({
        email: z.email(),
        tenantId: z.string(),
        username: z.string(),
      })
        .name('users')
        .compositeUnique(['email', 'tenantId'], 'fail')
        .compositeUnique(['username', 'tenantId'], 'replace')
        .register()

      expect(service).toBeInstanceOf(RegisteredService)
    })

    it('should add search indexes', () => {
      const service = defineService({
        title: z.string(),
        content: z.string(),
        category: z.string(),
        published: z.boolean(),
      })
        .name('posts')
        .searchIndex('search_content', {
          searchField: 'content',
          filterFields: ['category', 'published'],
        })
        .register()

      expect(service).toBeInstanceOf(RegisteredService)
    })

    it('should add vector indexes', () => {
      const service = defineService({
        title: z.string(),
        embedding: z.array(z.number()),
        category: z.string(),
      })
        .name('documents')
        .vectorIndex('by_embedding', {
          vectorField: 'embedding',
          dimensions: 1536,
          filterFields: ['category'],
        })
        .register()

      expect(service).toBeInstanceOf(RegisteredService)
    })
  })

  describe('Service Registration', () => {
    it('should register a service without options', () => {
      const service = defineService({
        name: z.string(),
        email: z.email(),
      })
        .name('users')
        .register()

      expect(service).toBeInstanceOf(RegisteredService)

      const exported = service.export()
      expect(exported.name).toBe('users')
      expect(exported.table).toBeDefined()
      expect(exported.fields).toBeDefined()
      expect(exported.state).toBeDefined()
    })

    it('should register a service with hooks', () => {
      const mockServiceHooks = new ServiceHooks().after(() => void 0)

      const mockFieldHooks = new FieldHooks()

      mockFieldHooks.field('email').after(() => void 0)

      const service = defineService({
        name: z.string(),
        email: z.email(),
      })
        .name('users')
        .register({
          serviceHooks: mockServiceHooks,
          fieldHooks: mockFieldHooks,
        })

      const exported = service.export()
      expect(exported.serviceHooks).toBe(mockServiceHooks)
      expect(exported.fieldHooks).toBe(mockFieldHooks)
    })

    it('should register a service with RLS rules', () => {
      const mockRlsRules = new RlsRules()

      const service = defineService({
        name: z.string(),
        ownerId: z.string(),
      })
        .name('documents')
        .register({
          rls: mockRlsRules,
        })

      const exported = service.export()
      expect(exported.rlsRules).toBe(mockRlsRules)
    })
  })

  describe('Service State Management', () => {
    it('should maintain field state across operations', () => {
      const service = defineService({
        email: defineField(z.email()).unique(),
        name: z.string(),
        count: z.number().default(0),
      })
        .name('users')
        .index('by_email', ['email'])
        .compositeUnique(['email', 'name'], 'fail')

      const registered = service.register()
      const exported = registered.export()

      expect(exported.state).toBeDefined()
      expect(exported.state.validators).toBeDefined()
      expect(exported.state.compositeUniques).toBeDefined()
    })

    it('should generate unique indexes for unique fields', () => {
      const service = defineService({
        email: defineField(z.email()).unique(),
        username: defineField(z.string()).unique(),
        name: z.string(),
      })
        .name('users')
        .index('by_name', ['name'])
        .register()

      const exported = service.export()
      const indexes = exported.table[' indexes']()
      expect(indexes).toContain({
        indexDescriptor: 'by_email',
        fields: ['email'],
      })
      expect(indexes).toContain({
        indexDescriptor: 'by_username',
        fields: ['username'],
      })
      expect(indexes).toContain({
        indexDescriptor: 'by_name',
        fields: ['name'],
      })
      expect(service).toBeInstanceOf(RegisteredService)
    })

    it('should handle empty fields', () => {
      expect(() => {
        defineService({}).name('empty').register()
      }).not.toThrow()
    })
  })

  describe('Service Method Chaining', () => {
    it('should support fluent interface', () => {
      const service = defineService({
        title: z.string(),
        content: z.string(),
        authorId: z.string(),
        categoryId: z.string(),
        published: z.boolean().default(false),
        createdAt: z.number().default(() => Date.now()),
      })
        .name('posts')
        .index('by_author', ['authorId'])
        .index('by_category', ['categoryId'])
        .index('by_published_created', ['published', 'createdAt'])
        .searchIndex('search_content', {
          searchField: 'content',
        })
        .compositeUnique(['title', 'authorId'], 'fail')
        .register()

      expect(service).toBeInstanceOf(RegisteredService)

      const exported = service.export()
      expect(exported.name).toBe('posts')
    })

    it('should maintain state through complex chaining', () => {
      const service = defineService({
        email: defineField(z.email())
          .unique()
          .hooks((hooks) => {
            hooks.before(() => 'processed')
          }),
        name: defineField(z.string()).hooks((hooks) => {
          hooks.after(() => {})
        }),
        status: z.enum(['active', 'inactive']).default('active'),
      })
        .name('complex_users')
        .index('by_status', ['status'])
        .compositeUnique(['email', 'status'], 'replace')
        .register()
      expect(service).toBeInstanceOf(RegisteredService)
    })
  })

  describe('Service Validation', () => {
    it('should handle various zod types', () => {
      const service = defineService({
        id: z.uuid(),
        email: z.email(),
        age: z.number().min(0).max(150),
        tags: z.array(z.string()),
        metadata: z.object({
          key: z.string(),
          value: z.any(),
        }),
        status: z.enum(['active', 'inactive', 'pending']),
        isVerified: z.boolean().default(false),
        score: z.number().optional(),
        createdAt: z.date().default(() => new Date()),
      })
        .name('complex_users')
        .register()
      expect(service).toBeInstanceOf(RegisteredService)
    })

    it('should work with field hooks and complex validations', () => {
      const service = defineService({
        email: defineField(z.email())
          .unique()
          .hooks((hooks) => {
            hooks.before(async (operation) => {
              return operation.value.toLowerCase()
            })
            hooks.after(async () => {})
          }),
        password: defineField(z.string().min(8)).hooks((hooks) => {
          hooks.before(async (operation) => {
            // Hash password logic would go here
            return `hashed_${operation.value}`
          })
        }),
      })
        .name('secure_users')
        .register()
      expect(service).toBeInstanceOf(RegisteredService)
    })
  })

  describe('ConvexTable Integration', () => {
    it('should convert to convex table', () => {
      const service = defineService({
        name: z.string(),
        email: z.email(),
        count: z.number().default(0),
      })
        .name('users')
        .register()

      const convexTable = service.toConvexTable()
      expect(convexTable).toBeDefined()
    })

    it('should maintain type information in convex table', () => {
      const service = defineService({
        id: z.string(),
        metadata: z.object({
          tags: z.array(z.string()),
          score: z.number(),
        }),
      })
        .name('typed_service')
        .register()

      const convexTable = service.toConvexTable()
      expect(convexTable).toBeDefined()
    })
  })
})
