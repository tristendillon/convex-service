import { v } from 'convex/values'
import { mutation } from '../lib/mutation'
import { partial } from 'convex-helpers/validators'
import { usersService } from './users.def'
export const insert = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const inserted = await ctx.db.insert('users').one(args)

    return inserted
  },
})

export const insertWithoutRestrictions = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const inserted = await ctx.db
      .insert('users')
      .one(args, { restrictions: false })

    return inserted
  },
})

export const patch = mutation({
  args: {
    id: v.id('users'),
    patch: partial(usersService.validators.validator),
  },
  handler: async (ctx, args) => {
    const patched = await ctx.db.patch(args.id).one(args.patch)

    return patched
  },
})

export const destroy = mutation({
  args: {
    id: v.id('users'),
  },
  handler: async (ctx, args) => {
    const deleted = await ctx.db.delete(args.id)

    return deleted
  },
})

export const replace = mutation({
  args: {
    id: v.id('users'),
    replace: v.object({
      email: v.string(),
      firstName: v.string(),
      lastName: v.string(),
      profileId: v.id('profiles'),
    }),
  },
  handler: async (ctx, args) => {
    const replaced = await ctx.db.replace(args.id).one(args.replace)

    return replaced
  },
})
