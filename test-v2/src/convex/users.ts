import { v } from 'convex/values'
import { customMutation } from '../lib/mutation'
import type { Id } from './_generated/dataModel'
import { usersService } from './users.def'
export const test = customMutation({
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
