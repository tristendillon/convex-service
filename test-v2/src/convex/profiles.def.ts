import { defineService } from '@lunarhue/convex-service/v2'
import { z } from 'zod/v4'
import { defaultFields } from './fields'

export const [profilesService, profilesTable] = defineService({
  name: z.string(),
  ...defaultFields,
})
  .name('profiles')
  .index('by_updated_by', ['updatedBy'])
  .register()
