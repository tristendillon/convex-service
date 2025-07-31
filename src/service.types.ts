import type {
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
  GenericQueryCtx,
} from 'convex/server'
import type { z } from 'zod'
import type { GenericValidator, VObject, ValidatorJSON } from 'convex/values'
import type {
  BaseOnConflict,
  CompositeUniqueFields,
  ConvexValidatorFromZod,
  ExportedTableDefinition,
  ExtractFieldPathsWithConvexSystemFields,
  ExtractFieldPathsWithoutSystemFields,
  FunctionValidateConstraint,
  GetAllVIdPaths,
  JoinFieldPathsWithUnderscores,
  OnDelete,
  RelationConstraint,
  ReplacePeriodWithUnderscore,
  SystemFieldsWithId,
  UniqueConstraint,
  UniqueField,
  ValueOrFunctionFromValidator,
} from './shared-types'
import type { Zid } from 'convex-helpers/server/zod'

export type DefaultsState<
  DocumentType extends GenericValidator = GenericValidator
> = Partial<{
  [K in ExtractFieldPathsWithoutSystemFields<DocumentType>]: ValueOrFunctionFromValidator<
    DocumentType,
    K
  >
}>

export type UniquesState<
  DocumentType extends GenericValidator = GenericValidator
> = Array<UniqueConstraint<DocumentType>>

export type ValidateState<ZodSchema extends z.ZodTypeAny = z.ZodTypeAny> =
  | FunctionValidateConstraint<ZodSchema>
  | z.ZodTypeAny

export type RelationsState<
  DocumentType extends GenericValidator = GenericValidator
> = {
  [K in GetAllVIdPaths<DocumentType>]?: RelationConstraint<DocumentType, K>
}

export interface BuilderState<
  ZodSchema extends z.ZodTypeAny = z.ZodTypeAny,
  DocumentType extends ConvexValidatorFromZod<ZodSchema> = ConvexValidatorFromZod<ZodSchema>
> {
  defaults: DefaultsState<DocumentType>
  uniques: UniquesState<DocumentType>
  validate: ValidateState<ZodSchema>
  relations: RelationsState<DocumentType>
}

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
  State extends BuilderState<ZodSchema> = BuilderState<ZodSchema>
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
          { searchField: SearchField; filterFields: FilterFields }
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
          { vectorField: VectorField; filterFields: FilterFields }
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
  unique<FieldPath extends UniqueField<DocumentType>>(
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
        uniques: [...State['uniques'], { fields: FieldPath }]
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
    FieldPaths extends CompositeUniqueFields<DocumentType>,
    OnConflict extends BaseOnConflict = 'fail'
  >(
    fields: FieldPaths,
    onConflict: OnConflict
  ): ConvexServiceInterface<
    ZodSchema,
    Intersection,
    TableName,
    DocumentType,
    Expand<
      Indexes &
        Record<
          `by_${JoinFieldPathsWithUnderscores<FieldPaths>}`,
          [...FieldPaths, '_creationTime']
        >
    >,
    SearchIndexes,
    VectorIndexes,
    Expand<
      Omit<State, 'uniques'> & {
        uniques: [
          ...State['uniques'],
          { fields: FieldPaths; onConflict: OnConflict }
        ]
      }
    >
  >

  /**
   * Builder function to define a validation schema for the table.
   * @param schema - Zod schema for validation
   * @returns A ConvexService instance with the validation schema set
   */
  validate<Schema extends z.ZodTypeAny | undefined = z.ZodTypeAny | undefined>(
    schema?: Schema
  ): ConvexServiceInterface<
    ZodSchema,
    Intersection,
    TableName,
    DocumentType,
    Indexes,
    SearchIndexes,
    VectorIndexes,
    Expand<Omit<State, 'validate'> & { validate: Schema }>
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
    Expand<Omit<State, 'validate'> & { validate: ValidationFn }>
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
    TableName extends TableNamesInDataModel<GenericDataModel>,
    OnDeleteAction extends OnDelete<DocumentType, FieldPath>
  >(
    field: FieldPath,
    table: TableName,
    onDelete: OnDeleteAction
  ): ConvexServiceInterface<
    ZodSchema,
    Intersection,
    TableName,
    DocumentType,
    Indexes,
    SearchIndexes,
    VectorIndexes,
    State extends BuilderState<ZodSchema>
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
  >

  /**
   * Register the service with the Convex framework.
   * @returns A RegisteredServiceDefinition instance with the service metadata
   */
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
  State extends BuilderState<ZodSchema> = BuilderState<ZodSchema>,
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
