/**
 * Analyze command - analyze BWP files without conversion
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs-extra';
import * as path from 'path';
import { BWPParser } from '@/parsers';
import { BWPProcess, BWPActivityType } from '@/types';

/**
 * Analysis result interface
 */
interface AnalysisResult {
  processes: ProcessAnalysis[];
  summary: AnalysisSummary;
  errors: string[];
}

interface ProcessAnalysis {
  name: string;
  filePath: string;
  activities: ActivityAnalysis[];
  complexity: number;
  dependencies: string[];
  httpEndpoints: number;
  databaseOperations: number;
  jmsOperations: number;
  fileOperations: number;
}

interface ActivityAnalysis {
  name: string;
  type: BWPActivityType;
  complexity: number;
  hasCustomCode: boolean;
}

interface AnalysisSummary {
  totalProcesses: number;
  totalActivities: number;
  averageComplexity: number;
  activityTypeDistribution: Record<string, number>;
  conversionDifficulty: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Analyze command class
 */
export class AnalyzeCommand {
  private command: Command;

  constructor() {
    this.command = new Command('analyze');
    this.setupCommand();
  }

  /**
   * Setup the analyze command
   */
  private setupCommand(): void {
    this.command
      .description('Analyze TIBCO BW processes and generate conversion report')
      .argument('<input>', 'input BWP file or directory')
      .option('-o, --output <file>', 'output report file (JSON format)')
      .option('--format <type>', 'output format (json|table|csv)', 'table')
      .option('--detailed', 'include detailed analysis', false)
      .action(async (input, options) => {
        await this.execute(input, options);
      });
  }

  /**
   * Execute the analyze command
   */
  private async execute(input: string, options: any): Promise<void> {
    const spinner = ora('Analyzing TIBCO BW processes...').start();

    try {
      // Validate input
      if (!await fs.pathExists(input)) {
        throw new Error(`Input path does not exist: ${input}`);
      }

      // Perform analysis
      const result = await this.analyzeInput(input, spinner);

      // Display results
      this.displayResults(result, options);

      // Save to file if requested
      if (options.output) {
        await this.saveResults(result, options.output, options.format);
        console.log(chalk.green(`\nReport saved to: ${options.output}`));
      }

      spinner.succeed(chalk.green('Analysis completed successfully!'));

    } catch (error) {
      spinner.fail(chalk.red('Analysis failed'));
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Analyze input (file or directory)
   */
  private async analyzeInput(input: string, spinner: ora.Ora): Promise<AnalysisResult> {
    const result: AnalysisResult = {
      processes: [],
      summary: {
        totalProcesses: 0,
        totalActivities: 0,
        averageComplexity: 0,
        activityTypeDistribution: {},
        conversionDifficulty: 'LOW',
      },
      errors: [],
    };

    const inputStat = await fs.stat(input);

    if (inputStat.isDirectory()) {
      await this.analyzeDirectory(input, result, spinner);
    } else {
      await this.analyzeFile(input, result, spinner);
    }

    // Calculate summary
    this.calculateSummary(result);

    return result;
  }

  /**
   * Analyze a single file
   */
  private async analyzeFile(filePath: string, result: AnalysisResult, spinner: ora.Ora): Promise<void> {
    const fileName = path.basename(filePath);
    spinner.text = `Analyzing ${fileName}...`;

    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      
      if (fileExtension !== '.bwp' && fileExtension !== '.process') {
        result.errors.push(`Unsupported file type: ${filePath}`);
        return;
      }

      const fileContent = await fs.readFile(filePath, 'utf-8');
      const parser = new BWPParser({ verbose: false });
      const parseResult = await parser.parse(fileContent);

      if (!parseResult.success || !parseResult.data) {
        result.errors.push(`Failed to parse ${filePath}: ${parseResult.errors.map(e => e.message).join(', ')}`);
        return;
      }

      const processAnalysis = this.analyzeProcess(parseResult.data, filePath);
      result.processes.push(processAnalysis);

    } catch (error) {
      result.errors.push(`Error analyzing ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze a directory
   */
  private async analyzeDirectory(dirPath: string, result: AnalysisResult, spinner: ora.Ora): Promise<void> {
    const files = await this.findBWPFiles(dirPath);
    
    for (const file of files) {
      await this.analyzeFile(file, result, spinner);
    }
  }

  /**
   * Find all BWP files in directory
   */
  private async findBWPFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await this.findBWPFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.bwp' || ext === '.process') {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Analyze a single process
   */
  private analyzeProcess(process: BWPProcess, filePath: string): ProcessAnalysis {
    const activities = process.activities.map(activity => this.analyzeActivity(activity));
    
    return {
      name: process.name,
      filePath,
      activities,
      complexity: this.calculateProcessComplexity(process),
      dependencies: this.extractDependencies(process),
      httpEndpoints: this.countActivitiesByType(process, [BWPActivityType.HTTP_RECEIVER, BWPActivityType.HTTP_SENDER]),
      databaseOperations: this.countActivitiesByType(process, [BWPActivityType.JDBC_QUERY, BWPActivityType.JDBC_UPDATE, BWPActivityType.JDBC_CALL]),
      jmsOperations: this.countActivitiesByType(process, [BWPActivityType.JMS_QUEUE_SENDER, BWPActivityType.JMS_QUEUE_RECEIVER, BWPActivityType.JMS_TOPIC_PUBLISHER, BWPActivityType.JMS_TOPIC_SUBSCRIBER]),
      fileOperations: this.countActivitiesByType(process, [BWPActivityType.READ_FILE, BWPActivityType.WRITE_FILE]),
    };
  }

  /**
   * Analyze a single activity
   */
  private analyzeActivity(activity: any): ActivityAnalysis {
    return {
      name: activity.name,
      type: activity.type,
      complexity: this.calculateActivityComplexity(activity),
      hasCustomCode: activity.type === BWPActivityType.JAVA_CODE,
    };
  }

  /**
   * Calculate process complexity score
   */
  private calculateProcessComplexity(process: BWPProcess): number {
    let complexity = 0;
    
    // Base complexity from number of activities
    complexity += process.activities.length;
    
    // Add complexity for transitions (control flow)
    complexity += process.transitions.length * 0.5;
    
    // Add complexity for custom code activities
    const customCodeActivities = process.activities.filter(a => a.type === BWPActivityType.JAVA_CODE);
    complexity += customCodeActivities.length * 3;
    
    // Add complexity for mappings
    const totalMappings = process.activities.reduce((sum, activity) => 
      sum + activity.inputMappings.length + activity.outputMappings.length, 0);
    complexity += totalMappings * 0.2;
    
    return Math.round(complexity);
  }

  /**
   * Calculate activity complexity score
   */
  private calculateActivityComplexity(activity: any): number {
    let complexity = 1; // Base complexity
    
    // Add complexity based on activity type
    const complexityMap: Record<BWPActivityType, number> = {
      [BWPActivityType.JAVA_CODE]: 5,
      [BWPActivityType.MAPPER]: 3,
      [BWPActivityType.JDBC_QUERY]: 2,
      [BWPActivityType.JDBC_UPDATE]: 2,
      [BWPActivityType.JDBC_CALL]: 3,
      [BWPActivityType.HTTP_RECEIVER]: 2,
      [BWPActivityType.HTTP_SENDER]: 2,
      [BWPActivityType.JMS_QUEUE_SENDER]: 2,
      [BWPActivityType.JMS_QUEUE_RECEIVER]: 2,
      [BWPActivityType.JMS_TOPIC_PUBLISHER]: 2,
      [BWPActivityType.JMS_TOPIC_SUBSCRIBER]: 2,
      [BWPActivityType.READ_FILE]: 1,
      [BWPActivityType.WRITE_FILE]: 1,
      [BWPActivityType.CALL_PROCESS]: 2,
      [BWPActivityType.NULL]: 0,
      [BWPActivityType.SLEEP]: 0,
      [BWPActivityType.CATCH]: 1,
      [BWPActivityType.RETHROW]: 1,
    };
    
    complexity += complexityMap[activity.type] || 1;
    
    // Add complexity for mappings
    complexity += (activity.inputMappings.length + activity.outputMappings.length) * 0.2;
    
    return Math.round(complexity);
  }

  /**
   * Extract dependencies from process
   */
  private extractDependencies(process: BWPProcess): string[] {
    const dependencies: Set<string> = new Set();
    
    // Extract from global variables
    process.globalVariables.forEach(gv => dependencies.add(`Global Variable: ${gv}`));
    
    // Extract from call process activities
    process.activities
      .filter(a => a.type === BWPActivityType.CALL_PROCESS)
      .forEach(a => {
        const processName = a.config.processName || a.config.process;
        if (processName) {
          dependencies.add(`Process: ${processName}`);
        }
      });
    
    return Array.from(dependencies);
  }

  /**
   * Count activities by type
   */
  private countActivitiesByType(process: BWPProcess, types: BWPActivityType[]): number {
    return process.activities.filter(a => types.includes(a.type)).length;
  }

  /**
   * Calculate analysis summary
   */
  private calculateSummary(result: AnalysisResult): void {
    const { processes } = result;
    
    result.summary.totalProcesses = processes.length;
    result.summary.totalActivities = processes.reduce((sum, p) => sum + p.activities.length, 0);
    result.summary.averageComplexity = processes.length > 0 
      ? Math.round(processes.reduce((sum, p) => sum + p.complexity, 0) / processes.length)
      : 0;
    
    // Calculate activity type distribution
    const typeDistribution: Record<string, number> = {};
    processes.forEach(process => {
      process.activities.forEach(activity => {
        const type = BWPActivityType[activity.type];
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      });
    });
    result.summary.activityTypeDistribution = typeDistribution;
    
    // Determine conversion difficulty
    const avgComplexity = result.summary.averageComplexity;
    const hasCustomCode = processes.some(p => p.activities.some(a => a.hasCustomCode));
    
    if (avgComplexity > 20 || hasCustomCode) {
      result.summary.conversionDifficulty = 'HIGH';
    } else if (avgComplexity > 10) {
      result.summary.conversionDifficulty = 'MEDIUM';
    } else {
      result.summary.conversionDifficulty = 'LOW';
    }
  }

  /**
   * Display analysis results
   */
  private displayResults(result: AnalysisResult, options: any): void {
    console.log('\n' + chalk.bold('TIBCO BW Analysis Report'));
    console.log('='.repeat(50));

    // Summary
    console.log(chalk.blue('\nSummary:'));
    console.log(`  Total Processes: ${result.summary.totalProcesses}`);
    console.log(`  Total Activities: ${result.summary.totalActivities}`);
    console.log(`  Average Complexity: ${result.summary.averageComplexity}`);
    console.log(`  Conversion Difficulty: ${this.getColoredDifficulty(result.summary.conversionDifficulty)}`);

    // Activity type distribution
    console.log(chalk.blue('\nActivity Type Distribution:'));
    Object.entries(result.summary.activityTypeDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

    // Process details (if detailed option is enabled)
    if (options.detailed && result.processes.length > 0) {
      console.log(chalk.blue('\nProcess Details:'));
      result.processes.forEach(process => {
        console.log(`\n  ${chalk.green(process.name)} (${path.basename(process.filePath)})`);
        console.log(`    Complexity: ${process.complexity}`);
        console.log(`    Activities: ${process.activities.length}`);
        console.log(`    HTTP Endpoints: ${process.httpEndpoints}`);
        console.log(`    Database Operations: ${process.databaseOperations}`);
        console.log(`    JMS Operations: ${process.jmsOperations}`);
        console.log(`    File Operations: ${process.fileOperations}`);
        
        if (process.dependencies.length > 0) {
          console.log(`    Dependencies: ${process.dependencies.join(', ')}`);
        }
      });
    }

    // Errors
    if (result.errors.length > 0) {
      console.log(chalk.red('\nErrors:'));
      result.errors.forEach(error => {
        console.log(`  ${error}`);
      });
    }
  }

  /**
   * Get colored difficulty text
   */
  private getColoredDifficulty(difficulty: string): string {
    switch (difficulty) {
      case 'LOW': return chalk.green(difficulty);
      case 'MEDIUM': return chalk.yellow(difficulty);
      case 'HIGH': return chalk.red(difficulty);
      default: return difficulty;
    }
  }

  /**
   * Save results to file
   */
  private async saveResults(result: AnalysisResult, outputPath: string, format: string): Promise<void> {
    let content: string;

    switch (format.toLowerCase()) {
      case 'json':
        content = JSON.stringify(result, null, 2);
        break;
      case 'csv':
        content = this.convertToCSV(result);
        break;
      default:
        content = JSON.stringify(result, null, 2);
    }

    await fs.writeFile(outputPath, content, 'utf-8');
  }

  /**
   * Convert results to CSV format
   */
  private convertToCSV(result: AnalysisResult): string {
    const headers = ['Process Name', 'File Path', 'Complexity', 'Activities', 'HTTP Endpoints', 'DB Operations', 'JMS Operations', 'File Operations'];
    const rows = result.processes.map(p => [
      p.name,
      p.filePath,
      p.complexity.toString(),
      p.activities.length.toString(),
      p.httpEndpoints.toString(),
      p.databaseOperations.toString(),
      p.jmsOperations.toString(),
      p.fileOperations.toString(),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Get the command instance
   */
  getCommand(): Command {
    return this.command;
  }
}
