import { CustomBuilder } from 'convex-helpers/server/customFunctions'
import {
  DocumentByName,
  GenericDataModel,
  GenericDatabaseWriter,
  GenericMutationCtx,
  TableNamesInDataModel,
  WithoutSystemFields,
} from 'convex/server'
import { GenericId } from 'convex/values'
import { GenericServiceSchema } from './schema.types'
import { GenericRegisteredServiceDefinition } from './service.types'
import z from 'zod'

// Updated WithoutDefaults type that extracts field types from VObject
type WithoutDefaults<
  RegisteredService extends GenericRegisteredServiceDefinition
> = RegisteredService extends GenericRegisteredServiceDefinition
  ? z.infer<RegisteredService['schemaWithoutDefaults']>
  : never

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

// Base operations for regular inserts (full values required)
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
  Schema extends GenericServiceSchema
> {
  one(
    value: WithoutDefaults<GetServiceForTable<Schema, TableName>>
  ): Promise<GenericId<TableName>>

  many(
    values: WithoutDefaults<GetServiceForTable<Schema, TableName>>[]
  ): Promise<GenericId<TableName>[]>
}

interface DatabaseInsertOperations<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema
> extends BaseInsertOperations<DataModel, TableName> {
  withDefaults(): DefaultsInsertOperations<DataModel, TableName, Schema>
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
