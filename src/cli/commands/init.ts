/**
 * Init command - initialize new project
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Project template configuration
 */
interface ProjectConfig {
  name: string;
  packageName: string;
  springBootVersion: string;
  javaVersion: string;
  buildTool: 'maven' | 'gradle';
  features: string[];
  outputDir: string;
}

/**
 * Init command class
 */
export class InitCommand {
  private command: Command;

  constructor() {
    this.command = new Command('init');
    this.setupCommand();
  }

  /**
   * Setup the init command
   */
  private setupCommand(): void {
    this.command
      .description('Initialize a new Spring Boot project for TIBCO conversion')
      .argument('[name]', 'project name')
      .option('-o, --output <dir>', 'output directory')
      .option('-p, --package <name>', 'Java package name')
      .option('--spring-version <version>', 'Spring Boot version')
      .option('--java-version <version>', 'Java version')
      .option('--build-tool <tool>', 'build tool (maven|gradle)')
      .option('--interactive', 'interactive mode', true)
      .action(async (name, options) => {
        await this.execute(name, options);
      });
  }

  /**
   * Execute the init command
   */
  private async execute(name?: string, options: any = {}): Promise<void> {
    try {
      let config: ProjectConfig;

      if (options.interactive) {
        config = await this.promptForConfig(name, options);
      } else {
        config = this.buildConfigFromOptions(name, options);
      }

      await this.createProject(config);
      
      console.log(chalk.green('\n✅ Project initialized successfully!'));
      console.log(chalk.blue('\nNext steps:'));
      console.log(`  1. cd ${config.outputDir}`);
      console.log('  2. Place your TIBCO BW files in the input/ directory');
      console.log('  3. Run: tibco-converter convert input/ -o src/main/java');

    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Prompt user for project configuration
   */
  private async promptForConfig(name?: string, options: any = {}): Promise<ProjectConfig> {
    console.log(chalk.blue('🚀 Let\'s set up your TIBCO to Spring Boot conversion project!\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Project name:',
        default: name || 'tibco-converted-app',
        validate: (input: string) => input.trim().length > 0 || 'Project name is required',
      },
      {
        type: 'input',
        name: 'packageName',
        message: 'Java package name:',
        default: options.package || 'com.example.converted',
        validate: (input: string) => {
          const packageRegex = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/;
          return packageRegex.test(input) || 'Invalid package name format';
        },
      },
      {
        type: 'list',
        name: 'springBootVersion',
        message: 'Spring Boot version:',
        choices: ['3.2.0', '3.1.5', '3.0.12', '2.7.17'],
        default: options.springVersion || '3.1.5',
      },
      {
        type: 'list',
        name: 'javaVersion',
        message: 'Java version:',
        choices: ['17', '11', '8'],
        default: options.javaVersion || '17',
      },
      {
        type: 'list',
        name: 'buildTool',
        message: 'Build tool:',
        choices: ['maven', 'gradle'],
        default: options.buildTool || 'maven',
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features to include:',
        choices: [
          { name: 'Spring Web (REST APIs)', value: 'web', checked: true },
          { name: 'Spring Data JPA (Database)', value: 'jpa', checked: true },
          { name: 'Spring Boot Actuator (Monitoring)', value: 'actuator', checked: true },
          { name: 'Spring Security', value: 'security', checked: false },
          { name: 'Spring Cloud Config', value: 'config', checked: false },
          { name: 'Spring Boot DevTools', value: 'devtools', checked: true },
          { name: 'Lombok', value: 'lombok', checked: true },
          { name: 'Validation', value: 'validation', checked: true },
          { name: 'OpenAPI/Swagger', value: 'openapi', checked: true },
        ],
      },
      {
        type: 'input',
        name: 'outputDir',
        message: 'Output directory:',
        default: options.output || (name || 'tibco-converted-app'),
        validate: (input: string) => input.trim().length > 0 || 'Output directory is required',
      },
    ]);

    return answers as ProjectConfig;
  }

  /**
   * Build configuration from command line options
   */
  private buildConfigFromOptions(name?: string, options: any = {}): ProjectConfig {
    return {
      name: name || 'tibco-converted-app',
      packageName: options.package || 'com.example.converted',
      springBootVersion: options.springVersion || '3.1.5',
      javaVersion: options.javaVersion || '17',
      buildTool: options.buildTool || 'maven',
      features: ['web', 'jpa', 'actuator', 'devtools', 'lombok', 'validation', 'openapi'],
      outputDir: options.output || (name || 'tibco-converted-app'),
    };
  }

  /**
   * Create the project structure
   */
  private async createProject(config: ProjectConfig): Promise<void> {
    console.log(chalk.blue(`\n📁 Creating project structure in ${config.outputDir}...`));

    // Create directory structure
    await this.createDirectoryStructure(config);

    // Create build files
    if (config.buildTool === 'maven') {
      await this.createMavenFiles(config);
    } else {
      await this.createGradleFiles(config);
    }

    // Create application files
    await this.createApplicationFiles(config);

    // Create configuration files
    await this.createConfigurationFiles(config);

    // Create README
    await this.createReadme(config);
  }

  /**
   * Create directory structure
   */
  private async createDirectoryStructure(config: ProjectConfig): Promise<void> {
    const baseDir = config.outputDir;
    const packagePath = config.packageName.replace(/\./g, '/');

    const directories = [
      'src/main/java/' + packagePath,
      'src/main/java/' + packagePath + '/controller',
      'src/main/java/' + packagePath + '/service',
      'src/main/java/' + packagePath + '/repository',
      'src/main/java/' + packagePath + '/dto',
      'src/main/java/' + packagePath + '/config',
      'src/main/resources',
      'src/test/java/' + packagePath,
      'input',
      'docs',
    ];

    for (const dir of directories) {
      await fs.ensureDir(path.join(baseDir, dir));
    }
  }

  /**
   * Create Maven files
   */
  private async createMavenFiles(config: ProjectConfig): Promise<void> {
    const pomXml = this.generatePomXml(config);
    await fs.writeFile(path.join(config.outputDir, 'pom.xml'), pomXml);
  }

  /**
   * Create Gradle files
   */
  private async createGradleFiles(config: ProjectConfig): Promise<void> {
    const buildGradle = this.generateBuildGradle(config);
    await fs.writeFile(path.join(config.outputDir, 'build.gradle'), buildGradle);
    
    const gradleWrapper = `distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip`;
    await fs.ensureDir(path.join(config.outputDir, 'gradle/wrapper'));
    await fs.writeFile(path.join(config.outputDir, 'gradle/wrapper/gradle-wrapper.properties'), gradleWrapper);
  }

  /**
   * Create application files
   */
  private async createApplicationFiles(config: ProjectConfig): Promise<void> {
    const packagePath = config.packageName.replace(/\./g, '/');
    const className = this.toPascalCase(config.name) + 'Application';
    
    const applicationJava = this.generateApplicationClass(config.packageName, className);
    await fs.writeFile(
      path.join(config.outputDir, 'src/main/java', packagePath, className + '.java'),
      applicationJava
    );
  }

  /**
   * Create configuration files
   */
  private async createConfigurationFiles(config: ProjectConfig): Promise<void> {
    const applicationYml = this.generateApplicationYml(config);
    await fs.writeFile(path.join(config.outputDir, 'src/main/resources/application.yml'), applicationYml);

    // Create conversion configuration
    const conversionConfig = this.generateConversionConfig(config);
    await fs.writeFile(path.join(config.outputDir, 'tibco-converter.json'), conversionConfig);
  }

  /**
   * Create README file
   */
  private async createReadme(config: ProjectConfig): Promise<void> {
    const readme = this.generateReadme(config);
    await fs.writeFile(path.join(config.outputDir, 'README.md'), readme);
  }

  /**
   * Generate pom.xml content
   */
  private generatePomXml(config: ProjectConfig): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>${config.springBootVersion}</version>
        <relativePath/>
    </parent>

    <groupId>${config.packageName}</groupId>
    <artifactId>${config.name}</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>${config.name}</name>
    <description>Converted TIBCO BW application</description>

    <properties>
        <java.version>${config.javaVersion}</java.version>
    </properties>

    <dependencies>
        ${this.generateMavenDependencies(config.features)}
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`;
  }

  /**
   * Generate Maven dependencies
   */
  private generateMavenDependencies(features: string[]): string {
    const dependencies: string[] = [];

    if (features.includes('web')) {
      dependencies.push(`        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>`);
    }

    if (features.includes('jpa')) {
      dependencies.push(`        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>`);
    }

    if (features.includes('actuator')) {
      dependencies.push(`        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>`);
    }

    if (features.includes('lombok')) {
      dependencies.push(`        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>`);
    }

    if (features.includes('validation')) {
      dependencies.push(`        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>`);
    }

    if (features.includes('openapi')) {
      dependencies.push(`        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.2.0</version>
        </dependency>`);
    }

    // Test dependencies
    dependencies.push(`        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>`);

    return dependencies.join('\n');
  }

  /**
   * Generate application class
   */
  private generateApplicationClass(packageName: string, className: string): string {
    return `package ${packageName};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ${className} {

    public static void main(String[] args) {
        SpringApplication.run(${className}.class, args);
    }
}`;
  }

  /**
   * Generate application.yml
   */
  private generateApplicationYml(config: ProjectConfig): string {
    return `spring:
  application:
    name: ${config.name}
  
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password: password
  
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: create-drop
    show-sql: true

  h2:
    console:
      enabled: true

server:
  port: 8080

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics

logging:
  level:
    ${config.packageName}: DEBUG`;
  }

  /**
   * Generate conversion configuration
   */
  private generateConversionConfig(config: ProjectConfig): string {
    return JSON.stringify({
      packageName: config.packageName,
      springBootVersion: config.springBootVersion,
      outputDir: 'src/main/java',
      options: {
        generateControllers: true,
        generateServices: true,
        generateRepositories: true,
        generateDTOs: true,
        generateConfigurations: true,
        generateTests: true,
        useLombok: config.features.includes('lombok'),
        useValidation: config.features.includes('validation'),
      },
    }, null, 2);
  }

  /**
   * Generate README.md
   */
  private generateReadme(config: ProjectConfig): string {
    return `# ${config.name}

This project was generated from TIBCO BusinessWorks processes using the TIBCO to Spring Boot converter.

## Project Structure

\`\`\`
${config.name}/
├── src/main/java/${config.packageName.replace(/\./g, '/')}/
│   ├── controller/     # REST controllers
│   ├── service/        # Business logic services
│   ├── repository/     # Data access repositories
│   ├── dto/           # Data transfer objects
│   └── config/        # Configuration classes
├── src/main/resources/
│   └── application.yml # Application configuration
├── input/             # Place your TIBCO BW files here
└── docs/              # Documentation
\`\`\`

## Getting Started

1. Place your TIBCO BW files in the \`input/\` directory
2. Run the conversion:
   \`\`\`bash
   tibco-converter convert input/ -o src/main/java --package ${config.packageName}
   \`\`\`
3. Build and run the application:
   \`\`\`bash
   ${config.buildTool === 'maven' ? './mvnw spring-boot:run' : './gradlew bootRun'}
   \`\`\`

## Features

${config.features.map(f => `- ${f}`).join('\n')}

## Configuration

Edit \`tibco-converter.json\` to customize the conversion process.

## Documentation

- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)
- [TIBCO Converter Documentation](https://github.com/your-repo/tibco-converter)
`;
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Generate build.gradle (placeholder)
   */
  private generateBuildGradle(config: ProjectConfig): string {
    return `plugins {
    id 'java'
    id 'org.springframework.boot' version '${config.springBootVersion}'
    id 'io.spring.dependency-management' version '1.1.3'
}

group = '${config.packageName}'
version = '1.0.0-SNAPSHOT'
java.sourceCompatibility = JavaVersion.VERSION_${config.javaVersion}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    
    runtimeOnly 'com.h2database:h2'
    
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}`;
  }

  /**
   * Get the command instance
   */
  getCommand(): Command {
    return this.command;
  }
}
