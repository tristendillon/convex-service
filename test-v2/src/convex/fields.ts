import { defineField, zid } from 'convex-service/v2/server'
import { z } from 'zod'

export const updatedAtField = defineField(z.number())
  .default(Date.now)
  .beforeOperation(async ({ value, operation }) => {
    if (operation === 'insert' || operation === 'update') {
      return Date.now()
    }
    return value
  })

export const updatedByField = defineField(
  zid('users').optional()
).beforeOperation(async ({ ctx }) => {
  const identity = await ctx.auth.getUserIdentity()
  const userId = ctx.db.normalizeId('users', identity?.subject ?? '')
  if (!userId) {
    return undefined
  }
  return userId
})

export const defaultFields = {
  updatedBy: updatedByField,
  updatedAt: updatedAtField,
}
