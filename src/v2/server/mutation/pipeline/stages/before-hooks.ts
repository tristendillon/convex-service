import type { PipelineStage, OperationContext } from '../types'
import type { GenericRegisteredService } from '../../../service'
import { ServiceHooks } from '../../../hooks/service'
import { ServiceField } from '../../../field'

export class BeforeHookStage implements PipelineStage {
  name = 'before-hooks'

  async execute(
    context: OperationContext<any, any, any>,
    data: any
  ): Promise<any> {
    if (!data) {
      return data
    }

    const service = context.schema[
      context.serviceName
    ] as GenericRegisteredService
    if (!service) {
      throw new Error(`Service ${context.serviceName} not found in schema`)
    }

    let processedData = data

    // Execute service-level before hooks
    if (service.$hooks.service) {
      const serviceHooks = ServiceHooks.getServiceHooks(service.$hooks.service)
      if (serviceHooks.before) {
        const hookOperation = this.mapOperationType(context.operation)
        const hookCtx = { ...context.ctx, meta: {} }

        console.log(
          '[PIPELINE][BEFORE HOOKS] Service Hook',
          serviceHooks.before
        )

        processedData = await serviceHooks.before({
          value: processedData,
          operation: hookOperation,
          ctx: hookCtx,
        })
      }
    }

    // Execute field-level before hooks from FieldHooks registry
    console.log('[PIPELINE][BEFORE HOOKS] Field Hooks', service.$hooks.field)
    if (service.$hooks.field) {
      const fieldHooks = service.$hooks.field.fieldHooks

      for (const [fieldName, fieldHook] of fieldHooks) {
        console.log(
          `[PIPELINE][BEFORE HOOKS][FIELD][${fieldName}] Field Hook`,
          fieldHook
        )
        if (fieldHook.before) {
          const hookOperation = this.mapOperationType(context.operation)
          const hookCtx = { ...context.ctx, meta: {} }

          console.log('[PIPELINE][BEFORE HOOKS] Field Hook', fieldHook.before)

          processedData[fieldName] = await fieldHook.before({
            value: processedData,
            operation: hookOperation,
            ctx: hookCtx,
          })
        }
      }
    }

    // Execute ServiceField hooks
    for (const [fieldName, field] of Object.entries(service.fields)) {
      if (field instanceof ServiceField) {
        const fieldHooks = field.fieldHooks
        if (fieldHooks?.before) {
          const hookOperation = this.mapOperationType(context.operation)
          const hookCtx = { ...context.ctx, meta: {} }

          console.log(
            `[PIPELINE][BEFORE HOOKS][SERVICE FIELD][${fieldName}] Hook`,
            fieldHooks.before
          )

          processedData[fieldName] = await fieldHooks.before({
            value: processedData,
            operation: hookOperation,
            ctx: hookCtx,
          })
          console.log(
            `[PIPELINE][BEFORE HOOKS][SERVICE FIELD][${fieldName}] Processed Data`,
            processedData
          )
        }
      }
    }

    return processedData
  }

  private mapOperationType(operation: string): 'insert' | 'update' | 'delete' {
    switch (operation) {
      case 'insert':
        return 'insert'
      case 'patch':
      case 'replace':
        return 'update'
      case 'delete':
        return 'delete'
      default:
        throw new Error(`Unknown operation type: ${operation}`)
    }
  }
}
