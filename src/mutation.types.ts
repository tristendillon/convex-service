import { CustomBuilder } from 'convex-helpers/server/customFunctions'
import {
  DocumentByName,
  GenericDataModel,
  GenericDatabaseWriter,
  GenericDocument,
  GenericMutationCtx,
  TableNamesInDataModel,
  WithoutSystemFields,
} from 'convex/server'
import { GenericId, GenericValidator, Validator } from 'convex/values'
import { GenericServiceSchema } from './schema.types'
import {
  DefaultsState,
  GenericRegisteredServiceDefinition,
} from './service.types'
import { z } from 'zod'
import { BetterOmit } from 'convex-helpers'

// Updated WithoutDefaults type that extracts field types from VObject

type ExtractDocumentType<T extends GenericValidator> = T extends Validator<
  infer DocType,
  any,
  any
>
  ? DocType
  : never

type WithoutDefaults<
  Document extends GenericValidator,
  Defaults extends DefaultsState<Document>
> = {
  // Extract all fields from the validator's document type
  [K in keyof ExtractDocumentType<Document> as K extends keyof Defaults
    ? never
    : K]: ExtractDocumentType<Document>[K]
} & {
  // Add optional default fields that don't exist in the document
  [K in Exclude<
    keyof Defaults,
    keyof ExtractDocumentType<Document>
  >]?: Defaults[K] extends (...args: unknown[]) => unknown
    ? ReturnType<Defaults[K]> | undefined
    : Defaults[K] | undefined
}

type InsertValue<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> = WithoutSystemFields<DocumentByName<DataModel, TableName>>

interface BaseInsertOperations<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> {
  one(value: InsertValue<DataModel, TableName>): Promise<GenericId<TableName>>

  many(
    values: InsertValue<DataModel, TableName>[]
  ): Promise<GenericId<TableName>[]>
}

type ServiceFromTableName<
  Schema extends GenericServiceSchema,
  TableName extends TableNamesInDataModel<GenericDataModel>
> = {
  [K in keyof Schema]: Schema[K]['tableName'] extends TableName
    ? Schema[K]
    : never
}[keyof Schema]

interface DefaultsInsertOperations<
  Schema extends GenericServiceSchema,
  TableName extends TableNamesInDataModel<GenericDataModel>,
  Service extends GenericRegisteredServiceDefinition = ServiceFromTableName<
    Schema,
    TableName
  >,
  Defaults extends DefaultsState = Service['$config']['state']['defaults']
> {
  one(
    value: WithoutDefaults<Service['validator'], Defaults>
  ): Promise<GenericId<TableName>>

  many(
    values: WithoutDefaults<Service['validator'], Defaults>[]
  ): Promise<GenericId<TableName>[]>
}

interface DatabaseInsertOperations<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema
> extends BaseInsertOperations<DataModel, TableName> {
  withDefaults(): DefaultsInsertOperations<Schema, TableName>
}

type EnhancedDatabaseWriter<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema
> = GenericDatabaseWriter<DataModel> & {
  insert<TableName extends TableNamesInDataModel<DataModel>>(
    table: TableName
  ): DatabaseInsertOperations<DataModel, TableName, Schema>
}

type ServiceMutationCtx<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema
> = GenericMutationCtx<DataModel> & {
  db: EnhancedDatabaseWriter<DataModel, Schema>
}

export type ServiceMutation<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema
> = CustomBuilder<
  'mutation',
  {},
  ServiceMutationCtx<DataModel, Schema>,
  {},
  {},
  'public',
  {}
>
