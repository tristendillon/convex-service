import {
  defineService,
  createFieldHooks,
  createRlsRules,
  createServiceHooks,
} from '@lunarhue/convex-service/v2'
import { defaultFields, emailField, profileIdField } from './fields'
import { z } from 'zod/v4'
import { DataModel } from './_generated/dataModel'

const fieldHooks = createFieldHooks<DataModel, 'users'>()
const rls = createRlsRules<DataModel, 'users'>()
const serviceHooks = createServiceHooks<DataModel, 'users'>()

rls.rule('insert', async ({ doc, ctx }) => {
  return true
})
rls.rule('update', async ({ doc, ctx }) => {
  return true
})
rls.rule('delete', async ({ doc, ctx }) => {
  return true
})
rls.rule('read', async ({ doc, ctx }) => {
  return true
})

serviceHooks.before(async ({ value, operation }) => {
  console.log('serviceHooks.before', value, operation)
  return value
})

fieldHooks.field('fullName').before(async ({ value, operation }) => {
  if (operation === 'insert' || operation === 'update') {
    return `${value.firstName} ${value.lastName}`
  }
  return value.fullName
})

export const [usersService, usersTable] = defineService({
  email: emailField,
  uuid: z.uuid().default(() => crypto.randomUUID()),
  firstName: z.string().nullish(),
  lastName: z.string(),
  fullName: z.string().optional(),
  profileId: profileIdField,
  ...defaultFields,
})
  .name('users')
  .compositeUnique(['email', 'uuid'], 'fail')
  .register({
    fieldHooks: fieldHooks,
    serviceHooks: serviceHooks,
    rls: rls,
  })
