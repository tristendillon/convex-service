// Updater types for service.types.ts

import type { BuilderState, RelationsState } from './service.types'
import type {
  GenericTableIndexes,
  GenericTableSearchIndexes,
  GenericTableVectorIndexes,
  TableNamesInDataModel,
  GenericDataModel,
  Expand,
} from 'convex/server'
import type { z } from 'zod'
import {
  BaseOnConflict,
  CompositeUniqueFields,
  ConvexValidatorFromZod,
  ExtractFieldPathsWithConvexSystemFields,
  ExtractFieldPathsWithoutSystemFields,
  GetAllVIdPaths,
  OnDelete,
  UniqueField,
  ValueOrFunctionFromValidator,
} from './shared-types'
import { Zid } from 'convex-helpers/server/zod'

export type UpdateName<
  ZodSchema extends z.ZodTypeAny,
  NewTableName extends string
> = z.ZodIntersection<
  z.ZodObject<{
    _id: Zid<NewTableName>
    _creationTime: z.ZodNumber
  }>,
  ZodSchema
>

export type UpdateDefault<
  ZodSchema extends z.ZodTypeAny,
  State extends BuilderState<DocumentType, ZodSchema>,
  DocumentType extends ConvexValidatorFromZod<ZodSchema>,
  FieldPath extends ExtractFieldPathsWithoutSystemFields<DocumentType>,
  DefaultValue extends ValueOrFunctionFromValidator<DocumentType, FieldPath>
> = Expand<
  Omit<State, 'defaults'> & {
    defaults: State['defaults'] & { [K in FieldPath]: DefaultValue }
  }
>

export type UpdateUnique<
  ZodSchema extends z.ZodTypeAny,
  State extends BuilderState<DocumentType, ZodSchema>,
  DocumentType extends ConvexValidatorFromZod<ZodSchema>,
  FieldPath extends UniqueField<DocumentType>
> = Expand<
  Omit<State, 'uniques'> & { uniques: State['uniques'] & { fields: FieldPath } }
>

export type UpdateUniqueComposite<
  ZodSchema extends z.ZodTypeAny,
  State extends BuilderState<DocumentType, ZodSchema>,
  DocumentType extends ConvexValidatorFromZod<ZodSchema>,
  Fields extends CompositeUniqueFields<DocumentType>,
  OnConflictAction extends BaseOnConflict = 'fail'
> = Expand<
  Omit<State, 'uniques'> & {
    uniques: State['uniques'] & { fields: Fields; onConflict: OnConflictAction }
  }
>

export type UpdateValidateFunction<
  ZodSchema extends z.ZodTypeAny,
  State extends BuilderState<DocumentType, ZodSchema>,
  DocumentType extends ConvexValidatorFromZod<ZodSchema>,
  ValidationFn extends (ctx: any, document: any) => Promise<void> | void
> = Expand<Omit<State, 'validate'> & { validate: ValidationFn }>

export type UpdateValidateSchema<
  ZodSchema extends z.ZodTypeAny,
  State extends BuilderState<DocumentType, ZodSchema>,
  DocumentType extends ConvexValidatorFromZod<ZodSchema>,
  NewSchema extends z.ZodTypeAny
> = Expand<Omit<State, 'validate'> & { validate: NewSchema }>

export type UpdateRelation<
  ZodSchema extends z.ZodTypeAny,
  State extends BuilderState<DocumentType, ZodSchema>,
  DocumentType extends ConvexValidatorFromZod<ZodSchema>,
  FieldPath extends GetAllVIdPaths<DocumentType>,
  TableName extends TableNamesInDataModel<GenericDataModel>
> = State & {
  relations: Expand<
    RelationsState<DocumentType> & {
      [K in FieldPath]: {
        path: FieldPath
        table: TableName
        onDelete: OnDelete<DocumentType, FieldPath>
      }
    }
  >
}

export type UpdateIndex<
  ZodSchema extends z.ZodTypeAny,
  Indexes extends GenericTableIndexes,
  DocumentType extends ConvexValidatorFromZod<ZodSchema>,
  IndexName extends string,
  Fields extends ExtractFieldPathsWithConvexSystemFields<DocumentType>[]
> = Expand<Indexes & Record<IndexName, Fields>>

export type UpdateSearchIndex<
  ZodSchema extends z.ZodTypeAny,
  SearchIndexes extends GenericTableSearchIndexes,
  DocumentType extends ConvexValidatorFromZod<ZodSchema>,
  IndexName extends string,
  SearchField extends ExtractFieldPathsWithConvexSystemFields<DocumentType>,
  FilterFields extends ExtractFieldPathsWithConvexSystemFields<DocumentType> = never
> = Expand<
  SearchIndexes &
    Record<
      IndexName,
      {
        searchField: SearchField
        filterFields: FilterFields
      }
    >
>

export type UpdateVectorIndex<
  ZodSchema extends z.ZodTypeAny,
  VectorIndexes extends GenericTableVectorIndexes,
  DocumentType extends ConvexValidatorFromZod<ZodSchema>,
  IndexName extends string,
  VectorField extends ExtractFieldPathsWithConvexSystemFields<DocumentType>,
  FilterFields extends ExtractFieldPathsWithConvexSystemFields<DocumentType> = never
> = Expand<
  VectorIndexes &
    Record<
      IndexName,
      {
        vectorField: VectorField
        filterFields: FilterFields
      }
    >
>
