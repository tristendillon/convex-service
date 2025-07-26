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
import { zodToConvex } from 'convex-helpers/server/zod'
import {
  GenericId,
  GenericValidator,
  VId,
  VObject,
  Validator,
} from 'convex/values'

export type Index<
  DocumentType extends Validator<any, any, any> = Validator<any, any, any>
> = {
  indexDescriptor: string
  fields: ExtractFieldPathsWithConvexSystemFields<DocumentType>[]
}

export type SearchIndex<
  DocumentType extends Validator<any, any, any> = Validator<any, any, any>
> = {
  indexDescriptor: string
  searchField: ExtractFieldPathsWithConvexSystemFields<DocumentType>
  filterFields: ExtractFieldPathsWithConvexSystemFields<DocumentType>[]
}

export type VectorIndex<
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

// Helper type to extract the document type from a ConvexValidatorFromZod
type ExtractDocumentType<T extends GenericValidator> = T extends Validator<
  infer DocType,
  any,
  any
>
  ? DocType
  : never

// Helper type to get field type from document type
type GetFieldType<
  DocType,
  FieldPath extends string | number | symbol
> = DocType extends Record<string | number | symbol, any>
  ? FieldPath extends keyof DocType
    ? DocType[FieldPath]
    : FieldPath extends `${infer First}.${infer Rest}`
    ? First extends keyof DocType
      ? GetFieldType<DocType[First], Rest>
      : never
    : never
  : never

// Improved ValueOrFunctionFromValidator using document type extraction
export type ValueOrFunctionFromValidator<
  ValidatorType extends GenericValidator,
  FieldPath extends ExtractFieldPathsWithConvexSystemFields<ValidatorType>
> = FieldPath extends keyof SystemFields
  ? never // Don't allow defaults on system fields
  : ValueOrFunction<GetFieldType<ExtractDocumentType<ValidatorType>, FieldPath>>

export type SystemFieldsWithId<TableName extends string> = SystemFields & {
  _id: GenericId<TableName>
}

export type JoinFieldPaths<
  Start extends string,
  End extends string
> = `${Start}.${End}`

// Simplified VId path extraction with reduced complexity
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

type OnDelete = 'cascade' | 'restrict'

// FIX 2: Break the recursive relation by pre-computing the VId paths type
type RelationConfig<
  DocumentType extends GenericValidator,
  FieldPath extends GetAllVIdPaths<DocumentType>
> = {
  path: FieldPath
  table: TableNamesInDataModel<GenericDataModel>
  onDelete: OnDelete
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
  OnDeleteAction extends OnDelete
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

// Trying to get the system fields in the return type of the parse and safeParse functions
// this is not working :(
type ZodSchemaParseWithSystemFields<
  ZodSchema extends z.ZodTypeAny,
  TableName extends string
> = ZodSchema & {
  parse: (
    data: unknown
  ) => Expand<z.infer<ZodSchema> & SystemFieldsWithId<TableName>>
  parseAsync: (
    data: unknown
  ) => Promise<Expand<z.infer<ZodSchema> & SystemFieldsWithId<TableName>>>

  safeParse: (
    data: unknown
  ) => z.SafeParseReturnType<
    unknown,
    Expand<z.infer<ZodSchema> & SystemFieldsWithId<TableName>>
  >
  safeParseAsync: (
    data: unknown
  ) => Promise<
    z.SafeParseReturnType<
      unknown,
      Expand<z.infer<ZodSchema> & SystemFieldsWithId<TableName>>
    >
  >
}

// Updated interface with improved relation method
export interface ConvexServiceInterface<
  ZodSchema extends z.ZodTypeAny = z.ZodTypeAny,
  DocumentType extends ConvexValidatorFromZod<ZodSchema> = ConvexValidatorFromZod<ZodSchema>,
  Indexes extends GenericTableIndexes = {},
  SearchIndexes extends GenericTableSearchIndexes = {},
  VectorIndexes extends GenericTableVectorIndexes = {},
  State extends BuilderState<DocumentType> = BuilderState<DocumentType>
> extends TableDefinition<DocumentType, Indexes, SearchIndexes, VectorIndexes> {
  schema: ZodSchemaParseWithSystemFields<
    ZodSchema,
    TableNamesInDataModel<GenericDataModel>
  >
  /**
   * Export the contents of this definition.
   *
   * This is called internally by the Convex framework.
   * @internal
   */
  export(): {
    indexes: Indexes
    searchIndexes: SearchIndexes
    vectorIndexes: VectorIndexes
    documentType: DocumentType
    state: State
  }

  index<
    IndexName extends string,
    FirstFieldPath extends ExtractFieldPathsWithConvexSystemFields<DocumentType>,
    RestFieldPaths extends ExtractFieldPathsWithConvexSystemFields<DocumentType>[]
  >(
    name: IndexName,
    fields: [FirstFieldPath, ...RestFieldPaths]
  ): ConvexServiceInterface<
    ZodSchema,
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
    DocumentType,
    Indexes,
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
    DocumentType,
    Indexes,
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
   * Builder function to define a composite unique constraint (combination of fields must be unique).
   * @param fields - Array of fields that together form a unique constraint
   * @returns A ConvexService instance with the unique constraint set
   */
  unique<
    FirstFieldPath extends ExtractFieldPathsWithoutSystemFields<DocumentType>,
    RestFieldPaths extends ExtractFieldPathsWithoutSystemFields<DocumentType>[]
  >(
    fields: [FirstFieldPath, ...RestFieldPaths]
  ): ConvexServiceInterface<
    ZodSchema,
    DocumentType,
    Indexes,
    SearchIndexes,
    VectorIndexes,
    Expand<
      Omit<State, 'uniques'> & {
        uniques: [
          ...State['uniques'],
          { fields: [FirstFieldPath, ...RestFieldPaths] }
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
    onDelete: OnDelete
  ): ConvexServiceInterface<
    ZodSchema,
    DocumentType,
    Indexes,
    SearchIndexes,
    VectorIndexes,
    UpdateRelations<State, DocumentType, FieldPath, TableName, OnDelete>
  >
}
