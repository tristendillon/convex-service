import {
  Expand,
  GenericDataModel,
  GenericDocument,
  GenericMutationCtx,
} from 'convex/server'
import { GenericServiceSchema } from '../schema.types'
import { GenericId } from 'convex/values'
import { BuilderState, SystemFieldsWithId } from '../service.types'

export class ServiceValidator {
  constructor(private schema: GenericServiceSchema) {}

  private getService(tableName: string) {
    const service = Object.values(this.schema).find(
      (service) => service.tableName === tableName
    )
    if (!service) {
      throw new Error(`Service ${tableName} not found`)
    }
    return service
  }

  createValidator(tableName: string) {
    const service = this.getService(tableName)
    const state = service.$config.state as BuilderState
    const schemaOrFn = state.validate

    return async (
      ctx: GenericMutationCtx<GenericDataModel>,
      tName: string,
      value: GenericDocument
    ) => {
      if (typeof schemaOrFn === 'function') {
        const document = await ctx.db.get(value._id as GenericId<string>)
        if (!document) {
          throw new Error(`Document ${value._id} not found`)
        }
        await schemaOrFn(
          ctx,
          document as Expand<GenericDocument & SystemFieldsWithId<string>>
        )
      } else if (typeof schemaOrFn === 'object') {
        const { error } = schemaOrFn.safeParse(value)
        if (error) {
          const formatted = error.flatten()

          // Build the error message with proper formatting
          let errorMessage = `ValidationError: Failed to validate ${tName}`

          // Add field errors if they exist
          if (
            formatted.fieldErrors &&
            Object.keys(formatted.fieldErrors).length > 0
          ) {
            errorMessage += '\n  * Field errors:'
            for (const [field, errors] of Object.entries(
              formatted.fieldErrors
            )) {
              if (Array.isArray(errors)) {
                errors.forEach((err) => {
                  errorMessage += `\n    - ${field}: ${err}`
                })
              }
            }
          }

          // Add form errors if they exist
          if (formatted.formErrors && formatted.formErrors.length > 0) {
            errorMessage += '\n  * Form errors:'
            formatted.formErrors.forEach((err) => {
              errorMessage += `\n    - ${err}`
            })
          }

          throw new Error(errorMessage)
        }
      }
    }
  }

  createDefaultsApplier(tableName: string) {
    const service = this.getService(tableName)
    const defaults = service?.$config?.state?.defaults || {}

    return (value: GenericDocument) => ({ ...value, ...defaults })
  }
}