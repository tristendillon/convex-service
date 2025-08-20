import type {
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
} from 'convex/server'
import type { ServiceOperationByDataModel } from '../types'
import type { FieldHooks } from './field'

export type HookDefinitionFromDataModel<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  FieldType = any
> = {
  before?: (
    operation: ServiceOperationByDataModel<DataModel, TableName>
  ) => Promise<FieldType> | FieldType
  after?: (
    operation: ServiceOperationByDataModel<
      DataModel,
      TableName,
      GenericMutationCtx<DataModel>
    >
  ) => Promise<void> | void
}

export type HookBuilder<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Fields extends Record<string, any>,
  FieldType
> = {
  before: (
    hook: HookDefinitionFromDataModel<DataModel, TableName, FieldType>['before']
  ) => {
    after: (
      afterHook: HookDefinitionFromDataModel<DataModel, TableName>['after']
    ) => FieldHooks<DataModel, TableName, Fields>
  }
  after: (hook: HookDefinitionFromDataModel<DataModel, TableName>['after']) => {
    before: (
      beforeHook: HookDefinitionFromDataModel<
        DataModel,
        TableName,
        FieldType
      >['before']
    ) => FieldHooks<DataModel, TableName, Fields>
  }
}
