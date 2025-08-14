import {
  GenericMutationCtx,
  GenericDataModel,
  TableNamesInDataModel,
  DocumentByName,
} from 'convex/server'
import { z } from 'zod/v4'
import { Merge } from '../types'

export type ServiceOperationByDataModel<
  T extends GenericDataModel = GenericDataModel,
  TableName extends TableNamesInDataModel<T> = TableNamesInDataModel<T>
> = {
  value: DocumentByName<T, TableName>
  operation: 'insert' | 'update' | 'delete'
  ctx: ServiceOperationCtx<T>
}

export type ServiceOperation<Value extends any = any> = {
  value: Value
  operation: 'insert' | 'update' | 'delete'
  ctx: ServiceOperationCtx<GenericDataModel>
}
type ServiceOperationCtx<T extends GenericDataModel = GenericDataModel> = Merge<
  GenericMutationCtx<T>,
  {
    meta: Record<string, any>
  }
>
