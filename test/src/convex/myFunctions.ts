import { v } from 'convex/values'
import { internalMutation, internalQuery } from './_generated/server'
import { users } from './schema'

export const myFunction = internalMutation({
  args: users.$argsWithoutDefaults,
  handler: async (ctx, args) => {
    return true
  },
})

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// You can read data from the database via a query:
export const myQuery = internalQuery({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()
    console.log(users)
    return false
  },
})
