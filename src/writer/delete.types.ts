import { GenericId } from 'convex/values'

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