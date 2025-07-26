import { defineSchema } from 'convex/server'

import { defineService } from 'convex-sql'
import z from 'zod'
import { zid } from 'convex-helpers/server/zod'

const ProfileService = defineService(
  z.object({
    name: z.string(),
    age: z.number().min(18, 'Age must be at least 18'),
  })
)

const UserService = defineService(
  z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(12, 'Username must be at most 12 characters'),
    name: z.string(),
    email: z.string().email('Invalid email address'),
    age: z.number().min(18, 'Age must be at least 18'),
    profiles: zid('profiles'),
  })
)
  .relation('profiles', 'profiles', 'cascade')
  .default('age', 18)
  .unique('username')
  .unique('email', 'username')
  .unique(['username', 'email'])
  .validate()
  .validate((ctx) => {
    console.log(ctx.db.query('users').collect())
  })
export default defineSchema({
  users: UserService,
  profiles: ProfileService,
})
