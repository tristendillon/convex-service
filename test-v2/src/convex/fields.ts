import { defineField } from '@lunarhue/convex-service/v2/server'
import { zid } from '@lunarhue/convex-service/v2/server/zod'
import { z } from 'zod/v4'

export const updatedAtField = defineField(z.number().default(Date.now)).hooks(
  (hooks) => {
    hooks.before(async ({ value, operation }) => {
      if (operation === 'insert' || operation === 'update') {
        return Date.now()
      }
      return value
    })
  }
)

export const updatedByField = defineField(zid('users').optional())

export const defaultFields = {
  updatedBy: updatedByField,
  updatedAt: updatedAtField,
}
