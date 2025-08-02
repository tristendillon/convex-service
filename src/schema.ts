// schema.ts - Updated implementation with services property

import type {
  GenericServiceSchema,
  RegisteredServiceSchemaDefinition,
  ServiceSchemaDefinitionInterface,
} from './schema.types'

// Temp until we have our functions mutations, queries, and crud functions.
import {
  internalMutationGeneric,
  internalQueryGeneric,
  queryGeneric,
} from 'convex/server'
import { crud } from 'convex-helpers/server/crud'
import { CreateServiceMutation } from './mutation'

export class ServiceSchemaDefinition<Schema extends GenericServiceSchema> {
  public services: Schema

  /**
   * @internal
   */
  constructor(tables: Schema) {
    this.services = tables
  }

  register(): RegisteredServiceSchemaDefinition<Schema> {
    return {
      services: this.services,
      // mutation: CreateServiceMutation(this.services),
      // query: queryGeneric,
      // internalMutation: internalMutationGeneric,
      // internalQuery: internalQueryGeneric,
      // crud: crud,
    }
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
  ) as ServiceSchemaDefinitionInterface<Schema>
}
