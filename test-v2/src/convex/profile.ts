import { defineService } from 'convex-service/v2'
import { z } from 'zod'
import { defaultFields } from './fields'

export const profileService = defineService({
  name: z.string(),
  ...defaultFields,
})
  .name('profiles')
  .index('by_updated_by', ['updatedBy'])
