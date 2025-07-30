import type { GenericRegisteredServiceDefinition } from './service.types'

export type GenericServiceSchema = Record<
  string,
  GenericRegisteredServiceDefinition
>

/**
 * Add a services property that returns the registered services
 */
export interface ServiceSchemaDefinitionInterface<
  Schema extends GenericServiceSchema
> {
  services: Schema
}
