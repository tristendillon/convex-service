import type {
  GenericDataModel,
  TableNamesInDataModel,
  DocumentByName,
} from 'convex/server'
import type { OmitSystemFieldsFromDocument } from '../../types'
import type { HookDefinitionFromDataModel } from './types'

export type GenericServiceHooks = ServiceHooks<any, any>

export class ServiceHooks<
  DataModel extends GenericDataModel = GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel> = TableNamesInDataModel<DataModel>,
  Document extends DocumentByName<DataModel, TableName> = DocumentByName<
    DataModel,
    TableName
  >
> {
  private _before:
    | HookDefinitionFromDataModel<DataModel, TableName, Document>['before']
    | undefined = undefined
  private _after:
    | HookDefinitionFromDataModel<DataModel, TableName>['after']
    | undefined = undefined

  before(
    hook: HookDefinitionFromDataModel<DataModel, TableName, Document>['before']
  ) {
    this._before = hook
    return this
  }

  after(hook: HookDefinitionFromDataModel<DataModel, TableName>['after']) {
    this._after = hook
    return this
  }

  static getServiceHooks<
    SDataModel extends GenericDataModel,
    STableName extends TableNamesInDataModel<SDataModel>
  >(serviceHooks: ServiceHooks<SDataModel, STableName>) {
    return {
      before: serviceHooks._before,
      after: serviceHooks._after,
    }
  }
}

type HookKeys<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> = OmitSystemFieldsFromDocument<DocumentByName<DataModel, TableName>>

export const createServiceHooks = <
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  Fields extends HookKeys<DataModel, TableName> = HookKeys<DataModel, TableName>
>(): ServiceHooks<DataModel, TableName> => {
  return new ServiceHooks<DataModel, TableName>()
}
