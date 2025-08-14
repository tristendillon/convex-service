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
type IndexStrategies = {
  indexes: GenericTableIndexes
  searchIndexes: GenericTableSearchIndexes
  vectorIndexes: GenericTableVectorIndexes
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
  fields: FieldPaths<Fields>
  onConflict: OnConflictPolicy
}

type ServiceState<Fields extends GenericFields> = {
  validators: ServiceValidators<Fields, ServiceState<Fields>>
  compositeUniques: CompositeUnique<Fields>[]
}

type OnConflictPolicy = 'replace' | 'fail'

type FieldPaths<Fields> = keyof Fields & string

type AnyServiceFields = Record<string, ServiceField<any, any>>

export type GenericRegisteredService = RegisteredService<any, any, any>

export class RegisteredService<
  Fields extends GenericFields,
  Validator extends GenericValidator,
  Indexes extends IndexStrategies = IndexStrategies
> {
  private _table: TableDefinition
  private _state: ServiceState<Fields> = {} as ServiceState<Fields>
  private _indexStrategies = {
    indexes: [] as Index<Fields>[],
    searchIndexes: [] as SearchIndex<Fields>[],
    vectorIndexes: [] as VectorIndex<Fields>[],
  }
  private _fields: Fields = {} as Fields
  private _serviceHooks: GenericServiceHooks | undefined
  private _fieldHooks: GenericFieldHooks | undefined
  private _name: string = ''
  constructor(
    state: ServiceState<Fields>,
    fields: Fields,
    name: string,
    options: {
      serviceHooks?: GenericServiceHooks
      fieldHooks?: GenericFieldHooks
    } = {}
  ) {
    this._name = name
    this._table = defineTable(state.validators.validator)
    this._fields = fields
    this._state = state
    this._serviceHooks = options.serviceHooks
    this._fieldHooks = options.fieldHooks
  }

  public export() {
    return {
      name: this._name,
      table: this._table,
      fields: this._fields,
      state: this._state,
      serviceHooks: this._serviceHooks,
      fieldHooks: this._fieldHooks,
    }
  }

  public toConvexTable(): TableDefinition<
    Validator,
    Indexes['indexes'],
    Indexes['searchIndexes'],
    Indexes['vectorIndexes']
  > {
    return this._table as TableDefinition<
      Validator,
      Indexes['indexes'],
      Indexes['searchIndexes'],
      Indexes['vectorIndexes']
    >
  }
}

export type GenericService = Service<any, any>

export class Service<
  Fields extends GenericFields,
  Indexes extends IndexStrategies = IndexStrategies
> {
  private _state: ServiceState<Fields> = {
    validators: {
      validator: {},
      withoutDefaults: {},
      withDefaults: {},
    },
    compositeUniques: [],
  } as unknown as ServiceState<Fields>
  private _indexStrategies = {
    indexes: [] as Index<Fields>[],
    searchIndexes: [] as SearchIndex<Fields>[],
    vectorIndexes: [] as VectorIndex<Fields>[],
  }
  private _fields: Fields = {} as Fields
  private _zodSchema: z.ZodType
  private _name: string = ''

  constructor(fields: Fields) {
    this._fields = Object.entries(fields).reduce((acc, [key, value]) => {
      // if (value instanceof RegisteredServiceField) {
      //   acc[key] = value
      // } else
      if (value instanceof ServiceField) {
        acc[key] = value.register()
      } else {
        acc[key] = defineField(value).register()
      }
      return acc
    }, {} as AnyServiceFields) as Fields

    this._zodSchema = createZodSchemaFromFields(this._fields)

    this._state.validators.validator = zodToConvex(
      this._zodSchema
    ) as unknown as ServiceFieldsToConvex<Fields>
  }

  public compositeUnique(
    fields: FieldPaths<Fields>,
    onConflict: OnConflictPolicy
  ): this {
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
    Indexes & {
      indexes: Expand<
        Indexes['indexes'] &
          Record<
            IndexName,
            [FirstFieldPath, ...RestFieldPaths, IndexTiebreakerField]
          >
      >
    }
  > {
    this._indexStrategies.indexes.push({
      indexDescriptor: name,
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
    Indexes & {
      searchIndexes: Expand<
        Indexes['searchIndexes'] &
          Record<
            IndexName,
            {
              searchField: SearchField
              filterFields: FilterFields
            }
          >
      >
    }
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
    Indexes & {
      vectorIndexes: Expand<
        Indexes['vectorIndexes'] &
          Record<
            IndexName,
            {
              vectorField: VectorField
              dimensions: number
              filterFields: FilterFields
            }
          >
      >
    }
  > {
    this._indexStrategies.vectorIndexes.push({
      indexDescriptor: name,
      vectorField: indexConfig.vectorField,
      dimensions: indexConfig.dimensions,
      filterFields: indexConfig.filterFields || [],
    })
    return this
  }

  public register(
    options: {
      serviceHooks?: GenericServiceHooks
      fieldHooks?: GenericFieldHooks
    } = {}
  ) {
    type Validator = typeof this._state.validators.validator
    return new RegisteredService<Fields, Validator, Indexes>(
      this._state,
      this._fields,
      this._name,
      options
    )
  }
}

export const defineService = <
  Fields extends Record<string, ServiceField | z.ZodType>
>(
  fields: Fields
) => {
  return new Service(fields)
}
