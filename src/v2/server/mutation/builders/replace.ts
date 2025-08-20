import {
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericId } from 'convex/values'
import {
  ReplaceOneBuilder,
  ReplaceOneBuilderWithoutValidation,
  ReplaceManyBuilder,
  ReplaceManyBuilderWithoutValidation,
  type DocumentWithOptionalDefaults,
  type GetServiceFromSchemaAndTableName,
  type DocumentWithRequiredDefaults,
  type GetZodSchemaFromService,
  type ExtractDocumentTypeWithoutDefaults,
  type ExtractDocumentType,
} from '../types'
import {
  type GenericServiceSchema,
  type ServiceNamesInServiceSchema,
} from '../../schema'

export class ReplaceOneBuilderImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>,
  TInput extends ExtractDocumentTypeWithoutDefaults<
    Schema,
    ServiceName
  > = ExtractDocumentTypeWithoutDefaults<Schema, ServiceName>
> implements ReplaceOneBuilder<DataModel, Schema, ServiceName>
{
  constructor(
    private id: GenericId<ServiceName>,
    private ctx: GenericMutationCtx<DataModel>,
    private schema: Schema
  ) {}

  async one(document: TInput): Promise<GenericId<ServiceName>> {
    // TODO: Apply validation and field hooks
    await this.ctx.db.replace(this.id, document as any)
    return this.id
  }

  withoutValidation() {
    return new ReplaceOneBuilderWithoutValidationImpl(
      this.id,
      this.ctx,
      this.schema
    )
  }
}

export class ReplaceOneBuilderWithoutValidationImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>,
  TInput extends ExtractDocumentType<Schema, ServiceName> = ExtractDocumentType<
    Schema,
    ServiceName
  >
> implements ReplaceOneBuilderWithoutValidation<DataModel, Schema, ServiceName>
{
  constructor(
    private id: GenericId<ServiceName>,
    private ctx: GenericMutationCtx<DataModel>,
    private schema: Schema
  ) {}

  async one(document: TInput): Promise<GenericId<ServiceName>> {
    // Skip validation, replace directly
    await this.ctx.db.replace(this.id, document as any)
    return this.id
  }
}

export class ReplaceManyBuilderImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>,
  TInput extends ExtractDocumentTypeWithoutDefaults<
    Schema,
    ServiceName
  > = ExtractDocumentTypeWithoutDefaults<Schema, ServiceName>
> implements ReplaceManyBuilder<DataModel, Schema, ServiceName>
{
  constructor(
    private ids: GenericId<ServiceName>[],
    private ctx: GenericMutationCtx<DataModel>,
    private schema: Schema
  ) {}

  async many(documents: TInput[]): Promise<GenericId<ServiceName>[]> {
    // TODO: Apply validation and field hooks to each document
    if (documents.length !== this.ids.length) {
      throw new Error(
        `Document count (${documents.length}) must match ID count (${this.ids.length})`
      )
    }

    await Promise.all(
      this.ids.map((id, index) =>
        this.ctx.db.replace(id, documents[index] as any)
      )
    )
    return this.ids
  }

  withoutValidation() {
    return new ReplaceManyBuilderWithoutValidationImpl(
      this.ids,
      this.ctx,
      this.schema
    )
  }
}

export class ReplaceManyBuilderWithoutValidationImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>,
  TInput extends ExtractDocumentType<Schema, ServiceName> = ExtractDocumentType<
    Schema,
    ServiceName
  >
> implements
    ReplaceManyBuilderWithoutValidation<DataModel, Schema, ServiceName>
{
  constructor(
    private ids: GenericId<ServiceName>[],
    private ctx: GenericMutationCtx<DataModel>,
    private schema: Schema
  ) {}

  async many(documents: TInput[]): Promise<GenericId<ServiceName>[]> {
    // Skip validation, replace directly
    if (documents.length !== this.ids.length) {
      throw new Error(
        `Document count (${documents.length}) must match ID count (${this.ids.length})`
      )
    }

    await Promise.all(
      this.ids.map((id, index) =>
        this.ctx.db.replace(id, documents[index] as any)
      )
    )
    return this.ids
  }
}
