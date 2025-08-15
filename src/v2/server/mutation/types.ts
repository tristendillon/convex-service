import {
  GenericDataModel,
  GenericDatabaseReader,
  TableNamesInDataModel,
  DocumentByName,
} from 'convex/server'
import { GenericId } from 'convex/values'
import { ServiceSchema } from '../schema'
import { GenericRegisteredService } from '../service'
import * as z from 'zod/v4'
import type {
  WithOptionalDefaults,
  WithRequiredDefaults,
} from './service-types'
import type { OmitSystemFields } from '../types'

export interface InsertBuilder<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  ServiceSchema extends any = any
> {
  one(
    document: WithOptionalDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
    >
  ): Promise<GenericId<TableName>>
  many(
    documents: WithOptionalDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
    >[]
  ): Promise<GenericId<TableName>[]>
  withoutValidation(): InsertBuilderWithoutValidation<
    DataModel,
    TableName,
    ServiceSchema
  >
}

export interface InsertBuilderWithoutValidation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  ServiceSchema extends any = any
> {
  one(
    document: WithRequiredDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
    >
  ): Promise<GenericId<TableName>>
  many(
    documents: WithRequiredDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
    >[]
  ): Promise<GenericId<TableName>[]>
}

export interface ReplaceOneBuilder<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  ServiceSchema extends any = any
> {
  one(
    document: WithOptionalDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
    >
  ): Promise<GenericId<TableName>>
  withoutValidation(): ReplaceOneBuilderWithoutValidation<
    DataModel,
    TableName,
    ServiceSchema
  >
}

export interface ReplaceOneBuilderWithoutValidation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  ServiceSchema extends any = any
> {
  one(
    document: WithRequiredDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
    >
  ): Promise<GenericId<TableName>>
}

export interface ReplaceManyBuilder<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  ServiceSchema extends any = any
> {
  many(
    documents: WithOptionalDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
    >[]
  ): Promise<GenericId<TableName>[]>
  withoutValidation(): ReplaceManyBuilderWithoutValidation<
    DataModel,
    TableName,
    ServiceSchema
  >
}

export interface ReplaceManyBuilderWithoutValidation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  ServiceSchema extends any = any
> {
  many(
    documents: WithRequiredDefaults<
      OmitSystemFields<DocumentByName<DataModel, TableName>>
    >[]
  ): Promise<GenericId<TableName>[]>
}

export interface PatchOneBuilder<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  ServiceSchema extends any = any
> {
  one(
    document: Partial<OmitSystemFields<DocumentByName<DataModel, TableName>>>
  ): Promise<GenericId<TableName>>
  withoutValidation(): PatchOneBuilderWithoutValidation<
    DataModel,
    TableName,
    ServiceSchema
  >
}

export interface PatchOneBuilderWithoutValidation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  ServiceSchema extends any = any
> {
  one(
    document: Partial<OmitSystemFields<DocumentByName<DataModel, TableName>>>
  ): Promise<GenericId<TableName>>
}

export interface PatchManyBuilder<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  ServiceSchema extends any = any
> {
  many(
    documents: Partial<OmitSystemFields<DocumentByName<DataModel, TableName>>>[]
  ): Promise<GenericId<TableName>[]>
  withoutValidation(): PatchManyBuilderWithoutValidation<
    DataModel,
    TableName,
    ServiceSchema
  >
}

export interface PatchManyBuilderWithoutValidation<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  ServiceSchema extends any = any
> {
  many(
    documents: Partial<OmitSystemFields<DocumentByName<DataModel, TableName>>>[]
  ): Promise<GenericId<TableName>[]>
}

// Main database interface that overrides Convex methods
export interface ServiceDatabaseWriter<
  DataModel extends GenericDataModel,
  Schema extends ServiceSchema = ServiceSchema
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
  Schema extends ServiceSchema = ServiceSchema
> = {
  schema: Schema
  dataModel: DataModel
}

// Document type helpers that handle ZodDefault fields
export type DocumentWithDefaults<T> = T extends z.ZodObject<infer Shape>
  ? {
      [K in keyof Shape]: Shape[K] extends z.ZodDefault<infer Inner>
        ? z.infer<Inner> | undefined // Make ZodDefault fields optional
        : Shape[K] extends z.ZodType
        ? z.infer<Shape[K]>
        : never
    }
  : T

export type DocumentWithoutDefaults<T> = T extends z.ZodObject<infer Shape>
  ? {
      [K in keyof Shape]: Shape[K] extends z.ZodDefault<infer Inner>
        ? z.infer<Inner> // ZodDefault fields are required
        : Shape[K] extends z.ZodType
        ? z.infer<Shape[K]>
        : never
    }
  : T
