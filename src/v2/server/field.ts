import z, { ZodTypeAny } from 'zod'
import { ServiceOperation } from './types'

type ServiceFieldDefault<T extends ZodTypeAny> = z.infer<T> | (() => z.infer<T>)

type ServiceFieldState<ZodValidator extends ZodTypeAny = ZodTypeAny> = {
  unique: boolean
  default: ServiceFieldDefault<ZodValidator> | undefined
  beforeOperation: (
    operation: ServiceOperation<ZodValidator>
  ) => Promise<z.infer<ZodValidator>> | z.infer<ZodValidator>
  afterOperation: (
    operation: ServiceOperation<ZodValidator>
  ) => Promise<void> | void
}

export class ServiceField<
  ZodValidator extends ZodTypeAny = ZodTypeAny,
  State extends ServiceFieldState<ZodValidator> = ServiceFieldState<ZodValidator>
> {
  private _zodValidator: ZodValidator
  private _state: State = {} as State
  constructor(zodValidator: ZodValidator) {
    this._zodValidator = zodValidator
  }

  private _mergeState(state: Partial<ServiceFieldState<ZodValidator>>) {
    this._state = {
      ...this._state,
      ...state,
    }
    return this
  }

  public unique(): this {
    this._mergeState({ unique: true })
    return this
  }

  public default(args: ServiceFieldDefault<ZodValidator>): this {
    this._mergeState({ default: args })
    return this
  }

  public beforeOperation(
    callback: ServiceFieldState<ZodValidator>['beforeOperation']
  ): this {
    this._mergeState({ beforeOperation: callback })
    return this
  }

  public afterOperation(
    callback: ServiceFieldState<ZodValidator>['afterOperation']
  ): this {
    this._mergeState({ afterOperation: callback })
    return this
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
export const defineField = <T extends ZodTypeAny>(zodValidator: T) => {
  return new ServiceField(zodValidator)
}
