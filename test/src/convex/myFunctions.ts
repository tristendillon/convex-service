import { v } from 'convex/values'
import { internalQuery } from './_generated/server'



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
