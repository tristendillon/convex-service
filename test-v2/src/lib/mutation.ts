import { defineServiceMutation } from '@lunarhue/convex-service/v2/server'
import { DataModel } from '../convex/_generated/dataModel'
import { serviceSchema } from '../convex/schema'

export const mutation = defineServiceMutation<
  DataModel,
  typeof serviceSchema.services
>(serviceSchema.services)
