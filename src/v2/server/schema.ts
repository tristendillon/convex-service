import type { GenericRegisteredService } from './service'

export type GenericServiceSchema = Record<string, GenericRegisteredService>

export type ServiceNamesInServiceSchema<Schema extends GenericServiceSchema> =
  keyof Schema & string

export class ServiceSchema<
  Schema extends Record<string, GenericRegisteredService> = GenericServiceSchema
> {
  private _services: Schema = {} as Schema

  constructor(services: Schema) {
    for (const [key, service] of Object.entries(services)) {
      if (key != service.name) {
        throw new Error(
          `Service name ${key} does not match exported name ${service.name}`
        )
      }
      this._services[key as keyof Schema] = service as Schema[keyof Schema]
    }
  }

  public getService(name: keyof Schema) {
    const service = this._services[name]
    if (!service) {
      throw new Error(`Service ${String(name)} not found`)
    }
    return service
  }

  public get services(): Schema {
    return this._services
  }
}

export const defineServiceSchema = <Schema extends GenericServiceSchema>(
  services: Schema
) => {
  return new ServiceSchema(services) as ServiceSchema<Schema>
}
