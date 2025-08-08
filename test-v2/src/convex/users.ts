import { defineField, defineService, zid } from 'convex-service/v2'
import { defaultFields } from './fields'
import { z } from 'zod'

const emailField = defineField(z.string())
const profileIdField = defineField(zid('profile'))
export const userService = defineService({
  email: emailField,
  name: z.string(),
  profileId: profileIdField,
  ...defaultFields,
})
  .name('users')
  .afterOperation(async ({ ctx, value, operation }) => {
    console.log(ctx, value, operation)
  })
  .index('by_email', ['email'])
