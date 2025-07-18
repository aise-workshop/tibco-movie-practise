# TIBCO BW to Spring Boot CLI Tool - Project Architecture

## 项目概述

这是一个从零开始构建的 TypeScript/Node.js CLI 工具，用于将 TIBCO BusinessWorks 流程转换为 Spring Boot 应用程序。

## 项目结构

```
tibco-movie-practise/
├── src/
│   ├── types/                  # 类型定义
│   │   └── index.ts           # 核心数据结构定义
│   ├── parsers/               # 解析器模块
│   │   ├── index.ts          # 模块导出
│   │   ├── base-parser.ts    # 基础解析器接口
│   │   ├── bwp-parser.ts     # BWP 文件解析器
│   │   ├── xsd-parser.ts     # XSD 文件解析器
│   │   └── xml-utils.ts      # XML 工具函数
│   ├── generators/            # 代码生成器模块
│   │   ├── index.ts          # 模块导出
│   │   ├── base-generator.ts # 基础生成器接口
│   │   ├── controller-generator.ts # Spring Boot Controller 生成器
│   │   └── template-engine.ts # 模板引擎
│   ├── cli/                   # CLI 接口
│   │   ├── index.ts          # CLI 主入口
│   │   └── commands/         # CLI 命令
│   │       ├── convert.ts    # 转换命令
│   │       ├── analyze.ts    # 分析命令
│   │       ├── init.ts       # 初始化命令
│   │       └── validate.ts   # 验证命令
│   ├── utils/                 # 工具函数
│   │   ├── index.ts          # 工具模块导出
│   │   └── logger.ts         # 日志工具
│   └── __tests__/            # 测试文件
│       └── setup.ts          # 测试配置
├── package.json              # 项目依赖配置
├── tsconfig.json            # TypeScript 配置
├── jest.config.js           # Jest 测试配置
├── .eslintrc.js            # ESLint 配置
├── .prettierrc             # Prettier 配置
└── README.md               # 项目说明
```

## 核心模块架构

### 1. 类型定义模块 (`src/types/`)

定义了完整的数据结构：

- **BWP 流程类型**: `BWPProcess`, `BWPActivity`, `BWPTransition` 等
- **XSD 模式类型**: `XSDSchema`, `XSDElement`, `XSDType` 等  
- **生成配置类型**: `GenerationConfig`, `GenerationOptions` 等
- **转换结果类型**: `ConversionResult`, `GeneratedFile` 等

### 2. 解析器模块 (`src/parsers/`)

负责解析 TIBCO 文件：

- **BaseParser**: 提供通用解析功能和错误处理
- **BWPParser**: 解析 .bwp 文件（XML 格式的 TIBCO BusinessWorks 流程）
- **XSDParser**: 解析 .xsd 文件生成数据模型
- **XMLUtils**: XML 解析和处理工具

### 3. 代码生成器模块 (`src/generators/`)

负责生成 Spring Boot 代码：

- **BaseGenerator**: 提供通用代码生成功能
- **ControllerGenerator**: 生成 Spring Boot REST Controllers
- **TemplateEngine**: 基于 Handlebars 的模板引擎
- 支持扩展：ServiceGenerator, DTOGenerator, RepositoryGenerator 等

### 4. CLI 接口模块 (`src/cli/`)

提供命令行交互：

- **convert**: 主要转换功能，将 BWP 文件转换为 Spring Boot 代码
- **analyze**: 分析 BWP 文件，生成转换报告
- **init**: 初始化新的 Spring Boot 项目
- **validate**: 验证 BWP/XSD 文件的有效性

## 技术栈

### 核心依赖
- **TypeScript**: 类型安全的 JavaScript
- **Commander.js**: CLI 框架
- **Handlebars**: 模板引擎
- **fast-xml-parser**: XML 解析
- **xml2js**: 备用 XML 解析器

### 开发工具
- **Jest**: 测试框架
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **ts-node**: TypeScript 运行时

### UI/UX 增强
- **chalk**: 彩色终端输出
- **ora**: 加载动画
- **inquirer**: 交互式命令行

## 主要特性

### 1. 模块化架构
- 清晰的模块分离
- 可扩展的插件架构
- 强类型定义

### 2. 完整的 CLI 工具
- 多种转换命令
- 交互式项目初始化
- 详细的分析和验证功能

### 3. 强大的解析能力
- 支持复杂的 BWP 流程解析
- XSD 模式解析和类型生成
- 错误处理和诊断

### 4. 灵活的代码生成
- 基于模板的代码生成
- 支持多种 Spring Boot 模式
- 可定制的生成选项

## 使用示例

### 安装依赖
```bash
npm install
```

### 构建项目
```bash
npm run build
```

### 运行 CLI 工具
```bash
# 转换 BWP 文件
npm run dev convert input.bwp -o output/ -p com.example.app

# 分析 BWP 文件
npm run dev analyze input.bwp --detailed

# 初始化新项目
npm run dev init my-app --interactive

# 验证文件
npm run dev validate input.bwp --strict
```

### 运行测试
```bash
npm test
```

## 扩展性

该架构设计为高度可扩展：

1. **新的解析器**: 继承 `BaseParser` 添加新的文件格式支持
2. **新的生成器**: 继承 `BaseGenerator` 添加新的代码生成功能
3. **新的 CLI 命令**: 在 `src/cli/commands/` 添加新命令
4. **新的模板**: 在模板目录添加 Handlebars 模板

## 配置选项

项目支持丰富的配置选项：

- **包名配置**: 自定义 Java 包名
- **Spring Boot 版本**: 支持多个版本
- **生成选项**: 控制生成哪些类型的文件
- **模板定制**: 使用自定义模板
- **验证级别**: 严格或宽松的验证模式

## 下一步开发

1. **完善生成器**: 实现 Service、Repository、DTO 生成器
2. **模板系统**: 创建完整的 Handlebars 模板库
3. **测试覆盖**: 添加全面的单元测试和集成测试
4. **文档完善**: 添加 API 文档和使用指南
5. **性能优化**: 优化大文件处理性能

这个架构为 TIBCO BW 到 Spring Boot 的转换提供了坚实的基础，支持复杂的企业级转换需求。
