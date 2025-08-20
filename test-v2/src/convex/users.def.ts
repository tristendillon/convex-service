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

rls.rule('insert', async () => {
  return true
})
rls.rule('update', async () => {
  return true
})
rls.rule('delete', async () => {
  return true
})
rls.rule('read', async () => {
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
  // we have to use guid since zod throws a parsing error when using uuid even though it's a valid uuid. So we use
  // guid instead since it looks for uuid like strings rather than rfc 9562
  // idk what this problem stems from lol but its a bug.
  uuid: z.guid().default(() => crypto.randomUUID()),
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
    serviceHooks: serviceHooks,
    rls: rls,
  })
