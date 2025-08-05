# Convex Service

## 📦 Installation

```bash
pnpm install convex-service
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
pnpm install convex convex-helpers@0.1.54 zod@3.23.8
```

## 🚀 Quick Start

### 1. Define a Service

```typescript
// schema.ts
import { defineService } from 'convex-service'
import { z } from 'zod'

const UserService = defineService(
  z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(12, 'Username must be at most 12 characters'),
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    age: z.number().min(18, 'Age must be at least 18'),
    isActive: z.boolean(),
    profileId: zid('profiles'),
    metadata: z.record(z.string(), z.any()).optional(),
  })
)
  .name('users')
  .default('age', 18)
  .default('isActive', true)
  .unique(['email', 'username'], 'replace')
  .relation('profileId', 'profiles', 'cascade')
  .index('by_age', ['age'])
  .index('by_active_age', ['isActive', 'age'])
  .searchIndex('by_name_username', {
    searchField: 'name',
    filterFields: ['isActive'],
  })
  .validate()
```

### 2. Create a Service Schema

```typescript
// schema.ts
import { defineServiceSchema } from 'convex-service'

export const ServiceSchema = defineServiceSchema({
  users: UserService.register(),
  // Additional services
})
  // Other schema builders go here 'learn more in the docs'
  .register()
```

### 3. Create Service Mutation

```typescript
// mutation.ts
import { ServiceSchema } from './schema'
import { CreateServiceMutation } from 'convex-service'
import { DataModel } from './_generated/dataModel'

const mutation = CreateServiceMutation<DataModel>(ServiceSchema.services)
```

### 3. Use Service Mutations

```typescript
import { ServiceSchema } from './schema'
import { mutation } from './mutation.ts'

const usersService = ServiceSchema.services.users

export const createUserWithDefaults = mutation({
  args: usersService.argsWithoutDefaults,
  handler: async (ctx, args) => {
    const userId = await ctx.db
      .insert('users')
      // Sets that we will generate the defaults, you can leave this builder out to override the defaults,
      .withDefaults()
      // we can use one or many and it will insert either one or an array of documents
      .one(args)
      // Then we validate, this will run your validation that you defined in the service, be it a custom zod schema or a validation function. Learn more in the docs.
      .validate()
      // Then we execute the insert. this will actually insert the data in the db.
      .execute()
    return userId
  },
})
```

## 📚 Documentation

For comprehensive documentation, examples, and advanced usage, visit our [documentation site](/).

## 📄 License

MIT © convex service

---

Built with ❤️ for the Convex ecosystem
