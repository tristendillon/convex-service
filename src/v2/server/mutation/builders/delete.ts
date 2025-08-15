import {
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericId } from 'convex/values'
import { ServiceValidationContext } from '../types'
import { ServiceSchema } from '../../schema'

export class DeleteOperations<
  DataModel extends GenericDataModel,
  Schema extends ServiceSchema = ServiceSchema
> {
  constructor(private ctx: GenericMutationCtx<DataModel>) {}

  // Single ID delete
  async deleteOne<TableName extends TableNamesInDataModel<DataModel>>(
    id: GenericId<TableName>
  ): Promise<GenericId<TableName>> {
    // TODO: Apply service hooks and relation handling
    await this.ctx.db.delete(id)
    return id
  }

  // Multiple ID delete
  async deleteMany<TableName extends TableNamesInDataModel<DataModel>>(
    ids: GenericId<TableName>[]
  ): Promise<GenericId<TableName>[]> {
    // TODO: Apply service hooks and relation handling to each
    await Promise.all(ids.map((id) => this.ctx.db.delete(id)))
    return ids
  }
}
