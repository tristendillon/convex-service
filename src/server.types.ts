import { Expand } from 'convex-helpers'
import {
  SystemFields,
  GenericDataModel,
  AnyDataModel,
  IdField,
  SystemIndexes,
  SchemaDefinition,
  GenericTableIndexes,
  GenericTableSearchIndexes,
  GenericTableVectorIndexes,
  GenericFieldPaths,
  GenericDocument,
} from 'convex/server'
import { GenericValidator, Validator } from 'convex/values'
import { GenericServiceSchema } from './schema.types'
import { BuilderState, RegisteredServiceDefinition } from './service.types'

/**
 * @public
 */
type ExtractFieldPaths<T extends Validator<any, any, any>> =
  // Add in the system fields available in index definitions.
  // This should be everything except for `_id` because thats added to indexes
  // automatically.
  T['fieldPaths'] | keyof SystemFields

/**
 * @public
 */
export type ExtractDocument<T extends Validator<any, any, any>> =
  // Add the system fields to `Value` (except `_id` because it depends on
  //the table name) and trick TypeScript into expanding them.
  Expand<SystemFields & T['type']>

/**
 * @public
 */
export type DataModelFromServiceSchemaDefinition<
  SchemaDef extends GenericServiceSchema
> = {
  [ServiceName in keyof SchemaDef['services'] &
    string as SchemaDef['services'][ServiceName] extends RegisteredServiceDefinition<
    any,
    any,
    infer TableName,
    any,
    any,
    any,
    any,
    any
  >
    ? TableName
    : never]: SchemaDef['services'][ServiceName] extends RegisteredServiceDefinition<
    any,
    any,
    infer TableName extends string,
    infer DocumentType extends GenericValidator,
    infer Indexes extends GenericTableIndexes,
    infer SearchIndexes extends GenericTableSearchIndexes,
    infer VectorIndexes extends GenericTableVectorIndexes,
    infer State
  >
    ? {
        document: Expand<IdField<TableName> & ExtractDocument<DocumentType>>
        fieldPaths: keyof IdField<TableName> | ExtractFieldPaths<DocumentType>
        indexes: Expand<Indexes & SystemIndexes>
        searchIndexes: SearchIndexes
        vectorIndexes: VectorIndexes
        state: State
      }
    : never
}

// export interface GenericServiceDataModel extends GenericDataModel {
//   [x: string]: {
//     document: GenericDocument
//     fieldPaths: GenericFieldPaths
//     indexes: GenericTableIndexes
//     searchIndexes: GenericTableSearchIndexes
//     vectorIndexes: GenericTableVectorIndexes
//     state: BuilderState
//   }
// }
