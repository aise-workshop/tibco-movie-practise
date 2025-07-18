/**
 * Core type definitions for TIBCO BW to Spring Boot conversion
 */

// ============================================================================
// BWP Process Types
// ============================================================================

/**
 * Represents a TIBCO BusinessWorks process definition
 */
export interface BWPProcess {
  /** Process name */
  name: string;
  /** Process description */
  description?: string;
  /** Process activities */
  activities: BWPActivity[];
  /** Process transitions */
  transitions: BWPTransition[];
  /** Process variables */
  variables: BWPVariable[];
  /** Process groups/scopes */
  groups: BWPGroup[];
  /** Process starter configuration */
  starter?: BWPStarter;
  /** Process fault handlers */
  faultHandlers: BWPFaultHandler[];
  /** Global variables used in this process */
  globalVariables: string[];
}

/**
 * Represents a BWP activity
 */
export interface BWPActivity {
  /** Unique activity ID */
  id: string;
  /** Activity name */
  name: string;
  /** Activity type (e.g., 'JDBC Query', 'JMS Publisher', etc.) */
  type: BWPActivityType;
  /** Activity configuration */
  config: Record<string, any>;
  /** Input mappings */
  inputMappings: BWPMapping[];
  /** Output mappings */
  outputMappings: BWPMapping[];
  /** Activity position in designer */
  position: { x: number; y: number };
}

/**
 * BWP Activity types
 */
export enum BWPActivityType {
  // HTTP Activities
  HTTP_RECEIVER = 'HTTP_RECEIVER',
  HTTP_SENDER = 'HTTP_SENDER',
  
  // Database Activities
  JDBC_QUERY = 'JDBC_QUERY',
  JDBC_UPDATE = 'JDBC_UPDATE',
  JDBC_CALL = 'JDBC_CALL',
  
  // JMS Activities
  JMS_QUEUE_SENDER = 'JMS_QUEUE_SENDER',
  JMS_QUEUE_RECEIVER = 'JMS_QUEUE_RECEIVER',
  JMS_TOPIC_PUBLISHER = 'JMS_TOPIC_PUBLISHER',
  JMS_TOPIC_SUBSCRIBER = 'JMS_TOPIC_SUBSCRIBER',
  
  // File Activities
  READ_FILE = 'READ_FILE',
  WRITE_FILE = 'WRITE_FILE',
  
  // General Activities
  MAPPER = 'MAPPER',
  JAVA_CODE = 'JAVA_CODE',
  CALL_PROCESS = 'CALL_PROCESS',
  
  // Control Flow
  NULL = 'NULL',
  SLEEP = 'SLEEP',
  
  // Error Handling
  CATCH = 'CATCH',
  RETHROW = 'RETHROW'
}

/**
 * Represents a transition between activities
 */
export interface BWPTransition {
  /** Unique transition ID */
  id: string;
  /** Source activity ID */
  from: string;
  /** Target activity ID */
  to: string;
  /** Transition condition (XPath expression) */
  condition?: string;
  /** Transition type */
  type: 'SUCCESS' | 'ERROR' | 'ALWAYS';
}

/**
 * Represents a process variable
 */
export interface BWPVariable {
  /** Variable name */
  name: string;
  /** Variable type */
  type: string;
  /** Variable schema reference */
  schema?: string;
  /** Default value */
  defaultValue?: any;
  /** Variable scope */
  scope: 'PROCESS' | 'GROUP' | 'ACTIVITY';
}

/**
 * Represents a data mapping
 */
export interface BWPMapping {
  /** Source expression (XPath) */
  source: string;
  /** Target field path */
  target: string;
  /** Mapping type */
  type: 'DIRECT' | 'EXPRESSION' | 'FUNCTION';
  /** Additional mapping configuration */
  config?: Record<string, any>;
}

/**
 * Represents a process group/scope
 */
export interface BWPGroup {
  /** Group ID */
  id: string;
  /** Group name */
  name: string;
  /** Group type */
  type: 'SCOPE' | 'TRANSACTION' | 'CRITICAL_SECTION' | 'REPEAT';
  /** Activities in this group */
  activities: string[];
  /** Group configuration */
  config: Record<string, any>;
}

/**
 * Represents a process starter
 */
export interface BWPStarter {
  /** Starter type */
  type: 'HTTP' | 'JMS' | 'FILE' | 'TIMER';
  /** Starter configuration */
  config: Record<string, any>;
}

/**
 * Represents a fault handler
 */
export interface BWPFaultHandler {
  /** Fault type to catch */
  faultType?: string;
  /** Activities to execute on fault */
  activities: string[];
  /** Whether this is a catch-all handler */
  catchAll: boolean;
}

// ============================================================================
// XSD Schema Types
// ============================================================================

/**
 * Represents an XSD schema definition
 */
export interface XSDSchema {
  /** Schema target namespace */
  targetNamespace?: string;
  /** Schema elements */
  elements: XSDElement[];
  /** Schema types */
  types: XSDType[];
  /** Schema imports */
  imports: XSDImport[];
}

/**
 * Represents an XSD element
 */
export interface XSDElement {
  /** Element name */
  name: string;
  /** Element type */
  type: string;
  /** Whether element is required */
  required: boolean;
  /** Minimum occurrences */
  minOccurs: number;
  /** Maximum occurrences */
  maxOccurs: number | 'unbounded';
  /** Element documentation */
  documentation?: string;
}

/**
 * Represents an XSD type definition
 */
export interface XSDType {
  /** Type name */
  name: string;
  /** Type kind */
  kind: 'SIMPLE' | 'COMPLEX';
  /** Base type */
  baseType?: string;
  /** Type properties (for complex types) */
  properties: XSDElement[];
  /** Type restrictions (for simple types) */
  restrictions?: XSDRestriction[];
}

/**
 * Represents an XSD restriction
 */
export interface XSDRestriction {
  /** Restriction type */
  type: 'PATTERN' | 'LENGTH' | 'MIN_LENGTH' | 'MAX_LENGTH' | 'ENUMERATION';
  /** Restriction value */
  value: string | number;
}

/**
 * Represents an XSD import
 */
export interface XSDImport {
  /** Import namespace */
  namespace: string;
  /** Import schema location */
  schemaLocation: string;
}

// ============================================================================
// Generation Configuration Types
// ============================================================================

/**
 * Configuration for code generation
 */
export interface GenerationConfig {
  /** Target output directory */
  outputDir: string;
  /** Java package name */
  packageName: string;
  /** Spring Boot version */
  springBootVersion: string;
  /** Generation options */
  options: GenerationOptions;
  /** Template configuration */
  templates: TemplateConfig;
}

/**
 * Generation options
 */
export interface GenerationOptions {
  /** Generate REST controllers */
  generateControllers: boolean;
  /** Generate service classes */
  generateServices: boolean;
  /** Generate repository interfaces */
  generateRepositories: boolean;
  /** Generate DTO classes */
  generateDTOs: boolean;
  /** Generate configuration classes */
  generateConfigurations: boolean;
  /** Generate unit tests */
  generateTests: boolean;
  /** Use Lombok annotations */
  useLombok: boolean;
  /** Use validation annotations */
  useValidation: boolean;
}

/**
 * Template configuration
 */
export interface TemplateConfig {
  /** Controller template path */
  controllerTemplate: string;
  /** Service template path */
  serviceTemplate: string;
  /** Repository template path */
  repositoryTemplate: string;
  /** DTO template path */
  dtoTemplate: string;
  /** Configuration template path */
  configTemplate: string;
  /** Test template path */
  testTemplate: string;
}

// ============================================================================
// AST Types (for advanced parsing)
// ============================================================================

/**
 * Abstract Syntax Tree node for BWP processes
 */
export interface ASTNode {
  /** Node type */
  type: string;
  /** Node ID */
  id: string;
  /** Child nodes */
  children: ASTNode[];
  /** Node metadata */
  metadata: Record<string, any>;
}

/**
 * Process AST node
 */
export interface ProcessASTNode extends ASTNode {
  type: 'PROCESS';
  process: BWPProcess;
}

/**
 * Activity AST node
 */
export interface ActivityASTNode extends ASTNode {
  type: 'ACTIVITY';
  activity: BWPActivity;
}

// ============================================================================
// Conversion Result Types
// ============================================================================

/**
 * Result of BWP to Spring Boot conversion
 */
export interface ConversionResult {
  /** Whether conversion was successful */
  success: boolean;
  /** Generated files */
  generatedFiles: GeneratedFile[];
  /** Conversion warnings */
  warnings: ConversionWarning[];
  /** Conversion errors */
  errors: ConversionError[];
  /** Conversion statistics */
  statistics: ConversionStatistics;
}

/**
 * Represents a generated file
 */
export interface GeneratedFile {
  /** File path */
  path: string;
  /** File content */
  content: string;
  /** File type */
  type: 'CONTROLLER' | 'SERVICE' | 'REPOSITORY' | 'DTO' | 'CONFIG' | 'TEST';
}

/**
 * Conversion warning
 */
export interface ConversionWarning {
  /** Warning message */
  message: string;
  /** Source location */
  source: string;
  /** Warning code */
  code: string;
}

/**
 * Conversion error
 */
export interface ConversionError {
  /** Error message */
  message: string;
  /** Source location */
  source: string;
  /** Error code */
  code: string;
  /** Stack trace */
  stack?: string;
}

/**
 * Conversion statistics
 */
export interface ConversionStatistics {
  /** Number of processes converted */
  processesConverted: number;
  /** Number of activities converted */
  activitiesConverted: number;
  /** Number of files generated */
  filesGenerated: number;
  /** Conversion duration in milliseconds */
  duration: number;
}
