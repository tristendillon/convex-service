import { defineSchema } from 'convex/server'
import { userService } from './users'
import { profileService } from './profile'
import { defineServiceSchema } from '@lunarhue/convex-service/v2'

export const serviceSchema = defineServiceSchema({
  users: userService,
  profiles: profileService,
})

export default defineSchema({
  users: userService,
  profiles: profileService,
})
