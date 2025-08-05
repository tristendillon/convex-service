import {
  GenericDataModel,
  GenericDocument,
  GenericMutationCtx,
} from 'convex/server'

// ============================================================================
// Core Operation Abstractions
// ============================================================================

/**
 * An operation that can be executed to perform a database mutation.
 *
 * @public
 */
export interface ExecutableOperation<TReturn> {
  /**
   * Execute the operation and return the result.
   *
   * @returns The result of the operation.
   */
  execute(): Promise<TReturn>
}

/**
 * An operation that supports validation before execution.
 *
 * For convenience, {@link ValidatableOperation} extends the {@link ExecutableOperation} interface,
 * allowing direct execution without validation.
 *
 * @public
 */
export interface ValidatableOperation<TReturn>
  extends ExecutableOperation<TReturn> {
  /**
   * Validate the operation data and return an executable operation.
   *
   * @returns An {@link ExecutableOperation} that will perform the validated operation.
   * @throws Will throw an error if validation fails.
   */
  validate(): ExecutableOperation<TReturn>
}

// ============================================================================
// Validator Function Type
// ============================================================================

export type ValidatorFunction = (
  ctx: GenericMutationCtx<GenericDataModel>,
  tableName: string,
  value: GenericDocument
) => Promise<void>