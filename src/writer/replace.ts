import {
  GenericDataModel,
  GenericDocument,
  GenericMutationCtx,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericId } from 'convex/values'
import { BaseOperationBuilder, BaseBatchOperationBuilder } from './base'
import { ValidatorFunction } from './base.types'
import { ReplaceOperationInitializer } from './replace.types'
import { GenericServiceSchema } from '../schema.types'

export class BatchReplaceOperationBuilder<TReturn> extends BaseBatchOperationBuilder<TReturn> {
  constructor(
    tableName: string,
    private replacements: Array<{ id: GenericId<any>; value: GenericDocument }>,
    ctx: GenericMutationCtx<GenericDataModel>,
    validator?: ValidatorFunction
  ) {
    super(tableName, ctx, validator)
  }

  protected async performBatchValidation(): Promise<void> {
    if (this.validator) {
      await Promise.all(
        this.replacements.map(({ value }) =>
          this.validator!(this.ctx, this.tableName, value)
        )
      )
    }
  }

  async execute(): Promise<TReturn> {
    await Promise.all(
      this.replacements.map(({ id, value }) => this.ctx.db.replace(id, value))
    )
    return this.replacements.map(({ id }) => id) as TReturn
  }
}

export class ReplaceOperationBuilder<TReturn> extends BaseOperationBuilder<TReturn> {
  constructor(
    tableName: string,
    private id: GenericId<any>,
    private value: GenericDocument,
    ctx: GenericMutationCtx<GenericDataModel>,
    validator?: ValidatorFunction
  ) {
    super(tableName, ctx, validator)
  }

  protected async performValidation(): Promise<void> {
    if (this.validator) {
      await this.validator(this.ctx, this.tableName, this.value)
    }
  }

  async execute(): Promise<TReturn> {
    await this.ctx.db.replace(this.id, this.value)
    return this.id as TReturn
  }
}

export class ReplaceOperationInitializerImpl<
  TableName extends TableNamesInDataModel<GenericDataModel>,
  Schema extends GenericServiceSchema = GenericServiceSchema
> implements ReplaceOperationInitializer<GenericDataModel, TableName, Schema>
{
  constructor(
    private ctx: GenericMutationCtx<GenericDataModel>,
    private tableName: TableName,
    private validator?: ValidatorFunction,
    private defaultsApplier?: (value: GenericDocument) => GenericDocument
  ) {}

  one = <Id extends GenericId<string>>(
    id: Id,
    value: GenericDocument
  ) => {
    return new ReplaceOperationBuilder<Id>(
      this.tableName,
      id,
      value,
      this.ctx,
      this.validator
    )
  }

  many = (
    replacements: Array<{ id: GenericId<any>; value: GenericDocument }>
  ) => {
    return new BatchReplaceOperationBuilder<GenericId<any>[]>(
      this.tableName,
      replacements,
      this.ctx,
      this.validator
    )
  }

  withDefaults() {
    if (!this.defaultsApplier) {
      throw new Error('No defaults configured for this schema')
    }
    return {
      one: (id: GenericId<any>, value: GenericDocument) => {
        return this.one(id, this.defaultsApplier!(value))
      },
      many: (replacements: Array<{ id: GenericId<any>; value: GenericDocument }>) => {
        return this.many(
          replacements.map(({ id, value }) => ({
            id,
            value: this.defaultsApplier!(value),
          }))
        )
      },
    }
  }
}
