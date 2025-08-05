import {
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericId } from 'convex/values'
import { BaseOperationBuilder, BaseBatchOperationBuilder } from './base'
import { ValidatorFunction } from './base.types'
import { PatchOperationInitializer } from './patch.types'

export class BatchPatchOperationBuilder<TReturn> extends BaseBatchOperationBuilder<TReturn> {
  constructor(
    tableName: string,
    private patches: Array<{ id: GenericId<any>; value: Record<string, any> }>,
    ctx: GenericMutationCtx<GenericDataModel>,
    validator?: ValidatorFunction
  ) {
    super(tableName, ctx, validator)
  }

  protected async performBatchValidation(): Promise<void> {
    if (this.validator) {
      await Promise.all(
        this.patches.map(async ({ id, value }) => {
          const document = await this.ctx.db.get(id)
          if (!document) {
            throw new Error(`Document ${id} not found`)
          }
          const documentWithPatch = {
            ...document,
            ...value,
          }
          await this.validator!(this.ctx, this.tableName, documentWithPatch)
        })
      )
    }
  }

  async execute(): Promise<TReturn> {
    await Promise.all(
      this.patches.map(({ id, value }) => this.ctx.db.patch(id, value))
    )
    return this.patches.map(({ id }) => id) as TReturn
  }
}

export class PatchOperationBuilder<TReturn> extends BaseOperationBuilder<TReturn> {
  constructor(
    tableName: string,
    private id: GenericId<any>,
    private value: Record<string, any>,
    ctx: GenericMutationCtx<GenericDataModel>,
    validator?: ValidatorFunction
  ) {
    super(tableName, ctx, validator)
  }

  protected async performValidation(): Promise<void> {
    if (this.validator) {
      const document = await this.ctx.db.get(this.id)
      if (!document) {
        throw new Error(`Document ${this.id} not found`)
      }
      const documentWithPatch = {
        ...document,
        ...this.value,
      }
      await this.validator(this.ctx, this.tableName, documentWithPatch)
    }
  }

  async execute(): Promise<TReturn> {
    await this.ctx.db.patch(this.id, this.value)
    return this.id as TReturn
  }
}

export class PatchOperationInitializerImpl<
  TableName extends TableNamesInDataModel<GenericDataModel>
> implements PatchOperationInitializer<GenericDataModel, TableName>
{
  constructor(
    private ctx: GenericMutationCtx<GenericDataModel>,
    private tableName: TableName,
    private validator?: ValidatorFunction
  ) {}

  one = <Id extends GenericId<string>>(
    id: Id,
    value: Record<string, any>
  ) => {
    return new PatchOperationBuilder<Id>(
      this.tableName,
      id,
      value,
      this.ctx,
      this.validator
    )
  }

  many = (
    patches: Array<{ id: GenericId<any>; value: Record<string, any> }>
  ) => {
    return new BatchPatchOperationBuilder<GenericId<any>[]>(
      this.tableName,
      patches,
      this.ctx,
      this.validator
    )
  }
}
