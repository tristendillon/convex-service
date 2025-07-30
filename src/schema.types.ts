import type { GenericSchema } from 'convex/server'
import type { ServiceSchemaDefinition } from './schema'
import {
  ConvexServiceInterface,
  RegisteredServiceDefinition,
} from './service.types'

/**
 * Utility type to convert a ConvexServiceInterface to a RegisteredTableDefinition
 */
export type RegisterService<
  T extends ConvexServiceInterface<any, any, any, any, any, any, any, any>
> = T extends ConvexServiceInterface<
  infer ZodSchema,
  infer Intersection,
  infer TableName,
  infer DocumentType,
  infer Indexes,
  infer SearchIndexes,
  infer VectorIndexes,
  infer State
>
  ? RegisteredServiceDefinition<
      ZodSchema,
      Intersection,
      TableName,
      DocumentType,
      Indexes,
      SearchIndexes,
      VectorIndexes,
      State
    >
  : never

/**
 * Type for registered tables from a schema
 */
export type RegisteredTables<Schema extends GenericSchema> = {
  [K in keyof Schema]: Schema[K] extends ConvexServiceInterface<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >
    ? RegisterService<Schema[K]>
    : never
}

// Updated interface that works with GenericSchema
export interface ServiceSchemaDefinitionInterface<
  Schema extends GenericSchema
> {
  tables: RegisteredTables<Schema>
}
