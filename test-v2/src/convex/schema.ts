import { defineSchema } from 'convex/server'
import { usersService, usersTable } from './users.def'
import { profilesService, profilesTable } from './profiles.def'
import { defineServiceSchema } from '@lunarhue/convex-service/v2'
import {
  CreateZodSchemaFromFields,
  type DocumentWithOptionalDefaults,
  type DocumentWithRequiredDefaults,
} from '@lunarhue/convex-service/v2/server'
import { T } from 'vitest/dist/chunks/reporters.d.BFLkQcL6.js'
import * as z from 'zod/v4'

export const serviceSchema = defineServiceSchema({
  users: usersService,
  profiles: profilesService,
})

type test = CreateZodSchemaFromFields<typeof usersService.fields>
type test2 = z.infer<test>
type test3 = DocumentWithOptionalDefaults<test>
type test4 = DocumentWithRequiredDefaults<test>

export default defineSchema({
  users: usersTable,
  profiles: profilesTable,
})
