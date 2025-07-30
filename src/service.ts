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
  GenericRegisteredServiceDefinition,
  CreateWithoutSystemFields,
  CreateArgsWithoutDefaults,
} from './service.types'
import {
  GenericQueryCtx,
  GenericDataModel,
  type TableNamesInDataModel,
  type Expand,
} from 'convex/server'
import { VObject } from 'convex/values'

export class ConvexService<
  ZodSchema extends z.ZodTypeAny,
  DocumentType extends ConvexValidatorFromZod<ZodSchema> = ConvexValidatorFromZod<ZodSchema>,
  State extends BuilderState<DocumentType> = BuilderState<DocumentType>,
  Args extends CreateWithoutSystemFields<DocumentType> = CreateWithoutSystemFields<DocumentType>
> {
  private indexes: Index<DocumentType>[] = []
  private searchIndexes: SearchIndex<DocumentType>[] = []
  private vectorIndexes: VectorIndex<DocumentType>[] = []
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

    this.validator = {
      ...this.validator,
      fields: {
        ...(this.validator as any).fields,
        _id: zid(tableName),
        _creationTime: z.number(),
      },
    } as DocumentType
    // Method 1: If your schema is always a ZodObject
    this.schema = z.intersection(
      z.object({
        _id: zid(tableName),
        _creationTime: z.number(),
      }),
      this._schema
    )

    return this
  }

  index<
    IndexName extends string,
    FirstFieldPath extends ExtractFieldPathsWithConvexSystemFields<DocumentType>,
    RestFieldPaths extends ExtractFieldPathsWithConvexSystemFields<DocumentType>[]
  >(name: IndexName, fields: [FirstFieldPath, ...RestFieldPaths]): this {
    // Convex index names must be <=64 chars, start with a letter, and only contain letters, digits, underscores.
    // See: https://docs.convex.dev/database/indexes#naming
    let fixedIndexName = name
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, '_') // replace invalid chars with underscore
      .replace(/^([^a-zA-Z])/, '_$1') // ensure starts with a letter by prepending underscore if not
      .slice(0, 64) // enforce max length

    this.indexes.push({
      indexDescriptor: fixedIndexName,
      fields: fields,
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

  /**
   * This API is experimental: it may change or disappear.
   *
   * Returns indexes defined on this table.
   * Intended for the advanced use cases of dynamically deciding which index to use for a query.
   * If you think you need this, please chime in on ths issue in the Convex JS GitHub repo.
   * https://github.com/get-convex/convex-js/issues/49
   */
  ' indexes'(): { indexDescriptor: string; fields: string[] }[] {
    return this.indexes
  }

  /**
   * Work around for https://github.com/microsoft/TypeScript/issues/57035
   */
  protected self(): this {
    return this
  }

  private hasDefaultForPath(
    defaults: Record<string, any>,
    path: string
  ): boolean {
    return path in defaults
  }

  // Helper function to remove fields with defaults from nested validator structure
  // private makeFieldsOptional(
  //   schema: z.ZodTypeAny,
  //   defaults: Record<string, any>,
  //   currentPath: string = ''
  // ): z.ZodTypeAny {
  //   console.log('=== makeZodFieldsOptional START ===')
  //   console.log('schema:', schema)
  //   console.log('schema._def:', schema._def)
  //   console.log('schema._def.typeName:', schema._def?.typeName)
  //   console.log('defaults:', defaults)
  //   console.log('currentPath:', currentPath)

  //   // If no defaults are set, return schema unchanged
  //   if (!defaults || Object.keys(defaults).length === 0) {
  //     console.log('No defaults set, returning schema unchanged')
  //     return schema
  //   }

  //   // Check for ZodObject by examining the internal structure
  //   if (schema._def?.typeName === 'ZodObject' && schema._def.shape) {
  //     console.log('Found ZodObject by typeName check!')
  //     console.log(
  //       'Processing ZodObject with shape keys:',
  //       Object.keys(schema._def.shape)
  //     )

  //     const newShape: Record<string, z.ZodTypeAny> = {}

  //     for (const [fieldName, fieldSchema] of Object.entries(
  //       schema._def.shape
  //     )) {
  //       const fullPath = currentPath ? `${currentPath}.${fieldName}` : fieldName
  //       console.log(`Processing field: ${fieldName}, fullPath: ${fullPath}`)
  //       console.log(
  //         `Field schema typeName:`,
  //         (fieldSchema as any)._def?.typeName
  //       )

  //       // Check if this exact path has a default
  //       if (this.hasDefaultForPath(defaults, fullPath)) {
  //         console.log(`Making field ${fullPath} optional - has default value`)

  //         // Make this field optional
  //         newShape[fieldName] = (fieldSchema as z.ZodTypeAny).optional()
  //       } else {
  //         // If it's a nested object, recursively process it
  //         if ((fieldSchema as any)._def?.typeName === 'ZodObject') {
  //           console.log(`Processing nested object at ${fullPath}`)
  //           const processedField = this.makeFieldsOptional(
  //             fieldSchema as z.ZodTypeAny,
  //             defaults,
  //             fullPath
  //           )
  //           newShape[fieldName] = processedField
  //         } else {
  //           // Regular field without default, keep as-is
  //           console.log(`Keeping field ${fieldName} as-is`)
  //           newShape[fieldName] = fieldSchema as z.ZodTypeAny
  //         }
  //       }
  //     }

  //     console.log('New shape keys:', Object.keys(newShape))

  //     // Create new ZodObject with the updated shape
  //     const result = z.object(newShape)
  //     console.log('Returning new ZodObject with updated optionality')
  //     return result
  //   }

  //   // Check for ZodArray by typeName
  //   if (schema._def?.typeName === 'ZodArray' && (schema as any).element) {
  //     console.log('Processing ZodArray by typeName check')
  //     return z.array(
  //       this.makeFieldsOptional((schema as any).element, defaults, currentPath)
  //     )
  //   }

  //   // Check for ZodUnion by typeName
  //   if (schema._def?.typeName === 'ZodUnion' && (schema as any).options) {
  //     console.log('Processing ZodUnion by typeName check')
  //     const options = (schema as any).options
  //     return z.union([
  //       this.makeFieldsOptional(options[0], defaults, currentPath),
  //       ...options
  //         .slice(1)
  //         .map((option: any) =>
  //           this.makeFieldsOptional(option, defaults, currentPath)
  //         ),
  //     ] as any)
  //   }

  //   // Check for ZodIntersection by typeName
  //   if (schema._def?.typeName === 'ZodIntersection') {
  //     console.log('Processing ZodIntersection by typeName check')
  //     return z.intersection(
  //       this.makeFieldsOptional(schema._def.left, defaults, currentPath),
  //       this.makeFieldsOptional(schema._def.right, defaults, currentPath)
  //     )
  //   }

  //   // For other schema types, return as-is
  //   console.log(`Other schema type (${schema._def?.typeName}), returning as-is`)
  //   return schema
  // }
  private makeFieldsOptionalDirect(
    schema: any,
    defaults: Record<string, any>
  ): z.ZodTypeAny {
    console.log('=== Direct approach ===')

    // If it has a shape property, treat it as a ZodObject
    if (schema.shape && typeof schema.shape === 'object') {
      console.log('Found shape property, processing as ZodObject')
      console.log('Shape keys:', Object.keys(schema.shape))

      const newShape: Record<string, z.ZodTypeAny> = {}

      for (const [fieldName, fieldSchema] of Object.entries(schema.shape)) {
        console.log(`Processing field: ${fieldName}`)

        // Check if this field has a default
        if (fieldName in defaults) {
          console.log(`Making field ${fieldName} optional - has default value`)
          newShape[fieldName] = (fieldSchema as z.ZodTypeAny).optional()
        } else {
          console.log(`Keeping field ${fieldName} as-is`)
          newShape[fieldName] = fieldSchema as z.ZodTypeAny
        }
      }

      console.log('Creating new ZodObject with shape:', Object.keys(newShape))
      return z.object(newShape)
    }

    console.log('No shape found, returning schema as-is')
    return schema
  }

  register(): GenericRegisteredServiceDefinition {
    let argsWithoutDefaults = this._args
    if (this.tableName === 'users') {
      argsWithoutDefaults = zodToConvex(
        this.makeFieldsOptionalDirect(this._schema, this._state.defaults)
      ) as unknown as CreateWithoutSystemFields<DocumentType>
      console.log('argsWithoutDefaults', argsWithoutDefaults)
      console.log('this._args', this._args)
      console.log('this.validator', this.validator)
    }
    // console.log('argsWithoutDefaults', argsWithoutDefaults)
    const registeredService: GenericRegisteredServiceDefinition = {
      tableName: this.tableName,
      schema: this.schema,
      validator: this.validator,
      $config: {
        indexes: this.indexes,
        searchIndexes: this.searchIndexes,
        vectorIndexes: this.vectorIndexes,
        state: this._state,
      },
      $args: this._args,
      $argsWithoutDefaults: argsWithoutDefaults,
    }
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
