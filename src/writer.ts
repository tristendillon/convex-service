import {
  GenericDataModel,
  GenericDatabaseWriter,
  GenericMutationCtx,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericServiceSchema } from './schema.types'
import { ServiceDatabaseWriter } from './writer.types'
import {
  InsertOperationInitializerImpl,
  ReplaceOperationInitializerImpl,
  PatchOperationInitializerImpl,
  DeleteOperationInitializerImpl,
  ServiceValidator,
} from './writer/index'

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
        const uniquenessValidator =
          this.serviceValidator.createUniquenessValidator(tableName)

        // Create the initializer with defaults support
        const initializer = new InsertOperationInitializerImpl(
          tableName,
          this.ctx,
          validator,
          defaultsApplier,
          uniquenessValidator
        )

        return initializer
      },

      replace: <TableName extends TableNamesInDataModel<GenericDataModel>>(
        tableName: TableName
      ) => {
        const validator = this.serviceValidator.createValidator(tableName)
        const defaultsApplier =
          this.serviceValidator.createDefaultsApplier(tableName)
        const uniquenessValidator =
          this.serviceValidator.createUniquenessValidator(tableName)

        return new ReplaceOperationInitializerImpl(
          this.ctx,
          tableName,
          validator,
          defaultsApplier,
          uniquenessValidator
        )
      },

      patch: <TableName extends TableNamesInDataModel<GenericDataModel>>(
        tableName: TableName
      ) => {
        const validator = this.serviceValidator.createValidator(tableName)
        const uniquenessValidator =
          this.serviceValidator.createUniquenessValidator(tableName)

        return new PatchOperationInitializerImpl(
          this.ctx,
          tableName,
          validator,
          uniquenessValidator
        )
      },

      delete: <TableName extends TableNamesInDataModel<GenericDataModel>>(
        tableName: TableName
      ) =>
        new DeleteOperationInitializerImpl(
          this.ctx,
          tableName,
          this.serviceValidator.schema
        ),
    } as unknown as ServiceDatabaseWriter<
      GenericDataModel,
      GenericServiceSchema
    >
  }
}
