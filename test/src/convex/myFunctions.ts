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

export const replaceUserWithDefaults = mutation({
  args: {
    id: v.id('users'),
    user: users.argsWithoutDefaults,
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db
      .replace('users')
      .withDefaults()
      .one(args.id, args.user)
      .validate()
      .execute()
    return ctx.db.get(userId)
  },
})

export const replaceUsers = mutation({
  args: v.object({
    users: v.array(
      v.object({
        id: v.id('users'),
        ...users.args.fields,
      })
    ),
  }),
  handler: async (ctx, args) => {
    const users = await ctx.db
      .replace('users')
      .many(args.users.map(({ id, ...user }) => ({ id, value: user })))
      .validate()
      .execute()
    return users
  },
})

export const replaceUsersWithDefaults = mutation({
  args: v.object({
    users: v.array(
      v.object({
        id: v.id('users'),
        ...users.argsWithoutDefaults.fields,
      })
    ),
  }),
  handler: async (ctx, args) => {
    const userIds = await ctx.db
      .replace('users')
      .withDefaults()
      .many(args.users.map(({ id, ...user }) => ({ id, value: user })))
      .validate()
      .execute()
    return userIds
  },
})

export const patchUser = mutation({
  args: {
    id: v.id('users'),
    user: partial(v.object(users.args.fields)),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .patch('users')
      .one(args.id, args.user)
      .validate()
      .execute()
    return user
  },
})

export const patchUsers = mutation({
  args: v.object({
    users: v.array(
      v.object({
        id: v.id('users'),
        ...partial(users.args.fields),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const users = await ctx.db
      .patch('users')
      .many(args.users.map(({ id, ...user }) => ({ id, value: user })))
      .validate()
      .execute()
    return users
  },
})
