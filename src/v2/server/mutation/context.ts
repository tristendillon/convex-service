import {
  GenericDataModel,
  GenericMutationCtx,
  mutationGeneric,
} from 'convex/server'
import {
  customMutation,
  customCtx,
  type CustomBuilder,
} from 'convex-helpers/server/customFunctions'
import { ServiceSchema } from '../schema'
import { ServiceDatabaseWriterImpl } from './database'

// Enhanced mutation context that replaces db with service-aware version
export interface ServiceMutationCtx<
  DataModel extends GenericDataModel,
  Schema extends ServiceSchema = ServiceSchema
> extends Omit<GenericMutationCtx<DataModel>, 'db'> {
  db: ServiceDatabaseWriterImpl<DataModel, Schema>
}

export type ServiceMutation<
  DataModel extends GenericDataModel,
  Schema extends ServiceSchema = ServiceSchema
> = CustomBuilder<
  'mutation',
  {},
  ServiceMutationCtx<DataModel, Schema>,
  {},
  {},
  'public',
  {}
>
// Mutation type that uses the enhanced context
// export type ServiceMutation<
//   DataModel extends GenericDataModel,
//   Schema extends ServiceSchema = ServiceSchema
// > = typeof mutationGeneric extends (
//   ctx: GenericMutationCtx<DataModel>,
//   ...args: any[]
// ) => any
//   ? (ctx: ServiceMutationCtx<DataModel, Schema>, ...args: any[]) => any
//   : never

// Factory function to create service-aware mutations
export function createServiceMutation<
  DataModel extends GenericDataModel,
  Schema extends ServiceSchema = ServiceSchema
>(schema: Schema) {
  const mutation = customMutation(
    mutationGeneric,
    customCtx(async (ctx: GenericMutationCtx<DataModel>) => {
      // Replace the database writer with our enhanced version
      const enhancedDb = new ServiceDatabaseWriterImpl(ctx, schema)

      return {
        ...ctx,
        db: enhancedDb,
      } as ServiceMutationCtx<DataModel, Schema>
    })
  )

  return mutation as ServiceMutation<DataModel, Schema>
}

// Helper function to create mutations with proper typing
export function defineServiceMutation<
  DataModel extends GenericDataModel,
  Schema extends ServiceSchema = ServiceSchema
>(schema: Schema) {
  return createServiceMutation<DataModel, Schema>(schema)
}
