import {
  defineField,
  defineService,
  createFieldHooks,
  createRlsRules,
} from '@lunarhue/convex-service/v2'
import { defaultFields, emailField, profileIdField } from './fields'
import { z } from 'zod/v4'
import { DataModel } from './_generated/dataModel'
import { mutation } from './_generated/server'

const fieldHooks = createFieldHooks<DataModel, 'users'>()
const rls = createRlsRules<DataModel, 'users'>()

rls.rule('insert', async ({ doc, ctx }) => {
  return true
})

fieldHooks.field('fullName').before(async ({ value, operation }) => {
  if (operation === 'insert' || operation === 'update') {
    return `${value.firstName} ${value.lastName}`
  }
  return value.fullName
})

export const userService = defineService({
  email: emailField.unique(),
  uuid: z.uuid().default(() => crypto.randomUUID()),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string().optional(),
  profileId: profileIdField,
  ...defaultFields,
})
  .name('users')
  .compositeUnique(['email', 'uuid'], 'fail')
  .register({
    fieldHooks: fieldHooks,
    rls: rls,
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
