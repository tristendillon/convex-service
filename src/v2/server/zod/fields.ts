import { ZodToConvex } from '.'
import { GenericFields, ServiceField } from '../field'
export type ServiceFieldToValidator<Field extends ServiceField> =
  Field extends ServiceField<infer ZodType> ? ZodToConvex<ZodType> : never

export type GenericFieldToValidator<Fields extends GenericFields> = {
  [K in keyof Fields]: Fields[K] extends ServiceField
    ? ServiceFieldToValidator<Fields[K]>
    : never
}
