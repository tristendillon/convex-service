import { GenericDataModel, TableNamesInDataModel } from 'convex/server'
import { GenericId } from 'convex/values'
import { ServiceSchema, type GenericServiceSchema } from '../schema'
import { GenericRegisteredService } from '../service'
import { ServiceField } from '../field'
import * as z from 'zod/v4'

// Extract service information from schema
export type ServiceFromSchema<
  Schema extends GenericServiceSchema,
  TableName extends string
> = Schema extends GenericServiceSchema ? GenericRegisteredService : never

// Extract field definitions from a service
export type ServiceFields<Service extends GenericRegisteredService> =
  Service extends GenericRegisteredService ? any : never

// Check if a field has a default value
export type HasDefault<Field> = Field extends ServiceField<z.ZodDefault<any>>
  ? true
  : Field extends z.ZodDefault<any>
  ? true
  : false

// Make default fields optional in document types
export type WithOptionalDefaults<T extends Record<string, any>> = {
  [K in keyof T]: HasDefault<T[K]> extends true
    ? T[K] extends ServiceField<infer ZodType>
      ? ZodType extends z.ZodDefault<infer Inner>
        ? z.infer<Inner> | undefined
        : z.infer<ZodType>
      : T[K] extends z.ZodDefault<infer Inner>
      ? z.infer<Inner> | undefined
      : T[K] extends z.ZodType
      ? z.infer<T[K]>
      : never
    : T[K] extends ServiceField<infer ZodType>
    ? z.infer<ZodType>
    : T[K] extends z.ZodType
    ? z.infer<T[K]>
    : never
}

// Make all fields required (for withoutValidation)
export type WithRequiredDefaults<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends ServiceField<infer ZodType>
    ? ZodType extends z.ZodDefault<infer Inner>
      ? z.infer<Inner>
      : z.infer<ZodType>
    : T[K] extends z.ZodDefault<infer Inner>
    ? z.infer<Inner>
    : T[K] extends z.ZodType
    ? z.infer<T[K]>
    : never
}

// Enhanced document types for service operations
export type ServiceInsertDocument<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  TableName extends TableNamesInDataModel<DataModel>
> = WithOptionalDefaults<
  ServiceFields<ServiceFromSchema<Schema, TableName & string>>
>

export type ServiceInsertDocumentWithoutValidation<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  TableName extends TableNamesInDataModel<DataModel>
> = WithRequiredDefaults<
  ServiceFields<ServiceFromSchema<Schema, TableName & string>>
>

// Enhanced builder interfaces with better typing
export interface TypedInsertBuilder<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  TableName extends TableNamesInDataModel<DataModel>
> {
  one(
    document: ServiceInsertDocument<DataModel, Schema, TableName>
  ): Promise<GenericId<TableName>>

  many(
    documents: ServiceInsertDocument<DataModel, Schema, TableName>[]
  ): Promise<GenericId<TableName>[]>

  withoutValidation(): TypedInsertBuilderWithoutValidation<
    DataModel,
    Schema,
    TableName
  >
}

export interface TypedInsertBuilderWithoutValidation<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  TableName extends TableNamesInDataModel<DataModel>
> {
  one(
    document: ServiceInsertDocumentWithoutValidation<
      DataModel,
      Schema,
      TableName
    >
  ): Promise<GenericId<TableName>>

  many(
    documents: ServiceInsertDocumentWithoutValidation<
      DataModel,
      Schema,
      TableName
    >[]
  ): Promise<GenericId<TableName>[]>
}

// Utility types for validation
export type ValidationMode = 'withDefaults' | 'withoutDefaults'

export type DocumentForValidation<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  TableName extends TableNamesInDataModel<DataModel>,
  Mode extends ValidationMode
> = Mode extends 'withDefaults'
  ? ServiceInsertDocument<DataModel, Schema, TableName>
  : ServiceInsertDocumentWithoutValidation<DataModel, Schema, TableName>

// Helper type to determine if a table exists in a schema
export type TableExistsInSchema<
  Schema extends GenericServiceSchema,
  TableName extends string
> = TableName extends keyof ReturnType<Schema['getService']> ? true : false

// Extract all table names from a service schema
export type TableNamesFromSchema<Schema extends GenericServiceSchema> =
  Schema extends GenericServiceSchema ? string : never
