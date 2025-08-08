import { defineSchema } from 'convex/server'
import { userService } from './users'
import { profileService } from './profile'

export default defineSchema({
  users: userService.toConvexTable(),
  profiles: profileService.toConvexTable(),
})
