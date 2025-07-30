import { convexTest as convexTestOriginal } from 'convex-test'
import schema from '../convex/schema'

const test = convexTestOriginal(schema, {
  './_generated/api': () => import('../convex/_generated/api'),
})

export const convexTest = () => {
  return test
}
