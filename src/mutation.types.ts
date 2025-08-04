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
import { GenericId } from 'convex/values'
import { GenericServiceSchema } from './schema.types'
import {
  DefaultsState,
  GenericRegisteredServiceDefinition,
} from './service.types'
import { z } from 'zod'

type WithoutDefaults<
  Document extends GenericDocument,
  Defaults extends DefaultsState
> = {
  [K in keyof Document as K extends keyof Defaults ? never : K]: Document[K]
} & {
  [K in keyof Document as K extends keyof Defaults ? K : never]?: Document[K]
}
// Helper: Find the service that owns this table
type GetServiceForTable<
  Schema extends GenericServiceSchema,
  TableName extends string
> = {
  [ServiceKey in keyof Schema]: Schema[ServiceKey]['tableName'] extends TableName
    ? Schema[ServiceKey]
    : never
}[keyof Schema]

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

interface DefaultsInsertOperations<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Defaults extends DefaultsState
> {
  one(
    value: WithoutDefaults<InsertValue<DataModel, TableName>, Defaults>
  ): Promise<GenericId<TableName>>

  many(
    values: WithoutDefaults<InsertValue<DataModel, TableName>, Defaults>[]
  ): Promise<GenericId<TableName>[]>
}

interface DatabaseInsertOperations<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> extends BaseInsertOperations<DataModel, TableName> {
  withDefaults<Defaults extends DefaultsState>(
    defaults: Defaults
  ): DefaultsInsertOperations<DataModel, TableName, Defaults>
}

type EnhancedDatabaseWriter<DataModel extends GenericDataModel> =
  GenericDatabaseWriter<DataModel> & {
    insert<TableName extends TableNamesInDataModel<DataModel>>(
      table: TableName
    ): DatabaseInsertOperations<DataModel, TableName>
  }

type ServiceMutationCtx<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema
> = GenericMutationCtx<DataModel> & {
  db: EnhancedDatabaseWriter<DataModel>
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
