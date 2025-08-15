import {
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
  DocumentByName,
} from 'convex/server'
import { GenericId } from 'convex/values'
import {
  ReplaceOneBuilder,
  ReplaceOneBuilderWithoutValidation,
  ReplaceManyBuilder,
  ReplaceManyBuilderWithoutValidation,
  ServiceValidationContext,
} from '../types'
import { ServiceSchema } from '../../schema'
import type {
  WithOptionalDefaults,
  WithRequiredDefaults,
} from '../service-types'
import type { OmitSystemFields } from '../../types'

export class ReplaceOneBuilderImpl<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends ServiceSchema = ServiceSchema
> implements ReplaceOneBuilder<DataModel, TableName, Schema>
{
  constructor(
    private id: GenericId<TableName>,
    private ctx: GenericMutationCtx<DataModel>
  ) {}

  async one(
    document: WithOptionalDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
    >
  ): Promise<GenericId<TableName>> {
    // TODO: Apply validation and field hooks
    await this.ctx.db.replace(this.id, document as any)
    return this.id
  }

  withoutValidation(): ReplaceOneBuilderWithoutValidation<
    DataModel,
    TableName,
    Schema
  > {
    return new ReplaceOneBuilderWithoutValidationImpl(this.id, this.ctx)
  }
}

export class ReplaceOneBuilderWithoutValidationImpl<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends ServiceSchema = ServiceSchema
> implements ReplaceOneBuilderWithoutValidation<DataModel, TableName, Schema>
{
  constructor(
    private id: GenericId<TableName>,
    private ctx: GenericMutationCtx<DataModel>
  ) {}

  async one(
    document: WithRequiredDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
    >
  ): Promise<GenericId<TableName>> {
    // Skip validation, replace directly
    await this.ctx.db.replace(this.id, document as any)
    return this.id
  }
}

export class ReplaceManyBuilderImpl<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends ServiceSchema = ServiceSchema
> implements ReplaceManyBuilder<DataModel, TableName, Schema>
{
  constructor(
    private ids: GenericId<TableName>[],
    private ctx: GenericMutationCtx<DataModel>
  ) {}

  async many(
    documents: WithOptionalDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
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
        this.ctx.db.replace(id, documents[index] as any)
      )
    )
    return this.ids
  }

  withoutValidation(): ReplaceManyBuilderWithoutValidation<
    DataModel,
    TableName,
    Schema
  > {
    return new ReplaceManyBuilderWithoutValidationImpl(this.ids, this.ctx)
  }
}

export class ReplaceManyBuilderWithoutValidationImpl<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends ServiceSchema = ServiceSchema
> implements ReplaceManyBuilderWithoutValidation<DataModel, TableName, Schema>
{
  constructor(
    private ids: GenericId<TableName>[],
    private ctx: GenericMutationCtx<DataModel>
  ) {}

  async many(
    documents: WithRequiredDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
    >[]
  ): Promise<GenericId<TableName>[]> {
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
