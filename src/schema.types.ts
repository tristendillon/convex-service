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
  register: () => RegisteredServiceSchemaDefinition<Schema>
}

export interface RegisteredServiceSchemaDefinition<
  Schema extends GenericServiceSchema
> {
  services: Schema

  // mutation: ServiceMutation<DataModelFromServiceSchemaDefinition<Schema>>
  // query: typeof queryGeneric
  // internalMutation: typeof internalMutationGeneric
  // internalQuery: typeof internalQueryGeneric
  // crud: typeof crud
}
