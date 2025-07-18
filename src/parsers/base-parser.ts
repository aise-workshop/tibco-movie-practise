/**
 * Base parser interface and utilities
 */

import { ConversionError, ConversionWarning } from '@/types';

/**
 * Base parser interface
 */
export interface IParser<TInput, TOutput> {
  /**
   * Parse input and return structured output
   */
  parse(input: TInput): Promise<ParseResult<TOutput>>;

  /**
   * Validate input before parsing
   */
  validate(input: TInput): Promise<ValidationResult>;
}

/**
 * Parse result containing output and diagnostics
 */
export interface ParseResult<T> {
  /** Parsed output */
  data: T | null;
  /** Parse warnings */
  warnings: ConversionWarning[];
  /** Parse errors */
  errors: ConversionError[];
  /** Whether parsing was successful */
  success: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether input is valid */
  valid: boolean;
  /** Validation errors */
  errors: ConversionError[];
  /** Validation warnings */
  warnings: ConversionWarning[];
}

/**
 * Parser configuration
 */
export interface ParserConfig {
  /** Whether to include detailed error information */
  verbose: boolean;
  /** Whether to continue parsing on non-fatal errors */
  continueOnError: boolean;
  /** Custom namespace mappings */
  namespaceMappings?: Record<string, string>;
}

/**
 * Base parser class with common functionality
 */
export abstract class BaseParser<TInput, TOutput> implements IParser<TInput, TOutput> {
  protected config: ParserConfig;
  protected warnings: ConversionWarning[] = [];
  protected errors: ConversionError[] = [];

  constructor(config: Partial<ParserConfig> = {}) {
    this.config = {
      verbose: false,
      continueOnError: true,
      ...config,
    };
  }

  /**
   * Abstract parse method to be implemented by subclasses
   */
  abstract parse(input: TInput): Promise<ParseResult<TOutput>>;

  /**
   * Abstract validation method to be implemented by subclasses
   */
  abstract validate(input: TInput): Promise<ValidationResult>;

  /**
   * Add a warning to the current parsing context
   */
  protected addWarning(message: string, source: string, code: string): void {
    this.warnings.push({
      message,
      source,
      code,
    });
  }

  /**
   * Add an error to the current parsing context
   */
  protected addError(message: string, source: string, code: string, stack?: string): void {
    this.errors.push({
      message,
      source,
      code,
      stack,
    });
  }

  /**
   * Clear warnings and errors
   */
  protected clearDiagnostics(): void {
    this.warnings = [];
    this.errors = [];
  }

  /**
   * Create a parse result
   */
  protected createResult<T>(data: T | null): ParseResult<T> {
    return {
      data,
      warnings: [...this.warnings],
      errors: [...this.errors],
      success: this.errors.length === 0 && data !== null,
    };
  }

  /**
   * Create a validation result
   */
  protected createValidationResult(): ValidationResult {
    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
    };
  }

  /**
   * Handle parsing errors
   */
  protected handleError(error: Error, source: string): void {
    const message = this.config.verbose ? error.message : 'Parsing error occurred';
    const stack = this.config.verbose ? error.stack : undefined;
    
    this.addError(message, source, 'PARSE_ERROR', stack);
    
    if (!this.config.continueOnError) {
      throw error;
    }
  }

  /**
   * Log debug information if verbose mode is enabled
   */
  protected debug(message: string): void {
    if (this.config.verbose) {
      console.debug(`[${this.constructor.name}] ${message}`);
    }
  }
}

/**
 * Parser factory for creating parser instances
 */
export class ParserFactory {
  private static parsers = new Map<string, new (config?: Partial<ParserConfig>) => IParser<any, any>>();

  /**
   * Register a parser class
   */
  static register<TInput, TOutput>(
    name: string,
    parserClass: new (config?: Partial<ParserConfig>) => IParser<TInput, TOutput>
  ): void {
    this.parsers.set(name, parserClass);
  }

  /**
   * Create a parser instance
   */
  static create<TInput, TOutput>(
    name: string,
    config?: Partial<ParserConfig>
  ): IParser<TInput, TOutput> {
    const ParserClass = this.parsers.get(name);
    if (!ParserClass) {
      throw new Error(`Parser '${name}' not found`);
    }
    return new ParserClass(config);
  }

  /**
   * Get list of registered parser names
   */
  static getRegisteredParsers(): string[] {
    return Array.from(this.parsers.keys());
  }
}
