import {
  GenericMutationCtx,
  GenericDataModel,
  TableNamesInDataModel,
  DocumentByName,
  type GenericQueryCtx,
} from 'convex/server'
import { z } from 'zod/v4'
import { Merge } from '../types'

export type ServiceOperationByDataModel<
  DataModel extends GenericDataModel = GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel> = TableNamesInDataModel<DataModel>,
  Ctx extends GenericQueryCtx<DataModel> = GenericQueryCtx<DataModel>
> = {
  value: DocumentByName<DataModel, TableName>
  operation: 'insert' | 'update' | 'delete'
  ctx: ServiceOperationCtx<DataModel, Ctx>
}

export type ServiceOperation<
  Value extends any = any,
  Ctx extends GenericQueryCtx<GenericDataModel> = GenericQueryCtx<GenericDataModel>
> = {
  value: Value
  operation: 'insert' | 'update' | 'delete' | 'replace'
  ctx: ServiceOperationCtx<GenericDataModel, Ctx>
}

export type OmitSystemFields<T> = T extends Record<string, any>
  ? Omit<T, '_id' | '_creationTime'>
  : T

type ServiceOperationCtx<
  DataModel extends GenericDataModel = GenericDataModel,
  Ctx extends GenericQueryCtx<DataModel> = GenericQueryCtx<DataModel>
> = Merge<
  Ctx,
  {
    meta: Record<string, any>
  }
>
