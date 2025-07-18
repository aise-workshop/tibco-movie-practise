/**
 * XML Schema Definition (.xsd) file parser
 */

import { BaseParser, ParseResult, ValidationResult, ParserConfig } from './base-parser';
import { XMLUtils, DEFAULT_XML_OPTIONS } from './xml-utils';
import {
  XSDSchema,
  XSDElement,
  XSDType,
  XSDRestriction,
  XSDImport,
} from '@/types';

/**
 * XSD parser configuration
 */
export interface XSDParserConfig extends ParserConfig {
  /** Whether to resolve external schema imports */
  resolveImports?: boolean;
  /** Whether to flatten nested types */
  flattenTypes?: boolean;
}

/**
 * XSD file parser
 */
export class XSDParser extends BaseParser<string, XSDSchema> {
  private xmlUtils: XMLUtils;
  private xsdConfig: XSDParserConfig;

  constructor(config: Partial<XSDParserConfig> = {}) {
    super(config);
    this.xsdConfig = {
      resolveImports: false,
      flattenTypes: false,
      ...config,
    };
    this.xmlUtils = new XMLUtils(DEFAULT_XML_OPTIONS);
  }

  /**
   * Parse XSD XML content to XSDSchema
   */
  async parse(xmlContent: string): Promise<ParseResult<XSDSchema>> {
    this.clearDiagnostics();
    this.debug('Starting XSD parsing');

    try {
      // Validate XML structure first
      const validation = await this.validate(xmlContent);
      if (!validation.valid) {
        return this.createResult(null);
      }

      // Parse XML to object
      const xmlObj = this.xmlUtils.parseXML(xmlContent);
      this.debug('XSD XML parsed successfully');

      // Extract schema definition
      const schemaDefinition = this.extractSchemaDefinition(xmlObj);
      if (!schemaDefinition) {
        this.addError('No schema definition found in XSD file', 'root', 'NO_SCHEMA_DEF');
        return this.createResult(null);
      }

      // Parse schema components
      const schema = await this.parseSchemaDefinition(schemaDefinition);
      
      this.debug(`XSD parsing completed. Found ${schema.elements.length} elements and ${schema.types.length} types`);
      return this.createResult(schema);

    } catch (error) {
      this.handleError(error as Error, 'XSDParser.parse');
      return this.createResult(null);
    }
  }

  /**
   * Validate XSD XML content
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

    // XSD-specific validation
    if (!xmlContent.includes('xs:schema') && !xmlContent.includes('schema')) {
      this.addError(
        'Not a valid XSD file - missing schema element',
        'root',
        'INVALID_XSD'
      );
    }

    // Check for XML Schema namespace
    const namespaces = this.xmlUtils.extractNamespaces(xmlContent);
    const hasXSNamespace = Object.values(namespaces).some(uri => 
      uri === 'http://www.w3.org/2001/XMLSchema'
    );

    if (!hasXSNamespace) {
      this.addWarning(
        'Missing XML Schema namespace declaration',
        'namespaces',
        'MISSING_XS_NAMESPACE'
      );
    }

    return this.createValidationResult();
  }

  /**
   * Extract schema definition from parsed XML
   */
  private extractSchemaDefinition(xmlObj: any): any {
    // Try different possible root elements
    const possibleRoots = [
      'xs:schema',
      'xsd:schema',
      'schema'
    ];

    for (const root of possibleRoots) {
      const def = this.xmlUtils.getElementValue(xmlObj, root);
      if (def) {
        return def;
      }
    }

    // If not found at root, search deeper
    const allSchemaDefs = this.xmlUtils.getElementsByTagName(xmlObj, 'schema');
    return allSchemaDefs.length > 0 ? allSchemaDefs[0] : null;
  }

  /**
   * Parse schema definition to XSDSchema
   */
  private async parseSchemaDefinition(schemaDefinition: any): Promise<XSDSchema> {
    const schema: XSDSchema = {
      targetNamespace: this.extractTargetNamespace(schemaDefinition),
      elements: [],
      types: [],
      imports: [],
    };

    // Parse elements
    schema.elements = this.parseElements(schemaDefinition);
    
    // Parse types
    schema.types = this.parseTypes(schemaDefinition);
    
    // Parse imports
    schema.imports = this.parseImports(schemaDefinition);

    return schema;
  }

  /**
   * Extract target namespace
   */
  private extractTargetNamespace(schemaDefinition: any): string | undefined {
    return schemaDefinition['@_targetNamespace'] || 
           schemaDefinition.targetNamespace;
  }

  /**
   * Parse elements from schema definition
   */
  private parseElements(schemaDefinition: any): XSDElement[] {
    const elements: XSDElement[] = [];
    const elementElements = this.xmlUtils.getElementsByTagName(schemaDefinition, 'element');

    for (const elementElement of elementElements) {
      try {
        const element = this.parseElement(elementElement);
        if (element) {
          elements.push(element);
        }
      } catch (error) {
        this.addWarning(
          `Failed to parse element: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'element',
          'ELEMENT_PARSE_ERROR'
        );
      }
    }

    return elements;
  }

  /**
   * Parse single element
   */
  private parseElement(elementElement: any): XSDElement | null {
    const name = elementElement['@_name'] || elementElement.name;
    if (!name) {
      this.addWarning('Element missing name', 'element', 'MISSING_ELEMENT_NAME');
      return null;
    }

    const type = elementElement['@_type'] || elementElement.type || 'string';
    const minOccurs = parseInt(elementElement['@_minOccurs'] || '1', 10);
    const maxOccursStr = elementElement['@_maxOccurs'] || '1';
    const maxOccurs = maxOccursStr === 'unbounded' ? 'unbounded' : parseInt(maxOccursStr, 10);

    return {
      name,
      type,
      required: minOccurs > 0,
      minOccurs,
      maxOccurs,
      documentation: this.extractDocumentation(elementElement),
    };
  }

  /**
   * Extract documentation from element
   */
  private extractDocumentation(element: any): string | undefined {
    const annotation = element.annotation || element['xs:annotation'];
    if (annotation) {
      const documentation = annotation.documentation || annotation['xs:documentation'];
      if (documentation) {
        return typeof documentation === 'string' ? documentation : documentation['#text'];
      }
    }
    return undefined;
  }

  /**
   * Parse types from schema definition
   */
  private parseTypes(schemaDefinition: any): XSDType[] {
    const types: XSDType[] = [];

    // Parse complex types
    const complexTypes = this.xmlUtils.getElementsByTagName(schemaDefinition, 'complexType');
    for (const complexType of complexTypes) {
      const type = this.parseComplexType(complexType);
      if (type) {
        types.push(type);
      }
    }

    // Parse simple types
    const simpleTypes = this.xmlUtils.getElementsByTagName(schemaDefinition, 'simpleType');
    for (const simpleType of simpleTypes) {
      const type = this.parseSimpleType(simpleType);
      if (type) {
        types.push(type);
      }
    }

    return types;
  }

  /**
   * Parse complex type
   */
  private parseComplexType(complexTypeElement: any): XSDType | null {
    const name = complexTypeElement['@_name'] || complexTypeElement.name;
    if (!name) {
      this.addWarning('Complex type missing name', 'complexType', 'MISSING_TYPE_NAME');
      return null;
    }

    const properties: XSDElement[] = [];

    // Parse sequence elements
    const sequence = complexTypeElement.sequence || complexTypeElement['xs:sequence'];
    if (sequence) {
      const elements = this.xmlUtils.getElementsByTagName(sequence, 'element');
      for (const element of elements) {
        const prop = this.parseElement(element);
        if (prop) {
          properties.push(prop);
        }
      }
    }

    // Parse choice elements
    const choice = complexTypeElement.choice || complexTypeElement['xs:choice'];
    if (choice) {
      const elements = this.xmlUtils.getElementsByTagName(choice, 'element');
      for (const element of elements) {
        const prop = this.parseElement(element);
        if (prop) {
          properties.push(prop);
        }
      }
    }

    // Parse all elements
    const all = complexTypeElement.all || complexTypeElement['xs:all'];
    if (all) {
      const elements = this.xmlUtils.getElementsByTagName(all, 'element');
      for (const element of elements) {
        const prop = this.parseElement(element);
        if (prop) {
          properties.push(prop);
        }
      }
    }

    return {
      name,
      kind: 'COMPLEX',
      baseType: this.extractBaseType(complexTypeElement),
      properties,
      restrictions: [],
    };
  }

  /**
   * Parse simple type
   */
  private parseSimpleType(simpleTypeElement: any): XSDType | null {
    const name = simpleTypeElement['@_name'] || simpleTypeElement.name;
    if (!name) {
      this.addWarning('Simple type missing name', 'simpleType', 'MISSING_TYPE_NAME');
      return null;
    }

    const restrictions = this.parseRestrictions(simpleTypeElement);

    return {
      name,
      kind: 'SIMPLE',
      baseType: this.extractBaseType(simpleTypeElement),
      properties: [],
      restrictions,
    };
  }

  /**
   * Extract base type
   */
  private extractBaseType(typeElement: any): string | undefined {
    // Check for extension
    const extension = typeElement.extension || 
                     typeElement.complexContent?.extension ||
                     typeElement['xs:extension'] ||
                     typeElement['xs:complexContent']?.['xs:extension'];
    
    if (extension) {
      return extension['@_base'] || extension.base;
    }

    // Check for restriction
    const restriction = typeElement.restriction ||
                       typeElement.simpleContent?.restriction ||
                       typeElement['xs:restriction'] ||
                       typeElement['xs:simpleContent']?.['xs:restriction'];
    
    if (restriction) {
      return restriction['@_base'] || restriction.base;
    }

    return undefined;
  }

  /**
   * Parse restrictions from simple type
   */
  private parseRestrictions(simpleTypeElement: any): XSDRestriction[] {
    const restrictions: XSDRestriction[] = [];
    
    const restriction = simpleTypeElement.restriction || simpleTypeElement['xs:restriction'];
    if (!restriction) {
      return restrictions;
    }

    // Parse different restriction types
    const restrictionTypes = [
      'pattern', 'length', 'minLength', 'maxLength', 'enumeration',
      'minInclusive', 'maxInclusive', 'minExclusive', 'maxExclusive'
    ];

    for (const restrictionType of restrictionTypes) {
      const elements = this.xmlUtils.getElementsByTagName(restriction, restrictionType);
      for (const element of elements) {
        const value = element['@_value'] || element.value;
        if (value !== undefined) {
          restrictions.push({
            type: this.mapRestrictionType(restrictionType),
            value,
          });
        }
      }
    }

    return restrictions;
  }

  /**
   * Map XSD restriction type to our enum
   */
  private mapRestrictionType(xsdType: string): XSDRestriction['type'] {
    const mapping: Record<string, XSDRestriction['type']> = {
      'pattern': 'PATTERN',
      'length': 'LENGTH',
      'minLength': 'MIN_LENGTH',
      'maxLength': 'MAX_LENGTH',
      'enumeration': 'ENUMERATION',
    };

    return mapping[xsdType] || 'PATTERN';
  }

  /**
   * Parse imports from schema definition
   */
  private parseImports(schemaDefinition: any): XSDImport[] {
    const imports: XSDImport[] = [];
    const importElements = this.xmlUtils.getElementsByTagName(schemaDefinition, 'import');

    for (const importElement of importElements) {
      const namespace = importElement['@_namespace'] || importElement.namespace;
      const schemaLocation = importElement['@_schemaLocation'] || importElement.schemaLocation;

      if (namespace && schemaLocation) {
        imports.push({
          namespace,
          schemaLocation,
        });
      }
    }

    return imports;
  }
}
