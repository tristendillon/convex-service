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
import { type GenericServiceSchema } from '../../schema'

export class InsertBuilderImpl<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema,
  TInput extends ExtractDocumentTypeWithoutDefaults<
    Schema,
    TableName
  > = ExtractDocumentTypeWithoutDefaults<Schema, TableName>,
  TWithoutValidation extends ExtractDocumentType<
    Schema,
    TableName
  > = ExtractDocumentType<Schema, TableName>
> implements
    InsertBuilder<DataModel, TableName, Schema, TInput, TWithoutValidation>
{
  constructor(
    private tableName: TableName,
    private ctx: GenericMutationCtx<DataModel>
  ) {}

  async one(document: TInput): Promise<GenericId<TableName>> {
    // Apply validation with defaults
    return await this.ctx.db.insert(this.tableName, document as any)
  }

  async many(documents: TInput[]): Promise<GenericId<TableName>[]> {
    // Apply validation with defaults to each document
    const results = await Promise.all(
      documents.map((doc) => this.ctx.db.insert(this.tableName, doc as any))
    )
    return results
  }

  withoutValidation(): InsertBuilderWithoutValidation<
    DataModel,
    TableName,
    Schema,
    TWithoutValidation
  > {
    return new InsertBuilderWithoutValidationImpl(this.tableName, this.ctx)
  }
}

export class InsertBuilderWithoutValidationImpl<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema,
  TInput extends ExtractDocumentType<Schema, TableName> = ExtractDocumentType<
    Schema,
    TableName
  >
> implements InsertBuilderWithoutValidation<DataModel, TableName, Schema>
{
  constructor(
    private tableName: TableName,
    private ctx: GenericMutationCtx<DataModel>
  ) {}

  async one(document: TInput): Promise<GenericId<TableName>> {
    // Apply minimal validation without defaults
    return await this.ctx.db.insert(this.tableName, document as any)
  }

  async many(documents: TInput[]): Promise<GenericId<TableName>[]> {
    // Apply minimal validation without defaults to each document
    const results = await Promise.all(
      documents.map((doc) => this.ctx.db.insert(this.tableName, doc as any))
    )
    return results
  }
}
