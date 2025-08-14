import type { GenericDataModel, TableNamesInDataModel } from 'convex/server'
import type { ServiceOperation, ServiceOperationByDataModel } from '../types'
import type { FieldHooks } from './field'
import type { z } from 'zod/v4'

export type OperationHookFromZod<Value extends any> = (
  operation: ServiceOperation<Value>
) => Promise<Value> | Value

export type OperationHookFromDataModel<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel> = TableNamesInDataModel<DataModel>,
  ReturnType = void
> = (
  operation: ServiceOperationByDataModel<DataModel, TableName>
) => Promise<ReturnType> | ReturnType

export type HookDefinitionFromDataModel<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  FieldType = any
> = {
  before: OperationHookFromDataModel<DataModel, TableName, FieldType>
  after: OperationHookFromDataModel<DataModel, TableName>
}

export type HookDefinitionFromZod<ZodValidator extends z.ZodType> = {
  before: OperationHookFromZod<z.infer<ZodValidator>>
  after: OperationHookFromZod<z.infer<ZodValidator>>
}

export type HookBuilder<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Fields extends Record<string, any>,
  FieldType
> = {
  before: (
    hook: OperationHookFromDataModel<DataModel, TableName, FieldType>
  ) => {
    after: (
      afterHook: OperationHookFromDataModel<DataModel, TableName>
    ) => FieldHooks<DataModel, TableName, Fields>
  }
  after: (hook: OperationHookFromDataModel<DataModel, TableName>) => {
    before: (
      beforeHook: OperationHookFromDataModel<DataModel, TableName, FieldType>
    ) => FieldHooks<DataModel, TableName, Fields>
  }
}
