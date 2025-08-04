import { v } from 'convex/values'
import { DataModel } from './_generated/dataModel'
import { ServiceSchema } from './schema'
import { CreateServiceMutation } from 'convex-sql'
import { partial } from 'convex-helpers/validators'

const mutation = CreateServiceMutation<DataModel>(ServiceSchema.services)
const users = ServiceSchema.services.users

export const createUser = mutation({
  args: users.argsWithoutDefaults,
  handler: async (ctx, args) => {
    const userId = await ctx.db
      .insert('users')
      .withDefaults()
      .one(args)
      .validate()
      .execute()

    return ctx.db.get(userId)
  },
})

export const replaceUser = mutation({
  args: {
    id: v.id('users'),
    user: users.args,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .replace('users')
      .one(args.id, args.user)
      .validate()
      .execute()
    return user
  },
})
