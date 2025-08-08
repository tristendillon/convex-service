import {
  GenericDataModel,
  GenericTableIndexes,
  GenericTableSearchIndexes,
  GenericTableVectorIndexes,
  IndexTiebreakerField,
  TableDefinition,
  defineTable,
} from 'convex/server'
import { GenericValidator, v } from 'convex/values'
import z, { ZodTypeAny } from 'zod'
import { Expand, Merge } from '../types'
import { ServiceField, defineField } from './field'
import { ServiceOperation } from './types'

type Field = ServiceField | z.ZodTypeAny // | RegisteredServiceField
type GenericFields = Record<string, Field>

/**
 * @internal
 */
export type VectorIndex<Fields extends GenericFields> = {
  indexDescriptor: string
  vectorField: string
  dimensions: number
  filterFields: string[]
}

/**
 * @internal
 */
export type Index<Fields extends GenericFields> = {
  indexDescriptor: string
  fields: string[]
}

/**
 * @internal
 */
export type SearchIndex<Fields extends GenericFields> = {
  indexDescriptor: string
  searchField: string
  filterFields: string[]
}

type UpdateIndexStrategies<
  Fields extends GenericFields,
  Indexes extends IndexStrategies,
  IndexName extends string,
  FirstFieldPath extends FieldPaths<Fields>,
  RestFieldPaths extends FieldPaths<Fields>[]
> = Indexes & {
  indexes: Expand<
    Indexes['indexes'] &
      Record<
        IndexName,
        [FirstFieldPath, ...RestFieldPaths, IndexTiebreakerField]
      >
  >
}

type IndexStrategies = {
  indexes: GenericTableIndexes
  searchIndexes: GenericTableSearchIndexes
  vectorIndexes: GenericTableVectorIndexes
}

type ServiceValidators = {
  validator: GenericValidator
  withoutDefaults: GenericValidator
  withDefaults: GenericValidator
}

// Use a looser constraint for BuildZodSchema
type BuildZodSchema<Fields extends GenericFields> = z.ZodObject<{
  [K in keyof Fields]: Fields[K] extends ServiceField<infer T>
    ? T
    : Fields[K] extends ZodTypeAny
    ? Fields[K]
    : ZodTypeAny
}>

type CompositeUnique<Fields extends GenericFields> = {
  fields: FieldPaths<Fields>
  onConflict: OnConflictPolicy
}

type ServiceState<Fields extends GenericFields> = {
  validators: ServiceValidators
  compositeUniques: CompositeUnique<Fields>[]
  beforeOperation(
    operation: ServiceOperation<BuildZodSchema<Fields>>
  ): Promise<BuildZodSchema<Fields>> | BuildZodSchema<Fields>
  afterOperation(
    operation: ServiceOperation<BuildZodSchema<Fields>>
  ): Promise<void> | void
}

type OnConflictPolicy = 'replace' | 'fail'

type FieldPaths<Fields> = keyof Fields

type AnyServiceFields = Record<string, ServiceField<any, any>>

export class Service<
  Fields extends GenericFields,
  Indexes extends IndexStrategies = IndexStrategies
> {
  private _table: TableDefinition
  private _state: ServiceState<AnyServiceFields> =
    {} as ServiceState<AnyServiceFields>
  private _indexStrategies = {
    indexes: [] as Index<Fields>[],
    searchIndexes: [] as SearchIndex<Fields>[],
    vectorIndexes: [] as VectorIndex<Fields>[],
  }
  private _fields: AnyServiceFields
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
    }, {} as AnyServiceFields)

    this._table = defineTable({
      test: v.string(),
    })
  }

  private _mergeState(state: Partial<ServiceState<AnyServiceFields>>) {
    this._state = {
      ...this._state,
      ...state,
    }
    return this
  }

  public beforeOperation(
    callback: ServiceState<AnyServiceFields>['beforeOperation']
  ): this {
    this._mergeState({
      beforeOperation: callback as any,
    })
    return this
  }

  public afterOperation(
    callback: ServiceState<AnyServiceFields>['afterOperation']
  ): this {
    this._mergeState({
      afterOperation: callback as any,
    })
    return this
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
      fields: fields.map((field) => field.toString()),
    })
    return this
  }

  public searchIndex(name: string, fields: FieldPaths<Fields>[]): this {
    return this
  }

  public vectorIndex(name: string, fields: FieldPaths<Fields>[]): this {
    return this
  }

  public register() {}

  public toConvexTable() {
    return this._table as TableDefinition<
      ServiceValidators['validator'],
      Indexes['indexes'],
      Indexes['searchIndexes'],
      Indexes['vectorIndexes']
    >
  }
}

export const defineService = <
  Fields extends Record<string, ServiceField | z.ZodTypeAny>
>(
  fields: Fields
) => {
  return new Service(fields)
}
