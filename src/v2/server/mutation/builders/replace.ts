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
} from '../types'
import { type GenericServiceSchema } from '../../schema'

export class ReplaceOneBuilderImpl<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> implements ReplaceOneBuilder<DataModel, TableName, Schema>
{
  constructor(
    private id: GenericId<TableName>,
    private ctx: GenericMutationCtx<DataModel>,
    private schema: Schema
  ) {}

  async one(
    document: DocumentWithOptionalDefaults<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >
  ): Promise<GenericId<TableName>> {
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
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema,
  TInput extends ExtractDocumentTypeWithoutDefaults<
    Schema,
    TableName
  > = ExtractDocumentTypeWithoutDefaults<Schema, TableName>
> implements ReplaceOneBuilderWithoutValidation<DataModel, TableName, Schema>
{
  constructor(
    private id: GenericId<TableName>,
    private ctx: GenericMutationCtx<DataModel>,
    private schema: Schema
  ) {}

  async one(document: TInput): Promise<GenericId<TableName>> {
    // Skip validation, replace directly
    await this.ctx.db.replace(this.id, document as any)
    return this.id
  }
}

export class ReplaceManyBuilderImpl<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema,
  TInput extends ExtractDocumentTypeWithoutDefaults<
    Schema,
    TableName
  > = ExtractDocumentTypeWithoutDefaults<Schema, TableName>
> implements ReplaceManyBuilder<DataModel, TableName, Schema>
{
  constructor(
    private ids: GenericId<TableName>[],
    private ctx: GenericMutationCtx<DataModel>,
    private schema: Schema
  ) {}

  async many(documents: TInput[]): Promise<GenericId<TableName>[]> {
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
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema,
  TInput extends ExtractDocumentTypeWithoutDefaults<
    Schema,
    TableName
  > = ExtractDocumentTypeWithoutDefaults<Schema, TableName>
> implements ReplaceManyBuilderWithoutValidation<DataModel, TableName, Schema>
{
  constructor(
    private ids: GenericId<TableName>[],
    private ctx: GenericMutationCtx<DataModel>,
    private schema: Schema
  ) {}

  async many(documents: TInput[]): Promise<GenericId<TableName>[]> {
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
