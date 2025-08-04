import {
  DocumentByName,
  GenericDataModel,
  GenericDatabaseWriter,
  TableNamesInDataModel,
  WithoutSystemFields,
} from 'convex/server'
import { GenericServiceSchema } from './schema.types'
import { GenericId, GenericValidator, Validator } from 'convex/values'
import {
  DefaultsState,
  GenericRegisteredServiceDefinition,
} from './service.types'

// ============================================================================
// Core Operation Abstractions
// ============================================================================

/**
 * An operation that can be executed to perform a database mutation.
 *
 * @public
 */
export interface ExecutableOperation<TReturn> {
  /**
   * Execute the operation and return the result.
   *
   * @returns The result of the operation.
   */
  execute(): Promise<TReturn>
}

/**
 * An operation that supports validation before execution.
 *
 * For convenience, {@link ValidatableOperation} extends the {@link ExecutableOperation} interface,
 * allowing direct execution without validation.
 *
 * @public
 */
export interface ValidatableOperation<TReturn>
  extends ExecutableOperation<TReturn> {
  /**
   * Validate the operation data and return an executable operation.
   *
   * @returns An {@link ExecutableOperation} that will perform the validated operation.
   * @throws Will throw an error if validation fails.
   */
  validate(): ExecutableOperation<TReturn>
}

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

type ReplaceValue<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> = InsertValue<DataModel, TableName>

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

// ============================================================================
// Replace Operation Interfaces
// ============================================================================

/**
 * Builder for single document replace operations.
 *
 * @public
 */
export interface ReplaceOneOperation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> {
  /**
   * Replace a single document by ID.
   *
   * @param id - The ID of the document to replace.
   * @param value - The new document data.
   * @returns A {@link ValidatableOperation} for the replace.
   */
  (
    id: GenericId<TableName>,
    value: ReplaceValue<DataModel, TableName>
  ): ValidatableOperation<DocumentByName<DataModel, TableName>>
}

/**
 * Builder for batch document replace operations.
 *
 * @public
 */
export interface ReplaceManyOperation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> {
  /**
   * Replace multiple documents by ID.
   *
   * @param replacements - Array of ID and value pairs for replacement.
   * @returns A {@link ValidatableOperation} for the batch replace.
   */
  (
    replacements: Array<{
      id: GenericId<TableName>
      value: ReplaceValue<DataModel, TableName>
    }>
  ): ValidatableOperation<DocumentByName<DataModel, TableName>[]>
}

/**
 * Replace operations with validation support.
 *
 * @public
 */
export interface ReplaceOperationInitializer<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> {
  /**
   * Replace a single document.
   */
  one: ReplaceOneOperation<DataModel, TableName>
  /**
   * Replace multiple documents.
   */
  many: ReplaceManyOperation<DataModel, TableName>
}

// ============================================================================
// Delete Operation Interfaces
// ============================================================================

/**
 * Builder for single document delete operations.
 *
 * @public
 */
export interface DeleteOneOperation {
  /**
   * Delete a single document by ID.
   *
   * @param id - The ID of the document to delete.
   * @returns A promise that resolves to the deleted document's ID.
   */
  <Id extends GenericId<string>>(id: Id): Promise<Id>
}

/**
 * Builder for batch document delete operations.
 *
 * @public
 */
export interface DeleteManyOperation {
  /**
   * Delete multiple documents by ID.
   *
   * @param ids - Array of document IDs to delete.
   * @returns A promise that resolves to the array of deleted document IDs.
   */
  <Id extends GenericId<string>>(ids: Id[]): Promise<Id[]>
}

/**
 * Delete operations.
 *
 * @public
 */
export interface DeleteOperationInitializer {
  /**
   * Delete a single document.
   */
  one: DeleteOneOperation
  /**
   * Delete multiple documents.
   */
  many: DeleteManyOperation
}

// ============================================================================
// Main Service Database Writer Interface
// ============================================================================

/**
 * The {@link ServiceDatabaseWriter} interface extends the standard Convex database writer
 * with service-aware operations that support validation and defaults.
 *
 * This interface provides the same API as the standard database writer but with enhanced
 * type safety and runtime validation based on your service schema configuration.
 *
 * @public
 */
export type ServiceDatabaseWriter<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema
> = GenericDatabaseWriter<DataModel> & {
  /**
   * Begin building insert operations for the given table.
   *
   * Insert operations support validation and default value application based on
   * your service schema configuration.
   *
   * @param tableName - The name of the table to insert into.
   * @returns An {@link InsertOperationInitializer} to build insert operations.
   */
  insert<TableName extends TableNamesInDataModel<DataModel>>(
    tableName: TableName
  ): InsertOperationInitializer<DataModel, TableName, Schema>

  /**
   * Begin building replace operations.
   *
   * Replace operations support validation based on your service schema configuration.
   *
   * @returns A {@link ReplaceOperationInitializer} to build replace operations.
   */
  replace<TableName extends TableNamesInDataModel<DataModel>>(
    tableName: TableName
  ): ReplaceOperationInitializer<DataModel, TableName>

  /**
   * Begin building delete operations.
   *
   * @returns A {@link DeleteOperationInitializer} to build delete operations.
   */
  delete(): DeleteOperationInitializer
}
