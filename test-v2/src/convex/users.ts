import { customMutation } from '../lib/mutation'
import { usersService } from './users.def'
export const test = customMutation({
  args: usersService.validators.validator,
  handler: async (ctx, args) => {
    // Test type inference - TypeScript should now properly infer
    // that uuid and updatedAt are optional due to defaults
    // while email, firstName, lastName are required
    const inserted = await ctx.db.insert('users').one({})

    // Test many operation with proper typing
    const manyInserted = await ctx.db.insert('users').many([
      {
        email: 'user1@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        profileId: 'profile456',
      },
      {
        email: 'user2@example.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        profileId: 'profile789',
        uuid: 'custom-uuid', // Optional field can be provided
        fullName: 'Custom Full Name', // Optional field
      },
    ])

    return { single: inserted, many: manyInserted }
  },
})
