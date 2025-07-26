import { z } from 'zod'
import { zid, zodToConvex } from 'convex-helpers/server/zod'

// Import all the types from your interface file
import {
  ConvexServiceInterface,
  BuilderState,
  ConvexValidatorFromZod,
  ExtractFieldPathsWithConvexSystemFields,
  ExtractFieldPathsWithoutSystemFields,
  ValueOrFunctionFromValidator,
  type Index,
  type SearchIndex,
  type VectorIndex,
  type GetAllVIdPaths,
  type SystemFieldsWithId,
} from './service.types'
import {
  GenericQueryCtx,
  GenericDataModel,
  type TableNamesInDataModel,
  type Expand,
} from 'convex/server'

export class ConvexService<
  ZodSchema extends z.ZodTypeAny,
  DocumentType extends ConvexValidatorFromZod<ZodSchema> = ConvexValidatorFromZod<ZodSchema>
> {
  // Internal state with proper typing
  validator: DocumentType
  private indexes: Index<DocumentType>[] = []
  private searchIndexes: SearchIndex<DocumentType>[] = []
  private vectorIndexes: VectorIndex<DocumentType>[] = []
  private _schema: ZodSchema
  private _state: BuilderState<DocumentType>
  public schema: z.ZodObject<any>

  constructor(tableName: string, zodSchema: ZodSchema) {
    this.validator = zodToConvex(zodSchema) as DocumentType
    this._schema = zodSchema
    this.schema = z
      .object({
        _id: zid(tableName),
        _creationTime: z.number(),
      })
      .extend(zodSchema._def)
    this._state = {
      defaults: {},
      uniques: [],
      validate: {},
      relations: {},
    } as BuilderState<DocumentType>
  }

  index<
    IndexName extends string,
    FirstFieldPath extends ExtractFieldPathsWithConvexSystemFields<DocumentType>,
    RestFieldPaths extends ExtractFieldPathsWithConvexSystemFields<DocumentType>[]
  >(name: IndexName, fields: [FirstFieldPath, ...RestFieldPaths]): this {
    this.indexes.push({
      indexDescriptor: name,
      fields: fields as ExtractFieldPathsWithConvexSystemFields<DocumentType>[],
    })
    return this
  }

  searchIndex<
    IndexName extends string,
    SearchField extends ExtractFieldPathsWithConvexSystemFields<DocumentType>,
    FilterFields extends ExtractFieldPathsWithConvexSystemFields<DocumentType> = never
  >(
    name: IndexName,
    indexConfig: {
      searchField: SearchField
      filterFields?: FilterFields extends never ? undefined : FilterFields[]
    }
  ): this {
    this.searchIndexes.push({
      indexDescriptor: name,
      searchField: indexConfig.searchField,
      filterFields: (indexConfig.filterFields ||
        []) as ExtractFieldPathsWithConvexSystemFields<DocumentType>[],
    })
    return this
  }

  vectorIndex<
    IndexName extends string,
    VectorField extends ExtractFieldPathsWithConvexSystemFields<DocumentType>,
    FilterFields extends ExtractFieldPathsWithConvexSystemFields<DocumentType> = never
  >(
    name: IndexName,
    indexConfig: {
      vectorField: VectorField
      dimensions: number
      filterFields?: FilterFields extends never ? undefined : FilterFields[]
    }
  ): this {
    this.vectorIndexes.push({
      indexDescriptor: name,
      vectorField: indexConfig.vectorField,
      dimensions: indexConfig.dimensions,
      filterFields: (indexConfig.filterFields ||
        []) as ExtractFieldPathsWithConvexSystemFields<DocumentType>[],
    })
    return this
  }

  // Default method with proper typing
  default<
    FieldPath extends ExtractFieldPathsWithoutSystemFields<DocumentType>,
    DefaultValue extends ValueOrFunctionFromValidator<DocumentType, FieldPath>
  >(field: FieldPath, value: DefaultValue): this {
    ;(this._state.defaults as any)[field] = value
    return this
  }

  // Unique method implementation with proper overloads
  unique<FieldPath extends ExtractFieldPathsWithoutSystemFields<DocumentType>>(
    field: FieldPath
  ): this
  unique<
    FirstFieldPath extends ExtractFieldPathsWithoutSystemFields<DocumentType>,
    SecondFieldPath extends ExtractFieldPathsWithoutSystemFields<DocumentType>,
    RestFieldPaths extends ExtractFieldPathsWithoutSystemFields<DocumentType>[]
  >(
    first: FirstFieldPath,
    second: SecondFieldPath,
    ...rest: RestFieldPaths
  ): this
  unique<
    FirstFieldPath extends ExtractFieldPathsWithoutSystemFields<DocumentType>,
    RestFieldPaths extends ExtractFieldPathsWithoutSystemFields<DocumentType>[]
  >(fields: [FirstFieldPath, ...RestFieldPaths]): this
  unique(
    ...args:
      | [ExtractFieldPathsWithoutSystemFields<DocumentType>]
      | [
          ExtractFieldPathsWithoutSystemFields<DocumentType>,
          ExtractFieldPathsWithoutSystemFields<DocumentType>,
          ...ExtractFieldPathsWithoutSystemFields<DocumentType>[]
        ]
      | [
          [
            ExtractFieldPathsWithoutSystemFields<DocumentType>,
            ...ExtractFieldPathsWithoutSystemFields<DocumentType>[]
          ]
        ]
  ): this {
    if (args.length === 1 && Array.isArray(args[0])) {
      // Array format: unique(['field1', 'field2']) - COMPOSITE uniqueness
      this._state = {
        ...this._state,
        uniques: [
          ...this._state.uniques,
          {
            fields: args[0],
          },
        ],
      }
    } else if (args.length === 1) {
      // Single field: unique('field') - INDIVIDUAL field uniqueness
      this._state = {
        ...this._state,
        uniques: [
          ...this._state.uniques,
          {
            fields: args[0],
          },
        ],
      }
    } else {
      // Rest parameters: unique('field1', 'field2', ...) - MULTIPLE INDIVIDUAL uniqueness
      const newUniques = args.map((field) => ({
        fields: [field] as [ExtractFieldPathsWithoutSystemFields<DocumentType>],
      }))
      this._state = {
        ...this._state,
        uniques: [...this._state.uniques, ...newUniques],
      }
    }
    return this
  }

  // Validate method with proper overloads
  validate(): this
  validate<Schema extends z.ZodTypeAny>(schema: Schema): this
  validate(
    validationFn: (
      ctx: GenericQueryCtx<GenericDataModel>
    ) => Promise<void> | void
  ): this
  validate(
    schemaOrFn?:
      | z.ZodTypeAny
      | ((
          ctx: GenericQueryCtx<GenericDataModel>,
          document: Expand<
            z.infer<ZodSchema> &
              SystemFieldsWithId<TableNamesInDataModel<GenericDataModel>>
          >
        ) => Promise<void> | void)
  ): this {
    // If no argument provided, use the default schema
    if (schemaOrFn === undefined) {
      this._state.validate.schema = this._schema
      return this
    }

    // Check if it's a function by checking if it has a 'call' method
    if (typeof schemaOrFn === 'function') {
      // It's a validation function
      this._state.validate.validationFn = schemaOrFn as (
        ctx: GenericQueryCtx<GenericDataModel>
      ) => Promise<void> | void
    } else {
      // It's a Zod schema
      this._state.validate.schema = schemaOrFn as z.ZodTypeAny
    }

    return this
  }

  // Relation method with proper typing
  relation<
    FieldPath extends GetAllVIdPaths<DocumentType>,
    TableName extends TableNamesInDataModel<GenericDataModel>
  >(
    field: FieldPath,
    table: TableName,
    onDelete: 'cascade' | 'restrict'
  ): this {
    this._state.relations[field] = {
      path: field,
      table,
      onDelete,
    }
    return this
  }

  /**
   * Export the contents of this definition.
   *
   * This is called internally by the Convex framework.
   * @internal
   */
  export() {
    return {
      indexes: this.indexes,
      searchIndexes: this.searchIndexes,
      vectorIndexes: this.vectorIndexes,
      documentType: (this.validator as any).json,
      // Include the state in the export for framework usage
      state: this._state,
    }
  }
}

// Factory function to create a new ConvexService with proper typing
export function defineService<ZodSchema extends z.ZodTypeAny>(
  tableName: string,
  zodSchema: ZodSchema
): ConvexServiceInterface<ZodSchema> {
  return new ConvexService(
    tableName,
    zodSchema
  ) as unknown as ConvexServiceInterface<ZodSchema>
}
