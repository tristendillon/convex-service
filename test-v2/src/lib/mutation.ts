import { defineServiceMutation } from '@lunarhue/convex-service/v2/server'
import type { DataModel } from '../convex/_generated/dataModel'
import { serviceSchema } from '../convex/schema'

export const customMutation = defineServiceMutation<DataModel>(serviceSchema)
