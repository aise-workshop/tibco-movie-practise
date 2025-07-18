/**
 * Spring Boot Controller generator
 */

import { BaseGenerator, GenerationResult, ValidationResult } from './base-generator';
import { TemplateEngine, TemplateContext } from './template-engine';
import { BWPProcess, BWPActivityType, GenerationConfig, GeneratedFile } from '@/types';

/**
 * Controller generator for Spring Boot REST controllers
 */
export class ControllerGenerator extends BaseGenerator<BWPProcess> {
  private templateEngine: TemplateEngine;

  constructor(config = {}) {
    super(config);
    this.templateEngine = new TemplateEngine({
      templateDir: this.config.templateDir,
    });
  }

  /**
   * Generate Spring Boot controller from BWP process
   */
  async generate(process: BWPProcess, config: GenerationConfig): Promise<GenerationResult> {
    this.clearDiagnostics();
    this.debug(`Generating controller for process: ${process.name}`);

    try {
      const files: GeneratedFile[] = [];

      // Only generate controller if process has HTTP activities
      if (this.hasHttpActivities(process)) {
        const controllerFile = await this.generateController(process, config);
        files.push(controllerFile);
      } else {
        this.addWarning(
          'Process has no HTTP activities, skipping controller generation',
          process.name,
          'NO_HTTP_ACTIVITIES'
        );
      }

      return this.createResult(files);
    } catch (error) {
      this.handleError(error as Error, 'ControllerGenerator.generate');
      return this.createResult([]);
    }
  }

  /**
   * Get supported file types
   */
  getSupportedTypes(): string[] {
    return ['CONTROLLER'];
  }

  /**
   * Validate BWP process for controller generation
   */
  async validate(process: BWPProcess): Promise<ValidationResult> {
    this.clearDiagnostics();

    if (!process.name) {
      this.addError('Process name is required', 'process', 'MISSING_PROCESS_NAME');
    }

    if (!process.activities || process.activities.length === 0) {
      this.addError('Process must have activities', 'process', 'NO_ACTIVITIES');
    }

    return this.createValidationResult();
  }

  /**
   * Check if process has HTTP activities
   */
  private hasHttpActivities(process: BWPProcess): boolean {
    return process.activities.some(activity => 
      activity.type === BWPActivityType.HTTP_RECEIVER ||
      activity.type === BWPActivityType.HTTP_SENDER
    );
  }

  /**
   * Generate controller file
   */
  private async generateController(process: BWPProcess, config: GenerationConfig): Promise<GeneratedFile> {
    const className = this.sanitizeClassName(process.name) + 'Controller';
    const packageName = config.packageName + '.controller';

    // Extract HTTP endpoints from process
    const endpoints = this.extractHttpEndpoints(process);

    // Prepare template context
    const context: TemplateContext = {
      packageName,
      className,
      imports: this.generateControllerImports(endpoints),
      processName: process.name,
      description: process.description,
      endpoints,
      hasValidation: config.options.useValidation,
      useLombok: config.options.useLombok,
    };

    // Render template
    const content = await this.templateEngine.render('controller', context);

    // Create file path
    const filePath = `${packageName.replace(/\./g, '/')}/${className}.java`;

    return this.createGeneratedFile(filePath, content, 'CONTROLLER');
  }

  /**
   * Extract HTTP endpoints from process activities
   */
  private extractHttpEndpoints(process: BWPProcess): any[] {
    const endpoints: any[] = [];

    const httpReceivers = process.activities.filter(activity => 
      activity.type === BWPActivityType.HTTP_RECEIVER
    );

    for (const receiver of httpReceivers) {
      const endpoint = this.parseHttpReceiver(receiver, process);
      if (endpoint) {
        endpoints.push(endpoint);
      }
    }

    return endpoints;
  }

  /**
   * Parse HTTP receiver activity to endpoint definition
   */
  private parseHttpReceiver(activity: any, process: BWPProcess): any | null {
    const config = activity.config || {};
    
    // Extract HTTP method and path
    const method = config.method || config.httpMethod || 'POST';
    const path = config.path || config.resourcePath || `/${this.sanitizeMethodName(process.name)}`;

    // Extract request/response information
    const requestType = this.determineRequestType(activity);
    const responseType = this.determineResponseType(activity, process);

    // Generate method name
    const methodName = this.sanitizeMethodName(activity.name || process.name);

    return {
      method: method.toUpperCase(),
      path,
      methodName,
      requestType,
      responseType,
      description: activity.config.description || `Handle ${method} request for ${path}`,
      hasRequestBody: method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT',
      hasPathVariables: path.includes('{'),
      hasQueryParams: this.hasQueryParameters(activity),
    };
  }

  /**
   * Determine request type from activity
   */
  private determineRequestType(activity: any): string {
    // Check input mappings for type information
    if (activity.inputMappings && activity.inputMappings.length > 0) {
      // Try to extract type from first mapping
      const firstMapping = activity.inputMappings[0];
      if (firstMapping.target && firstMapping.target.includes('Request')) {
        return firstMapping.target.replace(/.*\./, '') + 'DTO';
      }
    }

    // Default to generic request type
    return 'RequestDTO';
  }

  /**
   * Determine response type from activity and process
   */
  private determineResponseType(activity: any, process: BWPProcess): string {
    // Check output mappings for type information
    if (activity.outputMappings && activity.outputMappings.length > 0) {
      const firstMapping = activity.outputMappings[0];
      if (firstMapping.source && firstMapping.source.includes('Response')) {
        return firstMapping.source.replace(/.*\./, '') + 'DTO';
      }
    }

    // Look for subsequent activities that might indicate response type
    const transitions = process.transitions.filter(t => t.from === activity.id);
    for (const transition of transitions) {
      const nextActivity = process.activities.find(a => a.id === transition.to);
      if (nextActivity && nextActivity.type === BWPActivityType.HTTP_SENDER) {
        return this.determineRequestType(nextActivity);
      }
    }

    // Default to generic response type
    return 'ResponseDTO';
  }

  /**
   * Check if activity has query parameters
   */
  private hasQueryParameters(activity: any): boolean {
    // Check if there are input mappings that look like query parameters
    return activity.inputMappings?.some((mapping: any) => 
      mapping.source?.includes('queryParam') || 
      mapping.source?.includes('$_queryParam')
    ) || false;
  }

  /**
   * Generate imports for controller
   */
  private generateControllerImports(endpoints: any[]): string[] {
    const imports = [
      'org.springframework.web.bind.annotation.*',
      'org.springframework.http.ResponseEntity',
      'org.springframework.beans.factory.annotation.Autowired',
    ];

    // Add validation imports if needed
    const hasValidation = endpoints.some(e => e.hasRequestBody);
    if (hasValidation) {
      imports.push('javax.validation.Valid');
      imports.push('javax.validation.constraints.*');
    }

    // Add Lombok imports if enabled
    // This would be determined by configuration
    imports.push('lombok.extern.slf4j.Slf4j');

    return imports;
  }
}
