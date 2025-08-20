import type { PipelineStage, OperationContext } from '../types'
import type { GenericRegisteredService } from '../../../service'
import { ServiceHooks } from '../../../hooks/service'
import { ServiceField } from '../../../field'

export class AfterHookStage implements PipelineStage {
  name = 'after-hooks'

  async execute(
    context: OperationContext<any, any, any>,
    data: any
  ): Promise<any> {
    const service = context.schema[
      context.serviceName
    ] as GenericRegisteredService
    if (!service) {
      throw new Error(`Service ${context.serviceName} not found in schema`)
    }

    // Execute service-level after hooks
    if (service.$hooks.service) {
      const serviceHooks = ServiceHooks.getServiceHooks(service.$hooks.service)
      if (serviceHooks.after) {
        const hookOperation = this.mapOperationType(context.operation)
        const hookCtx = {
          ...context.ctx,
          meta: {},
        }

        await serviceHooks.after({
          value: data,
          operation: hookOperation,
          ctx: hookCtx,
        })
      }
    }

    // Execute field-level after hooks from FieldHooks registry
    if (service.$hooks.field) {
      const fieldHooks = service.$hooks.field.fieldHooks

      for (const [fieldName, fieldHook] of fieldHooks) {
        if (fieldHook.after && data && data[fieldName] !== undefined) {
          const hookOperation = this.mapOperationType(context.operation)
          const hookCtx = { ...context.ctx, meta: {} }

          await fieldHook.after({
            value: data,
            operation: hookOperation,
            ctx: hookCtx,
          })
        }
      }
    }

    // Execute ServiceField hooks
    for (const [fieldName, field] of Object.entries(service.fields)) {
      if (field instanceof ServiceField && data && data[fieldName] !== undefined) {
        const fieldHooks = field.fieldHooks
        if (fieldHooks?.after) {
          const hookOperation = this.mapOperationType(context.operation)
          const hookCtx = { ...context.ctx, meta: {} }

          await fieldHooks.after({
            value: data,
            operation: hookOperation,
            ctx: hookCtx,
          })
        }
      }
    }

    return data
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
