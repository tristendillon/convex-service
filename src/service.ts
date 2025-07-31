import { z } from 'zod'
import { zid, zodToConvex } from 'convex-helpers/server/zod'

import type {
  ConvexServiceInterface,
  BuilderState,
  GenericRegisteredServiceDefinition,
  CreateWithoutSystemFields,
} from './service.types'
import {
  GenericQueryCtx,
  GenericDataModel,
  type TableNamesInDataModel,
  type Expand,
} from 'convex/server'
import { GenericValidator } from 'convex/values'
import type {
  ExtractFieldPathsWithConvexSystemFields,
  ConvexValidatorFromZod,
  ExtractFieldPathsWithoutSystemFields,
  ValueOrFunctionFromValidator,
  GetAllVIdPaths,
  ExportedTableDefinition,
  UniqueField,
  CompositeUniqueFields,
  BaseOnConflict,
  FunctionValidateConstraint,
  ValidateConstraint,
  BaseOnDelete,
} from './shared-types'

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
      validate: undefined,
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

  default<
    FieldPath extends ExtractFieldPathsWithoutSystemFields<DocumentType>,
    DefaultValue extends ValueOrFunctionFromValidator<DocumentType, FieldPath>
  >(field: FieldPath, value: DefaultValue): this {
    this._state.defaults[field] = value
    return this
  }

  unique(field: UniqueField<DocumentType>): this
  unique(
    fields: CompositeUniqueFields<DocumentType>,
    onConflict: BaseOnConflict
  ): this
  unique(
    fields: UniqueField<DocumentType> | CompositeUniqueFields<DocumentType>,
    onConflict?: BaseOnConflict
  ): this {
    if (Array.isArray(fields)) {
      const indexName = `by_${fields.join('_')}`
      this.index(indexName, fields)
      this._state.uniques.push({ fields, onConflict: onConflict ?? 'fail' })
    } else {
      const indexName = `by_${fields}`
      this.index(indexName, [fields])
      this._state.uniques.push({
        fields,
        onConflict: onConflict ?? 'fail',
      })
    }
    return this
  }
  validate(): this
  // Use the service's schema for the validate function.
  validate(fn: FunctionValidateConstraint<ZodSchema>): this
  validate<Schema extends z.ZodTypeAny>(schema: Schema): this
  validate(schemaOrFn?: ValidateConstraint): this {
    if (schemaOrFn === undefined) {
      this._state.validate = this._schema
      return this
    }
    this._state.validate = schemaOrFn
    return this
  }

  relation<
    FieldPath extends GetAllVIdPaths<DocumentType>,
    TableName extends TableNamesInDataModel<GenericDataModel>
  >(field: FieldPath, table: TableName, onDelete: BaseOnDelete): this {
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
    return registeredService
  }
}

export function defineService<ZodSchema extends z.ZodTypeAny>(
  zodSchema: ZodSchema
): ConvexServiceInterface<ZodSchema> {
  return new ConvexService(
    zodSchema
  ) as unknown as ConvexServiceInterface<ZodSchema>
}
