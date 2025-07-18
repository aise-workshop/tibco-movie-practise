/**
 * Validate command - validate BWP/XSD files
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs-extra';
import * as path from 'path';
import { BWPParser, XSDParser } from '@/parsers';

/**
 * Validation result interface
 */
interface ValidationSummary {
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  warnings: number;
  errors: number;
  fileResults: FileValidationResult[];
}

interface FileValidationResult {
  filePath: string;
  fileType: 'BWP' | 'XSD' | 'UNKNOWN';
  valid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validate command class
 */
export class ValidateCommand {
  private command: Command;

  constructor() {
    this.command = new Command('validate');
    this.setupCommand();
  }

  /**
   * Setup the validate command
   */
  private setupCommand(): void {
    this.command
      .description('Validate TIBCO BW processes and XSD files')
      .argument('<input>', 'input file or directory')
      .option('-o, --output <file>', 'output validation report (JSON format)')
      .option('--strict', 'strict validation mode', false)
      .option('--format <type>', 'output format (table|json)', 'table')
      .action(async (input, options) => {
        await this.execute(input, options);
      });
  }

  /**
   * Execute the validate command
   */
  private async execute(input: string, options: any): Promise<void> {
    const spinner = ora('Validating files...').start();

    try {
      // Validate input path
      if (!await fs.pathExists(input)) {
        throw new Error(`Input path does not exist: ${input}`);
      }

      // Perform validation
      const summary = await this.validateInput(input, options, spinner);

      // Display results
      this.displayResults(summary, options);

      // Save report if requested
      if (options.output) {
        await this.saveReport(summary, options.output);
        console.log(chalk.green(`\nValidation report saved to: ${options.output}`));
      }

      // Set exit code based on validation results
      if (summary.invalidFiles > 0) {
        spinner.fail(chalk.red(`Validation completed with ${summary.invalidFiles} invalid files`));
        process.exit(1);
      } else {
        spinner.succeed(chalk.green('All files validated successfully!'));
      }

    } catch (error) {
      spinner.fail(chalk.red('Validation failed'));
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Validate input (file or directory)
   */
  private async validateInput(input: string, options: any, spinner: ora.Ora): Promise<ValidationSummary> {
    const summary: ValidationSummary = {
      totalFiles: 0,
      validFiles: 0,
      invalidFiles: 0,
      warnings: 0,
      errors: 0,
      fileResults: [],
    };

    const inputStat = await fs.stat(input);

    if (inputStat.isDirectory()) {
      await this.validateDirectory(input, summary, options, spinner);
    } else {
      await this.validateFile(input, summary, options, spinner);
    }

    return summary;
  }

  /**
   * Validate a single file
   */
  private async validateFile(
    filePath: string, 
    summary: ValidationSummary, 
    options: any, 
    spinner: ora.Ora
  ): Promise<void> {
    const fileName = path.basename(filePath);
    spinner.text = `Validating ${fileName}...`;

    const result: FileValidationResult = {
      filePath,
      fileType: 'UNKNOWN',
      valid: false,
      warnings: [],
      errors: [],
    };

    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      const fileContent = await fs.readFile(filePath, 'utf-8');

      if (fileExtension === '.bwp' || fileExtension === '.process') {
        result.fileType = 'BWP';
        await this.validateBWPFile(fileContent, result, options);
      } else if (fileExtension === '.xsd') {
        result.fileType = 'XSD';
        await this.validateXSDFile(fileContent, result, options);
      } else {
        result.errors.push(`Unsupported file type: ${fileExtension}`);
      }

    } catch (error) {
      result.errors.push(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Update result status
    result.valid = result.errors.length === 0;

    // Update summary
    summary.totalFiles++;
    if (result.valid) {
      summary.validFiles++;
    } else {
      summary.invalidFiles++;
    }
    summary.warnings += result.warnings.length;
    summary.errors += result.errors.length;
    summary.fileResults.push(result);
  }

  /**
   * Validate BWP file content
   */
  private async validateBWPFile(
    content: string, 
    result: FileValidationResult, 
    options: any
  ): Promise<void> {
    try {
      const parser = new BWPParser({ 
        verbose: false,
        continueOnError: true,
      });

      const parseResult = await parser.validate(content);

      // Add errors and warnings
      result.errors.push(...parseResult.errors.map(e => e.message));
      result.warnings.push(...parseResult.warnings.map(w => w.message));

      // Additional strict validation
      if (options.strict) {
        await this.performStrictBWPValidation(content, result);
      }

    } catch (error) {
      result.errors.push(`BWP validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate XSD file content
   */
  private async validateXSDFile(
    content: string, 
    result: FileValidationResult, 
    options: any
  ): Promise<void> {
    try {
      const parser = new XSDParser({ 
        verbose: false,
        continueOnError: true,
      });

      const parseResult = await parser.validate(content);

      // Add errors and warnings
      result.errors.push(...parseResult.errors.map(e => e.message));
      result.warnings.push(...parseResult.warnings.map(w => w.message));

      // Additional strict validation
      if (options.strict) {
        await this.performStrictXSDValidation(content, result);
      }

    } catch (error) {
      result.errors.push(`XSD validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform strict BWP validation
   */
  private async performStrictBWPValidation(content: string, result: FileValidationResult): Promise<void> {
    // Check for deprecated activities
    const deprecatedActivities = [
      'com.tibco.plugin.timer.activities.TimerActivity',
      'com.tibco.plugin.mail.activities.MailSendActivity',
    ];

    for (const activity of deprecatedActivities) {
      if (content.includes(activity)) {
        result.warnings.push(`Deprecated activity found: ${activity}`);
      }
    }

    // Check for complex XPath expressions
    const xpathMatches = content.match(/xpath="[^"]*"/g) || [];
    for (const xpath of xpathMatches) {
      if (xpath.length > 200) {
        result.warnings.push('Complex XPath expression detected - may require manual review');
      }
    }

    // Check for custom Java code
    if (content.includes('JavaCodeActivity')) {
      result.warnings.push('Custom Java code detected - will require manual conversion');
    }

    // Check for missing documentation
    if (!content.includes('description') && !content.includes('documentation')) {
      result.warnings.push('Process lacks documentation');
    }
  }

  /**
   * Perform strict XSD validation
   */
  private async performStrictXSDValidation(content: string, result: FileValidationResult): Promise<void> {
    // Check for missing target namespace
    if (!content.includes('targetNamespace')) {
      result.warnings.push('Missing target namespace');
    }

    // Check for complex types without documentation
    const complexTypeMatches = content.match(/<xs:complexType[^>]*name="([^"]*)"[^>]*>/g) || [];
    for (const match of complexTypeMatches) {
      const nameMatch = match.match(/name="([^"]*)"/);
      if (nameMatch) {
        const typeName = nameMatch[1];
        const typeContent = this.extractComplexTypeContent(content, typeName);
        if (typeContent && !typeContent.includes('documentation')) {
          result.warnings.push(`Complex type '${typeName}' lacks documentation`);
        }
      }
    }

    // Check for overly complex structures
    const maxDepth = this.calculateXSDDepth(content);
    if (maxDepth > 5) {
      result.warnings.push(`Deep nesting detected (depth: ${maxDepth}) - consider flattening structure`);
    }
  }

  /**
   * Extract complex type content from XSD
   */
  private extractComplexTypeContent(content: string, typeName: string): string | null {
    const regex = new RegExp(`<xs:complexType[^>]*name="${typeName}"[^>]*>([\\s\\S]*?)</xs:complexType>`, 'i');
    const match = content.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Calculate maximum nesting depth in XSD
   */
  private calculateXSDDepth(content: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    const lines = content.split('\n');
    for (const line of lines) {
      const openTags = (line.match(/<xs:(element|complexType|sequence|choice|all)/g) || []).length;
      const closeTags = (line.match(/<\/xs:(element|complexType|sequence|choice|all)>/g) || []).length;
      const selfClosing = (line.match(/<xs:(element|complexType)[^>]*\/>/g) || []).length;

      currentDepth += openTags - closeTags - selfClosing;
      maxDepth = Math.max(maxDepth, currentDepth);
    }

    return maxDepth;
  }

  /**
   * Validate a directory
   */
  private async validateDirectory(
    dirPath: string, 
    summary: ValidationSummary, 
    options: any, 
    spinner: ora.Ora
  ): Promise<void> {
    const files = await this.findValidatableFiles(dirPath);
    
    if (files.length === 0) {
      console.log(chalk.yellow('No validatable files found in directory'));
      return;
    }

    for (const file of files) {
      await this.validateFile(file, summary, options, spinner);
    }
  }

  /**
   * Find all validatable files in directory
   */
  private async findValidatableFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await this.findValidatableFiles(fullPath);
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
   * Display validation results
   */
  private displayResults(summary: ValidationSummary, options: any): void {
    console.log('\n' + chalk.bold('Validation Results'));
    console.log('='.repeat(50));

    // Summary
    console.log(chalk.blue('\nSummary:'));
    console.log(`  Total files: ${summary.totalFiles}`);
    console.log(`  Valid files: ${chalk.green(summary.validFiles.toString())}`);
    console.log(`  Invalid files: ${summary.invalidFiles > 0 ? chalk.red(summary.invalidFiles.toString()) : '0'}`);
    console.log(`  Total warnings: ${summary.warnings > 0 ? chalk.yellow(summary.warnings.toString()) : '0'}`);
    console.log(`  Total errors: ${summary.errors > 0 ? chalk.red(summary.errors.toString()) : '0'}`);

    // File details
    if (options.format === 'table' || !options.format) {
      this.displayTableResults(summary);
    } else if (options.format === 'json') {
      console.log('\n' + JSON.stringify(summary, null, 2));
    }
  }

  /**
   * Display results in table format
   */
  private displayTableResults(summary: ValidationSummary): void {
    if (summary.fileResults.length === 0) return;

    console.log(chalk.blue('\nFile Details:'));
    
    for (const result of summary.fileResults) {
      const status = result.valid ? chalk.green('✓ VALID') : chalk.red('✗ INVALID');
      const fileName = path.basename(result.filePath);
      
      console.log(`\n  ${status} ${fileName} (${result.fileType})`);
      
      if (result.warnings.length > 0) {
        console.log(chalk.yellow('    Warnings:'));
        result.warnings.forEach(warning => {
          console.log(`      - ${warning}`);
        });
      }
      
      if (result.errors.length > 0) {
        console.log(chalk.red('    Errors:'));
        result.errors.forEach(error => {
          console.log(`      - ${error}`);
        });
      }
    }
  }

  /**
   * Save validation report to file
   */
  private async saveReport(summary: ValidationSummary, outputPath: string): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: summary.totalFiles,
        validFiles: summary.validFiles,
        invalidFiles: summary.invalidFiles,
        warnings: summary.warnings,
        errors: summary.errors,
      },
      files: summary.fileResults,
    };

    await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  }

  /**
   * Get the command instance
   */
  getCommand(): Command {
    return this.command;
  }
}
