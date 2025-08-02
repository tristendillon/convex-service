import { customMutation } from 'convex-helpers/server/customFunctions'
import { customCtx } from 'convex-helpers/server/customFunctions'
import { GenericDataModel, mutationGeneric } from 'convex/server'
import type { GenericServiceSchema } from './schema.types'
import { ServiceMutation } from './mutation.types'

export function CreateServiceMutation<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema = GenericServiceSchema
>(schema: Schema) {
  const mutation = customMutation(
    mutationGeneric,
    customCtx(async (ctx) => ({
      ...ctx,
      db: {
        ...ctx.db,
        test: () => {
          console.log('test')
        },
      },
    }))
  )
  return mutation as unknown as ServiceMutation<DataModel, Schema>
}

// export function CreateServiceMutation<
//   Schema extends GenericServiceSchema,
//   DataModel extends GenericDataModel = DataModelFromServiceSchemaDefinition<Schema>
// >(schema: Schema) {
//   const mutation = customMutation(
//     mutationGeneric,
//     customCtx(async (ctx) => ({
//       ...ctx,
//       db: {
//         ...ctx.db,
//         test: () => {
//           console.log('test')
//         },
//       },
//     }))
//   )
//   return mutation as ServiceMutation<DataModel>
// }
