import {
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericId } from 'convex/values'
import {
  InsertBuilder,
  type ExtractDocumentType,
  type ExtractDocumentTypeWithoutDefaults,
} from '../types'
import type { PipelineConfig } from '../pipeline/types'
import {
  type GenericServiceSchema,
  type ServiceNamesInServiceSchema,
} from '../../schema'
import { OperationPipeline } from '../pipeline'

export class InsertBuilderImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>,
  TInput extends ExtractDocumentTypeWithoutDefaults<
    Schema,
    ServiceName
  > = ExtractDocumentTypeWithoutDefaults<Schema, ServiceName>
> implements InsertBuilder<Schema, ServiceName, TInput>
{
  private pipeline: OperationPipeline<DataModel, Schema, ServiceName>

  constructor(
    tableName: ServiceName,
    ctx: GenericMutationCtx<DataModel>,
    schema: Schema
  ) {
    this.pipeline = new OperationPipeline(tableName, ctx, schema)
  }

  async one(
    document: TInput,
    config?: Partial<PipelineConfig>
  ): Promise<GenericId<ServiceName>> {
    return await this.pipeline.insert(document, config)
  }

  async many(
    documents: TInput[],
    config?: Partial<PipelineConfig>
  ): Promise<GenericId<ServiceName>[]> {
    return await this.pipeline.insertMany(documents, config)
  }
}
