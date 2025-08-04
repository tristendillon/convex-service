import {
  Expand,
  GenericDataModel,
  GenericDatabaseWriter,
  GenericDocument,
  GenericMutationCtx,
  SystemFields,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericServiceSchema } from './schema.types'
import { ServiceDatabaseWriter } from './writer.types'
import { GenericId } from 'convex/values'
import { BuilderState, SystemFieldsWithId } from './service.types'

// Core operation interfaces - matching your writer.types.ts exactly
interface ExecutableOperation<TReturn> {
  execute(): Promise<TReturn>
}

interface ValidatableOperation<TReturn> extends ExecutableOperation<TReturn> {
  validate(): ExecutableOperation<TReturn> // Synchronous, returns ExecutableOperation
}

// Individual operation builders
class InsertOperationBuilder<TReturn> implements ValidatableOperation<TReturn> {
  constructor(
    private tableName: string,
    private value: GenericDocument,
    private ctx: GenericMutationCtx<GenericDataModel>,
    private validator?: (
      ctx: GenericMutationCtx<GenericDataModel>,
      tableName: string,
      value: GenericDocument
    ) => Promise<void>
  ) {}

  validate(): ExecutableOperation<TReturn> {
    console.log('validating', this.tableName, this.value)
    return {
      execute: async () => {
        console.log('executing with validation', this.tableName, this.value)
        if (this.validator) {
          await this.validator(this.ctx, this.tableName, this.value)
        }
        return this.ctx.db.insert(
          this.tableName,
          this.value
        ) as Promise<TReturn>
      },
    }
  }

  async execute(): Promise<TReturn> {
    console.log('executing without validation', this.tableName, this.value)
    return this.ctx.db.insert(this.tableName, this.value) as Promise<TReturn>
  }
}

class BatchInsertOperationBuilder<TReturn>
  implements ValidatableOperation<TReturn>
{
  constructor(
    private tableName: string,
    private values: GenericDocument[],
    private ctx: GenericMutationCtx<GenericDataModel>,
    private validator?: (
      ctx: GenericMutationCtx<GenericDataModel>,
      tableName: string,
      value: GenericDocument
    ) => Promise<void>
  ) {}

  validate(): ExecutableOperation<TReturn> {
    return {
      execute: async () => {
        if (this.validator) {
          await Promise.all(
            this.values.map((value) =>
              this.validator!(this.ctx, this.tableName, value)
            )
          )
        }
        return Promise.all(
          this.values.map((value) => this.ctx.db.insert(this.tableName, value))
        ) as Promise<TReturn>
      },
    }
  }

  async execute(): Promise<TReturn> {
    return Promise.all(
      this.values.map((value) => this.ctx.db.insert(this.tableName, value))
    ) as Promise<TReturn>
  }
}

class ReplaceOperationBuilder<TReturn>
  implements ValidatableOperation<TReturn>
{
  constructor(
    private tableName: string,
    private id: GenericId<any>,
    private value: GenericDocument,
    private ctx: GenericMutationCtx<GenericDataModel>,
    private validator?: (
      ctx: GenericMutationCtx<GenericDataModel>,
      tableName: string,
      value: GenericDocument
    ) => Promise<void>
  ) {}

  validate(): ExecutableOperation<TReturn> {
    return {
      execute: async () => {
        if (this.validator) {
          const document = await this.ctx.db.get(this.id)
          if (!document) {
            throw new Error(`Document ${this.id} not found`)
          }
          const documentWithReplacement = {
            ...document,
            ...this.value,
          }
          await this.validator(
            this.ctx,
            this.tableName,
            documentWithReplacement
          )
        }

        console.log('executing', this.tableName, this.id, this.value)
        return this.ctx.db.replace(this.id, this.value) as Promise<TReturn>
      },
    }
  }

  async execute(): Promise<TReturn> {
    return this.ctx.db.replace(this.id, this.value) as Promise<TReturn>
  }
}

// Operation initializers (similar to QueryInitializer)
class InsertOperationInitializer<
  TableName extends TableNamesInDataModel<GenericDataModel>
> {
  constructor(
    private tableName: TableName,
    private ctx: GenericMutationCtx<GenericDataModel>,
    private validator?: (
      ctx: GenericMutationCtx<GenericDataModel>,
      tableName: string,
      value: GenericDocument
    ) => Promise<void>,
    private defaultsApplier?: (value: GenericDocument) => GenericDocument
  ) {}

  one(value: GenericDocument): ValidatableOperation<GenericId<TableName>> {
    console.log('one', this.tableName, value)
    return new InsertOperationBuilder<GenericId<TableName>>(
      this.tableName,
      value,
      this.ctx,
      this.validator
    )
  }

  many(
    values: GenericDocument[]
  ): ValidatableOperation<GenericId<TableName>[]> {
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

class ReplaceOperationInitializer<
  TableName extends TableNamesInDataModel<GenericDataModel>
> {
  constructor(
    private ctx: GenericMutationCtx<GenericDataModel>,
    private tableName: TableName,
    private validator?: (
      ctx: GenericMutationCtx<GenericDataModel>,
      tableName: string,
      value: GenericDocument
    ) => Promise<void>
  ) {}

  one<Id extends GenericId<string>>(
    id: Id,
    value: GenericDocument
  ): ValidatableOperation<any> {
    return new ReplaceOperationBuilder(
      this.tableName,
      id,
      value,
      this.ctx,
      this.validator
    )
  }

  many(
    replacements: Array<{ id: GenericId<any>; value: GenericDocument }>
  ): ValidatableOperation<any[]> {
    return {
      validate: () => {
        return {
          execute: async () => {
            if (this.validator) {
              await Promise.all(
                replacements.map(async ({ id, value }) => {
                  const document = await this.ctx.db.get(id)
                  if (!document) {
                    throw new Error(`Document ${id} not found`)
                  }
                  const documentWithReplacement = {
                    ...document,
                    ...value,
                  }
                  await this.validator!(
                    this.ctx,
                    this.tableName,
                    documentWithReplacement
                  )
                })
              )
            }
            return Promise.all(
              replacements.map(({ id, value }) =>
                this.ctx.db.replace(id, value)
              )
            )
          },
        }
      },
      execute: async () => {
        return Promise.all(
          replacements.map(({ id, value }) => this.ctx.db.replace(id, value))
        )
      },
    }
  }
}

class DeleteOperationInitializer<DataModel extends GenericDataModel> {
  constructor(private ctx: GenericMutationCtx<DataModel>) {}

  async one<Id extends GenericId<string>>(id: Id): Promise<Id> {
    await this.ctx.db.delete(id)
    return id
  }

  async many<Id extends GenericId<string>>(ids: Id[]): Promise<Id[]> {
    await Promise.all(ids.map((id) => this.ctx.db.delete(id)))
    return ids
  }
}

// Service validator helper
class ServiceValidator {
  constructor(private schema: GenericServiceSchema) {}

  private getService(tableName: string) {
    const service = Object.values(this.schema).find(
      (service) => service.tableName === tableName
    )
    if (!service) {
      throw new Error(`Service ${tableName} not found`)
    }
    return service
  }

  createValidator(tableName: string) {
    const service = this.getService(tableName)
    const state = service.$config.state as BuilderState
    const schemaOrFn = state.validate

    return async (
      ctx: GenericMutationCtx<GenericDataModel>,
      tName: string,
      value: GenericDocument
    ) => {
      if (typeof schemaOrFn === 'function') {
        const document = await ctx.db.get(value._id as GenericId<string>)
        if (!document) {
          throw new Error(`Document ${value._id} not found`)
        }
        await schemaOrFn(
          ctx,
          document as Expand<GenericDocument & SystemFieldsWithId<string>>
        )
      } else if (typeof schemaOrFn === 'object') {
        const { error } = schemaOrFn.safeParse(value)
        if (error) {
          const formatted = error.flatten()

          // Build the error message with proper formatting
          let errorMessage = `ValidationError: Failed to validate ${tName}`

          // Add field errors if they exist
          if (
            formatted.fieldErrors &&
            Object.keys(formatted.fieldErrors).length > 0
          ) {
            errorMessage += '\n  * Field errors:'
            for (const [field, errors] of Object.entries(
              formatted.fieldErrors
            )) {
              if (Array.isArray(errors)) {
                errors.forEach((err) => {
                  errorMessage += `\n    - ${field}: ${err}`
                })
              }
            }
          }

          // Add form errors if they exist
          if (formatted.formErrors && formatted.formErrors.length > 0) {
            errorMessage += '\n  * Form errors:'
            formatted.formErrors.forEach((err) => {
              errorMessage += `\n    - ${err}`
            })
          }

          throw new Error(errorMessage)
        }
      }
    }
  }

  createDefaultsApplier(tableName: string) {
    const service = this.getService(tableName)
    const defaults = service?.$config?.state?.defaults || {}

    return (value: GenericDocument) => ({ ...value, ...defaults })
  }
}

// Main ServiceWriter class
export class ServiceWriter {
  private serviceValidator: ServiceValidator

  constructor(
    schema: GenericServiceSchema,
    private ctx: GenericMutationCtx<GenericDataModel>
  ) {
    this.serviceValidator = new ServiceValidator(schema)
  }

  wrapDb(db: GenericDatabaseWriter<GenericDataModel>) {
    return {
      ...db,
      insert: <TableName extends TableNamesInDataModel<GenericDataModel>>(
        tableName: TableName
      ) => {
        const validator = this.serviceValidator.createValidator(tableName)
        const defaultsApplier =
          this.serviceValidator.createDefaultsApplier(tableName)

        // Create the initializer with defaults support
        const initializer = new InsertOperationInitializer(
          tableName,
          this.ctx,
          validator,
          defaultsApplier
        )

        return initializer
      },

      replace: <TableName extends TableNamesInDataModel<GenericDataModel>>(
        tableName: TableName
      ) => {
        const validator = this.serviceValidator.createValidator(tableName)
        return new ReplaceOperationInitializer(this.ctx, tableName, validator)
      },

      delete: () => new DeleteOperationInitializer(this.ctx),
    } as unknown as ServiceDatabaseWriter<
      GenericDataModel,
      GenericServiceSchema
    >
  }
}
