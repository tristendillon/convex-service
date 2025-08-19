import {
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericId } from 'convex/values'
import {
  PatchOneBuilder,
  PatchOneBuilderWithoutValidation,
  PatchManyBuilder,
  PatchManyBuilderWithoutValidation,
  type GetZodSchemaFromService,
  type GetServiceFromSchemaAndTableName,
} from '../types'
import { type GenericServiceSchema } from '../../schema'

export class PatchOneBuilderImpl<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> implements PatchOneBuilder<DataModel, TableName, Schema>
{
  constructor(
    private id: GenericId<TableName>,
    private ctx: GenericMutationCtx<DataModel>
  ) {}

  async one(
    document: Partial<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >
  ): Promise<GenericId<TableName>> {
    // TODO: Apply validation and field hooks
    await this.ctx.db.patch(this.id, document as any)
    return this.id
  }

  withoutValidation(): PatchOneBuilderWithoutValidation<
    DataModel,
    TableName,
    Schema
  > {
    return new PatchOneBuilderWithoutValidationImpl(this.id, this.ctx)
  }
}

export class PatchOneBuilderWithoutValidationImpl<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> implements PatchOneBuilderWithoutValidation<DataModel, TableName, Schema>
{
  constructor(
    private id: GenericId<TableName>,
    private ctx: GenericMutationCtx<DataModel>
  ) {}

  async one(
    document: Partial<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >
  ): Promise<GenericId<TableName>> {
    // Skip validation, patch directly
    await this.ctx.db.patch(this.id, document as any)
    return this.id
  }
}

export class PatchManyBuilderImpl<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> implements PatchManyBuilder<DataModel, TableName, Schema>
{
  constructor(
    private ids: GenericId<TableName>[],
    private ctx: GenericMutationCtx<DataModel>
  ) {}

  async many(
    documents: Partial<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >[]
  ): Promise<GenericId<TableName>[]> {
    // TODO: Apply validation and field hooks to each document
    if (documents.length !== this.ids.length) {
      throw new Error(
        `Document count (${documents.length}) must match ID count (${this.ids.length})`
      )
    }

    await Promise.all(
      this.ids.map((id, index) =>
        this.ctx.db.patch(id, documents[index] as any)
      )
    )
    return this.ids
  }

  withoutValidation(): PatchManyBuilderWithoutValidation<
    DataModel,
    TableName,
    Schema
  > {
    return new PatchManyBuilderWithoutValidationImpl(this.ids, this.ctx)
  }
}

export class PatchManyBuilderWithoutValidationImpl<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> implements PatchManyBuilderWithoutValidation<DataModel, TableName, Schema>
{
  constructor(
    private ids: GenericId<TableName>[],
    private ctx: GenericMutationCtx<DataModel>
  ) {}

  async many(
    documents: Partial<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >[]
  ): Promise<GenericId<TableName>[]> {
    // Skip validation, patch directly
    if (documents.length !== this.ids.length) {
      throw new Error(
        `Document count (${documents.length}) must match ID count (${this.ids.length})`
      )
    }

    await Promise.all(
      this.ids.map((id, index) =>
        this.ctx.db.patch(id, documents[index] as any)
      )
    )
    return this.ids
  }
}
