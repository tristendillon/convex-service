import { defineService, defineServiceSchema } from 'convex-sql'
import z from 'zod'

// Service with schema validation in the validate function
const UserService = defineService(
  z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(12, 'Username must be at most 12 characters'),
    name: z.string(),
    email: z.string().email('Invalid email address'),
    age: z.number().min(18, 'Age must be at least 18'),
    test: z.object({
      name: z.string(),
      age: z.number(),
    }),
  })
)
  .name('users')
  .default('age', 18)
  .unique('username')

export default defineServiceSchema({
  [UserService.tableName]: UserService,
})
