import type { GenericSchema } from 'convex/server'
import type { ServiceSchemaDefinition } from './schema'

// Updated interface that works with GenericSchema
export interface ServiceSchemaDefinitionInterface<
  Schema extends GenericSchema,
  StrictTableTypes extends boolean = false
> extends ServiceSchemaDefinition<Schema, StrictTableTypes> {
  export(): string
}
