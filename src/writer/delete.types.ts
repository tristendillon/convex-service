import { GenericDataModel, TableNamesInDataModel } from 'convex/server'
import { GenericId } from 'convex/values'

// ============================================================================
// Delete Operation Interfaces
// ============================================================================

/**
 * Builder for single document delete operations.
 *
 * @public
 */
export interface DeleteOneOperation<
  TableName extends TableNamesInDataModel<GenericDataModel>
> {
  /**
   * Delete a single document by ID.
   *
   * @param id - The ID of the document to delete.
   * @returns A promise that resolves to the deleted document's ID.
   */
  <Id extends GenericId<TableName>>(id: Id): Promise<Id>
}

/**
 * Builder for batch document delete operations.
 *
 * @public
 */
export interface DeleteManyOperation<
  TableName extends TableNamesInDataModel<GenericDataModel>
> {
  /**
   * Delete multiple documents by ID.
   *
   * @param ids - Array of document IDs to delete.
   * @returns A promise that resolves to the array of deleted document IDs.
   */
  <Id extends GenericId<TableName>>(ids: Id[]): Promise<Id[]>
}

/**
 * Delete operations.
 *
 * @public
 */
export interface DeleteOperationInitializer<
  TableName extends TableNamesInDataModel<GenericDataModel>
> {
  /**
   * Delete a single document.
   */
  one: DeleteOneOperation<TableName>
  /**
   * Delete multiple documents.
   */
  many: DeleteManyOperation<TableName>
}
