import {
  GenericDataModel,
  GenericDatabaseWriter,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericServiceSchema } from './schema.types'
import { InsertOperationInitializer } from './writer/insert.types'
import { ReplaceOperationInitializer } from './writer/replace.types'
import { PatchOperationInitializer } from './writer/patch.types'
import { DeleteOperationInitializer } from './writer/delete.types'

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
  ): ReplaceOperationInitializer<DataModel, TableName, Schema>

  /**
   * Begin building patch operations.
   *
   * Patch operations support validation based on your service schema configuration.
   *
   * @returns A {@link PatchOperationInitializer} to build patch operations.
   */
  patch<TableName extends TableNamesInDataModel<DataModel>>(
    tableName: TableName
  ): PatchOperationInitializer<DataModel, TableName>

  /**
   * Begin building delete operations for the given table.
   *
   * Delete operations support relational cascade management based on your service schema configuration.
   *
   * @param tableName - The name of the table to delete from.
   * @returns A {@link DeleteOperationInitializer} to build delete operations.
   */
  delete<TableName extends TableNamesInDataModel<DataModel>>(
    tableName: TableName
  ): DeleteOperationInitializer<TableName>
}
