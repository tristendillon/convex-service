import type { ConvexServiceInterface } from './service.types'

type GetTableName<T> = T extends ConvexServiceInterface ? T['tableName'] : never

// Type to convert array of services to a record type
export type SchemaFromServiceNames<
  Services extends ReadonlyArray<ConvexServiceInterface>
> = {
  [K in keyof Services as Services[K] extends ConvexServiceInterface
    ? GetTableName<Services[K]>
    : never]: Services[K]
}

// reimplementing the schema definition interface to get the type safety on the schema
export interface ServiceSchemaDefinitionInterface<
  Services extends ReadonlyArray<ConvexServiceInterface>,
  Schema extends SchemaFromServiceNames<Services>,
  StrictTableTypes extends boolean
> {
  tables: Schema
  strictTableNameTypes: StrictTableTypes
  readonly schemaValidation: boolean
  export(): string
}
