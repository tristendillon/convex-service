import { zodToConvex } from 'convex-helpers/server/zod'
import {
  Expand,
  GenericDataModel,
  GenericQueryCtx,
  SystemFields,
  TableNamesInDataModel,
} from 'convex/server'
import {
  GenericId,
  GenericValidator,
  VArray,
  VId,
  VObject,
  VUnion,
  Validator,
  ValidatorJSON,
} from 'convex/values'
import { z } from 'zod'

type ValueOrFunction<T> = T | (() => T)

type ExtractDocumentType<T extends GenericValidator> = T extends Validator<
  infer DocType,
  any,
  any
>
  ? DocType
  : never

type GetFieldType<
  DocType,
  FieldPath extends string | number | symbol
> = DocType extends Record<string | number | symbol, any>
  ? FieldPath extends keyof DocType
    ? DocType[FieldPath]
    : FieldPath extends `${infer First}.${infer Rest}`
    ? First extends keyof DocType
      ? GetFieldType<DocType[First], Rest>
      : unknown
    : unknown
  : unknown

export type ReplacePeriodWithUnderscore<T extends string> =
  T extends `${infer Before}.${infer After}`
    ? `${Before}_${ReplacePeriodWithUnderscore<After>}`
    : T

export type JoinFieldPathsWithUnderscores<T extends readonly string[]> =
  T extends readonly [infer First, ...infer Rest]
    ? First extends string
      ? Rest extends readonly string[]
        ? Rest['length'] extends 0
          ? ReplacePeriodWithUnderscore<First>
          : `${ReplacePeriodWithUnderscore<First>}_${JoinFieldPathsWithUnderscores<Rest>}`
        : never
      : never
    : ''

export type ExtractFieldPathsWithConvexSystemFields<
  T extends Validator<any, any, any>
> = T['fieldPaths'] | keyof SystemFields

export type ExtractFieldPathsWithSystemFields<
  T extends Validator<any, any, any>,
  TableName extends string
> = T['fieldPaths'] | keyof SystemFieldsWithId<TableName>

export type ExtractFieldPathsWithoutSystemFields<
  T extends Validator<any, any, any>
> = T['fieldPaths']

export type ValueOrFunctionFromValidator<
  ValidatorType extends GenericValidator,
  FieldPath extends ExtractFieldPathsWithConvexSystemFields<ValidatorType>
> = FieldPath extends keyof SystemFields
  ? never
  : GetFieldType<
      ExtractDocumentType<ValidatorType>,
      FieldPath
    > extends infer FieldType
  ? FieldType extends never
    ? unknown
    : ValueOrFunction<FieldType>
  : ValueOrFunction<unknown>

export type SystemFieldsWithId<TableName extends string> = SystemFields & {
  _id: GenericId<TableName>
}

export type GetValidatorAtPath<
  V extends Validator<any, any, any>,
  Path extends string
> = Path extends `${infer Key}.${infer Rest}`
  ? V extends VObject<any, infer Fields, any, any>
    ? Key extends keyof Fields
      ? GetValidatorAtPath<Fields[Key], Rest>
      : never
    : V extends VArray<any, infer Element, any>
    ? GetValidatorAtPath<Element, Path>
    : never
  : V extends VObject<any, infer Fields, any, any>
  ? Path extends keyof Fields
    ? Fields[Path]
    : never
  : V extends VArray<any, infer Element, any>
  ? GetValidatorAtPath<Element, Path>
  : never

export type IsOptionalValidator<V extends Validator<any, any, any>> =
  V extends Validator<any, 'optional', any> ? true : false

export type BaseOnDelete = 'cascade' | 'fail'
export type BaseOnConflict = 'replace' | 'fail'

export type OnDelete<
  DocumentType extends Validator<any, any, any>,
  FieldPath extends GetAllVIdPaths<DocumentType>
> = GetValidatorAtPath<DocumentType, FieldPath> extends infer FieldValidator
  ? FieldValidator extends Validator<any, any, any>
    ?
        | BaseOnDelete
        | (IsOptionalValidator<FieldValidator> extends true
            ? 'setOptional'
            : never)
    : BaseOnDelete
  : BaseOnDelete

export type JoinFieldPaths<
  Start extends string,
  End extends string
> = `${Start}.${End}`
export type GetAllVIdPaths<
  V extends Validator<any, any, any>,
  Prefix extends string = '',
  Depth extends number = 0
> = Depth extends 4 // Reduced depth limit from 8 to 4
  ? never
  : V extends VId<any, any>
  ? Prefix extends ''
    ? never
    : Prefix
  : V extends VObject<any, infer Fields, any, any>
  ? Fields extends Record<string, Validator<any, any, any>>
    ? {
        [K in keyof Fields]: K extends string
          ? Fields[K] extends VId<any, any>
            ? Prefix extends ''
              ? K
              : `${Prefix}.${K}`
            : GetAllVIdPaths<
                Fields[K],
                Prefix extends '' ? K : `${Prefix}.${K}`,
                Add1<Depth>
              >
          : never
      }[keyof Fields]
    : never
  : V extends VArray<any, infer Element, any>
  ? GetAllVIdPaths<Element, Prefix, Add1<Depth>>
  : V extends VUnion<any, infer Members, any, any>
  ? Members extends readonly Validator<any, any, any>[]
    ? {
        [K in keyof Members]: Members[K] extends Validator<any, any, any>
          ? GetAllVIdPaths<Members[K], Prefix, Add1<Depth>>
          : never
      }[number]
    : never
  : never

type Add1<N extends number> = N extends 0
  ? 1
  : N extends 1
  ? 2
  : N extends 2
  ? 3
  : 4
export type ExportedTableDefinition = {
  indexes: ExportedIndex[]
  searchIndexes: ExportedSearchIndex[]
  vectorIndexes: ExportedVectorIndex[]
  documentType: ValidatorJSON
}

export type ExportedIndex<
  DocumentType extends Validator<any, any, any> = Validator<any, any, any>
> = {
  indexDescriptor: string
  fields: ExtractFieldPathsWithConvexSystemFields<DocumentType>[]
}

export type ExportedSearchIndex<
  DocumentType extends Validator<any, any, any> = Validator<any, any, any>
> = {
  indexDescriptor: string
  searchField: ExtractFieldPathsWithConvexSystemFields<DocumentType>
  filterFields: ExtractFieldPathsWithConvexSystemFields<DocumentType>[]
}

export type ExportedVectorIndex<
  DocumentType extends Validator<any, any, any> = Validator<any, any, any>
> = {
  indexDescriptor: string
  vectorField: ExtractFieldPathsWithConvexSystemFields<DocumentType>
  dimensions: number
  filterFields: ExtractFieldPathsWithConvexSystemFields<DocumentType>[]
}

export type ConvexValidatorFromZod<ZodSchema extends z.ZodTypeAny> = ReturnType<
  typeof zodToConvex<ZodSchema>
>

export type FunctionValidateConstraint<
  ZodSchema extends z.ZodTypeAny = z.ZodTypeAny
> = (
  ctx: GenericQueryCtx<GenericDataModel>,
  document: Expand<
    z.infer<ZodSchema> &
      SystemFieldsWithId<TableNamesInDataModel<GenericDataModel>>
  >
) => Promise<void> | void
export type ValidateConstraint<ZodSchema extends z.ZodTypeAny = z.ZodTypeAny> =
  | undefined
  | FunctionValidateConstraint<ZodSchema>
  | ZodSchema

export type RelationConstraint<
  DocumentType extends GenericValidator = GenericValidator,
  FieldPath extends GetAllVIdPaths<DocumentType> = GetAllVIdPaths<DocumentType>
> = {
  path: FieldPath
  table: TableNamesInDataModel<GenericDataModel>
  onDelete: BaseOnDelete
}

export type UniqueField<
  DocumentType extends GenericValidator = GenericValidator
> = ExtractFieldPathsWithoutSystemFields<DocumentType>

export type CompositeUniqueFields<
  DocumentType extends GenericValidator = GenericValidator
> = [
  UniqueField<DocumentType>,
  UniqueField<DocumentType>,
  ...UniqueField<DocumentType>[]
]

export type UniqueConstraint<
  DocumentType extends GenericValidator = GenericValidator
> = {
  fields: UniqueField<DocumentType> | CompositeUniqueFields<DocumentType>
  onConflict: BaseOnConflict
}
