import {
  GenericDataModel,
  GenericDocument,
  GenericMutationCtx,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericId } from 'convex/values'
import { BaseOperationBuilder, BaseBatchOperationBuilder } from './base'
import { ValidatorFunction } from './base.types'
import { InsertOperationInitializer } from './insert.types'

export class InsertOperationBuilder<TReturn> extends BaseOperationBuilder<TReturn> {
  constructor(
    tableName: string,
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
    return this.ctx.db.insert(this.tableName, this.value) as Promise<TReturn>
  }
}

export class BatchInsertOperationBuilder<TReturn> extends BaseBatchOperationBuilder<TReturn> {
  constructor(
    tableName: string,
    private values: GenericDocument[],
    ctx: GenericMutationCtx<GenericDataModel>,
    validator?: ValidatorFunction
  ) {
    super(tableName, ctx, validator)
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

  async execute(): Promise<TReturn> {
    return Promise.all(
      this.values.map((value) => this.ctx.db.insert(this.tableName, value))
    ) as Promise<TReturn>
  }
}

export class InsertOperationInitializerImpl<
  TableName extends TableNamesInDataModel<GenericDataModel>
> implements InsertOperationInitializer<GenericDataModel, TableName, any> {
  constructor(
    private tableName: TableName,
    private ctx: GenericMutationCtx<GenericDataModel>,
    private validator?: ValidatorFunction,
    private defaultsApplier?: (value: GenericDocument) => GenericDocument
  ) {}

  one = (value: GenericDocument) => {
    return new InsertOperationBuilder<GenericId<TableName>>(
      this.tableName,
      value,
      this.ctx,
      this.validator
    )
  }

  many = (values: GenericDocument[]) => {
    return new BatchInsertOperationBuilder<GenericId<TableName>[]>(
      this.tableName,
      values,
      this.ctx,
      this.validator
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