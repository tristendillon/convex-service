import { v } from 'convex/values'
import { internalQuery } from './_generated/server'

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// You can read data from the database via a query:
export const myQuery = internalQuery({
  handler: async (ctx) => {
    const users = await ctx.db
      .query('users')
      .withIndex('by_test_username_age_name_email', (q) =>
        q
          .eq('test', { name: 'test', age: 18 })
          .eq('username', 'test')
          .eq('age', 18)
          .eq('name', 'test')
          .eq('email', 'test@test.com')
      )
      .collect()
    console.log(users)
    return false
  },
})
