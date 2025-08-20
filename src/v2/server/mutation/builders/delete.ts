import { GenericDataModel, GenericMutationCtx } from 'convex/server'
import { GenericId } from 'convex/values'
import {
  type GenericServiceSchema,
  type ServiceNamesInServiceSchema,
} from '../../schema'
import { OperationPipeline } from '../pipeline'

export class DeleteOperations<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema = GenericServiceSchema
> {
  private pipeline: OperationPipeline<DataModel, Schema, any>
  constructor(
    private ctx: GenericMutationCtx<DataModel>,
    private schema: Schema
  ) {
    this.pipeline = new OperationPipeline(undefined, this.ctx, this.schema)
  }

  // Single ID delete
  async deleteOne<ServiceName extends ServiceNamesInServiceSchema<Schema>>(
    id: GenericId<ServiceName>
  ): Promise<GenericId<ServiceName>> {
    return await this.pipeline.delete(id)
  }

  // Multiple ID delete
  async deleteMany<ServiceName extends ServiceNamesInServiceSchema<Schema>>(
    ids: GenericId<ServiceName>[]
  ): Promise<GenericId<ServiceName>[]> {
    if (ids.length === 0) return []
    return await this.pipeline.deleteMany(ids)
  }
}
