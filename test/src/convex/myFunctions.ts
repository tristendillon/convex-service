import { internalMutation, internalQuery } from './_generated/server'
import { users } from './schema'

export const myFunction = internalMutation({
  args: users.argsWithoutDefaults,
  handler: async (ctx, args) => {
    const newUser = {
      ...args,
      age: args.age ?? users.$config.state.defaults.age,
      isActive: args.isActive ?? users.$config.state.defaults.isActive,
    }
    const userId = await ctx.db.insert(users.tableName, newUser)
    return await ctx.db.get(userId)
  },
})

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// You can read data from the database via a query:
export const myQuery = internalQuery({
  handler: async (ctx) => {
    const users = await
      ctx.db.query('users')
        .withIndex("")
        .collect()
    console.log(users)
    return false
  },
})
