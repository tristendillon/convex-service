import {
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericId } from 'convex/values'
import {
  InsertBuilder,
  InsertBuilderWithoutValidation,
  type ExtractDocumentType,
  type ExtractDocumentTypeWithoutDefaults,
} from '../types'
import {
  type GenericServiceSchema,
  type ServiceNamesInServiceSchema,
} from '../../schema'

export class InsertBuilderImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>,
  TInput extends ExtractDocumentTypeWithoutDefaults<
    Schema,
    ServiceName
  > = ExtractDocumentTypeWithoutDefaults<Schema, ServiceName>,
  TWithoutValidation extends ExtractDocumentType<
    Schema,
    ServiceName
  > = ExtractDocumentType<Schema, ServiceName>
> implements
    InsertBuilder<DataModel, Schema, ServiceName, TInput, TWithoutValidation>
{
  constructor(
    private tableName: ServiceName,
    private ctx: GenericMutationCtx<DataModel>
  ) {}

  async one(document: TInput): Promise<GenericId<ServiceName>> {
    // Apply validation with defaults
    return await this.ctx.db.insert(this.tableName, document as any)
  }

  async many(documents: TInput[]): Promise<GenericId<ServiceName>[]> {
    // Apply validation with defaults to each document
    const results = await Promise.all(
      documents.map((doc) => this.ctx.db.insert(this.tableName, doc as any))
    )
    return results
  }

  withoutValidation(): InsertBuilderWithoutValidation<
    DataModel,
    Schema,
    ServiceName,
    TWithoutValidation
  > {
    return new InsertBuilderWithoutValidationImpl(this.tableName, this.ctx)
  }
}

export class InsertBuilderWithoutValidationImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>,
  TInput extends ExtractDocumentType<Schema, ServiceName> = ExtractDocumentType<
    Schema,
    ServiceName
  >
> implements InsertBuilderWithoutValidation<DataModel, Schema, ServiceName>
{
  constructor(
    private tableName: ServiceName,
    private ctx: GenericMutationCtx<DataModel>
  ) {}

  async one(document: TInput): Promise<GenericId<ServiceName>> {
    // Apply minimal validation without defaults
    return await this.ctx.db.insert(this.tableName, document as any)
  }

  async many(documents: TInput[]): Promise<GenericId<ServiceName>[]> {
    // Apply minimal validation without defaults to each document
    const results = await Promise.all(
      documents.map((doc) => this.ctx.db.insert(this.tableName, doc as any))
    )
    return results
  }
}
