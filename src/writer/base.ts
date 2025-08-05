import {
  GenericDataModel,
  GenericDocument,
  GenericMutationCtx,
} from 'convex/server'
import {
  ExecutableOperation,
  ValidatableOperation,
  ValidatorFunction,
  UniquenessValidatorFunction,
} from './base.types'

/**
 * Base class for single operation builders that provides common validation and execution patterns.
 */
export abstract class BaseOperationBuilder<TReturn>
  implements ValidatableOperation<TReturn>
{
  constructor(
    protected tableName: string,
    protected ctx: GenericMutationCtx<GenericDataModel>,
    protected validator?: ValidatorFunction,
    protected uniquenessValidator?: UniquenessValidatorFunction
  ) {}

  validate(): ExecutableOperation<TReturn> {
    return {
      execute: async () => {
        if (this.validator) {
          await this.performValidation()
        }
        if (this.uniquenessValidator) {
          await this.performUniquenessValidation()
        }
        return this.execute()
      },
    }
  }

  abstract execute(): Promise<TReturn>

  protected abstract performValidation(): Promise<void>
  protected abstract performUniquenessValidation(): Promise<void>
}

/**
 * Base class for batch operation builders that provides common validation and execution patterns.
 */
export abstract class BaseBatchOperationBuilder<TReturn>
  implements ValidatableOperation<TReturn>
{
  constructor(
    protected tableName: string,
    protected ctx: GenericMutationCtx<GenericDataModel>,
    protected validator?: ValidatorFunction,
    protected uniquenessValidator?: UniquenessValidatorFunction
  ) {}

  validate(): ExecutableOperation<TReturn> {
    return {
      execute: async () => {
        if (this.uniquenessValidator) {
          await this.performBatchUniquenessValidation()
        }
        if (this.validator) {
          await this.performBatchValidation()
        }
        return this.execute()
      },
    }
  }

  abstract execute(): Promise<TReturn>

  protected abstract performBatchValidation(): Promise<void>
  protected abstract performBatchUniquenessValidation(): Promise<void>
}
