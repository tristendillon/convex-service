import {
  DocumentByName,
  GenericDataModel,
  TableNamesInDataModel,
  WithoutSystemFields,
} from 'convex/server'
import { GenericId } from 'convex/values'
import { ValidatableOperation } from './base.types'

// ============================================================================
// Type Utilities
// ============================================================================

type PatchValue<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> = Partial<WithoutSystemFields<DocumentByName<DataModel, TableName>>> & {
  [key: string]: any
}

// ============================================================================
// Patch Operation Interfaces
// ============================================================================

/**
 * Builder for single document patch operations.
 *
 * @public
 */
export interface PatchOneOperation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> {
  /**
   * Patch a single document by ID.
   *
   * @param id - The ID of the document to patch.
   * @param value - The partial document data to merge.
   * @returns A {@link ValidatableOperation} for the patch.
   */
  (
    id: GenericId<TableName>,
    value: PatchValue<DataModel, TableName>
  ): ValidatableOperation<GenericId<TableName>>
}

/**
 * Builder for batch document patch operations.
 *
 * @public
 */
export interface PatchManyOperation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> {
  /**
   * Patch multiple documents by ID.
   *
   * @param patches - Array of ID and value pairs for patching.
   * @returns A {@link ValidatableOperation} for the batch patch.
   */
  (
    patches: Array<{
      id: GenericId<TableName>
      value: PatchValue<DataModel, TableName>
    }>
  ): ValidatableOperation<GenericId<TableName>[]>
}

/**
 * Patch operations with validation support.
 *
 * @public
 */
export interface PatchOperationInitializer<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> {
  /**
   * Patch a single document.
   */
  one: PatchOneOperation<DataModel, TableName>
  /**
   * Patch multiple documents.
   */
  many: PatchManyOperation<DataModel, TableName>
}