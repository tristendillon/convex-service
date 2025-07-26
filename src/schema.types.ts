import type { GenericSchema, SchemaDefinition } from 'convex/server'

export interface ServiceSchemaDefinition<
  Schema extends GenericSchema,
  StrictTableTypes extends boolean
> extends SchemaDefinition<Schema, StrictTableTypes> {
  export(): string
}
