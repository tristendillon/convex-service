// Minimal exports for better tree shaking
export { defineService } from './service'
export { defineServiceSchema } from './schema'
export { CreateServiceMutation } from './mutation'

// Error classes for better error handling
export { 
  ConvexSQLError, 
  ValidationError, 
  UniqueConstraintError, 
  DocumentNotFoundError 
} from './errors'

// Essential types only
// export type {
//   ConvexValidatorFromZod,
//   Index,
//   SearchIndex,
//   VectorIndex
// } from './schema.types'
