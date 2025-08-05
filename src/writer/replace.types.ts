import {
  DocumentByName,
  GenericDataModel,
  TableNamesInDataModel,
  WithoutSystemFields,
} from 'convex/server'
import { GenericId, GenericValidator, Validator } from 'convex/values'
import { ValidatableOperation } from './base.types'
import { GenericServiceSchema } from '../schema.types'
import {
  DefaultsState,
  GenericRegisteredServiceDefinition,
} from '../service.types'

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

type ReplaceValue<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> = WithoutSystemFields<DocumentByName<DataModel, TableName>>

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
  ): ValidatableOperation<GenericId<TableName>>
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
  ): ValidatableOperation<GenericId<TableName>[]>
}

/**
 * Builder for single document replace operations with defaults applied.
 *
 * @public
 */
export interface ReplaceOneWithDefaultsOperation<
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
   * Replace a single document with default values applied.
   *
   * @param id - The ID of the document to replace.
   * @param value - The document to replace with (fields with defaults are optional).
   * @returns A {@link ValidatableOperation} for the replace.
   */
  (
    id: GenericId<TableName>,
    value: WithoutDefaults<Service['validator'], Defaults>
  ): ValidatableOperation<GenericId<TableName>>
}

/**
 * Builder for batch document replace operations with defaults applied.
 *
 * @public
 */
export interface ReplaceManyWithDefaultsOperation<
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
   * Replace multiple documents with default values applied.
   *
   * @param replacements - Array of ID and value pairs for replacement (fields with defaults are optional).
   * @returns A {@link ValidatableOperation} for the batch replace.
   */
  (
    replacements: Array<{
      id: GenericId<TableName>
      value: WithoutDefaults<Service['validator'], Defaults>
    }>
  ): ValidatableOperation<GenericId<TableName>[]>
}

/**
 * Replace operations with defaults support.
 *
 * @public
 */
export interface ReplaceWithDefaultsOperations<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema
> {
  /**
   * Replace a single document with defaults applied.
   */
  one: ReplaceOneWithDefaultsOperation<DataModel, TableName, Schema>
  /**
   * Replace multiple documents with defaults applied.
   */
  many: ReplaceManyWithDefaultsOperation<DataModel, TableName, Schema>
}

/**
 * Replace operations with validation support.
 *
 * @public
 */
export interface ReplaceOperationInitializer<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> {
  /**
   * Replace a single document.
   */
  one: ReplaceOneOperation<DataModel, TableName>
  /**
   * Replace multiple documents.
   */
  many: ReplaceManyOperation<DataModel, TableName>

  /**
   * Get replace operations that apply default values before replacement.
   *
   * @returns Replace operations that will apply configured defaults.
   */
  withDefaults(): ReplaceWithDefaultsOperations<DataModel, TableName, Schema>
}