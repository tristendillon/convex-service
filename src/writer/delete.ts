import {
  GenericDataModel,
  GenericMutationCtx,
} from 'convex/server'
import { GenericId } from 'convex/values'
import {
  DeleteOperationInitializer,
} from './delete.types'

export class DeleteOperationInitializerImpl<DataModel extends GenericDataModel> 
  implements DeleteOperationInitializer {
  constructor(private ctx: GenericMutationCtx<DataModel>) {}

  one = async <Id extends GenericId<string>>(id: Id): Promise<Id> => {
    await this.ctx.db.delete(id)
    return id
  }

  many = async <Id extends GenericId<string>>(ids: Id[]): Promise<Id[]> => {
    await Promise.all(ids.map((id) => this.ctx.db.delete(id)))
    return ids
  }
}