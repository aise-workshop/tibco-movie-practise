# Build a Tibco BW → Spring Boot Migration CLI from Scratch with an AI Assistant (Practice)

## Learning Goals

Through a multi-prompt practice flow, you will build a complete CLI tool that migrates Tibco BW to Spring Boot from scratch.

## Phase 1: Project Initialization and Basic Parsers

### Prompt 1.1: Project Architecture Design

```markdown
I need to build a CLI tool from scratch that migrates Tibco BW to Spring Boot.

**Project Requirements**:
- Parse .bwp files (Tibco BusinessWorks process files in XML)
- Parse .xsd files and generate Java model classes
- Generate Spring Boot Controllers and Services
- Support converting external API calls

**First Step**: Design the project architecture and initialize

**Requirements**:
1. Create a TypeScript/Node.js project structure
2. Design core module architecture:
   - `src/parsers/` - parser modules
   - `src/generators/` - code generators
   - `src/types/` - type definitions
   - `src/cli/` - CLI entry
   - `src/utils/` - utilities

3. Initialize project configuration:
   - package.json dependencies
   - TypeScript configuration
   - Test framework configuration

4. Define core data structures:
   - BWP process representation
   - XSD model representation
   - Generation options

Please provide complete project initialization code and the architecture design.
```

### Prompt 1.2: XSD Parser Implementation

```markdown
I am building the Tibco BW migration tool, and now I need to implement the XSD parser.

**Current Task**: Parse XSD files to generate Java model classes

**Sample XSD File**: `test/_fixtures/MovieCatalogSearch.module/Schemas/MovieCatalogMaster.xsd`

**Requirements**:
1. **Create an XSD parser** (`src/parsers/xsd-parser.ts`):
   - Parse XSD file structure
   - Extract complex type definitions
   - Handle elements and attributes
   - Support nested types

2. **Create a Java model generator** (`src/generators/xsd-java-model-generator.ts`):
   - Convert XSD types to Java classes
   - Generate fields and getter/setter methods
   - Add Jackson annotations
   - Support JSR-303 validation annotations

3. **Implement type mapping**:
   - XSD primitive types → Java types
   - Complex types → Java classes
   - Array types → List<T>

4. **Write unit tests**:
   - Test XSD parsing
   - Validate Java code generation
   - Compare generated output against expected results

**Verification**:
- Can parse the sample XSD
- Generates compilable Java classes
- Includes correct annotations and type mappings

Please implement the full XSD parsing and Java model generation features.
```

## Phase 2: BWP Parsing and Business Logic Transformation

### Prompt 2.1: BWP Parser Implementation

```markdown
I am building the Tibco BW migration tool. The XSD parser is done; now I need to implement BWP parsing.

**Current Task**: Parse BWP files and extract business process logic

**Sample BWP File**: `test/_fixtures/MovieCatalogSearch.module/Processes/moviecatalogsearch/module/SearchMovies.bwp`

**BWP File Structure Overview**:
- XML-based business process definitions
- Includes REST endpoint definitions
- Contains Activities and process logic
- Includes external service call configurations

**Requirements**:
1. **Create a BWP parser** (`src/parsers/bwp-parser.ts`):
   - Parse the XML structure
   - Extract REST endpoint info (path, method, parameters)
   - Parse Activities and control flow
   - Extract external service call configurations

2. **Define data structures** (`src/types/index.ts`):
   ```typescript
   interface BWPProcess {
     name: string;
     namespace: string;
     restEndpoints: RestEndpoint[];
     activities: Activity[];
     variables: Variable[];
     partnerLinks: PartnerLink[];
   }

   interface RestEndpoint {
     path: string;
     method: string;
     parameters: Parameter[];
     responseType: string;
   }
   ```

3. **Handle special elements**:
   - `<referenceBinding>` - external service configuration
   - `<operation>` - REST operation definitions
   - `<parameterMapping>` - parameter mapping

4. **Write parsing tests**:
   - Validate REST endpoint extraction
   - Validate parameter mapping parsing
   - Validate external service configurations

**Verification**:
- Correctly parses the sample BWP file
- Extracts the `/movies` GET endpoint
- Detects the OMDB API external call configuration

Please implement complete BWP parsing.
```

### Prompt 2.2: Spring Boot Code Generator

```markdown
I am building the Tibco BW migration tool. BWP parsing is done; now I need to generate Spring Boot code.

**Current Task**: Convert the parsed BWP process into Spring Boot Controllers and Services

**Requirements**:
1. **Create a Controller generator** (`src/generators/bwp-java-generator.ts`):
   - Generate `@RestController` classes
   - Generate `@GetMapping`/`@PostMapping` methods based on BWP endpoints
   - Handle request parameter binding
   - Generate response handling logic

2. **Create a Service generator**:
   - Generate `@Service` classes
   - Implement business logic
   - Handle external API calls (RestTemplate)
   - Exception handling

3. **External API client generator** (`src/generators/external-api-client-generator.ts`):
   - Generate client code from `<referenceBinding>` elements in BWP
   - Handle URL configuration and parameter mapping
   - Generate HTTP call logic

4. **Configuration file generator** (`src/generators/properties-generator.ts`):
   - Parse `.substvar` files
   - Generate `application.properties`
   - Handle external service URLs and API keys

**Target example**:
```java
@RestController
public class SearchMoviesController {
    @GetMapping("/movies")
    public ResponseEntity<OMDBSearchElement> searchMovies(
        @RequestParam String searchString) {
        // Call the service layer
    }
}

@Service
public class SearchMoviesService {
    public OMDBSearchElement search(String searchString) {
        // Call external OMDB API
    }
}
```

**Verification**:
- Generates compilable Spring Boot code
- Correctly maps BWP endpoints to Spring annotations
- External API call configuration is correct

Please implement the full Spring Boot code generation features.
```

## Phase 3: CLI and Automation Workflow

### Prompt 3.1: CLI Interface Implementation

```markdown
I am building the Tibco BW migration tool. Parsers and generators are done; now I need a CLI interface.

**Current Task**: Build a user-friendly command-line interface

**Requirements**:
1. **Create the CLI entry** (`src/cli.ts`):
   - Use `commander.js` to build the CLI
   - Support multiple subcommands
   - Provide help and usage examples

2. **Implement core commands**:
   ```bash
   # Convert a single BWP file
   tibco-cli convert -i input.bwp -s schemas/ -o output/ -p com.example

   # Validate a BWP file
   tibco-cli validate -i input.bwp

   # Generate model classes
   tibco-cli generate-models -s schemas/ -o output/ -p com.example.model

   # Auto-convert an entire project
   tibco-cli auto project-dir/ -p com.example
   ```

3. **Command option design**:
   - `-i, --input` - input BWP file
   - `-s, --schemas` - XSD schema directory
   - `-o, --output` - output directory
   - `-p, --package` - Java package name
   - `--spring-boot-project` - Spring Boot project path
   - `--no-validation` - disable validation annotations
   - `--lombok` - use Lombok

4. **Error handling and UX**:
   - Friendly error messages
   - Progress indicators
   - Verbose logging
   - Success/failure feedback

**Verification**:
- CLI commands work
- Help text is clear
- Error handling is robust
- Supports common usage scenarios

Please implement the complete CLI interface.
```

### Prompt 3.2: Automation Workflow Implementation

```markdown
I am building the Tibco BW migration tool. Core features are done; now I need an automated workflow.

**Current Task**: Implement one-click auto-conversion

**Requirements**:
1. **Auto-detection**:
   - Automatically discover BWP files
   - Automatically detect the Schemas directory
   - Automatically discover the swagger.json file
   - Automatically detect configuration files

2. **Integrated conversion flow**:
   ```typescript
   async function autoConvert(projectDir: string, options: AutoConvertOptions) {
     // 1. Analyze project structure
     const projectStructure = await analyzeProject(projectDir);

     // 2. Parse all components
     const bwpData = await parseBWP(projectStructure.bwpFiles);
     const xsdModels = await parseXSD(projectStructure.schemasDir);
     const config = await parseConfig(projectStructure.configFiles);

     // 3. Generate code
     const javaCode = await generateJavaCode(bwpData, xsdModels, options);

     // 4. Deploy into Spring Boot project
     await deployToSpringBoot(javaCode, options.springBootProject);

     // 5. Validate the result
     await validateDeployment(options.springBootProject);
   }
   ```

3. **Spring Boot project integration** (`src/utils/spring-boot-deployer.ts`):
   - Automatically copy generated code to the correct locations
   - Update Spring Boot configuration
   - Validate project compilation
   - Optional application startup test

4. **Verification and tests**:
   - Code compilation validation
   - Basic functionality tests
   - API consistency checks
   - Generate a test report

**Example usage**:
```bash
# One-click conversion for an entire project
tibco-cli auto test/_fixtures/ -p com.example.movies

# Expected output includes:
# ✅ Found BWP file: SearchMovies.bwp
# ✅ Found Schemas directory: Schemas/
# ✅ Generated 30+ model classes
# ✅ Generated Controller and Service
# ✅ Deployed to Spring Boot project
# ✅ Compilation passed
```

**Verification**:
- Auto-detection works
- End-to-end conversion flow is complete
- Generated Spring Boot project is runnable
- Provides a detailed execution report

Please implement the full automation workflow.
```

## Phase 4: Testing, Validation, and Fixes

### Prompt 4.1: Test Framework and Validation

```markdown
I am building the Tibco BW migration tool. Core features are complete; now I need a comprehensive test framework.

**Current Task**: Build a test framework to validate correctness

**Requirements**:
1. **Unit tests** (`test/unit/`):
   ```typescript
   // bwp-parser.test.ts
   describe('BWP Parser', () => {
     it('should parse REST endpoints correctly', () => {
       // Test BWP file parsing
     });

     it('should extract external service configurations', () => {
       // Test external service configuration extraction
     });
   });

   // xsd-parser.test.ts
   describe('XSD Parser', () => {
     it('should generate correct Java models', () => {
       // Test XSD to Java conversion
     });
   });
   ```

2. **Integration tests** (`test/integration/`):
   - End-to-end conversion
   - Spring Boot deployment tests
   - API functionality verification

3. **Test data preparation**:
   - Create the `test/_fixtures/` directory
   - Prepare sample BWP, XSD, and config files
   - Create reference files for expected outputs

4. **Automated test workflow**:
   ```bash
   # Run all tests
   npm test

   # Run a specific test
   npm test -- test/unit/bwp-parser.test.ts

   # Generate coverage report
   npm run test:coverage
   ```

**Verification**:
- Test coverage > 80%
- All core features are covered by tests
- Integration tests verify the end-to-end flow
- Test data is complete and realistic

Please implement the full test framework.
```

### Prompt 4.2: Diagnostics and Fixes

```markdown
I am building the Tibco BW migration tool. During testing, I found issues that need fixing.

**Common Issue Scenarios**:

**Issue 1: External API call configuration is wrong**
- Symptom: External API URL in generated code is incorrect
- Cause: `.substvar` parsing or URL concatenation logic is wrong
- Fix direction: Check config parser and URL handling logic

**Issue 2: Data type mapping is wrong**
- Symptom: XSD type converted to an incorrect Java type
- Cause: Incomplete mapping table or mapping logic errors
- Fix direction: Improve type mapping rules

**Issue 3: Generated code fails to compile**
- Symptom: Spring Boot project compilation errors
- Cause: Import statements, annotation usage, or syntax errors
- Fix direction: Review code generation templates

**Requirements**:
1. **Implement a diagnostics tool**:
   ```typescript
   // src/utils/diagnostics.ts
   export class DiagnosticTool {
     async validateBWPFile(filePath: string): Promise<ValidationResult> {
       // Validate BWP file structure
     }

     async validateGeneratedCode(outputDir: string): Promise<ValidationResult> {
       // Validate generated Java code
     }

     async checkExternalApiConfig(config: ProjectConfig): Promise<ValidationResult> {
       // Check external API configuration
     }
   }
   ```

2. **Error handling and recovery**:
   - Detailed error messages and suggestions
   - Auto-fix common issues
   - Provide manual fix guidance

3. **Debugging and logging**:
   - Detailed execution logs
   - Intermediate output
   - Performance monitoring

**Fix verification process**:
```bash
# Diagnose issues
tibco-cli diagnose -i test/_fixtures/SearchMovies.bwp

# Re-run after fixes
tibco-cli auto test/_fixtures/ -p com.example.movies

# Verify result
cd spring-boilerplate && mvn compile
curl "http://localhost:8080/movies?searchString=batman"
```

**Verification**:
- Issues are diagnosed accurately
- Clear fix suggestions are provided
- Functionality works after fixes
- Avoid regressions

Please implement diagnostics and fixing features.
```

## Phase 5: Advanced Features and Optimization

### Prompt 5.1: API Test Generation and Validation

```markdown
I am building the Tibco BW migration tool and need to add API test generation.

**Current Task**: Generate API test code based on a Swagger spec

**Requirements**:
1. **Swagger parser** (`src/features/openapi/swagger-parser.ts`):
   - Parse the swagger.json file
   - Extract API endpoint information
   - Generate test case data

2. **API test generator** (`src/features/openapi/api-test-generator.ts`):
   - Generate JUnit 5 integration tests
   - Generate Spring Boot Test configuration
   - Support positive and negative test cases

3. **Test code templates**:
   ```java
   @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
   class SearchMoviesControllerIntegrationTest {

       @Test
       void shouldReturnMoviesWhenValidSearchString() {
           // Test the normal search scenario
       }

       @Test
       void shouldReturnErrorWhenInvalidSearchString() {
           // Test the error scenario
       }
   }
   ```

4. **API consistency validation**:
   - Compare generated APIs with the original Swagger spec
   - Validate parameter types and response formats
   - Check error handling

**Verification**:
- Generated test code compiles and runs
- Tests cover major API scenarios
- Consistent with the original Swagger spec

Please implement API test generation.
```

### Prompt 5.2: Performance Optimization and Production Readiness

```markdown
I am building the Tibco BW migration tool and need to optimize performance and prepare for production.

**Current Task**: Optimize tool performance and improve the quality of generated code

**Requirements**:
1. **Performance optimization**:
   - Process multiple files in parallel
   - Cache parsing results
   - Optimize memory usage
   - Support incremental updates

2. **Code quality improvements**:
   ```typescript
   // Code generation options
   interface CodeGenerationOptions {
     useJSR303Validation: boolean;
     useLombok: boolean;
     useJacksonAnnotations: boolean;
     includeConstructors: boolean;
     includeToString: boolean;
     generateDocumentation: boolean;
   }
   ```

3. **Production configuration**:
   - Environment variable support
   - Separate configuration files
   - Log level configuration
   - Monitoring integration

4. **Deployment tooling** (`src/utils/deployment-helper.ts`):
   - Generate Docker configuration
   - Kubernetes deployment files
   - CI/CD pipeline configuration

**Advanced features**:
```bash
# Batch convert multiple projects
tibco-cli batch-convert projects/ -o output/ -p com.company

# Generate deployment configuration
tibco-cli generate-deployment -t docker -o deployment/

# Performance analysis
tibco-cli analyze-performance -i large-project/
```

**Verification**:
- Performs well on large projects
- Generated code meets production standards
- Deployment configuration is complete and usable

Please implement performance optimization and production readiness features.
```

## Suggested Learning Path

### 🎯 For Different Skill Levels

**Beginner** (familiar with TypeScript/Node.js):
1. Start from Phase 1, focusing on architecture design
2. Implement each parser and generator step by step
3. Focus on code structure and tests

**Intermediate** (with enterprise development experience):
1. You may skip basic architecture and start from Phase 2
2. Focus on the complexity of business logic transformation
3. Deepen understanding of differences between Tibco BW and Spring Boot

**Advanced** (experienced in migration tool development):
1. Start from Phase 3, focusing on automation
2. Dive into performance optimization and error handling
3. Extend support for more Tibco BW features

### 📚 Learning Outcome Checklist

After finishing each phase, you should be able to:
- **Phase 1**: Parse XSD and generate Java models
- **Phase 2**: Parse BWP and generate Spring Boot code
- **Phase 3**: Build a complete CLI tool
- **Phase 4**: Implement testing and fix issues
- **Phase 5**: Optimize the tool and get it production-ready

### 🔧 Practical Tips

1. **Incremental development**: Ensure each phase produces runnable code
2. **Test-driven**: Write tests before implementing features
3. **Realistic data**: Use the provided sample project for testing
4. **Documentation**: Record issues and solutions
5. **Code reviews**: Regularly review code quality and architecture

This multi-prompt design helps you build a complete enterprise-grade migration tool from scratch while learning the core techniques and best practices for legacy system migration.


