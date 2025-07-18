/**
 * Template engine for code generation
 */

import * as Handlebars from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Template context for code generation
 */
export interface TemplateContext {
  /** Package name */
  packageName: string;
  /** Class name */
  className: string;
  /** Imports */
  imports: string[];
  /** Additional context data */
  [key: string]: any;
}

/**
 * Template engine configuration
 */
export interface TemplateEngineConfig {
  /** Template directory */
  templateDir: string;
  /** Template file extension */
  templateExtension: string;
  /** Whether to cache compiled templates */
  cacheTemplates: boolean;
}

/**
 * Template engine for generating code from Handlebars templates
 */
export class TemplateEngine {
  private config: TemplateEngineConfig;
  private templateCache = new Map<string, HandlebarsTemplateDelegate>();

  constructor(config: Partial<TemplateEngineConfig> = {}) {
    this.config = {
      templateDir: path.join(__dirname, '../../templates'),
      templateExtension: '.hbs',
      cacheTemplates: true,
      ...config,
    };

    this.registerHelpers();
  }

  /**
   * Render template with context
   */
  async render(templateName: string, context: TemplateContext): Promise<string> {
    const template = await this.getTemplate(templateName);
    return template(context);
  }

  /**
   * Get compiled template
   */
  private async getTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    // Check cache first
    if (this.config.cacheTemplates && this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    // Load and compile template
    const templatePath = this.getTemplatePath(templateName);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateContent);

    // Cache if enabled
    if (this.config.cacheTemplates) {
      this.templateCache.set(templateName, compiledTemplate);
    }

    return compiledTemplate;
  }

  /**
   * Get template file path
   */
  private getTemplatePath(templateName: string): string {
    const fileName = templateName.endsWith(this.config.templateExtension) 
      ? templateName 
      : templateName + this.config.templateExtension;
    
    return path.join(this.config.templateDir, fileName);
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // Helper for converting to camelCase
    Handlebars.registerHelper('camelCase', (str: string) => {
      return str.charAt(0).toLowerCase() + str.slice(1);
    });

    // Helper for converting to PascalCase
    Handlebars.registerHelper('pascalCase', (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    // Helper for converting to snake_case
    Handlebars.registerHelper('snakeCase', (str: string) => {
      return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    });

    // Helper for converting to kebab-case
    Handlebars.registerHelper('kebabCase', (str: string) => {
      return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    });

    // Helper for pluralizing words
    Handlebars.registerHelper('pluralize', (str: string) => {
      if (str.endsWith('y')) {
        return str.slice(0, -1) + 'ies';
      } else if (str.endsWith('s') || str.endsWith('sh') || str.endsWith('ch')) {
        return str + 'es';
      } else {
        return str + 's';
      }
    });

    // Helper for generating getter method name
    Handlebars.registerHelper('getter', (fieldName: string) => {
      return 'get' + fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    });

    // Helper for generating setter method name
    Handlebars.registerHelper('setter', (fieldName: string) => {
      return 'set' + fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    });

    // Helper for mapping XSD types to Java types
    Handlebars.registerHelper('javaType', (xsdType: string) => {
      const typeMapping: Record<string, string> = {
        'string': 'String',
        'int': 'Integer',
        'integer': 'Integer',
        'long': 'Long',
        'double': 'Double',
        'float': 'Float',
        'boolean': 'Boolean',
        'date': 'LocalDate',
        'dateTime': 'LocalDateTime',
        'time': 'LocalTime',
        'decimal': 'BigDecimal',
        'base64Binary': 'byte[]',
        'anyURI': 'String',
      };

      return typeMapping[xsdType] || 'String';
    });

    // Helper for generating validation annotations
    Handlebars.registerHelper('validationAnnotations', (element: any) => {
      const annotations: string[] = [];

      if (element.required) {
        annotations.push('@NotNull');
      }

      if (element.restrictions) {
        for (const restriction of element.restrictions) {
          switch (restriction.type) {
            case 'MIN_LENGTH':
              annotations.push(`@Size(min = ${restriction.value})`);
              break;
            case 'MAX_LENGTH':
              annotations.push(`@Size(max = ${restriction.value})`);
              break;
            case 'PATTERN':
              annotations.push(`@Pattern(regexp = "${restriction.value}")`);
              break;
          }
        }
      }

      return annotations.join('\n    ');
    });

    // Helper for conditional rendering
    Handlebars.registerHelper('if_eq', function(a: any, b: any, options: any) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // Helper for conditional rendering (not equal)
    Handlebars.registerHelper('if_ne', function(a: any, b: any, options: any) {
      if (a !== b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // Helper for generating HTTP method annotations
    Handlebars.registerHelper('httpMethodAnnotation', (method: string) => {
      const methodMapping: Record<string, string> = {
        'GET': '@GetMapping',
        'POST': '@PostMapping',
        'PUT': '@PutMapping',
        'DELETE': '@DeleteMapping',
        'PATCH': '@PatchMapping',
      };

      return methodMapping[method.toUpperCase()] || '@RequestMapping';
    });

    // Helper for generating Spring Boot imports
    Handlebars.registerHelper('springImports', (features: string[]) => {
      const importMapping: Record<string, string> = {
        'web': 'org.springframework.web.bind.annotation.*',
        'jpa': 'org.springframework.data.jpa.repository.*',
        'service': 'org.springframework.stereotype.Service',
        'component': 'org.springframework.stereotype.Component',
        'autowired': 'org.springframework.beans.factory.annotation.Autowired',
        'validation': 'javax.validation.constraints.*',
        'lombok': 'lombok.*',
      };

      const imports = features.map(feature => importMapping[feature]).filter(Boolean);
      return imports.join('\n');
    });
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Check if template exists
   */
  async templateExists(templateName: string): Promise<boolean> {
    const templatePath = this.getTemplatePath(templateName);
    return fs.pathExists(templatePath);
  }

  /**
   * List available templates
   */
  async listTemplates(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.config.templateDir);
      return files
        .filter(file => file.endsWith(this.config.templateExtension))
        .map(file => file.replace(this.config.templateExtension, ''));
    } catch (error) {
      return [];
    }
  }
}
