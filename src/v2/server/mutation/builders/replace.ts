import { GenericDataModel, GenericMutationCtx } from 'convex/server'
import { GenericId } from 'convex/values'
import {
  ReplaceOneBuilder,
  ReplaceManyBuilder,
  type ExtractDocumentTypeWithoutDefaults,
} from '../types'
import {
  type GenericServiceSchema,
  type ServiceNamesInServiceSchema,
} from '../../schema'
import { OperationPipeline } from '../pipeline'
import type { PipelineConfig } from '../pipeline/types'

export class ReplaceOneBuilderImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>,
  TInput extends ExtractDocumentTypeWithoutDefaults<
    Schema,
    ServiceName
  > = ExtractDocumentTypeWithoutDefaults<Schema, ServiceName>
> implements ReplaceOneBuilder<Schema, ServiceName>
{
  private pipeline: OperationPipeline<DataModel, Schema, ServiceName>

  constructor(
    private id: GenericId<ServiceName>,
    ctx: GenericMutationCtx<DataModel>,
    schema: Schema
  ) {
    this.pipeline = new OperationPipeline(
      undefined as unknown as ServiceName,
      ctx,
      schema
    )
  }

  async one(document: TInput, config?: Partial<PipelineConfig>): Promise<GenericId<ServiceName>> {
    return await this.pipeline.replace(this.id, document, config)
  }
}

export class ReplaceManyBuilderImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>,
  TInput extends ExtractDocumentTypeWithoutDefaults<
    Schema,
    ServiceName
  > = ExtractDocumentTypeWithoutDefaults<Schema, ServiceName>
> implements ReplaceManyBuilder<Schema, ServiceName>
{
  private pipeline: OperationPipeline<DataModel, Schema, ServiceName>

  constructor(
    private ids: GenericId<ServiceName>[],
    ctx: GenericMutationCtx<DataModel>,
    schema: Schema
  ) {
    this.pipeline = new OperationPipeline(
      undefined as unknown as ServiceName,
      ctx,
      schema
    )
  }

  async many(documents: TInput[], config?: Partial<PipelineConfig>): Promise<GenericId<ServiceName>[]> {
    return await this.pipeline.replaceMany(this.ids, documents, config)
  }
}
