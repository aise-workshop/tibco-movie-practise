/**
 * XML parsing utilities
 */

import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import * as xml2js from 'xml2js';

/**
 * XML parsing options
 */
export interface XMLParseOptions {
  /** Whether to ignore attributes */
  ignoreAttributes?: boolean;
  /** Whether to parse attribute values */
  parseAttributeValue?: boolean;
  /** Whether to parse tag values */
  parseTagValue?: boolean;
  /** Whether to trim whitespace */
  trimValues?: boolean;
  /** Whether to ignore namespaces */
  ignoreNameSpace?: boolean;
  /** Attribute name prefix */
  attributeNamePrefix?: string;
  /** Text node name */
  textNodeName?: string;
  /** Whether to always create arrays for tags */
  isArray?: (name: string, jpath: string, isLeafNode: boolean, isAttribute: boolean) => boolean;
}

/**
 * Default XML parsing options
 */
export const DEFAULT_XML_OPTIONS: XMLParseOptions = {
  ignoreAttributes: false,
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
  ignoreNameSpace: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name, jpath, isLeafNode, isAttribute) => {
    // Always treat these as arrays
    const arrayTags = ['activity', 'transition', 'variable', 'mapping', 'element', 'type'];
    return arrayTags.includes(name.toLowerCase());
  },
};

/**
 * XML utility class for parsing and building XML
 */
export class XMLUtils {
  private parser: XMLParser;
  private builder: XMLBuilder;

  constructor(options: XMLParseOptions = DEFAULT_XML_OPTIONS) {
    this.parser = new XMLParser({
      ignoreAttributes: options.ignoreAttributes,
      parseAttributeValue: options.parseAttributeValue,
      parseTagValue: options.parseTagValue,
      trimValues: options.trimValues,
      ignoreNameSpace: options.ignoreNameSpace,
      attributeNamePrefix: options.attributeNamePrefix,
      textNodeName: options.textNodeName,
      isArray: options.isArray,
    });

    this.builder = new XMLBuilder({
      ignoreAttributes: options.ignoreAttributes,
      attributeNamePrefix: options.attributeNamePrefix,
      textNodeName: options.textNodeName,
    });
  }

  /**
   * Parse XML string to JavaScript object
   */
  parseXML(xmlString: string): any {
    try {
      return this.parser.parse(xmlString);
    } catch (error) {
      throw new Error(`Failed to parse XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build XML string from JavaScript object
   */
  buildXML(obj: any): string {
    try {
      return this.builder.build(obj);
    } catch (error) {
      throw new Error(`Failed to build XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse XML using xml2js (alternative parser)
   */
  async parseXMLWithXml2js(xmlString: string): Promise<any> {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xmlString, {
        explicitArray: false,
        mergeAttrs: true,
        explicitRoot: false,
      }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse XML with xml2js: ${err.message}`));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Extract namespace information from XML
   */
  extractNamespaces(xmlString: string): Record<string, string> {
    const namespaces: Record<string, string> = {};
    const nsRegex = /xmlns:?([^=]*?)=["']([^"']*?)["']/g;
    let match;

    while ((match = nsRegex.exec(xmlString)) !== null) {
      const prefix = match[1] || 'default';
      const uri = match[2];
      namespaces[prefix] = uri;
    }

    return namespaces;
  }

  /**
   * Get element value by XPath-like expression
   */
  getElementValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Set element value by XPath-like expression
   */
  setElementValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Normalize XML element names (remove namespaces, convert to camelCase)
   */
  normalizeElementName(name: string): string {
    // Remove namespace prefix
    const withoutNamespace = name.includes(':') ? name.split(':')[1] : name;
    
    // Convert to camelCase
    return withoutNamespace.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  /**
   * Get all elements matching a tag name
   */
  getElementsByTagName(obj: any, tagName: string): any[] {
    const results: any[] = [];

    const search = (current: any): void => {
      if (typeof current === 'object' && current !== null) {
        if (Array.isArray(current)) {
          current.forEach(search);
        } else {
          Object.keys(current).forEach(key => {
            if (key === tagName || this.normalizeElementName(key) === tagName) {
              const value = current[key];
              if (Array.isArray(value)) {
                results.push(...value);
              } else {
                results.push(value);
              }
            } else {
              search(current[key]);
            }
          });
        }
      }
    };

    search(obj);
    return results;
  }

  /**
   * Validate XML against basic structure rules
   */
  validateXMLStructure(xmlString: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for basic XML structure
    if (!xmlString.trim().startsWith('<')) {
      errors.push('XML must start with an opening tag');
    }

    if (!xmlString.trim().endsWith('>')) {
      errors.push('XML must end with a closing tag');
    }

    // Check for balanced tags (basic check)
    const openTags = (xmlString.match(/<[^/][^>]*>/g) || []).length;
    const closeTags = (xmlString.match(/<\/[^>]*>/g) || []).length;
    const selfClosingTags = (xmlString.match(/<[^>]*\/>/g) || []).length;

    if (openTags !== closeTags + selfClosingTags) {
      errors.push('Unbalanced XML tags detected');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
