import {
  DocumentByName,
  GenericDataModel,
  TableNamesInDataModel,
  WithoutSystemFields,
} from 'convex/server'
import { GenericServiceSchema } from '../schema.types'
import { GenericId, GenericValidator, Validator } from 'convex/values'
import {
  DefaultsState,
  GenericRegisteredServiceDefinition,
} from '../service.types'
import { ValidatableOperation } from './base.types'

// ============================================================================
// Type Utilities
// ============================================================================

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
  [K in keyof ExtractDocumentType<Document> as K extends keyof Defaults
    ? never
    : K]: ExtractDocumentType<Document>[K]
} & {
  [K in Exclude<
    keyof Defaults,
    keyof ExtractDocumentType<Document>
  >]?: Defaults[K] extends (...args: unknown[]) => unknown
    ? ReturnType<Defaults[K]> | undefined
    : Defaults[K] | undefined
}

type ServiceFromTableName<
  Schema extends GenericServiceSchema,
  TableName extends TableNamesInDataModel<GenericDataModel>
> = {
  [K in keyof Schema]: Schema[K]['tableName'] extends TableName
    ? Schema[K]
    : never
}[keyof Schema]

type InsertValue<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> = WithoutSystemFields<DocumentByName<DataModel, TableName>>

// ============================================================================
// Insert Operation Interfaces
// ============================================================================

/**
 * Builder for single document insert operations.
 *
 * @public
 */
export interface InsertOneOperation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> {
  /**
   * Insert a single document into the table.
   *
   * @param value - The document to insert.
   * @returns A {@link ValidatableOperation} for the insert.
   */
  (value: InsertValue<DataModel, TableName>): ValidatableOperation<
    GenericId<TableName>
  >
}

/**
 * Builder for batch document insert operations.
 *
 * @public
 */
export interface InsertManyOperation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> {
  /**
   * Insert multiple documents into the table.
   *
   * @param values - The documents to insert.
   * @returns A {@link ValidatableOperation} for the batch insert.
   */
  (values: InsertValue<DataModel, TableName>[]): ValidatableOperation<
    GenericId<TableName>[]
  >
}

/**
 * Builder for single document insert operations with defaults applied.
 *
 * @public
 */
export interface InsertOneWithDefaultsOperation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema,
  Service extends GenericRegisteredServiceDefinition = ServiceFromTableName<
    Schema,
    TableName
  >,
  Defaults extends DefaultsState<
    Service['validator']
  > = Service['$config']['state']['defaults']
> {
  /**
   * Insert a single document with default values applied.
   *
   * @param value - The document to insert (fields with defaults are optional).
   * @returns A {@link ValidatableOperation} for the insert.
   */
  (
    value: WithoutDefaults<Service['validator'], Defaults>
  ): ValidatableOperation<GenericId<TableName>>
}

/**
 * Builder for batch document insert operations with defaults applied.
 *
 * @public
 */
export interface InsertManyWithDefaultsOperation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema,
  Service extends GenericRegisteredServiceDefinition = ServiceFromTableName<
    Schema,
    TableName
  >,
  Defaults extends DefaultsState<
    Service['validator']
  > = Service['$config']['state']['defaults']
> {
  /**
   * Insert multiple documents with default values applied.
   *
   * @param values - The documents to insert (fields with defaults are optional).
   * @returns A {@link ValidatableOperation} for the batch insert.
   */
  (
    values: WithoutDefaults<Service['validator'], Defaults>[]
  ): ValidatableOperation<GenericId<TableName>[]>
}

/**
 * Insert operations with defaults support.
 *
 * @public
 */
export interface InsertWithDefaultsOperations<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema
> {
  /**
   * Insert a single document with defaults applied.
   */
  one: InsertOneWithDefaultsOperation<DataModel, TableName, Schema>
  /**
   * Insert multiple documents with defaults applied.
   */
  many: InsertManyWithDefaultsOperation<DataModel, TableName, Schema>
}

/**
 * The {@link InsertOperationInitializer} interface is the entry point for building insert operations
 * on a database table with service validation and defaults support.
 *
 * For convenience, {@link InsertOperationInitializer} provides direct access to insert operations
 * without defaults, while also providing the {@link InsertOperationInitializer["withDefaults"]} method
 * for operations that should apply default values.
 *
 * @public
 */
export interface InsertOperationInitializer<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema
> {
  /**
   * Insert a single document without applying defaults.
   */
  one: InsertOneOperation<DataModel, TableName>
  /**
   * Insert multiple documents without applying defaults.
   */
  many: InsertManyOperation<DataModel, TableName>

  /**
   * Get insert operations that apply default values before insertion.
   *
   * @returns Insert operations that will apply configured defaults.
   */
  withDefaults(): InsertWithDefaultsOperations<DataModel, TableName, Schema>
}