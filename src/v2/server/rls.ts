import type {
  GenericDataModel,
  GenericQueryCtx,
  TableNamesInDataModel,
  DocumentByName,
} from 'convex/server'

type RlsOperation = 'insert' | 'delete' | 'update' | 'read'

type RlsRuleHandler<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> = (params: {
  doc: DocumentByName<DataModel, TableName>
  ctx: GenericQueryCtx<DataModel>
}) => Promise<boolean> | boolean

export type GenericRlsRules = RlsRules<any, any>

export class RlsRules<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
> {
  private rules = new Map<RlsOperation, RlsRuleHandler<DataModel, TableName>>()

  rule(
    operation: RlsOperation,
    handler: RlsRuleHandler<DataModel, TableName>
  ): this {
    this.rules.set(operation, handler)
    return this
  }



  static hasRule<
    DataModel extends GenericDataModel,
    TableName extends TableNamesInDataModel<DataModel>
  >(rls: RlsRules<DataModel, TableName>, operation: RlsOperation): boolean {
    return rls.rules.has(operation)
  }

  static getRule<
    DataModel extends GenericDataModel,
    TableName extends TableNamesInDataModel<DataModel>
  >(
    rls: RlsRules<DataModel, TableName>,
    operation: RlsOperation
  ): RlsRuleHandler<DataModel, TableName> | undefined {
    return rls.rules.get(operation)
  }
}

export const createRlsRules = <
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>
>(): RlsRules<DataModel, TableName> => {
  return new RlsRules<DataModel, TableName>()
}
