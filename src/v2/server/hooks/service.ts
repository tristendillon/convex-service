import type {
  GenericDataModel,
  TableNamesInDataModel,
  DocumentByName,
} from 'convex/server'
import type { OmitSystemFieldsFromDocument } from '../../types'
import type { OperationHook } from './types'

export class ServiceHooks<
  DataModel extends GenericDataModel = GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel> = TableNamesInDataModel<DataModel>,
  Document extends DocumentByName<DataModel, TableName> = DocumentByName<
    DataModel,
    TableName
  >
> {
  private _before: OperationHook<DataModel, TableName, Document>[] = []
  private _after: OperationHook<DataModel, TableName>[] = []

  before(hook: OperationHook<DataModel, TableName, Document>) {
    this._before.push(hook)
    return this
  }

  after(hook: OperationHook<DataModel, TableName>) {
    this._after.push(hook)
    return this
  }

  static getServiceHooks<
    SDataModel extends GenericDataModel,
    STableName extends TableNamesInDataModel<SDataModel>
  >(
    serviceHooks: ServiceHooks<SDataModel, STableName>
  ): ServiceHooks<SDataModel, STableName> {
    return serviceHooks
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
