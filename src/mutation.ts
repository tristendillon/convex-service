import { customMutation } from 'convex-helpers/server/customFunctions'
import { customCtx } from 'convex-helpers/server/customFunctions'
import { GenericDataModel, mutationGeneric } from 'convex/server'
import type { GenericServiceSchema } from './schema.types'
import { ServiceMutation } from './mutation.types'
import { ServiceWriter } from './writer'

export function CreateServiceMutation<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema = GenericServiceSchema
>(schema: Schema) {
  const mutation = customMutation(
    mutationGeneric,
    customCtx(async (ctx) => {
      const writer = new ServiceWriter(schema, ctx)
      return {
        ...ctx,
        db: writer.wrapDb(ctx.db),
      }
    })
  )

  return mutation as unknown as ServiceMutation<DataModel, Schema>
}
