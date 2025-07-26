import { defineService, defineServiceSchema } from 'convex-sql'
import z from 'zod'
import { zid } from 'convex-helpers/server/zod'

// Service with schema validation in the refine/superRefine
const ProfileService = defineService(
  'profiles',
  z
    .object({
      name: z.string(),
      age: z.number(),
    })
    .refine((data) => data.age > 18, {
      message: 'Age must be at least 18',
      path: ['age'],
    })
).validate()

// Service with schema validation in the validate function
const UserService = defineService(
  'users',
  z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(12, 'Username must be at most 12 characters'),
    name: z.string(),
    email: z.string().email('Invalid email address'),
    age: z.number().min(18, 'Age must be at least 18'),
    profile: zid('profiles'),
  })
)
  .relation('profile', 'profiles', 'cascade')
  .default('age', 18)
  .unique('username')
  .unique('email', 'username')
  .unique(['username', 'email'])
  // so the thing about any builder functions that have access to the convex ctx. They cannot have any more type safety
  // on the ctx because the ctx is generic until you get a datamodel or a schema defined to create the properly typed
  // ctx. So this means we cannot have any more type safety on the ctx.

  // This also means any document that is fetched from the db will not have any type safety on the document.
  // This can be solved by using the schema of the service that we are querying to infer the type of the document.
  // but we still lose out on the auto-generated type safety on the document.
  .validate(async (ctx, document) => {
    const users = await ctx.db.query('users').collect()
    const parsedUsers = users.map((user) => {
      const parsedUser = UserService.schema.parse(user)
      return parsedUser
    })
    console.log(parsedUsers)
  })

export default defineServiceSchema({
  users: UserService,
  profiles: ProfileService,
})
