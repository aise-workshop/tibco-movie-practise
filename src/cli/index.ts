#!/usr/bin/env node

/**
 * TIBCO BW to Spring Boot CLI Tool
 * Main entry point for the command line interface
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ConvertCommand } from './commands/convert';
import { AnalyzeCommand } from './commands/analyze';
import { InitCommand } from './commands/init';
import { ValidateCommand } from './commands/validate';

const packageJson = require('../../package.json');

/**
 * Main CLI application
 */
class TibcoConverterCLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupProgram();
    this.registerCommands();
  }

  /**
   * Setup the main program
   */
  private setupProgram(): void {
    this.program
      .name('tibco-converter')
      .description('CLI tool to convert TIBCO BusinessWorks processes to Spring Boot applications')
      .version(packageJson.version)
      .option('-v, --verbose', 'enable verbose logging')
      .option('--config <path>', 'path to configuration file')
      .hook('preAction', (thisCommand) => {
        // Set global options
        const opts = thisCommand.opts();
        if (opts.verbose) {
          process.env.VERBOSE = 'true';
        }
        if (opts.config) {
          process.env.CONFIG_PATH = opts.config;
        }
      });
  }

  /**
   * Register all commands
   */
  private registerCommands(): void {
    // Convert command - main conversion functionality
    this.program.addCommand(new ConvertCommand().getCommand());

    // Analyze command - analyze BWP files without conversion
    this.program.addCommand(new AnalyzeCommand().getCommand());

    // Init command - initialize new project
    this.program.addCommand(new InitCommand().getCommand());

    // Validate command - validate BWP/XSD files
    this.program.addCommand(new ValidateCommand().getCommand());

    // Help command
    this.program
      .command('help [command]')
      .description('display help for command')
      .action((command) => {
        if (command) {
          this.program.commands.find(cmd => cmd.name() === command)?.help();
        } else {
          this.program.help();
        }
      });
  }

  /**
   * Run the CLI
   */
  async run(argv: string[] = process.argv): Promise<void> {
    try {
      await this.program.parseAsync(argv);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  const cli = new TibcoConverterCLI();
  cli.run().catch((error) => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

export { TibcoConverterCLI };
