import { CustomBuilder } from 'convex-helpers/server/customFunctions'
import { GenericDataModel, GenericMutationCtx } from 'convex/server'
import { GenericServiceSchema } from './schema.types'
import { ServiceDatabaseWriter } from './writer.types'

// Updated WithoutDefaults type that extracts field types from VObject

type ServiceMutationCtx<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema
> = GenericMutationCtx<DataModel> & {
  db: ServiceDatabaseWriter<DataModel, Schema>
}

export type ServiceMutation<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema
> = CustomBuilder<
  'mutation',
  {},
  ServiceMutationCtx<DataModel, Schema>,
  {},
  {},
  'public',
  {}
>
