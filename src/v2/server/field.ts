import * as z from 'zod/v4'
import { ZodToConvex } from './zod/types'
import type { HookDefinitionFromZod } from './hooks/types'

type ExtractZodType<T extends Field> = T extends ServiceField<infer U>
  ? U
  : T extends z.ZodType
  ? T
  : never

export type CreateZodSchemaFromFields<Fields extends GenericFields> =
  z.ZodObject<{
    [K in keyof Fields]: ExtractZodType<Fields[K]>
  }>

export type ServiceFieldsToConvex<Fields extends GenericFields> = ZodToConvex<
  CreateZodSchemaFromFields<Fields>
>

export function createZodSchemaFromFields<T extends GenericFields>(
  fields: T
): CreateZodSchemaFromFields<T> {
  const zodShape: Record<string, z.ZodType> = {}

  for (const [key, field] of Object.entries(fields)) {
    if (field instanceof ServiceField) {
      zodShape[key] = field.toZod()
    } else {
      zodShape[key] = field
    }
  }

  return z.object(zodShape) as CreateZodSchemaFromFields<T>
}

export type Field = ServiceField | z.ZodType
export type GenericFields = Record<string, Field>

type ServiceFieldDefault<T extends z.ZodType> = z.infer<T> | (() => z.infer<T>)

type ServiceFieldState<ZodValidator extends z.ZodType = z.ZodType> = {
  unique: boolean
  default: ServiceFieldDefault<ZodValidator> | undefined
  hooks: HookDefinitionFromZod<ZodValidator>
}

export class ServiceField<
  ZodValidator extends z.ZodType = z.ZodType,
  State extends ServiceFieldState<ZodValidator> = ServiceFieldState<ZodValidator>
> {
  private _zodValidator: ZodValidator
  private _state: State = {
    unique: false,
    default: undefined,
    hooks: {},
  } as State
  constructor(zodValidator: ZodValidator) {
    this._zodValidator = zodValidator
  }

  public unique(): this {
    this._state.unique = true
    return this
  }

  public default(args: ServiceFieldDefault<ZodValidator>): this {
    this._state.default = args
    return this
  }

  public hooks(callback: (hooks: HookDefinitionFromZod<ZodValidator>) => void) {
    callback(this._state.hooks)
    return this
  }

  public toZod(): ZodValidator {
    return this._zodValidator
  }

  public register(): this {
    return this
  }
}

/**
 * A field in a service.
 *
 * ```ts
 * const emailField = defineField(v.string().email()).unique()
 * ```
 *
 * @param zodValidator - The zod validator for the field.
 */
export const defineField = <T extends z.ZodType>(zodValidator: T) => {
  return new ServiceField(zodValidator)
}
