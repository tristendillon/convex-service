import { convexTest as convexTestOriginal } from 'convex-test'
import schema from './schema'

const test = convexTestOriginal(schema, {
  './_generated/api': () => import('./_generated/api'),
})

export const convexTest = () => {
  return test
}
