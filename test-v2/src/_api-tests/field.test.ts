import { describe, it, expect, vi } from 'vitest'
import { defineField, ServiceField } from '@lunarhue/convex-service/v2/server'
import { z } from 'zod/v4'

describe('ServiceField', () => {
  describe('Basic Field Creation', () => {
    it('should create a field with zod validator', () => {
      const field = defineField(z.string())
      expect(field).toBeInstanceOf(ServiceField)
      expect(field.toZod()).toEqual(z.string())
    })

    it('should create a field with email validation', () => {
      const field = defineField(z.email())
      expect(field.toZod()).toBeInstanceOf(z.ZodEmail)
    })

    it('should create a field with number validation', () => {
      const field = defineField(z.number())
      expect(field.toZod()).toBeInstanceOf(z.ZodNumber)
    })
  })

  describe('Field State Management', () => {
    it('should initialize with unique set to false', () => {
      const field = defineField(z.string())
      expect(field.isUnique()).toBe(false)
    })

    it('should set unique to true when chained', () => {
      const field = defineField(z.string()).unique()
      expect(field.isUnique()).toBe(true)
    })

    it('should maintain chainability', () => {
      const field = defineField(z.string())
        .unique()
        .hooks(() => {})

      expect(field.isUnique()).toBe(true)
      expect(field).toBeInstanceOf(ServiceField)
    })
  })

  describe('Field Hooks', () => {
    it('should allow setting before hook', () => {
      const beforeHook = vi.fn().mockReturnValue('processed')
      const field = defineField(z.string()).hooks((hooks) => {
        hooks.before(beforeHook)
      })

      expect(field).toBeInstanceOf(ServiceField)
    })

    it('should allow setting after hook', () => {
      const afterHook = vi.fn().mockReturnValue('processed')
      const field = defineField(z.string()).hooks((hooks) => {
        hooks.after(afterHook)
      })

      expect(field).toBeInstanceOf(ServiceField)
    })

    it('should allow setting both before and after hooks', () => {
      const beforeHook = vi.fn().mockReturnValue('before-processed')
      const afterHook = vi.fn().mockReturnValue(void 0)

      const field = defineField(z.string()).hooks((hooks) => {
        hooks.before(beforeHook)
        hooks.after(afterHook)
      })

      expect(field).toBeInstanceOf(ServiceField)
    })

    it('should support async hooks', () => {
      const asyncBeforeHook = vi.fn().mockResolvedValue('async-processed')
      const asyncAfterHook = vi.fn().mockResolvedValue(void 0)

      const field = defineField(z.string()).hooks((hooks) => {
        hooks.before(asyncBeforeHook)
        hooks.after(asyncAfterHook)
      })

      expect(field).toBeInstanceOf(ServiceField)
    })
  })

  describe('Field with Complex Types', () => {
    it('should work with optional fields', () => {
      const field = defineField(z.string().optional())
      expect(field.toZod()).toEqual(z.string().optional())
    })

    it('should work with default values', () => {
      const field = defineField(z.string().default('default-value'))
      expect(field.toZod()).toEqual(z.string().default('default-value'))
    })

    it('should work with arrays', () => {
      const field = defineField(z.array(z.string()))
      expect(field.toZod()).toEqual(z.array(z.string()))
    })

    it('should work with objects', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      })
      const field = defineField(schema)
      expect(field.toZod()).toEqual(schema)
    })
  })

  describe('Field State Persistence', () => {
    it('should maintain state across method calls', () => {
      const field = defineField(z.string())
        .unique()
        .hooks((hooks) => {
          hooks.before(() => 'modified')
        })
        .unique() // Call unique again to test state persistence

      expect(field.isUnique()).toBe(true)
    })

    it('should not mutate original zod schema', () => {
      const originalSchema = z.email()
      const field = defineField(originalSchema).unique()

      expect(field.toZod()).toEqual(originalSchema)
      expect(field.isUnique()).toBe(true)
    })
  })

  describe('Type Safety', () => {
    it('should maintain type safety with typed fields', () => {
      const numberField = defineField(z.number())
      const stringField = defineField(z.string())
      const booleanField = defineField(z.boolean())

      expect(numberField.toZod()).toEqual(z.number())
      expect(stringField.toZod()).toEqual(z.string())
      expect(booleanField.toZod()).toEqual(z.boolean())
    })

    it('should work with union types', () => {
      const unionField = defineField(z.union([z.string(), z.number()]))
      expect(unionField.toZod()).toEqual(z.union([z.string(), z.number()]))
    })

    it('should work with literal types', () => {
      const literalField = defineField(z.literal('specific-value'))
      expect(literalField.toZod()).toEqual(z.literal('specific-value'))
    })
  })
})
