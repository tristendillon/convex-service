import { DataModel } from './_generated/dataModel'
import { ServiceSchema } from './schema'
import { CreateServiceMutation } from 'convex-sql'

const mutation = CreateServiceMutation<DataModel>(ServiceSchema.services)

const users = ServiceSchema.services.users
users.$config.state.defaults.age
export const myMutation = mutation({
  args: users.argsWithoutDefaults,
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert('users').withDefaults().one({

    })
    return await ctx.db.get(userId)
  },
})
