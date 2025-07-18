/**
 * Convert command - main conversion functionality
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs-extra';
import * as path from 'path';
import { BWPParser, XSDParser } from '@/parsers';
import { ControllerGenerator } from '@/generators';
import { GenerationConfig, ConversionResult } from '@/types';

/**
 * Convert command class
 */
export class ConvertCommand {
  private command: Command;

  constructor() {
    this.command = new Command('convert');
    this.setupCommand();
  }

  /**
   * Setup the convert command
   */
  private setupCommand(): void {
    this.command
      .description('Convert TIBCO BW processes to Spring Boot applications')
      .argument('<input>', 'input BWP file or directory')
      .option('-o, --output <dir>', 'output directory', './output')
      .option('-p, --package <name>', 'Java package name', 'com.example.converted')
      .option('--spring-version <version>', 'Spring Boot version', '3.1.0')
      .option('--controllers', 'generate REST controllers', true)
      .option('--services', 'generate service classes', true)
      .option('--repositories', 'generate repository interfaces', true)
      .option('--dtos', 'generate DTO classes', true)
      .option('--tests', 'generate unit tests', false)
      .option('--lombok', 'use Lombok annotations', true)
      .option('--validation', 'use validation annotations', true)
      .option('--overwrite', 'overwrite existing files', false)
      .option('--dry-run', 'show what would be generated without creating files', false)
      .action(async (input, options) => {
        await this.execute(input, options);
      });
  }

  /**
   * Execute the convert command
   */
  private async execute(input: string, options: any): Promise<void> {
    const spinner = ora('Starting conversion...').start();

    try {
      // Validate input
      if (!await fs.pathExists(input)) {
        throw new Error(`Input path does not exist: ${input}`);
      }

      // Create output directory
      if (!options.dryRun) {
        await fs.ensureDir(options.output);
      }

      // Build generation config
      const config: GenerationConfig = {
        outputDir: options.output,
        packageName: options.package,
        springBootVersion: options.springVersion,
        options: {
          generateControllers: options.controllers,
          generateServices: options.services,
          generateRepositories: options.repositories,
          generateDTOs: options.dtos,
          generateConfigurations: true,
          generateTests: options.tests,
          useLombok: options.lombok,
          useValidation: options.validation,
        },
        templates: {
          controllerTemplate: 'controller',
          serviceTemplate: 'service',
          repositoryTemplate: 'repository',
          dtoTemplate: 'dto',
          configTemplate: 'config',
          testTemplate: 'test',
        },
      };

      // Process input
      const inputStat = await fs.stat(input);
      let result: ConversionResult;

      if (inputStat.isDirectory()) {
        result = await this.convertDirectory(input, config, spinner);
      } else {
        result = await this.convertFile(input, config, spinner);
      }

      // Display results
      this.displayResults(result, options.dryRun);

      if (result.success) {
        spinner.succeed(chalk.green('Conversion completed successfully!'));
      } else {
        spinner.fail(chalk.red('Conversion completed with errors'));
        process.exit(1);
      }

    } catch (error) {
      spinner.fail(chalk.red('Conversion failed'));
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Convert a single file
   */
  private async convertFile(filePath: string, config: GenerationConfig, spinner: ora.Ora): Promise<ConversionResult> {
    const fileName = path.basename(filePath);
    spinner.text = `Converting ${fileName}...`;

    const result: ConversionResult = {
      success: false,
      generatedFiles: [],
      warnings: [],
      errors: [],
      statistics: {
        processesConverted: 0,
        activitiesConverted: 0,
        filesGenerated: 0,
        duration: 0,
      },
    };

    const startTime = Date.now();

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const fileExtension = path.extname(filePath).toLowerCase();

      if (fileExtension === '.bwp' || fileExtension === '.process') {
        // Parse BWP file
        const parser = new BWPParser({ verbose: process.env.VERBOSE === 'true' });
        const parseResult = await parser.parse(fileContent);

        if (!parseResult.success || !parseResult.data) {
          result.errors.push(...parseResult.errors);
          result.warnings.push(...parseResult.warnings);
          return result;
        }

        // Generate code
        const generator = new ControllerGenerator();
        const generateResult = await generator.generate(parseResult.data, config);

        result.generatedFiles.push(...generateResult.files);
        result.warnings.push(...generateResult.warnings);
        result.errors.push(...generateResult.errors);
        result.statistics.processesConverted = 1;
        result.statistics.activitiesConverted = parseResult.data.activities.length;

      } else if (fileExtension === '.xsd') {
        // Parse XSD file
        const parser = new XSDParser({ verbose: process.env.VERBOSE === 'true' });
        const parseResult = await parser.parse(fileContent);

        if (!parseResult.success || !parseResult.data) {
          result.errors.push(...parseResult.errors);
          result.warnings.push(...parseResult.warnings);
          return result;
        }

        // TODO: Generate DTOs from XSD
        // const generator = new DTOGenerator();
        // const generateResult = await generator.generate(parseResult.data, config);

      } else {
        result.errors.push({
          message: `Unsupported file type: ${fileExtension}`,
          source: filePath,
          code: 'UNSUPPORTED_FILE_TYPE',
        });
        return result;
      }

      result.statistics.filesGenerated = result.generatedFiles.length;
      result.statistics.duration = Date.now() - startTime;
      result.success = result.errors.length === 0;

    } catch (error) {
      result.errors.push({
        message: error instanceof Error ? error.message : 'Unknown error',
        source: filePath,
        code: 'CONVERSION_ERROR',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    return result;
  }

  /**
   * Convert a directory
   */
  private async convertDirectory(dirPath: string, config: GenerationConfig, spinner: ora.Ora): Promise<ConversionResult> {
    const result: ConversionResult = {
      success: true,
      generatedFiles: [],
      warnings: [],
      errors: [],
      statistics: {
        processesConverted: 0,
        activitiesConverted: 0,
        filesGenerated: 0,
        duration: 0,
      },
    };

    const startTime = Date.now();

    try {
      // Find all BWP and XSD files
      const files = await this.findConvertibleFiles(dirPath);
      
      if (files.length === 0) {
        result.warnings.push({
          message: 'No convertible files found in directory',
          source: dirPath,
          code: 'NO_FILES_FOUND',
        });
        return result;
      }

      // Convert each file
      for (const file of files) {
        const fileResult = await this.convertFile(file, config, spinner);
        
        result.generatedFiles.push(...fileResult.generatedFiles);
        result.warnings.push(...fileResult.warnings);
        result.errors.push(...fileResult.errors);
        result.statistics.processesConverted += fileResult.statistics.processesConverted;
        result.statistics.activitiesConverted += fileResult.statistics.activitiesConverted;
      }

      result.statistics.filesGenerated = result.generatedFiles.length;
      result.statistics.duration = Date.now() - startTime;
      result.success = result.errors.length === 0;

    } catch (error) {
      result.errors.push({
        message: error instanceof Error ? error.message : 'Unknown error',
        source: dirPath,
        code: 'DIRECTORY_CONVERSION_ERROR',
        stack: error instanceof Error ? error.stack : undefined,
      });
      result.success = false;
    }

    return result;
  }

  /**
   * Find all convertible files in directory
   */
  private async findConvertibleFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await this.findConvertibleFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.bwp' || ext === '.process' || ext === '.xsd') {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Display conversion results
   */
  private displayResults(result: ConversionResult, dryRun: boolean): void {
    console.log('\n' + chalk.bold('Conversion Results:'));
    console.log('='.repeat(50));

    // Statistics
    console.log(chalk.blue('Statistics:'));
    console.log(`  Processes converted: ${result.statistics.processesConverted}`);
    console.log(`  Activities converted: ${result.statistics.activitiesConverted}`);
    console.log(`  Files generated: ${result.statistics.filesGenerated}`);
    console.log(`  Duration: ${result.statistics.duration}ms`);

    // Generated files
    if (result.generatedFiles.length > 0) {
      console.log('\n' + chalk.green('Generated Files:'));
      result.generatedFiles.forEach(file => {
        const status = dryRun ? '[DRY RUN]' : '[CREATED]';
        console.log(`  ${status} ${file.path} (${file.type})`);
      });
    }

    // Warnings
    if (result.warnings.length > 0) {
      console.log('\n' + chalk.yellow('Warnings:'));
      result.warnings.forEach(warning => {
        console.log(`  ${warning.code}: ${warning.message} (${warning.source})`);
      });
    }

    // Errors
    if (result.errors.length > 0) {
      console.log('\n' + chalk.red('Errors:'));
      result.errors.forEach(error => {
        console.log(`  ${error.code}: ${error.message} (${error.source})`);
        if (error.stack && process.env.VERBOSE === 'true') {
          console.log(`    ${error.stack}`);
        }
      });
    }
  }

  /**
   * Get the command instance
   */
  getCommand(): Command {
    return this.command;
  }
}
