import { defineSchema } from 'convex/server'
import { usersService, usersTable } from './users.def'
import { profilesService, profilesTable } from './profiles.def'
import { defineServiceSchema } from '@lunarhue/convex-service/v2'

export const serviceSchema = defineServiceSchema({
  users: usersService,
  profiles: profilesService,
})

export default defineSchema({
  users: usersTable,
  profiles: profilesTable,
})
