import {
  Expand,
  GenericDataModel,
  GenericDocument,
  GenericMutationCtx,
  TableNamesInDataModel,
} from 'convex/server'
import { GenericServiceSchema } from '../schema.types'
import { GenericId } from 'convex/values'
import {
  BuilderState,
  SystemFieldsWithId,
  BaseOnDelete,
} from '../service.types'
import {
  ValidationError,
  UniqueConstraintError,
  DocumentNotFoundError,
  DependentRecordError,
} from '../errors'

export class RelationManager {
  constructor(private schema: GenericServiceSchema) {}

  async handleDeleteCascades(
    ctx: GenericMutationCtx<GenericDataModel>,
    targetTable: TableNamesInDataModel<GenericDataModel>,
    targetIds: GenericId<string>[]
  ): Promise<void> {
    const relatedServices = this.findRelatedServices(targetTable)

    for (const { service, fieldPath, onDelete } of relatedServices) {
      if (onDelete === 'fail') {
        await this.validateNoDependentRecords(
          ctx,
          service.tableName,
          fieldPath,
          targetIds
        )
      } else if (onDelete === 'cascade') {
        await this.cascadeDelete(ctx, service.tableName, fieldPath, targetIds)
      } else if (onDelete === 'setOptional') {
        await this.setFieldOptional(
          ctx,
          service.tableName,
          fieldPath,
          targetIds
        )
      }
    }
  }

  private findRelatedServices(
    targetTable: TableNamesInDataModel<GenericDataModel>
  ) {
    const relatedServices: Array<{
      service: any
      fieldPath: string
      onDelete: BaseOnDelete | 'setOptional'
    }> = []

    for (const service of Object.values(this.schema)) {
      const relations = service.$config.state.relations || {}

      for (const [fieldPath, relation] of Object.entries(relations)) {
        const rel = relation as {
          table: string
          onDelete: BaseOnDelete | 'setOptional'
        }
        if (rel.table === targetTable) {
          relatedServices.push({
            service,
            fieldPath,
            onDelete: rel.onDelete,
          })
        }
      }
    }

    return relatedServices
  }

  private async validateNoDependentRecords(
    ctx: GenericMutationCtx<GenericDataModel>,
    relatedTable: string,
    fieldPath: string,
    targetIds: GenericId<string>[]
  ): Promise<void> {
    for (const targetId of targetIds) {
      const dependentRecord = await ctx.db
        .query(relatedTable)
        .withIndex(`by_${fieldPath.replace('.', '_')}`, (q) =>
          q.eq(fieldPath, targetId)
        )
        .first()

      if (dependentRecord) {
        throw new DependentRecordError(
          targetIds[0].split(':')[0],
          targetId,
          relatedTable,
          fieldPath
        )
      }
    }
  }

  private async cascadeDelete(
    ctx: GenericMutationCtx<GenericDataModel>,
    relatedTable: string,
    fieldPath: string,
    targetIds: GenericId<string>[]
  ): Promise<void> {
    for (const targetId of targetIds) {
      const dependentRecords = await ctx.db
        .query(relatedTable)
        .withIndex(`by_${fieldPath.replace('.', '_')}`, (q) =>
          q.eq(fieldPath, targetId)
        )
        .collect()

      for (const record of dependentRecords) {
        await this.handleDeleteCascades(
          ctx,
          relatedTable as TableNamesInDataModel<GenericDataModel>,
          [record._id as GenericId<string>]
        )
        await ctx.db.delete(record._id as GenericId<string>)
      }
    }
  }

  private async setFieldOptional(
    ctx: GenericMutationCtx<GenericDataModel>,
    relatedTable: string,
    fieldPath: string,
    targetIds: GenericId<string>[]
  ): Promise<void> {
    for (const targetId of targetIds) {
      const dependentRecords = await ctx.db
        .query(relatedTable)
        .withIndex(`by_${fieldPath.replace('.', '_')}`, (q) =>
          q.eq(fieldPath, targetId)
        )
        .collect()

      for (const record of dependentRecords) {
        const updateData = { ...record }
        delete updateData[fieldPath]
        await ctx.db.replace(record._id as GenericId<string>, updateData)
      }
    }
  }
}

export class ServiceValidator {
  public schema: GenericServiceSchema

  constructor(schema: GenericServiceSchema) {
    this.schema = schema
  }

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
          throw new DocumentNotFoundError(
            tName,
            value._id as string,
            'validation'
          )
        }
        await schemaOrFn(
          ctx,
          document as Expand<GenericDocument & SystemFieldsWithId<string>>
        )
      } else if (typeof schemaOrFn === 'object') {
        const { error } = schemaOrFn.safeParse(value)
        if (error) {
          throw new ValidationError(tName, error)
        }
      }
    }
  }

  createDefaultsApplier(tableName: string) {
    const service = this.getService(tableName)
    const defaults = service?.$config?.state?.defaults || {}

    return (value: GenericDocument) => ({ ...value, ...defaults })
  }

  createUniquenessValidator(tableName: string) {
    const service = this.getService(tableName)
    const state = service.$config.state as BuilderState
    const uniques = state.uniques || {}

    return async (
      ctx: GenericMutationCtx<GenericDataModel>,
      tName: string,
      value: GenericDocument,
      operation: 'insert' | 'replace' | 'patch',
      currentId?: GenericId<string>
    ): Promise<{
      action: 'proceed' | 'replace'
      replaceId?: GenericId<string>
    }> => {
      for (const [indexName, constraint] of Object.entries(uniques)) {
        const fields = Array.isArray(constraint.fields)
          ? constraint.fields
          : [constraint.fields]
        const onConflict =
          'onConflict' in constraint ? constraint.onConflict : 'fail'

        const filter: Record<string, any> = {}
        for (const field of fields) {
          if (value[field] !== undefined) {
            filter[field] = value[field]
          }
        }

        if (Object.keys(filter).length !== fields.length) {
          continue
        }

        let query = ctx.db.query(tName).withIndex(indexName, (q) => {
          return fields.reduce((q, field) => q.eq(field, filter[field]), q)
        })

        const existingDoc = await query.first()

        if (existingDoc) {
          if (
            (operation === 'replace' || operation === 'patch') &&
            currentId &&
            existingDoc._id === currentId
          ) {
            continue
          }

          if (onConflict === 'fail') {
            const fieldValues: Record<string, any> = {}
            for (const field of fields) {
              fieldValues[field] = value[field]
            }

            throw new UniqueConstraintError(
              tName,
              indexName,
              fields,
              fieldValues,
              existingDoc._id as string
            )
          } else if (onConflict === 'replace') {
            if (operation === 'insert') {
              return {
                action: 'replace',
                replaceId: existingDoc._id as GenericId<string>,
              }
            }
            continue
          }
        }
      }

      return { action: 'proceed' }
    }
  }
}
