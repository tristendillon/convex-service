import { GenericDataModel, GenericMutationCtx } from 'convex/server'
import { GenericId } from 'convex/values'
import {
  PatchOneBuilder,
  PatchManyBuilder,
  type GetZodSchemaFromService,
  type GetServiceFromSchemaAndTableName,
  type ExtractDocumentTypeWithoutDefaults,
} from '../types'
import {
  type GenericServiceSchema,
  type ServiceNamesInServiceSchema,
} from '../../schema'
import { OperationPipeline } from '../pipeline'
import type { PipelineConfig } from '../pipeline/types'

export class PatchOneBuilderImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>,
  TInput extends ExtractDocumentTypeWithoutDefaults<
    Schema,
    ServiceName
  > = ExtractDocumentTypeWithoutDefaults<Schema, ServiceName>
> implements PatchOneBuilder<Schema, ServiceName>
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

  async one(document: Partial<TInput>, config?: Partial<PipelineConfig>): Promise<GenericId<ServiceName>> {
    return await this.pipeline.patch(this.id, document, config)
  }
}

export class PatchManyBuilderImpl<
  DataModel extends GenericDataModel,
  Schema extends GenericServiceSchema,
  ServiceName extends ServiceNamesInServiceSchema<Schema>,
  TInput extends ExtractDocumentTypeWithoutDefaults<
    Schema,
    ServiceName
  > = ExtractDocumentTypeWithoutDefaults<Schema, ServiceName>
> implements PatchManyBuilder<Schema, ServiceName>
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

  async many(documents: Partial<TInput>[], config?: Partial<PipelineConfig>): Promise<GenericId<ServiceName>[]> {
    return await this.pipeline.patchMany(this.ids, documents, config)
  }
}
