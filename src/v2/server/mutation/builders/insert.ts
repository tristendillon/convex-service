import {
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
  DocumentByName,
} from 'convex/server'
import { GenericId } from 'convex/values'
import {
  InsertBuilder,
  InsertBuilderWithoutValidation,
  ServiceValidationContext,
} from '../types'
import { ServiceSchema } from '../../schema'
import type {
  WithOptionalDefaults,
  WithRequiredDefaults,
} from '../service-types'
import type { OmitSystemFields } from '../../types'

export class InsertBuilderImpl<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends ServiceSchema = ServiceSchema
> implements InsertBuilder<DataModel, TableName, Schema>
{
  constructor(
    private tableName: TableName,
    private ctx: GenericMutationCtx<DataModel>
  ) {}

  async one(
    document: WithOptionalDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
    >
  ): Promise<GenericId<TableName>> {
    // Apply validation with defaults
    return await this.ctx.db.insert(this.tableName, document as any)
  }

  async many(
    documents: WithOptionalDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
    >[]
  ): Promise<GenericId<TableName>[]> {
    // Apply validation with defaults to each document
    const results = await Promise.all(
      documents.map((doc) => this.ctx.db.insert(this.tableName, doc as any))
    )
    return results
  }

  withoutValidation(): InsertBuilderWithoutValidation<
    DataModel,
    TableName,
    Schema
  > {
    return new InsertBuilderWithoutValidationImpl(this.tableName, this.ctx)
  }
}

export class InsertBuilderWithoutValidationImpl<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends ServiceSchema = ServiceSchema
> implements InsertBuilderWithoutValidation<DataModel, TableName, Schema>
{
  constructor(
    private tableName: TableName,
    private ctx: GenericMutationCtx<DataModel>
  ) {}

  async one(
    document: WithRequiredDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
    >
  ): Promise<GenericId<TableName>> {
    // Apply minimal validation without defaults
    return await this.ctx.db.insert(this.tableName, document as any)
  }

  async many(
    documents: WithRequiredDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
    >[]
  ): Promise<GenericId<TableName>[]> {
    // Apply minimal validation without defaults to each document
    const results = await Promise.all(
      documents.map((doc) => this.ctx.db.insert(this.tableName, doc as any))
    )
    return results
  }
}
