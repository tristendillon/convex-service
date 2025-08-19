import {
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericId } from 'convex/values'
import {
  ServiceDatabaseWriter,
  type ExtractDocumentType,
  type ExtractDocumentTypeWithoutDefaults,
} from './types'
import { type GenericServiceSchema } from '../schema'
import {
  InsertBuilderImpl,
  ReplaceOneBuilderImpl,
  ReplaceManyBuilderImpl,
  PatchOneBuilderImpl,
  PatchManyBuilderImpl,
  DeleteOperations,
} from './builders'

export class ServiceDatabaseWriterImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema = GenericServiceSchema
> implements ServiceDatabaseWriter<DataModel, Schema>
{
  private deleteOperations: DeleteOperations<DataModel, Schema>

  constructor(
    private ctx: GenericMutationCtx<DataModel>,
    private schema: Schema
  ) {
    this.deleteOperations = new DeleteOperations(this.ctx)
  }

  // Delegate all read operations to the original database reader
  get<TableName extends TableNamesInDataModel<DataModel>>(
    id: GenericId<TableName>
  ): Promise<any | null> {
    return this.ctx.db.get(id)
  }

  query<TableName extends TableNamesInDataModel<DataModel>>(
    tableName: TableName
  ) {
    return this.ctx.db.query(tableName)
  }

  normalizeId<TableName extends TableNamesInDataModel<DataModel>>(
    tableName: TableName,
    id: string
  ): GenericId<TableName> | null {
    return this.ctx.db.normalizeId(tableName, id)
  }

  get system(): any {
    return this.ctx.db.system
  }

  insert<TableName extends TableNamesInDataModel<DataModel>>(
    tableName: TableName
  ): InsertBuilderImpl<
    DataModel,
    TableName,
    Schema,
    ExtractDocumentTypeWithoutDefaults<Schema, TableName>,
    ExtractDocumentType<Schema, TableName>
  > {
    return new InsertBuilderImpl(tableName, this.ctx)
  }

  // Override replace with overloads for single vs multiple IDs
  replace<TableName extends TableNamesInDataModel<DataModel>>(
    id: GenericId<TableName>
  ): ReplaceOneBuilderImpl<DataModel, TableName, Schema>
  replace<TableName extends TableNamesInDataModel<DataModel>>(
    ids: GenericId<TableName>[]
  ): ReplaceManyBuilderImpl<DataModel, TableName, Schema>
  replace<TableName extends TableNamesInDataModel<DataModel>>(
    idOrIds: GenericId<TableName> | GenericId<TableName>[]
  ) {
    if (Array.isArray(idOrIds)) {
      return new ReplaceManyBuilderImpl(idOrIds, this.ctx, this.schema)
    } else {
      return new ReplaceOneBuilderImpl(idOrIds, this.ctx, this.schema)
    }
  }

  // Override patch with overloads for single vs multiple IDs
  patch<TableName extends TableNamesInDataModel<DataModel>>(
    id: GenericId<TableName>
  ): PatchOneBuilderImpl<DataModel, TableName, Schema>
  patch<TableName extends TableNamesInDataModel<DataModel>>(
    ids: GenericId<TableName>[]
  ): PatchManyBuilderImpl<DataModel, TableName, Schema>
  patch<TableName extends TableNamesInDataModel<DataModel>>(
    idOrIds: GenericId<TableName> | GenericId<TableName>[]
  ) {
    if (Array.isArray(idOrIds)) {
      return new PatchManyBuilderImpl(idOrIds, this.ctx, this.schema)
    } else {
      return new PatchOneBuilderImpl(idOrIds, this.ctx, this.schema)
    }
  }

  // Override delete with overloads for single vs multiple IDs
  delete<TableName extends TableNamesInDataModel<DataModel>>(
    id: GenericId<TableName>
  ): Promise<GenericId<TableName>>
  delete<TableName extends TableNamesInDataModel<DataModel>>(
    ids: GenericId<TableName>[]
  ): Promise<GenericId<TableName>[]>
  delete<TableName extends TableNamesInDataModel<DataModel>>(
    idOrIds: GenericId<TableName> | GenericId<TableName>[]
  ) {
    if (Array.isArray(idOrIds)) {
      return this.deleteOperations.deleteMany(idOrIds)
    } else {
      return this.deleteOperations.deleteOne(idOrIds)
    }
  }
}
