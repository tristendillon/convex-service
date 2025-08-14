import {
  defineField,
  defineService,
  createFieldHooks,
  createServiceHooks,
} from '@lunarhue/convex-service/v2'
import { zid } from '@lunarhue/convex-service/v2/server/zod'
import { defaultFields } from './fields'
import { z } from 'zod/v4'
import { DataModel } from './_generated/dataModel'
import { mutation } from './_generated/server'

const fieldHooks = createFieldHooks<DataModel, 'users'>()
const serviceHooks = createServiceHooks<DataModel, 'users'>()

fieldHooks.field('fullName').before(async ({ value, operation }) => {
  if (operation === 'insert' || operation === 'update') {
    return `${value.firstName} ${value.lastName}`
  }
  return value.fullName
})

serviceHooks.before(async ({ operation, value }) => {
  let rt = value
  if (operation === 'insert' || operation === 'update') {
    rt = {
      ...value,
      fullName: `${value.firstName} ${value.lastName}`,
    }
  }
  return rt
})

serviceHooks.after(async ({ operation, value }) => {
  if (operation === 'insert' || operation === 'update') {
    console.log('service after', value)
  }
})

const emailField = defineField(z.email())
const profileIdField = defineField(zid('profile'))

export const userService = defineService({
  email: emailField,
  firstName: defineField(z.string()),
  lastName: defineField(z.string()),
  fullName: defineField(z.string().optional()),
  profileId: profileIdField,
  ...defaultFields,
})
  .name('users')
  .index('by_email', ['email'])
  .register({
    serviceHooks: serviceHooks,
    fieldHooks: fieldHooks,
  })

export const test = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', 'test@test.com'))
      .first()

    return user
  },
})
