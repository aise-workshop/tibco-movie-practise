/**
 * TIBCO BusinessWorks Process (.bwp) file parser
 */

import { BaseParser, ParseResult, ValidationResult, ParserConfig } from './base-parser';
import { XMLUtils, DEFAULT_XML_OPTIONS } from './xml-utils';
import {
  BWPProcess,
  BWPActivity,
  BWPTransition,
  BWPVariable,
  BWPGroup,
  BWPStarter,
  BWPFaultHandler,
  BWPActivityType,
  BWPMapping,
} from '@/types';

/**
 * BWP parser configuration
 */
export interface BWPParserConfig extends ParserConfig {
  /** Whether to parse sub-processes */
  parseSubProcesses?: boolean;
  /** Whether to resolve external references */
  resolveExternalRefs?: boolean;
}

/**
 * BWP file parser
 */
export class BWPParser extends BaseParser<string, BWPProcess> {
  private xmlUtils: XMLUtils;
  private bwpConfig: BWPParserConfig;

  constructor(config: Partial<BWPParserConfig> = {}) {
    super(config);
    this.bwpConfig = {
      parseSubProcesses: true,
      resolveExternalRefs: false,
      ...config,
    };
    this.xmlUtils = new XMLUtils(DEFAULT_XML_OPTIONS);
  }

  /**
   * Parse BWP XML content to BWPProcess
   */
  async parse(xmlContent: string): Promise<ParseResult<BWPProcess>> {
    this.clearDiagnostics();
    this.debug('Starting BWP parsing');

    try {
      // Validate XML structure first
      const validation = await this.validate(xmlContent);
      if (!validation.valid) {
        return this.createResult(null);
      }

      // Parse XML to object
      const xmlObj = this.xmlUtils.parseXML(xmlContent);
      this.debug('XML parsed successfully');

      // Extract process definition
      const processDefinition = this.extractProcessDefinition(xmlObj);
      if (!processDefinition) {
        this.addError('No process definition found in BWP file', 'root', 'NO_PROCESS_DEF');
        return this.createResult(null);
      }

      // Parse process components
      const process = await this.parseProcessDefinition(processDefinition);
      
      this.debug(`BWP parsing completed. Found ${process.activities.length} activities`);
      return this.createResult(process);

    } catch (error) {
      this.handleError(error as Error, 'BWPParser.parse');
      return this.createResult(null);
    }
  }

  /**
   * Validate BWP XML content
   */
  async validate(xmlContent: string): Promise<ValidationResult> {
    this.clearDiagnostics();

    // Basic XML structure validation
    const xmlValidation = this.xmlUtils.validateXMLStructure(xmlContent);
    if (!xmlValidation.valid) {
      xmlValidation.errors.forEach(error => 
        this.addError(error, 'XML structure', 'XML_INVALID')
      );
    }

    // BWP-specific validation
    if (!xmlContent.includes('pd:ProcessDefinition')) {
      this.addError(
        'Not a valid BWP file - missing ProcessDefinition element',
        'root',
        'INVALID_BWP'
      );
    }

    // Check for required namespaces
    const namespaces = this.xmlUtils.extractNamespaces(xmlContent);
    if (!namespaces.pd && !namespaces.default) {
      this.addWarning(
        'Missing pd namespace declaration',
        'namespaces',
        'MISSING_NAMESPACE'
      );
    }

    return this.createValidationResult();
  }

  /**
   * Extract process definition from parsed XML
   */
  private extractProcessDefinition(xmlObj: any): any {
    // Try different possible root elements
    const possibleRoots = [
      'pd:ProcessDefinition',
      'ProcessDefinition',
      'process',
      'bw:process'
    ];

    for (const root of possibleRoots) {
      const def = this.xmlUtils.getElementValue(xmlObj, root);
      if (def) {
        return def;
      }
    }

    // If not found at root, search deeper
    const allProcessDefs = this.xmlUtils.getElementsByTagName(xmlObj, 'ProcessDefinition');
    return allProcessDefs.length > 0 ? allProcessDefs[0] : null;
  }

  /**
   * Parse process definition to BWPProcess
   */
  private async parseProcessDefinition(processDefinition: any): Promise<BWPProcess> {
    const process: BWPProcess = {
      name: this.extractProcessName(processDefinition),
      description: this.extractProcessDescription(processDefinition),
      activities: [],
      transitions: [],
      variables: [],
      groups: [],
      faultHandlers: [],
      globalVariables: [],
    };

    // Parse activities
    process.activities = this.parseActivities(processDefinition);
    
    // Parse transitions
    process.transitions = this.parseTransitions(processDefinition);
    
    // Parse variables
    process.variables = this.parseVariables(processDefinition);
    
    // Parse groups
    process.groups = this.parseGroups(processDefinition);
    
    // Parse starter
    process.starter = this.parseStarter(processDefinition);
    
    // Parse fault handlers
    process.faultHandlers = this.parseFaultHandlers(processDefinition);
    
    // Extract global variables
    process.globalVariables = this.extractGlobalVariables(processDefinition);

    return process;
  }

  /**
   * Extract process name
   */
  private extractProcessName(processDefinition: any): string {
    return processDefinition['@_name'] || 
           processDefinition.name || 
           'UnnamedProcess';
  }

  /**
   * Extract process description
   */
  private extractProcessDescription(processDefinition: any): string | undefined {
    return processDefinition['@_description'] || 
           processDefinition.description ||
           processDefinition.documentation;
  }

  /**
   * Parse activities from process definition
   */
  private parseActivities(processDefinition: any): BWPActivity[] {
    const activities: BWPActivity[] = [];
    const activityElements = this.xmlUtils.getElementsByTagName(processDefinition, 'activity');

    for (const activityElement of activityElements) {
      try {
        const activity = this.parseActivity(activityElement);
        if (activity) {
          activities.push(activity);
        }
      } catch (error) {
        this.addWarning(
          `Failed to parse activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'activity',
          'ACTIVITY_PARSE_ERROR'
        );
      }
    }

    return activities;
  }

  /**
   * Parse single activity
   */
  private parseActivity(activityElement: any): BWPActivity | null {
    const id = activityElement['@_name'] || activityElement.name;
    if (!id) {
      this.addWarning('Activity missing name/id', 'activity', 'MISSING_ACTIVITY_ID');
      return null;
    }

    const type = this.determineActivityType(activityElement);
    
    return {
      id,
      name: id,
      type,
      config: this.extractActivityConfig(activityElement),
      inputMappings: this.parseActivityMappings(activityElement, 'input'),
      outputMappings: this.parseActivityMappings(activityElement, 'output'),
      position: this.extractActivityPosition(activityElement),
    };
  }

  /**
   * Determine activity type from element
   */
  private determineActivityType(activityElement: any): BWPActivityType {
    const type = activityElement['@_type'] || activityElement.type;
    
    // Map TIBCO activity types to our enum
    const typeMapping: Record<string, BWPActivityType> = {
      'com.tibco.plugin.http.activities.HttpReceiveActivity': BWPActivityType.HTTP_RECEIVER,
      'com.tibco.plugin.http.activities.HttpSendActivity': BWPActivityType.HTTP_SENDER,
      'com.tibco.plugin.jdbc.activities.JDBCQueryActivity': BWPActivityType.JDBC_QUERY,
      'com.tibco.plugin.jdbc.activities.JDBCUpdateActivity': BWPActivityType.JDBC_UPDATE,
      'com.tibco.plugin.jms.activities.JMSQueueSendActivity': BWPActivityType.JMS_QUEUE_SENDER,
      'com.tibco.plugin.jms.activities.JMSQueueReceiveActivity': BWPActivityType.JMS_QUEUE_RECEIVER,
      'com.tibco.plugin.file.activities.FileReadActivity': BWPActivityType.READ_FILE,
      'com.tibco.plugin.file.activities.FileWriteActivity': BWPActivityType.WRITE_FILE,
      'com.tibco.pe.core.MapperActivity': BWPActivityType.MAPPER,
      'com.tibco.pe.core.JavaCodeActivity': BWPActivityType.JAVA_CODE,
      'com.tibco.pe.core.CallProcessActivity': BWPActivityType.CALL_PROCESS,
      'com.tibco.pe.core.NullActivity': BWPActivityType.NULL,
      'com.tibco.pe.core.SleepActivity': BWPActivityType.SLEEP,
      'com.tibco.pe.core.CatchActivity': BWPActivityType.CATCH,
      'com.tibco.pe.core.RethrowActivity': BWPActivityType.RETHROW,
    };

    return typeMapping[type] || BWPActivityType.NULL;
  }

  /**
   * Extract activity configuration
   */
  private extractActivityConfig(activityElement: any): Record<string, any> {
    const config: Record<string, any> = {};
    
    // Extract configuration from various possible locations
    const configElement = activityElement.config || 
                         activityElement.configuration ||
                         activityElement;

    // Copy all attributes and child elements as config
    Object.keys(configElement).forEach(key => {
      if (key.startsWith('@_')) {
        config[key.substring(2)] = configElement[key];
      } else if (typeof configElement[key] !== 'object' || 
                 key === 'inputBindings' || 
                 key === 'outputBindings') {
        config[key] = configElement[key];
      }
    });

    return config;
  }

  /**
   * Parse activity mappings (input/output)
   */
  private parseActivityMappings(activityElement: any, type: 'input' | 'output'): BWPMapping[] {
    const mappings: BWPMapping[] = [];
    const bindingsKey = type === 'input' ? 'inputBindings' : 'outputBindings';
    const bindings = activityElement[bindingsKey];

    if (bindings && bindings.mapping) {
      const mappingElements = Array.isArray(bindings.mapping) ? 
                             bindings.mapping : [bindings.mapping];

      for (const mapping of mappingElements) {
        mappings.push({
          source: mapping['@_source'] || mapping.source || '',
          target: mapping['@_target'] || mapping.target || '',
          type: 'DIRECT', // Default type, could be enhanced
          config: mapping,
        });
      }
    }

    return mappings;
  }

  /**
   * Extract activity position
   */
  private extractActivityPosition(activityElement: any): { x: number; y: number } {
    return {
      x: parseInt(activityElement['@_x'] || '0', 10),
      y: parseInt(activityElement['@_y'] || '0', 10),
    };
  }

  /**
   * Parse transitions from process definition
   */
  private parseTransitions(processDefinition: any): BWPTransition[] {
    const transitions: BWPTransition[] = [];
    const transitionElements = this.xmlUtils.getElementsByTagName(processDefinition, 'transition');

    for (const transitionElement of transitionElements) {
      const transition = this.parseTransition(transitionElement);
      if (transition) {
        transitions.push(transition);
      }
    }

    return transitions;
  }

  /**
   * Parse single transition
   */
  private parseTransition(transitionElement: any): BWPTransition | null {
    const from = transitionElement['@_from'] || transitionElement.from;
    const to = transitionElement['@_to'] || transitionElement.to;

    if (!from || !to) {
      this.addWarning('Transition missing from/to attributes', 'transition', 'INVALID_TRANSITION');
      return null;
    }

    return {
      id: `${from}->${to}`,
      from,
      to,
      condition: transitionElement['@_condition'] || transitionElement.condition,
      type: this.determineTransitionType(transitionElement),
    };
  }

  /**
   * Determine transition type
   */
  private determineTransitionType(transitionElement: any): 'SUCCESS' | 'ERROR' | 'ALWAYS' {
    const type = transitionElement['@_type'] || transitionElement.type;
    
    if (type === 'ERROR' || type === 'error') return 'ERROR';
    if (type === 'ALWAYS' || type === 'always') return 'ALWAYS';
    return 'SUCCESS';
  }

  /**
   * Parse variables (placeholder implementation)
   */
  private parseVariables(processDefinition: any): BWPVariable[] {
    // TODO: Implement variable parsing
    return [];
  }

  /**
   * Parse groups (placeholder implementation)
   */
  private parseGroups(processDefinition: any): BWPGroup[] {
    // TODO: Implement group parsing
    return [];
  }

  /**
   * Parse starter (placeholder implementation)
   */
  private parseStarter(processDefinition: any): BWPStarter | undefined {
    // TODO: Implement starter parsing
    return undefined;
  }

  /**
   * Parse fault handlers (placeholder implementation)
   */
  private parseFaultHandlers(processDefinition: any): BWPFaultHandler[] {
    // TODO: Implement fault handler parsing
    return [];
  }

  /**
   * Extract global variables (placeholder implementation)
   */
  private extractGlobalVariables(processDefinition: any): string[] {
    // TODO: Implement global variable extraction
    return [];
  }
}
