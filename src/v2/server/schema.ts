import type { GenericRegisteredService } from './service'

class ServiceSchema {
  private _services: Record<string, GenericRegisteredService> = {}

  constructor(services: Record<string, GenericRegisteredService>) {
    for (const [key, service] of Object.entries(services)) {
      const exported = service.export()
      if (key != exported.name) {
        throw new Error(
          `Service name ${key} does not match exported name ${exported.name}\n` +
            `  - Ensure that your service.name(...) matches the key in your service schema.`
        )
      }
      this._services[key] = service
    }
  }

  public getService(name: string) {
    const service = this._services[name]
    if (!service) {
      throw new Error(`Service ${name} not found`)
    }
    return service
  }
}

export const defineServiceSchema = (
  services: Record<string, GenericRegisteredService>
) => {
  return new ServiceSchema(services)
}
