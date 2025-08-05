import { v } from 'convex/values'
import { DataModel } from './_generated/dataModel'
import { ServiceSchema } from './schema'
import { CreateServiceMutation } from 'convex-sql'
import { partial } from 'convex-helpers/validators'

const mutation = CreateServiceMutation<DataModel>(ServiceSchema.services)
const users = ServiceSchema.services.users

export const createUser = mutation({
  args: users.args,
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert('users').one(args).validate().execute()
    return userId
  },
})

export const createUsers = mutation({
  args: v.object({
    users: v.array(users.args),
  }),
  handler: async (ctx, args) => {
    const userIds = await ctx.db
      .insert('users')
      .many(args.users)
      .validate()
      .execute()
    return userIds
  },
})

export const createUserWithDefaults = mutation({
  args: users.argsWithoutDefaults,
  handler: async (ctx, args) => {
    const userId = await ctx.db
      .insert('users')
      .withDefaults()
      .one(args)
      .validate()
      .execute()
    return userId
  },
})

export const createUsersWithDefaults = mutation({
  args: v.object({
    users: v.array(users.argsWithoutDefaults),
  }),
  handler: async (ctx, args) => {
    const userIds = await ctx.db
      .insert('users')
      .withDefaults()
      .many(args.users)
      .validate()
      .execute()
    return userIds
  },
})

export const replaceUser = mutation({
  args: {
    id: v.id('users'),
    user: users.args,
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db
      .replace('users')
      .one(args.id, args.user)
      .validate()
      .execute()
    return userId
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
    return userId
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

export const deleteUser = mutation({
  args: {
    id: v.id('users'),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.delete('users').one(args.id)
    return userId
  },
})

export const deleteUsers = mutation({
  args: v.object({
    users: v.array(v.id('users')),
  }),
  handler: async (ctx, args) => {
    const userIds = await ctx.db.delete('users').many(args.users)
    return userIds
  },
})
