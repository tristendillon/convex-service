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
  type ExportedIndex,
  type ExportedSearchIndex,
  type ExportedVectorIndex,
  type GetAllVIdPaths,
  type SystemFieldsWithId,
  GenericRegisteredServiceDefinition,
  CreateWithoutSystemFields,
  ExportedTableDefinition,
} from './service.types'
import {
  GenericQueryCtx,
  GenericDataModel,
  type TableNamesInDataModel,
  type Expand,
} from 'convex/server'
import { GenericValidator, VObject } from 'convex/values'

type Index<DocumentType extends GenericValidator> =
  ExtractFieldPathsWithConvexSystemFields<DocumentType>[]

type SearchIndex<DocumentType extends GenericValidator> = {
  searchField: ExtractFieldPathsWithConvexSystemFields<DocumentType>
  filterFields: ExtractFieldPathsWithConvexSystemFields<DocumentType>[]
}

type VectorIndex<DocumentType extends GenericValidator> = {
  vectorField: ExtractFieldPathsWithConvexSystemFields<DocumentType>
  dimensions: number
  filterFields: ExtractFieldPathsWithConvexSystemFields<DocumentType>[]
}

export class ConvexService<
  ZodSchema extends z.ZodTypeAny,
  DocumentType extends ConvexValidatorFromZod<ZodSchema> = ConvexValidatorFromZod<ZodSchema>,
  State extends BuilderState<DocumentType> = BuilderState<DocumentType>
> {
  private indexes: Record<string, Index<DocumentType>> = {}
  private searchIndexes: Record<string, SearchIndex<DocumentType>> = {}
  private vectorIndexes: Record<string, VectorIndex<DocumentType>> = {}
  private _schema: ZodSchema
  private _state: State
  private _args: CreateWithoutSystemFields<DocumentType>
  validator: DocumentType
  schema: z.ZodIntersection<z.ZodObject<any>, z.ZodTypeAny> = z.intersection(
    z.object({}),
    z.object({})
  )
  tableName: string = ''

  constructor(zodSchema: ZodSchema) {
    this.validator = zodToConvex(zodSchema) as DocumentType
    this._args = this
      .validator as unknown as CreateWithoutSystemFields<DocumentType>
    this._schema = zodSchema
    this._state = {
      defaults: {},
      uniques: [],
      validate: {},
      relations: {},
    } as unknown as State
  }

  name(tableName: string): this {
    this.tableName = tableName

    this.schema = z.intersection(
      z.object({
        _id: zid(tableName),
        _creationTime: z.number(),
      }),
      this._schema
    )

    return this
  }

  private fixIndexName(name: string): string {
    return name
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, '_') // replace invalid chars with underscore
      .replace(/^([^a-zA-Z])/, '_$1') // ensure starts with a letter by prepending underscore if not
      .slice(0, 64) // enforce max length
  }

  index<
    IndexName extends string,
    FirstFieldPath extends ExtractFieldPathsWithConvexSystemFields<DocumentType>,
    RestFieldPaths extends ExtractFieldPathsWithConvexSystemFields<DocumentType>[]
  >(name: IndexName, fields: [FirstFieldPath, ...RestFieldPaths]): this {
    // Convex index names must be <=64 chars, start with a letter, and only contain letters, digits, underscores.
    // See: https://docs.convex.dev/database/indexes#naming
    const fixedIndexName = this.fixIndexName(name)

    if (this.indexes[fixedIndexName]) {
      throw new Error(`Index ${fixedIndexName} already exists`)
    }

    this.indexes[fixedIndexName] = fields

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
    const fixedIndexName = this.fixIndexName(name)
    if (this.searchIndexes[fixedIndexName]) {
      throw new Error(`Search index ${name} already exists`)
    }

    this.searchIndexes[fixedIndexName] = {
      searchField: indexConfig.searchField,
      filterFields: (indexConfig.filterFields ||
        []) as ExtractFieldPathsWithConvexSystemFields<DocumentType>[],
    }
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
    const fixedIndexName = this.fixIndexName(name)
    if (this.vectorIndexes[fixedIndexName]) {
      throw new Error(`Vector index ${fixedIndexName} already exists`)
    }

    this.vectorIndexes[fixedIndexName] = {
      vectorField: indexConfig.vectorField,
      dimensions: indexConfig.dimensions,
      filterFields: (indexConfig.filterFields ||
        []) as ExtractFieldPathsWithConvexSystemFields<DocumentType>[],
    }
    return this
  }

  // Default method with proper typing
  default<
    FieldPath extends ExtractFieldPathsWithoutSystemFields<DocumentType>,
    DefaultValue extends ValueOrFunctionFromValidator<DocumentType, FieldPath>
  >(field: FieldPath, value: DefaultValue): this {
    this._state.defaults[field] = value
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
    if (args.length === 1) {
      // Single field: unique('field') - INDIVIDUAL field uniqueness
      this.index(`by_${args[0]}`, [
        args[0] as ExtractFieldPathsWithConvexSystemFields<DocumentType>,
      ])
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
      // Rest parameters: unique('field1', 'field2', ...) - Composite uniqueness
      let indexName = 'by_'
      const newUniques = args.map((field) => ({
        fields: [field] as [ExtractFieldPathsWithoutSystemFields<DocumentType>],
      }))
      for (const unique of newUniques) {
        indexName += `${unique.fields[0]} `
      }
      this.index(
        indexName,
        args as [
          ExtractFieldPathsWithConvexSystemFields<DocumentType>,
          ...ExtractFieldPathsWithConvexSystemFields<DocumentType>[]
        ]
      )
      this._state = {
        ...this._state,
        uniques: [
          ...this._state.uniques,
          {
            fields: newUniques.map((unique) => unique.fields[0]) as [
              ExtractFieldPathsWithoutSystemFields<DocumentType>,
              ...ExtractFieldPathsWithoutSystemFields<DocumentType>[]
            ],
          },
        ],
      }
    }
    return this
  }

  // Validate method with proper overloads
  validate(): this
  validate<Schema extends z.ZodTypeAny>(schema: Schema): this
  validate(
    validationFn: (
      ctx: GenericQueryCtx<GenericDataModel>,
      document: Expand<
        z.infer<ZodSchema> &
          SystemFieldsWithId<TableNamesInDataModel<GenericDataModel>>
      >
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
    onDelete: 'cascade' | 'restrict' | 'setOptional'
  ): this {
    this._state.relations[field] = {
      path: field,
      table,
      onDelete,
    }
    this.index(`by_${field}`, [
      field as ExtractFieldPathsWithConvexSystemFields<DocumentType>,
    ])
    return this
  }

  /**
   * Export the contents of this definition.
   *
   * This is called internally by the Convex framework.
   * @internal
   */
  export(): ExportedTableDefinition {
    const tableDefinition: ExportedTableDefinition = {
      indexes: Object.entries(this.indexes).map(
        ([indexDescriptor, fields]) => ({
          indexDescriptor,
          fields,
        })
      ),
      searchIndexes: Object.entries(this.searchIndexes).map(
        ([indexDescriptor, searchIndex]) => ({
          indexDescriptor,
          searchField: searchIndex.searchField,
          filterFields: searchIndex.filterFields,
        })
      ),
      vectorIndexes: Object.entries(this.vectorIndexes).map(
        ([indexDescriptor, vectorIndex]) => ({
          indexDescriptor,
          vectorField: vectorIndex.vectorField,
          dimensions: vectorIndex.dimensions,
          filterFields: vectorIndex.filterFields,
        })
      ),
      documentType: (this.validator as any).json,
    }

    console.log(tableDefinition)
    return tableDefinition
  }

  /**
   * This API is experimental: it may change or disappear.
   *
   * Returns indexes defined on this table.
   * Intended for the advanced use cases of dynamically deciding which index to use for a query.
   * If you think you need this, please chime in on ths issue in the Convex JS GitHub repo.
   * https://github.com/get-convex/convex-js/issues/49
   */
  ' indexes'(): { indexDescriptor: string; fields: string[] }[] {
    return Object.entries(this.indexes).map(([indexDescriptor, fields]) => ({
      indexDescriptor,
      fields,
    }))
  }

  /**
   * Work around for https://github.com/microsoft/TypeScript/issues/57035
   */
  protected self(): this {
    return this
  }

  private makeFieldsOptionalDirect(
    schema: any,
    defaults: Record<string, any>
  ): z.ZodTypeAny {
    if (schema.shape && typeof schema.shape === 'object') {
      const newShape: Record<string, z.ZodTypeAny> = {}

      for (const [fieldName, fieldSchema] of Object.entries(schema.shape)) {
        if (fieldName in defaults) {
          newShape[fieldName] = (fieldSchema as z.ZodTypeAny).optional()
        } else {
          newShape[fieldName] = fieldSchema as z.ZodTypeAny
        }
      }

      return z.object(newShape)
    }

    return schema
  }

  register(): GenericRegisteredServiceDefinition {
    const argsWithoutDefaults = zodToConvex(
      this.makeFieldsOptionalDirect(this._schema, this._state.defaults)
    )
    const registeredService: GenericRegisteredServiceDefinition = {
      $validatorJSON: (this.validator as any).json,
      $config: {
        indexes: this.indexes,
        searchIndexes: this.searchIndexes,
        vectorIndexes: this.vectorIndexes,
        state: this._state,
      },
      tableName: this.tableName,
      schema: this.schema,
      validator: this.validator,
      args: this._args,
      argsWithoutDefaults: argsWithoutDefaults,
    }
    console.log('REGISTER', registeredService)
    return registeredService
  }
}

// Factory function to create a new ConvexService with proper typing
export function defineService<ZodSchema extends z.ZodTypeAny>(
  zodSchema: ZodSchema
): ConvexServiceInterface<ZodSchema> {
  return new ConvexService(
    zodSchema
  ) as unknown as ConvexServiceInterface<ZodSchema>
}
