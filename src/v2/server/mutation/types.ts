import {
  GenericDataModel,
  GenericDatabaseReader,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericId } from 'convex/values'
import { type GenericServiceSchema } from '../schema'
import * as z from 'zod/v4'
import type { CreateZodSchemaFromFields } from '../field'
import type { GenericRegisteredService } from '../service'

export type GetZodSchemaFromService<Service extends GenericRegisteredService> =
  CreateZodSchemaFromFields<Service['fields']>

export type GetServiceFromSchemaAndTableName<
  Schema extends GenericServiceSchema,
  TableName extends string
> = Schema extends GenericServiceSchema ? Schema['services'][TableName] : never

export interface InsertBuilder<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> {
  one(
    document: DocumentWithOptionalDefaults<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >
  ): Promise<GenericId<TableName>>
  many(
    documents: DocumentWithOptionalDefaults<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >[]
  ): Promise<GenericId<TableName>[]>
  withoutValidation(): InsertBuilderWithoutValidation<
    DataModel,
    TableName,
    GenericServiceSchema
  >
}

export interface InsertBuilderWithoutValidation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> {
  one(
    document: DocumentWithRequiredDefaults<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >
  ): Promise<GenericId<TableName>>
  many(
    documents: DocumentWithRequiredDefaults<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >[]
  ): Promise<GenericId<TableName>[]>
}

export interface ReplaceOneBuilder<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> {
  one(
    document: DocumentWithOptionalDefaults<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >
  ): Promise<GenericId<TableName>>
  withoutValidation(): ReplaceOneBuilderWithoutValidation<
    DataModel,
    TableName,
    GenericServiceSchema
  >
}

export interface ReplaceOneBuilderWithoutValidation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> {
  one(
    document: DocumentWithRequiredDefaults<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >
  ): Promise<GenericId<TableName>>
}

export interface ReplaceManyBuilder<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> {
  many(
    documents: DocumentWithOptionalDefaults<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >[]
  ): Promise<GenericId<TableName>[]>
  withoutValidation(): ReplaceManyBuilderWithoutValidation<
    DataModel,
    TableName,
    GenericServiceSchema
  >
}

export interface ReplaceManyBuilderWithoutValidation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> {
  many(
    documents: DocumentWithRequiredDefaults<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >[]
  ): Promise<GenericId<TableName>[]>
}

export interface PatchOneBuilder<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> {
  one(
    document: Partial<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >
  ): Promise<GenericId<TableName>>
  withoutValidation(): PatchOneBuilderWithoutValidation<
    DataModel,
    TableName,
    GenericServiceSchema
  >
}

export interface PatchOneBuilderWithoutValidation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> {
  one(
    document: Partial<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >
  ): Promise<GenericId<TableName>>
}

export interface PatchManyBuilder<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> {
  many(
    documents: Partial<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >[]
  ): Promise<GenericId<TableName>[]>
  withoutValidation(): PatchManyBuilderWithoutValidation<
    DataModel,
    TableName,
    GenericServiceSchema
  >
}

export interface PatchManyBuilderWithoutValidation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> {
  many(
    documents: Partial<
      GetZodSchemaFromService<
        GetServiceFromSchemaAndTableName<Schema, TableName>
      >
    >[]
  ): Promise<GenericId<TableName>[]>
}

// Main database interface that overrides Convex methods
export interface ServiceDatabaseWriter<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema = GenericServiceSchema
> extends GenericDatabaseReader<DataModel> {
  // Override insert - returns builder instead of Promise
  insert<TableName extends TableNamesInDataModel<DataModel>>(
    tableName: TableName
  ): InsertBuilder<DataModel, TableName, Schema>

  // Override replace - returns builder based on ID type
  replace<TableName extends TableNamesInDataModel<DataModel>>(
    id: GenericId<TableName>
  ): ReplaceOneBuilder<DataModel, TableName, Schema>

  replace<TableName extends TableNamesInDataModel<DataModel>>(
    ids: GenericId<TableName>[]
  ): ReplaceManyBuilder<DataModel, TableName, Schema>

  // Override patch - returns builder based on ID type
  patch<TableName extends TableNamesInDataModel<DataModel>>(
    id: GenericId<TableName>
  ): PatchOneBuilder<DataModel, TableName, Schema>

  patch<TableName extends TableNamesInDataModel<DataModel>>(
    ids: GenericId<TableName>[]
  ): PatchManyBuilder<DataModel, TableName, Schema>

  // Override delete - directly executable based on ID type
  delete<TableName extends TableNamesInDataModel<DataModel>>(
    id: GenericId<TableName>
  ): Promise<GenericId<TableName>>

  delete<TableName extends TableNamesInDataModel<DataModel>>(
    ids: GenericId<TableName>[]
  ): Promise<GenericId<TableName>[]>
}

// Helper types for validation
export type ServiceValidationContext<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema = GenericServiceSchema
> = {
  schema: Schema
  dataModel: DataModel
}

// Document type helpers that handle ZodDefault fields
export type DocumentWithOptionalDefaults<T> = T extends z.ZodObject<infer Shape>
  ? {
      [K in keyof Shape]: Shape[K] extends z.ZodDefault<infer Inner>
        ? z.infer<Inner> | undefined // Make ZodDefault fields optional
        : Shape[K] extends z.ZodType
        ? z.infer<Shape[K]>
        : never
    }
  : T

export type DocumentWithRequiredDefaults<T> = T extends z.ZodObject<infer Shape>
  ? {
      [K in keyof Shape]: Shape[K] extends z.ZodDefault<infer Inner>
        ? z.infer<Inner> // ZodDefault fields are required
        : Shape[K] extends z.ZodType
        ? z.infer<Shape[K]>
        : never
    }
  : T
