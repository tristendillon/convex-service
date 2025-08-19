import { customMutation } from '../lib/mutation'
import { usersService } from './users.def'
export const test = customMutation({
  args: usersService.validators.validator,
  handler: async (ctx, args) => {
    const inserted = await ctx.db.insert('users').one({

    })
    return inserted
  },
})
