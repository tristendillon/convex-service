import {
  GenericDataModel,
  GenericDocument,
  GenericMutationCtx,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericId } from 'convex/values'
import { BaseOperationBuilder, BaseBatchOperationBuilder } from './base'
import { ValidatorFunction, UniquenessValidatorFunction } from './base.types'
import { InsertOperationInitializer } from './insert.types'

export class InsertOperationBuilder<
  TReturn
> extends BaseOperationBuilder<TReturn> {
  constructor(
    tableName: string,
    private value: GenericDocument,
    ctx: GenericMutationCtx<GenericDataModel>,
    validator?: ValidatorFunction,
    uniquenessValidator?: UniquenessValidatorFunction
  ) {
    super(tableName, ctx, validator, uniquenessValidator)
  }

  protected async performValidation(): Promise<void> {
    if (this.validator) {
      await this.validator(this.ctx, this.tableName, this.value)
    }
  }

  protected async performUniquenessValidation(): Promise<void> {
    if (this.uniquenessValidator) {
      const result = await this.uniquenessValidator(
        this.ctx,
        this.tableName,
        this.value,
        'insert'
      )

      if (result.action === 'replace' && result.replaceId) {
        this.shouldReplace = true
        this.replaceId = result.replaceId
      }
    }
  }

  private shouldReplace = false
  private replaceId?: GenericId<string>

  async execute(): Promise<TReturn> {
    if (this.shouldReplace && this.replaceId) {
      await this.ctx.db.replace(this.replaceId, this.value)
      return this.replaceId as TReturn
    }
    return this.ctx.db.insert(this.tableName, this.value) as Promise<TReturn>
  }
}

export class BatchInsertOperationBuilder<
  TReturn
> extends BaseBatchOperationBuilder<TReturn> {
  constructor(
    tableName: string,
    private values: GenericDocument[],
    ctx: GenericMutationCtx<GenericDataModel>,
    validator?: ValidatorFunction,
    uniquenessValidator?: UniquenessValidatorFunction
  ) {
    super(tableName, ctx, validator, uniquenessValidator)
  }

  protected async performBatchValidation(): Promise<void> {
    if (this.validator) {
      await Promise.all(
        this.values.map((value) =>
          this.validator!(this.ctx, this.tableName, value)
        )
      )
    }
  }

  protected async performBatchUniquenessValidation(): Promise<void> {
    if (this.uniquenessValidator) {
      const results = await Promise.all(
        this.values.map((value, index) =>
          this.uniquenessValidator!(
            this.ctx,
            this.tableName,
            value,
            'insert'
          ).then((result) => ({
            index,
            result,
            value,
          }))
        )
      )

      for (const { index, result, value } of results) {
        if (result.action === 'replace' && result.replaceId) {
          this.replacements.set(index, { id: result.replaceId, value })
        }
      }
    }
  }

  private replacements = new Map<
    number,
    { id: GenericId<string>; value: GenericDocument }
  >()

  async execute(): Promise<TReturn> {
    const results = await Promise.all(
      this.values.map(async (value, index) => {
        const replacement = this.replacements.get(index)
        if (replacement) {
          await this.ctx.db.replace(replacement.id, replacement.value)
          return replacement.id
        }
        return this.ctx.db.insert(this.tableName, value)
      })
    )
    return results as TReturn
  }
}

export class InsertOperationInitializerImpl<
  TableName extends TableNamesInDataModel<GenericDataModel>
> implements InsertOperationInitializer<GenericDataModel, TableName, any>
{
  constructor(
    private tableName: TableName,
    private ctx: GenericMutationCtx<GenericDataModel>,
    private validator?: ValidatorFunction,
    private defaultsApplier?: (value: GenericDocument) => GenericDocument,
    private uniquenessValidator?: UniquenessValidatorFunction
  ) {}

  one = (value: GenericDocument) => {
    return new InsertOperationBuilder<GenericId<TableName>>(
      this.tableName,
      value,
      this.ctx,
      this.validator,
      this.uniquenessValidator
    )
  }

  many = (values: GenericDocument[]) => {
    return new BatchInsertOperationBuilder<GenericId<TableName>[]>(
      this.tableName,
      values,
      this.ctx,
      this.validator,
      this.uniquenessValidator
    )
  }

  withDefaults() {
    if (!this.defaultsApplier) {
      throw new Error('No defaults configured for this schema')
    }
    return {
      one: (value: GenericDocument) => {
        return this.one(this.defaultsApplier!(value))
      },
      many: (values: GenericDocument[]) => {
        return this.many(values.map(this.defaultsApplier!))
      },
    }
  }
}
