import type { PipelineStage, OperationContext } from '../types'
import type { GenericRegisteredService } from '../../../service'

export class ParseStage implements PipelineStage {
  name = 'parse'

  async execute(
    context: OperationContext<any, any, any>,
    data: any
  ): Promise<any> {
    if (!data || context.operation === 'delete') {
      return data
    }

    const service = context.schema[
      context.serviceName
    ] as GenericRegisteredService
    if (!service) {
      throw new Error(`Service ${context.serviceName} not found in schema`)
    }

    try {
      let dataToValidate = data

      // For patch operations, fetch existing data and merge with patch data
      if (context.operation === 'patch' && context.id) {
        const existingDoc = await context.ctx.db.get(context.id)

        if (!existingDoc) {
          throw new Error(`Document with ID ${context.id} not found`)
        }

        // Filter out fields that haven't actually changed
        const changedFields: Record<string, any> = {}
        for (const [key, value] of Object.entries(data)) {
          // Only include field if the value is different from existing
          if (existingDoc[key] !== value) {
            changedFields[key] = value
          }
        }

        // Track which fields are actually being patched (only changed fields)
        context.patchedFields = new Set(Object.keys(changedFields))
        
        // If no fields changed, we still need to return the full document for validation
        // but the execute stage can detect this and skip the patch
        if (Object.keys(changedFields).length === 0) {
          // No actual changes, return existing document as-is
          dataToValidate = existingDoc
        } else {
          // Merge existing data with only the changed fields
          dataToValidate = {
            ...existingDoc,
            ...changedFields,
          }
        }
      }

      console.log('dataToValidate', dataToValidate)

      // Use the service's schema with defaults to parse and validate the data
      const zodSchema = service.schemas.withDefaults

      // Parse and validate the data, applying defaults automatically
      if (Array.isArray(dataToValidate)) {
        return dataToValidate.map((item) => zodSchema.parse(item))
      } else {
        return zodSchema.parse(dataToValidate)
      }
    } catch (error) {
      throw new Error(`Data validation failed: ${error}`)
    }
  }
}
