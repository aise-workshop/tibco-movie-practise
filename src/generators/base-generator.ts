/**
 * Base generator interface and utilities
 */

import { GeneratedFile, GenerationConfig, ConversionError, ConversionWarning } from '@/types';

/**
 * Base generator interface
 */
export interface IGenerator<TInput> {
  /**
   * Generate code from input
   */
  generate(input: TInput, config: GenerationConfig): Promise<GenerationResult>;

  /**
   * Get supported file types
   */
  getSupportedTypes(): string[];

  /**
   * Validate input before generation
   */
  validate(input: TInput): Promise<ValidationResult>;
}

/**
 * Generation result
 */
export interface GenerationResult {
  /** Generated files */
  files: GeneratedFile[];
  /** Generation warnings */
  warnings: ConversionWarning[];
  /** Generation errors */
  errors: ConversionError[];
  /** Whether generation was successful */
  success: boolean;
}

/**
 * Validation result for generators
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
 * Generator configuration
 */
export interface GeneratorConfig {
  /** Whether to include detailed debug information */
  verbose: boolean;
  /** Whether to overwrite existing files */
  overwriteFiles: boolean;
  /** Whether to format generated code */
  formatCode: boolean;
  /** Custom template directory */
  templateDir?: string;
}

/**
 * Base generator class with common functionality
 */
export abstract class BaseGenerator<TInput> implements IGenerator<TInput> {
  protected config: GeneratorConfig;
  protected warnings: ConversionWarning[] = [];
  protected errors: ConversionError[] = [];

  constructor(config: Partial<GeneratorConfig> = {}) {
    this.config = {
      verbose: false,
      overwriteFiles: true,
      formatCode: true,
      ...config,
    };
  }

  /**
   * Abstract generate method to be implemented by subclasses
   */
  abstract generate(input: TInput, config: GenerationConfig): Promise<GenerationResult>;

  /**
   * Abstract method to get supported file types
   */
  abstract getSupportedTypes(): string[];

  /**
   * Abstract validation method to be implemented by subclasses
   */
  abstract validate(input: TInput): Promise<ValidationResult>;

  /**
   * Add a warning to the current generation context
   */
  protected addWarning(message: string, source: string, code: string): void {
    this.warnings.push({
      message,
      source,
      code,
    });
  }

  /**
   * Add an error to the current generation context
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
   * Create a generation result
   */
  protected createResult(files: GeneratedFile[]): GenerationResult {
    return {
      files,
      warnings: [...this.warnings],
      errors: [...this.errors],
      success: this.errors.length === 0,
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
   * Handle generation errors
   */
  protected handleError(error: Error, source: string): void {
    const message = this.config.verbose ? error.message : 'Generation error occurred';
    const stack = this.config.verbose ? error.stack : undefined;
    
    this.addError(message, source, 'GENERATION_ERROR', stack);
  }

  /**
   * Log debug information if verbose mode is enabled
   */
  protected debug(message: string): void {
    if (this.config.verbose) {
      console.debug(`[${this.constructor.name}] ${message}`);
    }
  }

  /**
   * Create a generated file
   */
  protected createGeneratedFile(
    path: string,
    content: string,
    type: GeneratedFile['type']
  ): GeneratedFile {
    return {
      path,
      content: this.config.formatCode ? this.formatCode(content, path) : content,
      type,
    };
  }

  /**
   * Format code based on file extension
   */
  protected formatCode(content: string, filePath: string): string {
    // Basic formatting - could be enhanced with prettier or other formatters
    if (filePath.endsWith('.java')) {
      return this.formatJavaCode(content);
    }
    return content;
  }

  /**
   * Basic Java code formatting
   */
  protected formatJavaCode(content: string): string {
    // Simple indentation and line break formatting
    let formatted = content;
    
    // Normalize line endings
    formatted = formatted.replace(/\r\n/g, '\n');
    
    // Remove extra blank lines
    formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Ensure proper spacing around braces
    formatted = formatted.replace(/\{\s*\n/g, '{\n');
    formatted = formatted.replace(/\n\s*\}/g, '\n}');
    
    return formatted;
  }

  /**
   * Sanitize class name
   */
  protected sanitizeClassName(name: string): string {
    // Remove invalid characters and ensure proper casing
    let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Ensure it starts with a letter
    if (!/^[a-zA-Z]/.test(sanitized)) {
      sanitized = 'Generated' + sanitized;
    }
    
    // Convert to PascalCase
    return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
  }

  /**
   * Sanitize method name
   */
  protected sanitizeMethodName(name: string): string {
    // Remove invalid characters and ensure proper casing
    let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Ensure it starts with a letter
    if (!/^[a-zA-Z]/.test(sanitized)) {
      sanitized = 'generated' + sanitized;
    }
    
    // Convert to camelCase
    return sanitized.charAt(0).toLowerCase() + sanitized.slice(1);
  }

  /**
   * Sanitize package name
   */
  protected sanitizePackageName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '')
      .replace(/\.+/g, '.')
      .replace(/^\.+|\.+$/g, '');
  }

  /**
   * Generate import statements
   */
  protected generateImports(imports: string[]): string {
    const uniqueImports = [...new Set(imports)].sort();
    return uniqueImports.map(imp => `import ${imp};`).join('\n');
  }

  /**
   * Generate package declaration
   */
  protected generatePackageDeclaration(packageName: string): string {
    return `package ${this.sanitizePackageName(packageName)};`;
  }
}

/**
 * Generator factory for creating generator instances
 */
export class GeneratorFactory {
  private static generators = new Map<string, new (config?: Partial<GeneratorConfig>) => IGenerator<any>>();

  /**
   * Register a generator class
   */
  static register<TInput>(
    name: string,
    generatorClass: new (config?: Partial<GeneratorConfig>) => IGenerator<TInput>
  ): void {
    this.generators.set(name, generatorClass);
  }

  /**
   * Create a generator instance
   */
  static create<TInput>(
    name: string,
    config?: Partial<GeneratorConfig>
  ): IGenerator<TInput> {
    const GeneratorClass = this.generators.get(name);
    if (!GeneratorClass) {
      throw new Error(`Generator '${name}' not found`);
    }
    return new GeneratorClass(config);
  }

  /**
   * Get list of registered generator names
   */
  static getRegisteredGenerators(): string[] {
    return Array.from(this.generators.keys());
  }
}
