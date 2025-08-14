import { type Zid } from 'convex-helpers/server/zodV4'
import type {
  VAny,
  VOptional,
  VUnion,
  VNull,
  VString,
  VBytes,
  VFloat64,
  VInt64,
  VBoolean,
  VArray,
  VObject,
  VLiteral,
  VRecord,
  VId,
  GenericId,
} from 'convex/values'
import * as z from 'zod/v4'

type ConvexValidatorFromZodFields<
  T extends { [key: string]: any },
  Constraint extends 'required' | 'optional' = 'required'
> = {
  [K in keyof T]: T[K] extends z.ZodType
    ? ConvexValidatorFromZod<T[K], Constraint>
    : VAny<'required'>
}

// Auto-detect optional fields and apply appropriate constraints
type ConvexValidatorFromZodFieldsAuto<T extends { [key: string]: any }> = {
  [K in keyof T]: T[K] extends z.ZodOptional<any>
    ? ConvexValidatorFromZod<T[K], 'optional'> // Pass "optional" for optional fields
    : T[K] extends z.ZodType
    ? ConvexValidatorFromZod<T[K], 'required'> // Pass "required" for required fields
    : VAny<'required'>
}

type ConvexValidatorFromZodBase<Z extends z.ZodType> = Z extends z.ZodString
  ? VString<z.infer<Z>, 'required'>
  : Z extends z.ZodBase64
  ? VBytes<z.infer<Z>, 'required'> // Base64 strings map to VBytes
  : Z extends z.ZodNumber
  ? VFloat64<z.infer<Z>, 'required'>
  : Z extends z.ZodDate
  ? VFloat64<number, 'required'>
  : Z extends z.ZodBigInt
  ? VInt64<z.infer<Z>, 'required'>
  : Z extends z.ZodBoolean
  ? VBoolean<z.infer<Z>, 'required'>
  : Z extends z.ZodNull
  ? VNull<null, 'required'>
  : Z extends z.ZodNaN
  ? VFloat64<number, 'required'>
  : Z extends z.ZodArray<infer T>
  ? T extends z.ZodType
    ? VArray<z.infer<Z>, ConvexValidatorFromZodRequired<T>, 'required'>
    : VArray<z.infer<Z>, VAny<'required'>, 'required'>
  : Z extends z.ZodObject<infer T>
  ? VObject<z.infer<Z>, ConvexValidatorFromZodFieldsAuto<T>, 'required', string>
  : Z extends z.ZodUnion<infer T>
  ? T extends readonly [z.ZodType, z.ZodType, ...z.ZodType[]]
    ? VUnion<
        z.infer<Z>,
        [
          ConvexValidatorFromZodRequired<T[0]>,
          ConvexValidatorFromZodRequired<T[1]>,
          ...{
            [K in keyof T]: K extends '0' | '1'
              ? never
              : K extends keyof T
              ? ConvexValidatorFromZodRequired<T[K]>
              : never
          }[keyof T & number][]
        ],
        'required'
      >
    : never
  : Z extends z.ZodLiteral<infer T>
  ? VLiteral<T, 'required'>
  : Z extends z.ZodEnum<infer T>
  ? T extends readonly [string, ...string[]]
    ? T['length'] extends 1
      ? VLiteral<T[0], 'required'>
      : T['length'] extends 2
      ? VUnion<
          T[number],
          [VLiteral<T[0], 'required'>, VLiteral<T[1], 'required'>],
          'required'
        >
      : VUnion<
          T[number],
          [
            VLiteral<T[0], 'required'>,
            VLiteral<T[1], 'required'>,
            ...{
              [K in keyof T]: K extends '0' | '1'
                ? never
                : K extends keyof T
                ? VLiteral<T[K], 'required'>
                : never
            }[keyof T & number][]
          ],
          'required'
        >
    : T extends Record<string, string | number>
    ? VUnion<T[keyof T], Array<VLiteral<T[keyof T], 'required'>>, 'required'>
    : never
  : Z extends z.ZodRecord<infer K, infer V>
  ? K extends z.ZodString
    ? VRecord<
        Record<string, ConvexValidatorFromZodRequired<V & z.ZodType>['type']>,
        VString<string, 'required'>,
        ConvexValidatorFromZodRequired<V & z.ZodType>,
        'required',
        string
      > // ✅ Fixed: Use proper Record type
    : K extends z.ZodUnion<any>
    ? VRecord<
        Record<string, any>,
        VAny<'required'>,
        ConvexValidatorFromZodRequired<V & z.ZodType>,
        'required',
        string
      > // Union keys become any key validator
    : never
  : Z extends z.ZodNullable<infer Inner>
  ? Inner extends z.ZodOptional<infer InnerInner>
    ? // Handle nullable(optional(T)) as optional(union(T, null))
      VOptional<
        VUnion<
          ConvexValidatorFromZodBase<InnerInner & z.ZodType>['type'] | null,
          [
            ConvexValidatorFromZodBase<InnerInner & z.ZodType>,
            VNull<'required'>
          ],
          'required',
          ConvexValidatorFromZodBase<InnerInner & z.ZodType>['fieldPaths']
        >
      >
    : // Regular nullable
      VUnion<
        ConvexValidatorFromZodBase<Inner & z.ZodType>['type'] | null,
        [ConvexValidatorFromZodBase<Inner & z.ZodType>, VNull<'required'>],
        'required',
        ConvexValidatorFromZodBase<Inner & z.ZodType>['fieldPaths']
      >
  : Z extends z.ZodTuple<infer Items>
  ? Items extends readonly z.ZodType[]
    ? VObject<
        Record<string, any>,
        {
          [K in keyof Items as K extends number
            ? `_${K}`
            : never]: Items[K] extends z.ZodType
            ? ConvexValidatorFromZodRequired<Items[K]>
            : never
        },
        'required',
        string
      >
    : VObject<
        Record<string, any>,
        Record<string, VAny<'required'>>,
        'required',
        string
      >
  : Z extends Zid<infer TableName>
  ? VId<GenericId<TableName>, 'required'>
  : Z extends z.ZodAny
  ? VAny<'required'>
  : Z extends z.ZodUnknown
  ? VAny<'required'>
  : VAny<'required'>

type ConvexValidatorFromZodRequired<Z extends z.ZodType> =
  Z extends z.ZodOptional<infer T extends z.ZodType>
    ? VUnion<
        z.infer<T> | null,
        [ConvexValidatorFromZodBase<T & z.ZodType>, VNull<'required'>],
        'required'
      >
    : ConvexValidatorFromZodBase<Z>
type ConvexValidatorFromZod<
  Z extends z.ZodType,
  Constraint extends 'required' | 'optional' = 'required'
> = Z extends z.ZodAny
  ? VAny<any, 'required'> // Always use "required" for any types
  : Z extends z.ZodUnknown
  ? VAny<any, 'required'> // Always use "required" for unknown types
  : Z extends z.ZodDefault<infer T extends z.ZodType>
  ? ConvexValidatorFromZod<T, Constraint> // Handle ZodDefault by recursing on inner type
  : Z extends z.ZodOptional<infer T extends z.ZodType>
  ? T extends z.ZodNullable<infer Inner extends z.ZodType>
    ? // For optional(nullable(T)), we want optional(union(T, null))
      VOptional<
        VUnion<
          z.infer<Inner> | null,
          [
            ConvexValidatorFromZod<Inner & z.ZodType, 'required'>,
            VNull<null, 'required'>
          ],
          'required'
        >
      >
    : Constraint extends 'required'
    ? VUnion<
        z.infer<T> | null,
        [
          ConvexValidatorFromZod<T & z.ZodType, 'required'>,
          VNull<null, 'required'>
        ],
        'required'
      > // In required context, use union with null
    : VOptional<ConvexValidatorFromZod<T & z.ZodType, 'required'>> // In optional context, use VOptional
  : Z extends z.ZodNullable<infer T extends z.ZodType>
  ? VUnion<
      z.infer<T> | null,
      [
        ConvexValidatorFromZod<T & z.ZodType, 'required'>,
        VNull<null, 'required'>
      ],
      Constraint
    >
  : Z extends z.ZodString
  ? VString<z.infer<Z>, Constraint>
  : Z extends z.ZodBase64
  ? VBytes<z.infer<Z>, Constraint> // Base64 strings map to VBytes
  : Z extends z.ZodNumber
  ? VFloat64<z.infer<Z>, Constraint>
  : Z extends z.ZodDate
  ? VFloat64<number, Constraint>
  : Z extends z.ZodBigInt
  ? VInt64<z.infer<Z>, Constraint>
  : Z extends z.ZodBoolean
  ? VBoolean<z.infer<Z>, Constraint>
  : Z extends z.ZodNull
  ? VNull<null, Constraint>
  : Z extends z.ZodNaN
  ? VFloat64<number, Constraint>
  : Z extends z.ZodArray<infer T>
  ? T extends z.ZodType
    ? VArray<
        z.infer<Z>,
        ConvexValidatorFromZodRequired<T>, // ✅ Use helper to handle optional elements correctly
        Constraint // ✅ The array itself inherits the constraint
      >
    : VArray<z.infer<Z>, VAny<'required'>, Constraint> // ✅ Fixed here too
  : Z extends z.ZodObject<infer T>
  ? VObject<
      z.infer<Z>, // ✅ Type first
      ConvexValidatorFromZodFields<T, 'required'>, // ✅ Always "required" for fields
      Constraint, // ✅ The object itself inherits the constraint
      string // ✅ FieldPaths fourth
    >
  : Z extends z.ZodUnion<infer T>
  ? T extends readonly [z.ZodType, z.ZodType, ...z.ZodType[]]
    ? VUnion<
        z.infer<Z>,
        [
          ConvexValidatorFromZodRequired<T[0]>, // ✅ Use helper to handle optional union members correctly
          ConvexValidatorFromZodRequired<T[1]>, // ✅ Use helper to handle optional union members correctly
          ...{
            [K in keyof T]: K extends '0' | '1'
              ? never
              : K extends keyof T
              ? ConvexValidatorFromZodRequired<T[K]> // ✅ Use helper to handle optional union members correctly
              : never
          }[keyof T & number][]
        ],
        Constraint // ✅ The union itself inherits the constraint
      >
    : never
  : Z extends z.ZodLiteral<infer T>
  ? VLiteral<T, Constraint>
  : Z extends z.ZodEnum<infer T>
  ? T extends readonly [string, ...string[]]
    ? T['length'] extends 1
      ? VLiteral<T[0], Constraint>
      : T['length'] extends 2
      ? VUnion<
          T[number],
          [VLiteral<T[0], 'required'>, VLiteral<T[1], 'required'>],
          Constraint
        > // ✅ Always "required" for enum members
      : VUnion<
          T[number],
          [
            VLiteral<T[0], 'required'>, // ✅ Always "required" for enum members
            VLiteral<T[1], 'required'>, // ✅ Always "required" for enum members
            ...{
              [K in keyof T]: K extends '0' | '1'
                ? never
                : K extends keyof T
                ? VLiteral<T[K], 'required'> // ✅ Always "required" for enum members
                : never
            }[keyof T & number][]
          ],
          Constraint // ✅ The enum union itself inherits the constraint
        >
    : T extends Record<string, string | number>
    ? VUnion<T[keyof T], Array<VLiteral<T[keyof T], 'required'>>, Constraint>
    : never
  : Z extends z.ZodRecord<infer K, infer V>
  ? K extends z.ZodString
    ? V extends z.ZodAny
      ? VRecord<
          Record<string, any>,
          VAny<'required'>,
          ConvexValidatorFromZod<V & z.ZodType>,
          Constraint,
          string
        >
      : V extends z.ZodOptional<any>
      ? VRecord<
          Record<string, ConvexValidatorFromZodRequired<V & z.ZodType>['type']>,
          VString<string, 'required'>,
          ConvexValidatorFromZodRequired<V & z.ZodType>,
          Constraint,
          string
        > // Handle optional values specially
      : VRecord<
          Record<
            string,
            ConvexValidatorFromZod<V & z.ZodType, 'required'>['type']
          >,
          VString<string, 'required'>,
          ConvexValidatorFromZod<V & z.ZodType, 'required'>,
          Constraint,
          string
        >
    : K extends z.ZodUnion<any>
    ? V extends z.ZodOptional<any>
      ? VRecord<
          Record<string, any>,
          VAny<'required'>,
          ConvexValidatorFromZodRequired<V & z.ZodType>,
          Constraint,
          string
        > // Handle optional values specially
      : VRecord<
          Record<string, any>,
          VAny<'required'>,
          ConvexValidatorFromZod<V & z.ZodType, 'required'>,
          Constraint,
          string
        >
    : never
  : Z extends z.ZodTemplateLiteral<infer Template>
  ? VString<Template, Constraint> // ✅ Map template literals to strings
  : Z extends z.ZodTuple<infer Items>
  ? Items extends readonly z.ZodType[]
    ? VObject<
        Record<string, any>,
        {
          [K in keyof Items as K extends number
            ? `_${K}`
            : never]: Items[K] extends z.ZodType
            ? ConvexValidatorFromZod<Items[K], 'required'>
            : never
        },
        Constraint,
        string
      >
    : VObject<
        Record<string, any>,
        Record<string, VAny<'required'>>,
        Constraint,
        string
      >
  : Z extends Zid<infer TableName>
  ? VId<GenericId<TableName>, Constraint>
  : Z extends z.ZodTransform<infer Input extends z.ZodType, any>
  ? ConvexValidatorFromZod<Input, Constraint> // Handle transforms by using input type
  : Z extends z.ZodPipe<infer A extends z.ZodType, infer B extends z.ZodType>
  ? ConvexValidatorFromZod<A, Constraint> // For pipes, use the input type
  : Z extends z.ZodAny
  ? VAny<any, 'required'> // Always use "required" for any types
  : Z extends z.ZodUnknown
  ? VAny<any, 'required'> // Always use "required" for unknown types
  : VAny<'VALIDATION_ERROR'> // THIS LINE IS RESPONSIBLE FOR EVERYTHING BEING ASSIGNED THE 'REQUIRED' TYPE!!

export type ZodToConvex<T extends z.ZodType> = ConvexValidatorFromZod<
  T,
  'required'
>
