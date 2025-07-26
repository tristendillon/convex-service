import { convexTest as convexTestOriginal } from 'convex-test'
import schema from './schema'

export const convexTest = () =>
  convexTestOriginal(schema, {
    './_generated/api': () => import('./_generated/api'),
  })
