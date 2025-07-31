import {
  Expand,
  GenericDataModel,
  GenericTableIndexes,
  GenericTableSearchIndexes,
  GenericTableVectorIndexes,
  SearchIndexConfig,
  SystemFields,
  TableDefinition,
  TableNamesInDataModel,
  VectorIndexConfig,
  type GenericQueryCtx,
} from 'convex/server'
import { z } from 'zod'
import { zodToConvex, type Zid } from 'convex-helpers/server/zod'
import {
  GenericId,
  GenericValidator,
  VArray,
  VId,
  VLiteral,
  VObject,
  VUnion,
  Validator,
  type ValidatorJSON,
} from 'convex/values'

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

type ReplacePeriodWithUnderscore<T extends string> =
  T extends `${infer Before}.${infer After}`
    ? `${Before}_${ReplacePeriodWithUnderscore<After>}`
    : T

// Helper type to join field paths with underscores
type JoinFieldPathsWithUnderscores<T extends readonly string[]> =
  T extends readonly [infer First, ...infer Rest]
    ? First extends string
      ? Rest extends readonly string[]
        ? Rest['length'] extends 0
          ? ReplacePeriodWithUnderscore<First>
          : `${ReplacePeriodWithUnderscore<First>}_${JoinFieldPathsWithUnderscores<Rest>}`
        : never
      : never
    : ''

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

export type BaseOnDelete = 'cascade' | 'restrict'

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

// Helper type for incrementing depth counter (more efficient than tuple length)
type Add1<N extends number> = N extends 0
  ? 1
  : N extends 1
  ? 2
  : N extends 2
  ? 3
  : 4

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

type DefaultsState<DocumentType extends GenericValidator = GenericValidator> =
  Partial<{
    [K in ExtractFieldPathsWithoutSystemFields<DocumentType>]: ValueOrFunctionFromValidator<
      DocumentType,
      K
    >
  }>

// Updated to support composite uniqueness with objects containing fields arrays
type UniqueConstraint<
  DocumentType extends GenericValidator = GenericValidator
> = {
  fields: [
    ExtractFieldPathsWithoutSystemFields<DocumentType>,
    ...ExtractFieldPathsWithoutSystemFields<DocumentType>[]
  ]
}

type UniquesState<DocumentType extends GenericValidator = GenericValidator> =
  Array<UniqueConstraint<DocumentType>>

// Updated ValidateState to support both Zod schema and validation function
type ValidateState<ZodSchema extends z.ZodTypeAny = z.ZodTypeAny> = Partial<{
  schema: ZodSchema
  validationFn: (
    ctx: GenericQueryCtx<GenericDataModel>,
    document: Expand<
      z.infer<ZodSchema> &
        SystemFieldsWithId<TableNamesInDataModel<GenericDataModel>>
    >
  ) => Promise<void> | void
}>

type RelationConfig<
  DocumentType extends GenericValidator,
  FieldPath extends GetAllVIdPaths<DocumentType>
> = {
  path: FieldPath
  table: TableNamesInDataModel<GenericDataModel>
  // cant precompute onDelete since it will give an infinitely deep type
  onDelete: BaseOnDelete | 'setOptional'
}

// FIX 3: Use a mapped type that defers the complex computation
type RelationsState<DocumentType extends GenericValidator = GenericValidator> =
  {
    [K in GetAllVIdPaths<DocumentType>]?: RelationConfig<DocumentType, K>
  }

export interface BuilderState<
  DocumentType extends GenericValidator = GenericValidator
> {
  defaults: DefaultsState<DocumentType>
  uniques: UniquesState<DocumentType>
  validate: ValidateState
  relations: RelationsState<DocumentType>
}

// FIX 4: Use conditional types to defer complex type resolution
type UpdateRelations<
  State extends BuilderState<any>,
  DocumentType extends GenericValidator,
  FieldPath extends GetAllVIdPaths<DocumentType>,
  TableName extends TableNamesInDataModel<GenericDataModel>,
  OnDeleteAction extends OnDelete<DocumentType, FieldPath>
> = State extends BuilderState<DocumentType>
  ? Omit<State, 'relations'> & {
      relations: State['relations'] & {
        [K in FieldPath]: {
          path: FieldPath
          table: TableName
          onDelete: OnDeleteAction
        }
      }
    }
  : never

// Updated interface with improved relation method
export interface ConvexServiceInterface<
  ZodSchema extends z.ZodTypeAny = z.ZodTypeAny,
  Intersection extends z.ZodIntersection<
    z.ZodObject<any>,
    z.ZodTypeAny
  > = z.ZodIntersection<z.ZodObject<any>, z.ZodTypeAny>,
  TableName extends string = string,
  DocumentType extends ConvexValidatorFromZod<ZodSchema> = ConvexValidatorFromZod<ZodSchema>,
  Indexes extends GenericTableIndexes = {},
  SearchIndexes extends GenericTableSearchIndexes = {},
  VectorIndexes extends GenericTableVectorIndexes = {},
  State extends BuilderState<DocumentType> = BuilderState<DocumentType>
> extends TableDefinition<DocumentType, Indexes, SearchIndexes, VectorIndexes> {
  tableName: TableName
  schema: Intersection
  /**
   * Export the contents of this definition.
   *
   * This is called internally by the Convex framework.
   * @internal
   */
  export(): ExportedTableDefinition

  name<NewTableName extends string>(
    tableName: NewTableName
  ): ConvexServiceInterface<
    ZodSchema,
    z.ZodIntersection<
      z.ZodObject<{
        _id: Zid<NewTableName>
        _creationTime: z.ZodNumber
      }>,
      ZodSchema
    >,
    NewTableName,
    DocumentType,
    Indexes,
    SearchIndexes,
    VectorIndexes,
    State
  >

  index<
    IndexName extends string,
    FirstFieldPath extends ExtractFieldPathsWithConvexSystemFields<DocumentType>,
    RestFieldPaths extends ExtractFieldPathsWithConvexSystemFields<DocumentType>[]
  >(
    name: IndexName,
    fields: [FirstFieldPath, ...RestFieldPaths]
  ): ConvexServiceInterface<
    ZodSchema,
    Intersection,
    TableName,
    DocumentType,
    Expand<
      Indexes &
        Record<IndexName, [FirstFieldPath, ...RestFieldPaths, '_creationTime']>
    >,
    SearchIndexes,
    VectorIndexes,
    State
  >

  searchIndex<
    IndexName extends string,
    SearchField extends ExtractFieldPathsWithConvexSystemFields<DocumentType>,
    FilterFields extends ExtractFieldPathsWithConvexSystemFields<DocumentType> = never
  >(
    name: IndexName,
    indexConfig: Expand<SearchIndexConfig<SearchField, FilterFields>>
  ): ConvexServiceInterface<
    ZodSchema,
    Intersection,
    TableName,
    DocumentType,
    Indexes,
    Expand<
      SearchIndexes &
        Record<
          IndexName,
          {
            searchField: SearchField
            filterFields: FilterFields
          }
        >
    >,
    VectorIndexes,
    State
  >

  vectorIndex<
    IndexName extends string,
    VectorField extends ExtractFieldPathsWithConvexSystemFields<DocumentType>,
    FilterFields extends ExtractFieldPathsWithConvexSystemFields<DocumentType> = never
  >(
    name: IndexName,
    indexConfig: Expand<VectorIndexConfig<VectorField, FilterFields>>
  ): ConvexServiceInterface<
    ZodSchema,
    Intersection,
    TableName,
    DocumentType,
    Indexes,
    SearchIndexes,
    Expand<
      VectorIndexes &
        Record<
          IndexName,
          {
            vectorField: VectorField
            dimensions: number
            filterFields: FilterFields
          }
        >
    >,
    State
  >

  /**
   * Builder function to define a default value for a field.
   * @param field - The field that will be used to join the tables
   * @param value - The default value for the field
   * @returns A ConvexService instance with the default value set
   */
  default<
    FieldPath extends ExtractFieldPathsWithoutSystemFields<DocumentType>,
    DefaultValue extends ValueOrFunctionFromValidator<DocumentType, FieldPath>
  >(
    field: FieldPath,
    value: DefaultValue
  ): ConvexServiceInterface<
    ZodSchema,
    Intersection,
    TableName,
    DocumentType,
    Indexes,
    SearchIndexes,
    VectorIndexes,
    Expand<State & { defaults: { [K in FieldPath]: DefaultValue } }>
  >

  /**
   * Builder function to define a unique constraint on a single field.
   * @param field - The field that should be unique
   */
  unique<FieldPath extends ExtractFieldPathsWithoutSystemFields<DocumentType>>(
    field: FieldPath
  ): ConvexServiceInterface<
    ZodSchema,
    Intersection,
    TableName,
    DocumentType,
    Expand<
      Indexes &
        Record<
          `by_${ReplacePeriodWithUnderscore<FieldPath>}`,
          [FieldPath, '_creationTime']
        >
    >,
    SearchIndexes,
    VectorIndexes,
    Expand<
      Omit<State, 'uniques'> & {
        uniques: [...State['uniques'], { fields: [FieldPath] }]
      }
    >
  >

  /**
   * Builder function to define multiple individual unique constraints (each field is unique separately).
   * @param first - First field
   * @param second - Second field
   * @param rest - Additional fields
   * @returns A ConvexService instance with the unique constraint set
   */
  unique<
    FirstFieldPath extends ExtractFieldPathsWithoutSystemFields<DocumentType>,
    SecondFieldPath extends ExtractFieldPathsWithoutSystemFields<DocumentType>,
    RestFieldPaths extends ExtractFieldPathsWithoutSystemFields<DocumentType>[]
  >(
    first: FirstFieldPath,
    second: SecondFieldPath,
    ...rest: RestFieldPaths
  ): ConvexServiceInterface<
    ZodSchema,
    Intersection,
    TableName,
    DocumentType,
    Expand<
      Indexes &
        Record<
          `by_${JoinFieldPathsWithUnderscores<
            [FirstFieldPath, SecondFieldPath, ...RestFieldPaths]
          >}`,
          [FirstFieldPath, SecondFieldPath, ...RestFieldPaths, '_creationTime']
        >
    >,
    SearchIndexes,
    VectorIndexes,
    Expand<
      Omit<State, 'uniques'> & {
        uniques: [
          ...State['uniques'],
          { fields: [FirstFieldPath] },
          { fields: [SecondFieldPath] },
          ...{
            [I in keyof RestFieldPaths]: { fields: [RestFieldPaths[I]] }
          }
        ]
      }
    >
  >

  /**
   * Builder function to define a validation schema for the table.
   * @param schema - Zod schema for validation
   * @returns A ConvexService instance with the validation schema set
   */
  validate<Schema extends z.ZodTypeAny = z.ZodTypeAny>(
    schema?: Schema
  ): ConvexServiceInterface<
    ZodSchema,
    Intersection,
    TableName,
    DocumentType,
    Indexes,
    SearchIndexes,
    VectorIndexes,
    Expand<State & { validate: { schema: Schema } }>
  >

  /**
   * Builder function to define a validation function for the table.
   * @param validationFn - Function that receives ctx parameter for custom validation
   * @returns A ConvexService instance with the validation function set
   */
  validate<
    ValidationFn extends (
      ctx: GenericQueryCtx<GenericDataModel>,
      document: Expand<
        z.infer<ZodSchema> &
          SystemFieldsWithId<TableNamesInDataModel<GenericDataModel>>
      >
    ) => Promise<void> | void
  >(
    validationFn: ValidationFn
  ): ConvexServiceInterface<
    ZodSchema,
    Intersection,
    TableName,
    DocumentType,
    Indexes,
    SearchIndexes,
    VectorIndexes,
    Expand<State & { validate: { validationFn: typeof validationFn } }>
  >

  /**
   * Builder function to define a relation between this table and another table.
   * @param field - The field that will be used to join the tables (must be a VId field)
   * @param table - The table to join
   * @param onDelete - The action to take when the record is deleted
   * @returns A ConvexService instance with the relation set
   */
  relation<
    FieldPath extends GetAllVIdPaths<DocumentType>,
    TableName extends TableNamesInDataModel<GenericDataModel>
  >(
    field: FieldPath,
    table: TableName,
    onDelete: OnDelete<DocumentType, FieldPath>
  ): ConvexServiceInterface<
    ZodSchema,
    Intersection,
    TableName,
    DocumentType,
    Expand<
      Indexes &
        Record<
          `by_${ReplacePeriodWithUnderscore<FieldPath>}`,
          [FieldPath, '_creationTime']
        >
    >,
    SearchIndexes,
    VectorIndexes,
    UpdateRelations<
      State,
      DocumentType,
      FieldPath,
      TableName,
      OnDelete<DocumentType, FieldPath>
    >
  >

  register(): RegisteredServiceDefinition<
    ZodSchema,
    Intersection,
    TableName,
    DocumentType,
    Indexes,
    SearchIndexes,
    VectorIndexes,
    State
  >
}

export type GenericRegisteredServiceDefinition = RegisteredServiceDefinition<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>

/**
 * A registered/finalized table definition that exposes only the schema and metadata,
 * without the builder methods like .index(), .unique(), etc.
 */

export type CreateWithoutSystemFields<DocumentType extends GenericValidator> =
  DocumentType extends VObject<any, infer Fields, any, any>
    ? Omit<Fields, keyof SystemFields>
    : never

export type MakeZodFieldsOptional<
  Schema extends z.ZodTypeAny,
  Defaults extends Record<string, any>
> = Schema extends z.ZodObject<infer Shape>
  ? z.ZodObject<{
      [K in keyof Shape]: K extends keyof Defaults
        ? undefined extends Defaults[K]
          ? Shape[K]
          : z.ZodOptional<Shape[K]>
        : Shape[K]
    }>
  : Schema

export interface RegisteredServiceDefinition<
  ZodSchema extends z.ZodTypeAny = z.ZodTypeAny,
  Intersection extends z.ZodIntersection<
    z.ZodObject<any>,
    z.ZodTypeAny
  > = z.ZodIntersection<z.ZodObject<any>, z.ZodTypeAny>,
  TableName extends string = string,
  DocumentType extends ConvexValidatorFromZod<ZodSchema> = ConvexValidatorFromZod<ZodSchema>,
  Indexes extends GenericTableIndexes = {},
  SearchIndexes extends GenericTableSearchIndexes = {},
  VectorIndexes extends GenericTableVectorIndexes = {},
  State extends BuilderState<DocumentType> = BuilderState<DocumentType>,
  Args extends CreateWithoutSystemFields<DocumentType> = CreateWithoutSystemFields<DocumentType>
> {
  readonly tableName: TableName
  readonly $validatorJSON: ValidatorJSON
  readonly validator: DocumentType
  readonly schema: Intersection

  // Expose configuration metadata (read-only)
  readonly args: Args
  readonly argsWithoutDefaults: ConvexValidatorFromZod<
    MakeZodFieldsOptional<ZodSchema, State['defaults']>
  >
  readonly $config: {
    indexes: Indexes
    searchIndexes: SearchIndexes
    vectorIndexes: VectorIndexes
    state: State
  }
}
