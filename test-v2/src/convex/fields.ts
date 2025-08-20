import { defineField } from '@lunarhue/convex-service/v2/server'
import { zid } from '@lunarhue/convex-service/v2/server/zod'
import { z } from 'zod/v4'

export const emailField = defineField(z.email()).unique()
export const profileIdField = defineField(zid('profiles'))

export const updatedAtField = defineField(
  z.number().default(() => Date.now())
).hooks((hooks) => {
  hooks.before(async ({ value, operation }) => {
    if (operation === 'insert' || operation === 'update') {
      return Date.now()
    }
    return value
  })
})

export const updatedByField = defineField(zid('users').nullish()).hooks(
  (hooks) => {
    hooks.before(async ({ ctx }) => {
      const identity = await ctx.auth.getUserIdentity()
      const userId = identity?.subject
      console.log('[updatedBy beforeHook] userId', userId)
      if (userId) {
        const user = ctx.db.normalizeId('users', userId)
        return user
      }
      return null
    })
  }
)

export const defaultFields = {
  updatedBy: updatedByField,
  updatedAt: updatedAtField,
}
