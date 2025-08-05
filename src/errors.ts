import { ZodError } from 'zod'

/**
 * Base class for all ConvexSQL errors with consistent formatting
 */
export abstract class ConvexSQLError extends Error {
  abstract readonly errorType: string
  
  constructor(message: string, cause?: Error) {
    super(message)
    this.name = this.constructor.name
    this.cause = cause
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)
  }

  /**
   * Format the error for display with consistent styling
   */
  abstract formatError(): string

  toString(): string {
    return this.formatError()
  }
}

/**
 * Error thrown when validation fails (schema validation)
 */
export class ValidationError extends ConvexSQLError {
  readonly errorType = 'ValidationError'
  
  constructor(
    public readonly tableName: string,
    public readonly zodError: ZodError,
    cause?: Error
  ) {
    const message = ValidationError.formatValidationMessage(tableName, zodError)
    super(message, cause)
  }

  formatError(): string {
    return ValidationError.formatValidationMessage(this.tableName, this.zodError)
  }

  static formatValidationMessage(tableName: string, zodError: ZodError): string {
    const formatted = zodError.flatten()
    
    let errorMessage = `ValidationError: Failed to validate table '${tableName}'`

    // Add field errors if they exist
    if (formatted.fieldErrors && Object.keys(formatted.fieldErrors).length > 0) {
      errorMessage += '\n\n  Field Errors:'
      for (const [field, errors] of Object.entries(formatted.fieldErrors)) {
        if (Array.isArray(errors)) {
          errors.forEach((err) => {
            errorMessage += `\n    • ${field}: ${err}`
          })
        }
      }
    }

    // Add form errors if they exist
    if (formatted.formErrors && formatted.formErrors.length > 0) {
      errorMessage += '\n\n  General Errors:'
      formatted.formErrors.forEach((err) => {
        errorMessage += `\n    • ${err}`
      })
    }

    return errorMessage
  }
}

/**
 * Error thrown when a unique constraint is violated
 */
export class UniqueConstraintError extends ConvexSQLError {
  readonly errorType = 'UniqueConstraintError'
  
  constructor(
    public readonly tableName: string,
    public readonly constraintName: string,
    public readonly fields: string[],
    public readonly values: Record<string, any>,
    public readonly existingRecordId?: string,
    cause?: Error
  ) {
    const message = UniqueConstraintError.formatUniqueMessage(
      tableName, 
      constraintName, 
      fields, 
      values
    )
    super(message, cause)
  }

  formatError(): string {
    return UniqueConstraintError.formatUniqueMessage(
      this.tableName,
      this.constraintName,
      this.fields,
      this.values
    )
  }

  static formatUniqueMessage(
    tableName: string,
    constraintName: string,
    fields: string[],
    values: Record<string, any>
  ): string {
    const fieldCount = fields.length
    const fieldWord = fieldCount === 1 ? 'field' : 'fields'
    const fieldList = fields.map(f => `'${f}'`).join(', ')
    
    let errorMessage = `UniqueConstraintError: Duplicate ${fieldWord} detected in table '${tableName}'`
    errorMessage += `\n\n  Constraint: ${constraintName}`
    errorMessage += `\n  ${fieldWord.charAt(0).toUpperCase() + fieldWord.slice(1)}: ${fieldList}`
    
    // Show the conflicting values
    errorMessage += '\n  Conflicting values:'
    for (const field of fields) {
      const value = values[field]
      const displayValue = typeof value === 'string' ? `"${value}"` : String(value)
      errorMessage += `\n    • ${field}: ${displayValue}`
    }
    
    errorMessage += '\n\n  A record with these values already exists.'

    return errorMessage
  }
}

/**
 * Error thrown when a document is not found during an operation that requires it
 */
export class DocumentNotFoundError extends ConvexSQLError {
  readonly errorType = 'DocumentNotFoundError'
  
  constructor(
    public readonly tableName: string,
    public readonly documentId: string,
    public readonly operation: string,
    cause?: Error
  ) {
    const message = `DocumentNotFoundError: Document '${documentId}' not found in table '${tableName}' during ${operation} operation`
    super(message, cause)
  }

  formatError(): string {
    return `DocumentNotFoundError: Document not found\n\n` +
           `  Table: ${this.tableName}\n` +
           `  Document ID: ${this.documentId}\n` +
           `  Operation: ${this.operation}\n\n` +
           `  The document may have been deleted or the ID may be incorrect.`
  }
}

/**
 * Error thrown when a delete operation fails due to dependent records that prevent deletion
 */
export class DependentRecordError extends ConvexSQLError {
  readonly errorType = 'DependentRecordError'
  
  constructor(
    public readonly targetTable: string,
    public readonly targetId: string,
    public readonly dependentTable: string,
    public readonly fieldPath: string,
    cause?: Error
  ) {
    const message = `DependentRecordError: Cannot delete record from '${targetTable}' with id '${targetId}' because it has dependent records in '${dependentTable}'`
    super(message, cause)
  }

  formatError(): string {
    return `DependentRecordError: Cannot delete due to dependent records\n\n` +
           `  Target Table: ${this.targetTable}\n` +
           `  Target ID: ${this.targetId}\n` +
           `  Dependent Table: ${this.dependentTable}\n` +
           `  Relation Field: ${this.fieldPath}\n\n` +
           `  This record cannot be deleted because other records depend on it.\n` +
           `  Either delete the dependent records first or change the relation to 'cascade' or 'setOptional'.`
  }
}