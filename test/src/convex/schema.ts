import { zid } from 'convex-helpers/server/zod'
import { defineService, defineServiceSchema } from 'convex-sql'
import { defineSchema } from 'convex/server'
import z from 'zod'

const ProfileService = defineService(
  z.object({
    name: z.string(),
    age: z.number(),
    bio: z.string().optional(),
    avatar: z.string().url().optional(),
  })
)
  .name('profiles')
  .index('by_name', ['name'])
  .searchIndex('by_bio', { searchField: 'bio' })
const UserService = defineService(
  z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(12, 'Username must be at most 12 characters'),
    name: z.string(),
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
  .unique('username')
  .unique('email')
  .relation('profileId', 'profiles', 'cascade')
  .index('by_age', ['age'])
  .index('by_active_age', ['isActive', 'age'])
  .searchIndex('by_name_username', {
    searchField: 'name',
    filterFields: ['isActive'],
  })
  .validate()
const PostService = defineService(
  z.object({
    title: z.string(),
    content: z.string(),
    authorId: zid('users'),
    categoryId: zid('categories'),
    tags: z.array(zid('tags')),
    published: z.boolean(),
    views: z.number(),
    embedding: z.array(z.number()).optional(),
    slug: z.string(),
  })
)
  .name('posts')
  .unique('slug')
  .relation('authorId', 'users', 'cascade')
  .relation('categoryId', 'categories', 'restrict')
  .relation('tags', 'tags', 'cascade')
  .index('by_published_views', ['published', 'views'])
  .searchIndex('by_title_content', {
    searchField: 'title',
    filterFields: ['published', 'authorId', 'content'],
  })
  .vectorIndex('by_embedding', {
    vectorField: 'embedding',
    dimensions: 1536,
    filterFields: ['published'],
  })
  .validate()

const CategoryService = defineService(
  z.object({
    name: z.string(),
    description: z.string().optional(),
    parentId: zid('categories').optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i)
      .optional(),
    sortOrder: z.number(),
  })
)
  .name('categories')
  .unique('name')
  .relation('parentId', 'categories', 'cascade')
  .index('by_sort_order', ['sortOrder'])
  .default('sortOrder', 0)

const CommentService = defineService(
  z.object({
    postId: zid('posts'),
    authorId: zid('users'),
    parentId: zid('comments').optional(),
    content: z.string(),
    approved: z.boolean(),
    likes: z.number(),
  })
)
  .name('comments')
  .relation('postId', 'posts', 'cascade')
  .relation('authorId', 'users', 'cascade')
  .relation('parentId', 'comments', 'cascade')
  .index('by_post_approved', ['postId', 'approved'])
  .default('approved', false)
  .default('likes', 0)

const TagService = defineService(
  z.object({
    name: z.string(),
    color: z.string().optional(),
    usage_count: z.number(),
  })
)
  .name('tags')
  .unique('name')
  .index('by_usage_count', ['usage_count'])
  .default('usage_count', 0)

const schema = {
  profiles: ProfileService.register(),
  users: UserService.register(),
  posts: PostService.register(),
  categories: CategoryService.register(),
  comments: CommentService.register(),
  tags: TagService.register(),
}
export const ServiceSchema = defineServiceSchema(schema)

export const { profiles, users, posts, categories, comments, tags } = schema

export default defineSchema({
  profiles: ProfileService,
  users: UserService,
  posts: PostService,
  categories: CategoryService,
  comments: CommentService,
  tags: TagService,
})
