import {
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericId } from 'convex/values'
import { DeleteOperationInitializer } from './delete.types'
import { RelationManager } from './utils'
import { GenericServiceSchema } from '../schema.types'

export class DeleteOperationInitializerImpl<
  TableName extends TableNamesInDataModel<GenericDataModel>
> implements DeleteOperationInitializer<TableName>
{
  private relationManager: RelationManager

  constructor(
    private ctx: GenericMutationCtx<GenericDataModel>,
    private tableName: TableName,
    schema: GenericServiceSchema
  ) {
    this.relationManager = new RelationManager(schema)
  }

  one = async <Id extends GenericId<string>>(id: Id): Promise<Id> => {
    await this.relationManager.handleDeleteCascades(this.ctx, this.tableName, [
      id,
    ])
    await this.ctx.db.delete(id)
    return id
  }

  many = async <Id extends GenericId<string>>(ids: Id[]): Promise<Id[]> => {
    await this.relationManager.handleDeleteCascades(
      this.ctx,
      this.tableName,
      ids
    )
    await Promise.all(ids.map((id) => this.ctx.db.delete(id)))
    return ids
  }
}
