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
import {
  type GenericServiceSchema,
  type ServiceNamesInServiceSchema,
} from '../schema'
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

  insert<ServiceName extends ServiceNamesInServiceSchema<Schema>>(
    serviceName: ServiceName
  ): InsertBuilderImpl<
    DataModel,
    Schema,
    ServiceName,
    ExtractDocumentTypeWithoutDefaults<Schema, ServiceName>,
    ExtractDocumentType<Schema, ServiceName>
  > {
    return new InsertBuilderImpl(serviceName, this.ctx)
  }

  // Override replace with overloads for single vs multiple IDs
  replace<ServiceName extends ServiceNamesInServiceSchema<Schema>>(
    id: GenericId<ServiceName>
  ): ReplaceOneBuilderImpl<DataModel, Schema, ServiceName>
  replace<ServiceName extends ServiceNamesInServiceSchema<Schema>>(
    ids: GenericId<ServiceName>[]
  ): ReplaceManyBuilderImpl<DataModel, Schema, ServiceName>
  replace<ServiceName extends ServiceNamesInServiceSchema<Schema>>(
    idOrIds: GenericId<ServiceName> | GenericId<ServiceName>[]
  ) {
    if (Array.isArray(idOrIds)) {
      return new ReplaceManyBuilderImpl(idOrIds, this.ctx, this.schema)
    } else {
      return new ReplaceOneBuilderImpl(idOrIds, this.ctx, this.schema)
    }
  }

  // Override patch with overloads for single vs multiple IDs
  patch<ServiceName extends ServiceNamesInServiceSchema<Schema>>(
    id: GenericId<ServiceName>
  ): PatchOneBuilderImpl<DataModel, Schema, ServiceName>
  patch<ServiceName extends ServiceNamesInServiceSchema<Schema>>(
    ids: GenericId<ServiceName>[]
  ): PatchManyBuilderImpl<DataModel, Schema, ServiceName>
  patch<ServiceName extends ServiceNamesInServiceSchema<Schema>>(
    idOrIds: GenericId<ServiceName> | GenericId<ServiceName>[]
  ) {
    if (Array.isArray(idOrIds)) {
      return new PatchManyBuilderImpl(idOrIds, this.ctx, this.schema)
    } else {
      return new PatchOneBuilderImpl(idOrIds, this.ctx, this.schema)
    }
  }

  // Override delete with overloads for single vs multiple IDs
  delete<ServiceName extends ServiceNamesInServiceSchema<Schema>>(
    id: GenericId<ServiceName>
  ): Promise<GenericId<ServiceName>>
  delete<ServiceName extends ServiceNamesInServiceSchema<Schema>>(
    ids: GenericId<ServiceName>[]
  ): Promise<GenericId<ServiceName>[]>
  delete<ServiceName extends ServiceNamesInServiceSchema<Schema>>(
    idOrIds: GenericId<ServiceName> | GenericId<ServiceName>[]
  ) {
    if (Array.isArray(idOrIds)) {
      return this.deleteOperations.deleteMany(idOrIds)
    } else {
      return this.deleteOperations.deleteOne(idOrIds)
    }
  }
}
