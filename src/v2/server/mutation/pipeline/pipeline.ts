import { GenericDataModel, GenericMutationCtx } from 'convex/server'
import { GenericId } from 'convex/values'
import type {
  GenericServiceSchema,
  ServiceNamesInServiceSchema,
} from '../../schema'
import type {
  OperationContext,
  OperationType,
  PipelineStage,
  PipelineConfig,
} from './types'
import { ParseStage } from './stages/parse'
import { RestrictionStage } from './stages/restriction'
import { RelationsStage } from './stages/relations'
import { BeforeHookStage } from './stages/before-hooks'
import { ExecuteStage } from './stages/execute'
import { AfterHookStage } from './stages/after-hooks'
import { getDefaultConfig } from './configs'

export class OperationPipeline<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>
> {
  private allStages: Record<string, PipelineStage> = {}

  constructor(
    private serviceName: ServiceName | undefined,
    private ctx: GenericMutationCtx<DataModel>,
    private schema: Schema
  ) {
    this.initializeStages()
  }

  private initializeStages() {
    this.allStages = {
      parse: new ParseStage(),
      restrictions: new RestrictionStage(),
      relations: new RelationsStage(),
      beforeHooks: new BeforeHookStage(),
      execute: new ExecuteStage(),
      afterHooks: new AfterHookStage(),
    }
  }

  private _tableNameFromId(id: GenericId<ServiceName>): ServiceName | null {
    for (const serviceName of Object.keys(this.schema)) {
      if (this.ctx.db.normalizeId(serviceName, id)) {
        return serviceName as ServiceName
      }
    }
    return null
  }

  async executeOperation(
    operation: OperationType,
    data: any,
    id?: GenericId<ServiceName> | GenericId<ServiceName>[],
    config?: PipelineConfig
  ): Promise<any> {
    const pipelineConfig = config || getDefaultConfig(operation)

    if (!this.serviceName) {
      let idToUse = id
      if (!Array.isArray(id)) {
        idToUse = id
      } else {
        idToUse = id[0]
      }
      if (!idToUse) {
        throw new Error('ID is required if service name is not provided')
      }
      const serviceName = this._tableNameFromId(idToUse)
      if (!serviceName) {
        throw new Error(`ID ${idToUse} does not match any service name`)
      }
      this.serviceName = serviceName
    }

    let context: OperationContext<DataModel, Schema, ServiceName> = {
      serviceName: this.serviceName,
      ctx: this.ctx,
      schema: this.schema,
      operation,
      data,
    }

    if (id) {
      if (Array.isArray(id)) {
        context.ids = id
      } else {
        context.id = id
      }
    }

    let currentData = data

    // Execute stages based on configuration
    const stageOrder = [
      'parse',
      'restrictions',
      'relations',
      'beforeHooks',
      'execute',
      'afterHooks',
    ]

    for (const stageName of stageOrder) {
      if (pipelineConfig[stageName as keyof PipelineConfig]) {
        const stage = this.allStages[stageName]
        if (stage) {
          try {
            currentData = await stage.execute(context, currentData)

            // Update context with any modifications from the stage
            if (
              stage.name === 'restriction' &&
              context.operation !== operation
            ) {
              // Operation was modified by restriction checks
              operation = context.operation
            }
          } catch (error) {
            throw new Error(`Pipeline failed at stage ${stage.name}: ${error}`)
          }
        }
      }
    }

    return currentData
  }

  // Convenience methods for different operations
  async insert(data: any): Promise<GenericId<ServiceName>> {
    return this.executeOperation('insert', data)
  }

  async insertMany(data: any[]): Promise<GenericId<ServiceName>[]> {
    return Promise.all(
      data.map((item) => this.executeOperation('insert', item))
    )
  }

  async patch(
    id: GenericId<ServiceName>,
    data: any
  ): Promise<GenericId<ServiceName>> {
    return this.executeOperation('patch', data, id)
  }

  async patchMany(
    ids: GenericId<ServiceName>[],
    data: any[]
  ): Promise<GenericId<ServiceName>[]> {
    if (ids.length !== data.length) {
      throw new Error(
        `ID count (${ids.length}) must match data count (${data.length})`
      )
    }
    return Promise.all(
      ids.map((id, index) => this.executeOperation('patch', data[index], id))
    )
  }

  async replace(
    id: GenericId<ServiceName>,
    data: any
  ): Promise<GenericId<ServiceName>> {
    return this.executeOperation('replace', data, id)
  }

  async replaceMany(
    ids: GenericId<ServiceName>[],
    data: any[]
  ): Promise<GenericId<ServiceName>[]> {
    if (ids.length !== data.length) {
      throw new Error(
        `ID count (${ids.length}) must match data count (${data.length})`
      )
    }
    return Promise.all(
      ids.map((id, index) => this.executeOperation('replace', data[index], id))
    )
  }

  async delete(id: GenericId<ServiceName>): Promise<GenericId<ServiceName>> {
    return this.executeOperation('delete', undefined, id)
  }

  async deleteMany(
    ids: GenericId<ServiceName>[]
  ): Promise<GenericId<ServiceName>[]> {
    // For delete operations, we can process them individually or in batch
    // Let's process them individually to ensure proper hook execution per item
    return Promise.all(
      ids.map((id) => this.executeOperation('delete', undefined, id))
    )
  }
}
