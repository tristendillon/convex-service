import { GenericMutationCtx, GenericDataModel } from 'convex/server'
import z, { ZodTypeAny } from 'zod'
import { Merge } from '../types'

export type ServiceOperation<ZodValidator extends ZodTypeAny = ZodTypeAny> = {
  value: z.infer<ZodValidator>
  operation: 'insert' | 'update' | 'delete'
  ctx: ServiceOperationCtx
}
type ServiceOperationCtx = Merge<
  GenericMutationCtx<GenericDataModel>,
  {
    meta: Record<string, any>
  }
>
