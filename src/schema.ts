// schema.ts - Updated implementation with services property

import type {
  GenericServiceSchema,
  ServiceSchemaDefinitionInterface,
} from './schema.types'

export class ServiceSchemaDefinition<Schema extends GenericServiceSchema> {
  public tables: Schema

  /**
   * @internal
   */
  constructor(tables: Schema) {
    this.tables = tables
  }
}

export const defineServiceSchema = <Schema extends GenericServiceSchema>(
  schema: Schema
) => {
  for (const [tableName, definition] of Object.entries(schema)) {
    const service = definition
    if (!service.tableName) {
      throw new Error(
        `Service name is not defined. Please define the service name with the .name builder!`
      )
    }
    if (service.tableName != tableName) {
      throw new Error(
        `Table name mismatch!\n` +
          ` - Name defined in service: '${service.tableName}'\n` +
          ` - Name defined in schema: '${tableName}'`
      )
    }
  }
  return new ServiceSchemaDefinition(
    schema
  ) as unknown as ServiceSchemaDefinitionInterface<Schema>
}
