import {
  DocumentByName,
  GenericDataModel,
  TableNamesInDataModel,
} from 'convex/server'
import { OmitSystemFieldsFromDocument } from '../../types'
import type {
  HookBuilder,
  HookDefinitionFromDataModel,
  HookDefinitionFromZod,
  OperationHookFromDataModel,
} from './types'
import type { z } from 'zod/v4'

export type FieldHookFromDataModel<
  DataModel extends GenericDataModel = GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel> = TableNamesInDataModel<DataModel>,
  Fields extends Record<string, any> = Record<string, any>
> = HookDefinitionFromDataModel<DataModel, TableName, Fields[keyof Fields]>

export class FieldHooks<
  DataModel extends GenericDataModel = GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel> = TableNamesInDataModel<DataModel>,
  Fields extends Record<string, any> = Record<string, any>
> {
  private hooks: Map<
    string,
    FieldHookFromDataModel<DataModel, TableName, Fields>
  > = new Map()

  private addHook<K extends keyof Fields & string>(
    fieldName: K,
    hookDef: FieldHookFromDataModel<DataModel, TableName, Fields>
  ) {
    this.hooks.set(fieldName, hookDef)
    return this
  }

  field<K extends keyof Fields & string>(
    fieldName: K
  ): HookBuilder<DataModel, TableName, Fields, Fields[K]> {
    return {
      before: (
        hook: OperationHookFromDataModel<DataModel, TableName, Fields[K]>
      ) => ({
        after: (afterHook: OperationHookFromDataModel<DataModel, TableName>) =>
          this.addHook(fieldName, { before: hook, after: afterHook }),
      }),
      after: (hook: OperationHookFromDataModel<DataModel, TableName>) => ({
        before: (
          beforeHook: OperationHookFromDataModel<
            DataModel,
            TableName,
            Fields[K]
          >
        ) => this.addHook(fieldName, { before: beforeHook, after: hook }),
      }),
    }
  }

  static getFieldHooks<
    SDataModel extends GenericDataModel,
    STableName extends TableNamesInDataModel<SDataModel>,
    SFields extends Record<string, any>
  >(
    fieldHooks: FieldHooks<SDataModel, STableName, SFields>
  ): Map<
    keyof SFields & string,
    FieldHookFromDataModel<SDataModel, STableName, SFields>
  > {
    return fieldHooks.hooks
  }
}

type HookKeys<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> = OmitSystemFieldsFromDocument<DocumentByName<DataModel, TableName>>

export const createFieldHooks = <
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Fields extends HookKeys<DataModel, TableName> = HookKeys<DataModel, TableName>
>(): FieldHooks<DataModel, TableName, Fields> => {
  return new FieldHooks<DataModel, TableName, Fields>()
}
