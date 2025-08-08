// This is a copy from the zod.ts file from convex-helpers
// -- Start of copy --

import { GenericDataModel, TableNamesInDataModel } from 'convex/server'
import { GenericId } from 'convex/values'
import z, { ZodTypeDef } from 'zod'

export const zid = <
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel> = TableNamesInDataModel<DataModel>
>(
  tableName: TableName
) => new Zid({ typeName: 'ConvexId', tableName })

interface ZidDef<TableName extends string> extends ZodTypeDef {
  typeName: 'ConvexId'
  tableName: TableName
}

export class Zid<TableName extends string> extends z.ZodType<
  GenericId<TableName>,
  ZidDef<TableName>
> {
  _parse(input: z.ParseInput) {
    return z.string()._parse(input) as z.ParseReturnType<GenericId<TableName>>
  }
}
// -- End of copy --
