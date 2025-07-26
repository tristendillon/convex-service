import { type DefineSchemaOptions } from 'convex/server'
import type { ServiceSchemaDefinition as IServiceSchemaDefinition } from './schema.types'
import type { ConvexServiceInterface } from './service.types'
import type { GenericSchema } from 'convex/server'

export class ServiceSchemaDefinition<
  Schema extends GenericSchema,
  StrictTableTypes extends boolean
> {
  public tables: Schema
  public strictTableNameTypes!: StrictTableTypes
  private readonly schemaValidation: boolean

  /**
   * @internal
   */
  constructor(tables: Schema, options?: DefineSchemaOptions<StrictTableTypes>) {
    this.tables = tables
    this.schemaValidation =
      options?.schemaValidation === undefined ? true : options.schemaValidation
  }

  /**
   * Export the contents of this definition.
   *
   * This is called internally by the Convex framework.
   * @internal
   */
  export(): string {
    return JSON.stringify({
      tables: Object.entries(this.tables).map(([tableName, definition]) => {
        const service = (
          definition as unknown as ConvexServiceInterface
        ).export()
        if (!service.state) {
          throw new Error(
            'Service state is not defined. Please use the defineService function to define the service.'
          )
        }
        const { indexes, searchIndexes, vectorIndexes, documentType, state } =
          service
        return {
          tableName,
          indexes,
          searchIndexes,
          vectorIndexes,
          documentType,
          state,
        }
      }),
      schemaValidation: this.schemaValidation,
    })
  }
}

export const defineServiceSchema = <
  Schema extends GenericSchema,
  StrictTableTypes extends boolean
>(
  schema: Schema,
  options?: DefineSchemaOptions<boolean>
) => {
  return new ServiceSchemaDefinition(
    schema,
    options
  ) as unknown as IServiceSchemaDefinition<Schema, StrictTableTypes>
}
