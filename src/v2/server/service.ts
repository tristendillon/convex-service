import {
  defineTable,
  GenericTableIndexes,
  GenericTableSearchIndexes,
  GenericTableVectorIndexes,
  IndexTiebreakerField,
  TableDefinition,
  type SearchIndexConfig,
  type VectorIndexConfig,
} from 'convex/server'
import { GenericValidator } from 'convex/values'
import * as z from 'zod/v4'
import { Expand } from '../types'
import {
  GenericFields,
  ServiceField,
  ServiceFieldsToConvex,
  createZodSchemaFromFields,
  defineField,
} from './field'
import { zodToConvex } from './zod'
import type { GenericFieldHooks, GenericServiceHooks } from './hooks'
import type { GenericRlsRules } from './rls'

type Join<T extends string[], Sep extends string> = T extends []
  ? ''
  : T extends [infer F extends string]
  ? F
  : T extends [infer F extends string, ...infer R extends string[]]
  ? `${F}${Sep}${Join<R, Sep>}`
  : string

export type IndexNameByFields<T extends string[]> = `by_${Join<T, '_'>}`

/**
 * @internal
 */
export type VectorIndex<Fields extends GenericFields> = {
  indexDescriptor: string
  vectorField: FieldPaths<Fields>
  dimensions: number
  filterFields: FieldPaths<Fields>[]
}

/**
 * @internal
 */
export type Index<Fields extends GenericFields> = {
  indexDescriptor: string
  fields: FieldPaths<Fields>[]
}

/**
 * @internal
 */
export type SearchIndex<Fields extends GenericFields> = {
  indexDescriptor: string
  searchField: FieldPaths<Fields>
  filterFields: FieldPaths<Fields>[]
}
type IndexStrategies<Fields extends GenericFields> = {
  indexes: Index<Fields>[]
  searchIndexes: SearchIndex<Fields>[]
  vectorIndexes: VectorIndex<Fields>[]
}

type ServiceValidators<
  Fields extends GenericFields,
  State extends ServiceState<Fields>
> = {
  validator: ServiceFieldsToConvex<Fields>
  withoutDefaults: GenericValidator
  withDefaults: GenericValidator
}

type CompositeUnique<Fields extends GenericFields> = {
  fields: FieldPaths<Fields>[]
  onConflict: OnConflictPolicy
}

type ServiceState<Fields extends GenericFields> = {
  validators: ServiceValidators<Fields, ServiceState<Fields>>
  compositeUniques: Record<string, CompositeUnique<Fields>>
}

type OnConflictPolicy = 'replace' | 'fail'

type FieldPaths<Fields> = keyof Fields & string

type AnyServiceFields = Record<string, ServiceField<any, any>>

export type GenericRegisteredService = RegisteredServiceInterface<
  any,
  any,
  any,
  any,
  any
>

type RegisteredServiceOptions = {
  serviceHooks?: GenericServiceHooks
  fieldHooks?: GenericFieldHooks
  rls?: GenericRlsRules
}

interface RegisteredServiceInterface<
  Fields extends GenericFields,
  Validator extends GenericValidator,
  Indexes extends GenericTableIndexes = {},
  SearchIndexes extends GenericTableSearchIndexes = {},
  VectorIndexes extends GenericTableVectorIndexes = {}
> extends TableDefinition<Validator, Indexes, SearchIndexes, VectorIndexes> {
  export(): {
    name: string
    indexes: Index<Fields>[]
    searchIndexes: SearchIndex<Fields>[]
    vectorIndexes: VectorIndex<Fields>[]
    state: ServiceState<Fields>
    fields: Fields
    serviceHooks: GenericServiceHooks | undefined
    fieldHooks: GenericFieldHooks | undefined
    rlsRules: GenericRlsRules | undefined
    documentType: any
  }
}

type TableDefinitionData<Fields extends GenericFields> = {
  state: ServiceState<Fields>
  fields: Fields
  name: string
  indexStrategies: IndexStrategies<Fields>
}

export class RegisteredService<
  Fields extends GenericFields,
  Validator extends GenericValidator,
  Indexes extends GenericTableIndexes = {},
  SearchIndexes extends GenericTableSearchIndexes = {},
  VectorIndexes extends GenericTableVectorIndexes = {}
> {
  private _state: ServiceState<Fields> = {} as ServiceState<Fields>
  private _indexStrategies: IndexStrategies<Fields> = {
    indexes: [],
    searchIndexes: [],
    vectorIndexes: [],
  }
  private _fields: Fields = {} as Fields
  private _serviceHooks: GenericServiceHooks | undefined
  private _fieldHooks: GenericFieldHooks | undefined
  private _rlsRules: GenericRlsRules | undefined
  private _name: string = ''
  constructor(
    tableData: TableDefinitionData<Fields>,
    options: RegisteredServiceOptions = {}
  ) {
    this._name = tableData.name
    this._fields = tableData.fields
    this._state = tableData.state
    this._indexStrategies = tableData.indexStrategies
    this._serviceHooks = options.serviceHooks
    this._fieldHooks = options.fieldHooks
    this._rlsRules = options.rls
  }

  protected self(): TableDefinition<
    Validator,
    Indexes,
    SearchIndexes,
    VectorIndexes
  > {
    throw new Error('Method not implemented.')
  }

  ' indexes'(): { indexDescriptor: string; fields: string[] }[] {
    return this._indexStrategies.indexes
  }

  export() {
    const documentType = (this._state.validators.validator as any).json
    if (typeof documentType !== 'object') {
      throw new Error(
        'Invalid validator: please make sure that the parameter of `defineTable` is valid (see https://docs.convex.dev/database/schemas)'
      )
    }

    console.log(this._indexStrategies.indexes)

    return {
      indexes: this._indexStrategies.indexes,
      searchIndexes: this._indexStrategies.searchIndexes,
      vectorIndexes: this._indexStrategies.vectorIndexes,
      documentType,

      name: this._name,
      state: this._state,
      fields: this._fields,
      serviceHooks: this._serviceHooks,
      fieldHooks: this._fieldHooks,
      rlsRules: this._rlsRules,
    }
  }
}

export type GenericService = Service<any, any>

export class Service<
  Fields extends GenericFields,
  Indexes extends GenericTableIndexes = {},
  SearchIndexes extends GenericTableSearchIndexes = {},
  VectorIndexes extends GenericTableVectorIndexes = {}
> {
  private _state: ServiceState<Fields> = {
    validators: {
      validator: {},
      withoutDefaults: {},
      withDefaults: {},
    },
    compositeUniques: {},
  } as ServiceState<Fields>
  private _indexStrategies: IndexStrategies<Fields> = {
    indexes: [],
    searchIndexes: [],
    vectorIndexes: [],
  }
  private _fields: Fields = {} as Fields
  private _zodSchema: z.ZodType
  private _name: string = ''

  constructor(fields: Fields) {
    this._fields = Object.entries(fields).reduce((acc, [key, value]) => {
      if (value instanceof ServiceField) {
        acc[key] = value
      } else {
        acc[key] = defineField(value)
      }
      return acc
    }, {} as AnyServiceFields) as Fields

    this._zodSchema = createZodSchemaFromFields(this._fields)
    this._state.validators.validator = zodToConvex(
      this._zodSchema
    ) as unknown as ServiceFieldsToConvex<Fields>
  }

  private cleanIndexName(name: string): string {
    let cleaned = name.replace(/[^a-zA-Z0-9_]/g, '_')
    if (cleaned.length > 64) cleaned = cleaned.slice(0, 64)
    return cleaned
  }

  public compositeUnique<
    FirstFieldPath extends FieldPaths<Fields>,
    RestFieldPaths extends FieldPaths<Fields>[]
  >(
    fields: [FirstFieldPath, ...RestFieldPaths],
    onConflict: OnConflictPolicy
  ): Service<
    Fields,
    Expand<
      Indexes &
        Record<
          IndexNameByFields<[FirstFieldPath, ...RestFieldPaths]>,
          [FirstFieldPath, ...RestFieldPaths, IndexTiebreakerField]
        >
    >,
    SearchIndexes,
    VectorIndexes
  > {
    const indexName = this.cleanIndexName(`by_${fields.join('_')}`)
    this._state.compositeUniques[indexName] = {
      fields,
      onConflict,
    }
    this.index(indexName, fields)
    return this
  }

  public name(name: string): this {
    this._name = name
    return this
  }

  public index<
    IndexName extends string,
    FirstFieldPath extends FieldPaths<Fields>,
    RestFieldPaths extends FieldPaths<Fields>[]
  >(
    name: IndexName,
    fields: [FirstFieldPath, ...RestFieldPaths]
  ): Service<
    Fields,
    Expand<
      Indexes &
        Record<
          IndexName,
          [FirstFieldPath, ...RestFieldPaths, IndexTiebreakerField]
        >
    >,
    SearchIndexes,
    VectorIndexes
  > {
    const indexName = this.cleanIndexName(`by_${fields.join('_')}`)
    this._indexStrategies.indexes.push({
      indexDescriptor: indexName,
      fields: fields,
    })
    return this
  }

  public searchIndex<
    IndexName extends string,
    SearchField extends FieldPaths<Fields>,
    FilterFields extends FieldPaths<Fields> = never
  >(
    name: IndexName,
    indexConfig: Expand<SearchIndexConfig<SearchField, FilterFields>>
  ): Service<
    Fields,
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
    VectorIndexes
  > {
    this._indexStrategies.searchIndexes.push({
      indexDescriptor: name,
      searchField: indexConfig.searchField,
      filterFields: indexConfig.filterFields || [],
    })
    return this
  }

  public vectorIndex<
    IndexName extends string,
    VectorField extends FieldPaths<Fields>,
    FilterFields extends FieldPaths<Fields> = never
  >(
    name: IndexName,
    indexConfig: Expand<VectorIndexConfig<VectorField, FilterFields>>
  ): Service<
    Fields,
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
    >
  > {
    this._indexStrategies.vectorIndexes.push({
      indexDescriptor: name,
      vectorField: indexConfig.vectorField,
      dimensions: indexConfig.dimensions,
      filterFields: indexConfig.filterFields || [],
    })
    return this
  }

  public register(options: RegisteredServiceOptions = {}) {
    for (const [key, value] of Object.entries(this._fields)) {
      if (value instanceof ServiceField) {
        if (ServiceField.isUnique(value)) {
          this.index(`by_${key}`, [key as FieldPaths<Fields>])
        }
      }
    }
    const registeredService = new RegisteredService<
      Fields,
      ServiceFieldsToConvex<Fields>,
      Expand<Indexes & GetUniqueFieldIndexes<Fields>>,
      SearchIndexes,
      VectorIndexes
    >(
      {
        state: this._state,
        fields: this._fields,
        name: this._name,
        indexStrategies: this._indexStrategies,
      },
      options
    )

    return registeredService as unknown as RegisteredServiceInterface<
      Fields,
      ServiceFieldsToConvex<Fields>,
      Expand<Indexes & GetUniqueFieldIndexes<Fields>>,
      SearchIndexes,
      VectorIndexes
    >
  }
}

type GetUniqueFieldIndexes<Fields extends GenericFields> = {
  [K in keyof Fields as Fields[K] extends ServiceField<any, infer State>
    ? State['unique'] extends true
      ? `by_${K & string}`
      : never
    : never]: [K & string, IndexTiebreakerField]
}

export const defineService = <
  Fields extends Record<string, ServiceField | z.ZodType>
>(
  fields: Fields
) => {
  return new Service(fields)
}
