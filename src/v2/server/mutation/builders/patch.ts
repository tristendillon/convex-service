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
import {
  type GenericServiceSchema,
  type ServiceNamesInServiceSchema,
} from '../../schema'

export class PatchOneBuilderImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>
> implements PatchOneBuilder<DataModel, Schema, ServiceName>
{
  constructor(
    private id: GenericId<ServiceName>,
    private ctx: GenericMutationCtx<DataModel>,
    private schema: Schema
  ) {}

  async one(
    document: Partial<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, ServiceName>
      >
    >
  ): Promise<GenericId<ServiceName>> {
    // TODO: Apply validation and field hooks
    await this.ctx.db.patch(this.id, document as any)
    return this.id
  }

  withoutValidation(): PatchOneBuilderWithoutValidation<
    DataModel,
    Schema,
    ServiceName
  > {
    return new PatchOneBuilderWithoutValidationImpl(
      this.id,
      this.ctx,
      this.schema
    )
  }
}

export class PatchOneBuilderWithoutValidationImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>
> implements PatchOneBuilderWithoutValidation<DataModel, Schema, ServiceName>
{
  constructor(
    private id: GenericId<ServiceName>,
    private ctx: GenericMutationCtx<DataModel>,
    private schema: Schema
  ) {}

  async one(
    document: Partial<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, ServiceName>
      >
    >
  ): Promise<GenericId<ServiceName>> {
    // Skip validation, patch directly
    await this.ctx.db.patch(this.id, document as any)
    return this.id
  }
}

export class PatchManyBuilderImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>
> implements PatchManyBuilder<DataModel, Schema, ServiceName>
{
  constructor(
    private ids: GenericId<ServiceName>[],
    private ctx: GenericMutationCtx<DataModel>,
    private schema: Schema
  ) {}

  async many(
    documents: Partial<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, ServiceName>
      >
    >[]
  ): Promise<GenericId<ServiceName>[]> {
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
    Schema,
    ServiceName
  > {
    return new PatchManyBuilderWithoutValidationImpl(
      this.ids,
      this.ctx,
      this.schema
    )
  }
}

export class PatchManyBuilderWithoutValidationImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>
> implements PatchManyBuilderWithoutValidation<DataModel, Schema, ServiceName>
{
  constructor(
    private ids: GenericId<ServiceName>[],
    private ctx: GenericMutationCtx<DataModel>,
    private schema: Schema
  ) {}

  async many(
    documents: Partial<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, ServiceName>
      >
    >[]
  ): Promise<GenericId<ServiceName>[]> {
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
