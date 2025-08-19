import type { GenericRegisteredService } from './service'

export type GenericServiceSchema = ServiceSchema<any>

export class ServiceSchema<
  Services extends Record<string, GenericRegisteredService>
> {
  private _services: Services = {} as Services

  constructor(services: Services) {
    for (const [key, service] of Object.entries(services)) {
      if (key != service.name) {
        throw new Error(
          `Service name ${key} does not match exported name ${service.name}`
        )
      }
      this._services[key as keyof Services] =
        service as Services[keyof Services]
    }
  }

  public getService(name: keyof Services) {
    const service = this._services[name]
    if (!service) {
      throw new Error(`Service ${String(name)} not found`)
    }
    return service
  }

  public get services(): Services {
    return this._services
  }
}

export const defineServiceSchema = <
  Services extends Record<string, GenericRegisteredService>
>(
  services: Services
) => {
  return new ServiceSchema(services) as ServiceSchema<Services>
}
