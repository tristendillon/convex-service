import { type DefineSchemaOptions } from 'convex/server'
import type { ServiceSchemaDefinitionInterface } from './schema.types'
import type { ConvexServiceInterface } from './service.types'
import type { GenericSchema } from 'convex/server'

export class ServiceSchemaDefinition<
  Schema extends GenericSchema,
  StrictTableTypes extends boolean
> {
  public tables: Schema
  public strictTableNameTypes!: StrictTableTypes

  /**
   * @internal
   */
  constructor(tables: Schema) {
    this.tables = tables
  }
}

export const defineServiceSchema = <Schema extends GenericSchema>(
  schema: Schema
) => {
  for (const [tableName, definition] of Object.entries(schema)) {
    const service = definition as unknown as ConvexServiceInterface
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
