# 从零构建 Tibco BW 迁移 CLI 工具的提示词

## 学习目标

通过多轮提示词练习，学员将从零开始构建一个完整的 Tibco BW 到 Spring Boot 的迁移 CLI 工具。

## 示例项目结构

学员将基于以下示例项目进行练习：
```
test/_fixtures/MovieApi_Final_withConsul/
├── MovieCatalogSearch.module/
│   ├── Processes/moviecatalogsearch/module/SearchMovies.bwp
│   ├── Schemas/
│   │   ├── MovieCatalogMaster.xsd
│   │   └── OMDBSearchElement.xsd
│   └── Resources/swagger.json
└── META-INF/
    └── default.substvar
```

## 阶段 1：项目初始化和基础解析器

### 提示词 1.1：项目架构设计

```markdown
我需要从零开始构建一个 Tibco BW 转 Spring Boot 的 CLI 工具。

**项目需求**：
- 解析 .bwp 文件（XML 格式的 Tibco BusinessWorks 流程文件）
- 解析 .xsd 文件生成 Java 模型类
- 生成 Spring Boot Controller 和 Service
- 支持外部 API 调用转换

**第一步任务**：设计项目架构和初始化

**要求**：
1. 创建 TypeScript/Node.js 项目结构
2. 设计核心模块架构：
   - `src/parsers/` - 解析器模块
   - `src/generators/` - 代码生成器模块
   - `src/types/` - 类型定义
   - `src/cli/` - CLI 接口
   - `src/utils/` - 工具函数

3. 初始化项目配置：
   - package.json 依赖配置
   - TypeScript 配置
   - 测试框架配置

4. 定义核心数据结构：
   - BWP 流程表示
   - XSD 模型表示
   - 生成配置选项

请提供完整的项目初始化代码和架构设计。
```

### 提示词 1.2：XSD 解析器实现

```markdown
我正在构建 Tibco BW 迁移工具，现在需要实现 XSD 解析器。

**当前任务**：实现 XSD 文件解析，生成 Java 模型类

**示例 XSD 文件**：`test/_fixtures/MovieCatalogSearch.module/Schemas/MovieCatalogMaster.xsd`

**要求**：
1. **创建 XSD 解析器** (`src/parsers/xsd-parser.ts`)：
   - 解析 XSD 文件结构
   - 提取复杂类型定义
   - 处理元素和属性
   - 支持嵌套类型

2. **创建 Java 模型生成器** (`src/generators/xsd-java-model-generator.ts`)：
   - 将 XSD 类型转换为 Java 类
   - 生成字段、getter/setter
   - 添加 Jackson 注解
   - 支持 JSR-303 验证注解

3. **实现类型映射**：
   - XSD 基础类型 → Java 类型
   - 复杂类型 → Java 类
   - 数组类型 → List<T>

4. **编写单元测试**：
   - 测试 XSD 解析功能
   - 验证 Java 代码生成
   - 对比生成结果与预期

**验证要求**：
- 能解析示例 XSD 文件
- 生成可编译的 Java 类
- 包含正确的注解和类型映射

请实现完整的 XSD 解析和 Java 模型生成功能。
```

## 阶段 2：BWP 文件解析和业务逻辑转换

### 提示词 2.1：BWP 解析器实现

```markdown
我正在构建 Tibco BW 迁移工具，已完成 XSD 解析器，现在需要实现 BWP 文件解析。

**当前任务**：解析 BWP 文件，提取业务流程逻辑

**示例 BWP 文件**：`test/_fixtures/MovieCatalogSearch.module/Processes/moviecatalogsearch/module/SearchMovies.bwp`

**BWP 文件结构分析**：
- XML 格式的业务流程定义
- 包含 REST 端点定义
- 包含活动（Activities）和流程逻辑
- 包含外部服务调用配置

**要求**：
1. **创建 BWP 解析器** (`src/parsers/bwp-parser.ts`)：
   - 解析 XML 结构
   - 提取 REST 端点信息（路径、方法、参数）
   - 解析活动流程（Activities）
   - 提取外部服务调用配置

2. **定义数据结构** (`src/types/index.ts`)：
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

3. **处理特殊元素**：
   - `<referenceBinding>` - 外部服务配置
   - `<operation>` - REST 操作定义
   - `<parameterMapping>` - 参数映射

4. **编写解析测试**：
   - 验证 REST 端点提取
   - 验证参数映射解析
   - 验证外部服务配置

**验证要求**：
- 正确解析示例 BWP 文件
- 提取出 `/movies` GET 端点
- 识别 OMDB API 外部调用配置

请实现完整的 BWP 解析功能。
```

### 提示词 2.2：Spring Boot 代码生成器

```markdown
我正在构建 Tibco BW 迁移工具，已完成 BWP 解析，现在需要生成 Spring Boot 代码。

**当前任务**：将解析的 BWP 流程转换为 Spring Boot Controller 和 Service

**要求**：
1. **创建 Controller 生成器** (`src/generators/bwp-java-generator.ts`)：
   - 生成 `@RestController` 类
   - 根据 BWP 端点生成 `@GetMapping`/`@PostMapping` 方法
   - 处理请求参数绑定
   - 生成响应处理逻辑

2. **创建 Service 生成器**：
   - 生成 `@Service` 类
   - 实现业务逻辑
   - 处理外部 API 调用（RestTemplate）
   - 异常处理

3. **外部 API 客户端生成** (`src/generators/external-api-client-generator.ts`)：
   - 根据 BWP 中的 `<referenceBinding>` 生成客户端代码
   - 处理 URL 配置和参数映射
   - 生成 HTTP 调用逻辑

4. **配置文件生成** (`src/generators/properties-generator.ts`)：
   - 解析 `.substvar` 文件
   - 生成 `application.properties`
   - 处理外部服务 URL 和 API 密钥

**示例生成目标**：
```java
@RestController
public class SearchMoviesController {
    @GetMapping("/movies")
    public ResponseEntity<OMDBSearchElement> searchMovies(
        @RequestParam String searchString) {
        // 调用 service 层
    }
}

@Service
public class SearchMoviesService {
    public OMDBSearchElement search(String searchString) {
        // 调用外部 OMDB API
    }
}
```

**验证要求**：
- 生成可编译的 Spring Boot 代码
- 正确映射 BWP 端点到 Spring 注解
- 外部 API 调用配置正确

请实现完整的 Spring Boot 代码生成功能。
```

## 阶段 3：CLI 接口和自动化流程

### 提示词 3.1：CLI 命令行接口实现

```markdown
我正在构建 Tibco BW 迁移工具，已完成解析器和生成器，现在需要实现 CLI 接口。

**当前任务**：创建用户友好的命令行接口

**要求**：
1. **创建 CLI 主入口** (`src/cli.ts`)：
   - 使用 `commander.js` 创建命令行接口
   - 支持多个子命令
   - 提供帮助信息和使用示例

2. **实现核心命令**：
   ```bash
   # 转换单个 BWP 文件
   tibco-cli convert -i input.bwp -s schemas/ -o output/ -p com.example

   # 验证 BWP 文件
   tibco-cli validate -i input.bwp

   # 生成模型类
   tibco-cli generate-models -s schemas/ -o output/ -p com.example.model

   # 自动转换整个项目
   tibco-cli auto project-dir/ -p com.example
   ```

3. **命令选项设计**：
   - `-i, --input` - 输入 BWP 文件
   - `-s, --schemas` - XSD 模式目录
   - `-o, --output` - 输出目录
   - `-p, --package` - Java 包名
   - `--spring-boot-project` - Spring Boot 项目路径
   - `--no-validation` - 禁用验证注解
   - `--lombok` - 使用 Lombok

4. **错误处理和用户体验**：
   - 友好的错误信息
   - 进度指示器
   - 详细的日志输出
   - 成功/失败状态反馈

**验证要求**：
- CLI 命令正常工作
- 帮助信息清晰
- 错误处理完善
- 支持常见使用场景

请实现完整的 CLI 接口。
```

### 提示词 3.2：自动化工作流程实现

```markdown
我正在构建 Tibco BW 迁移工具，已完成基础功能，现在需要实现自动化工作流程。

**当前任务**：实现一键自动转换功能

**要求**：
1. **自动检测功能**：
   - 自动查找 BWP 文件
   - 自动检测 Schemas 目录
   - 自动发现 swagger.json 文件
   - 自动检测配置文件

2. **集成转换流程**：
   ```typescript
   async function autoConvert(projectDir: string, options: AutoConvertOptions) {
     // 1. 项目结构分析
     const projectStructure = await analyzeProject(projectDir);

     // 2. 解析所有组件
     const bwpData = await parseBWP(projectStructure.bwpFiles);
     const xsdModels = await parseXSD(projectStructure.schemasDir);
     const config = await parseConfig(projectStructure.configFiles);

     // 3. 生成代码
     const javaCode = await generateJavaCode(bwpData, xsdModels, options);

     // 4. 部署到 Spring Boot 项目
     await deployToSpringBoot(javaCode, options.springBootProject);

     // 5. 验证结果
     await validateDeployment(options.springBootProject);
   }
   ```

3. **Spring Boot 项目集成** (`src/utils/spring-boot-deployer.ts`)：
   - 自动复制生成的代码到正确位置
   - 更新 Spring Boot 配置
   - 验证项目编译
   - 可选的应用启动测试

4. **验证和测试**：
   - 代码编译验证
   - 基础功能测试
   - API 一致性检查
   - 生成测试报告

**示例使用**：
```bash
# 一键转换整个项目
tibco-cli auto test/_fixtures/ -p com.example.movies

# 输出应该包括：
# ✅ 发现 BWP 文件: SearchMovies.bwp
# ✅ 发现 Schemas 目录: Schemas/
# ✅ 生成 30+ 模型类
# ✅ 生成 Controller 和 Service
# ✅ 部署到 Spring Boot 项目
# ✅ 编译验证通过
```

**验证要求**：
- 自动检测功能正常
- 端到端转换流程完整
- 生成的 Spring Boot 项目可运行
- 提供详细的执行报告

请实现完整的自动化工作流程。
```

## 阶段 4：测试验证和问题修复

### 提示词 4.1：测试框架和验证

```markdown
我正在构建 Tibco BW 迁移工具，已完成核心功能，现在需要实现完整的测试框架。

**当前任务**：构建测试框架，验证工具的正确性

**要求**：
1. **单元测试实现** (`test/unit/`)：
   ```typescript
   // bwp-parser.test.ts
   describe('BWP Parser', () => {
     it('should parse REST endpoints correctly', () => {
       // 测试 BWP 文件解析
     });

     it('should extract external service configurations', () => {
       // 测试外部服务配置提取
     });
   });

   // xsd-parser.test.ts
   describe('XSD Parser', () => {
     it('should generate correct Java models', () => {
       // 测试 XSD 到 Java 转换
     });
   });
   ```

2. **集成测试实现** (`test/integration/`)：
   - 端到端转换测试
   - Spring Boot 部署测试
   - API 功能验证测试

3. **测试数据准备**：
   - 创建 `test/_fixtures/` 目录
   - 准备示例 BWP、XSD、配置文件
   - 创建预期输出的参考文件

4. **自动化测试流程**：
   ```bash
   # 运行所有测试
   npm test

   # 运行特定测试
   npm test -- test/unit/bwp-parser.test.ts

   # 生成覆盖率报告
   npm run test:coverage
   ```

**验证要求**：
- 测试覆盖率 > 80%
- 所有核心功能有测试覆盖
- 集成测试验证端到端流程
- 测试数据完整且真实

请实现完整的测试框架。
```

### 提示词 4.2：问题诊断和修复

```markdown
我正在构建 Tibco BW 迁移工具，在测试过程中发现了一些问题需要修复。

**常见问题场景**：

**问题 1：外部 API 调用配置错误**
- 现象：生成的代码中外部 API URL 不正确
- 原因：`.substvar` 文件解析或 URL 拼接逻辑错误
- 修复方向：检查配置解析器和 URL 处理逻辑

**问题 2：数据类型映射错误**
- 现象：XSD 类型转换为错误的 Java 类型
- 原因：类型映射表不完整或映射逻辑错误
- 修复方向：完善类型映射规则

**问题 3：生成的代码编译失败**
- 现象：Spring Boot 项目编译报错
- 原因：包导入、注解使用或语法错误
- 修复方向：检查代码生成模板

**要求**：
1. **实现问题诊断工具**：
   ```typescript
   // src/utils/diagnostics.ts
   export class DiagnosticTool {
     async validateBWPFile(filePath: string): Promise<ValidationResult> {
       // 验证 BWP 文件结构
     }

     async validateGeneratedCode(outputDir: string): Promise<ValidationResult> {
       // 验证生成的 Java 代码
     }

     async checkExternalApiConfig(config: ProjectConfig): Promise<ValidationResult> {
       // 检查外部 API 配置
     }
   }
   ```

2. **错误处理和恢复**：
   - 详细的错误信息和建议
   - 自动修复常见问题
   - 提供手动修复指导

3. **调试和日志**：
   - 详细的执行日志
   - 中间结果输出
   - 性能监控

**修复验证流程**：
```bash
# 诊断问题
tibco-cli diagnose -i test/_fixtures/SearchMovies.bwp

# 修复后重新测试
tibco-cli auto test/_fixtures/ -p com.example.movies

# 验证修复结果
cd spring-boilerplate && mvn compile
curl "http://localhost:8080/movies?searchString=batman"
```

**验证要求**：
- 问题能被准确诊断
- 提供清晰的修复建议
- 修复后功能正常
- 避免回归问题

请实现问题诊断和修复功能。
```

## 阶段 5：高级功能和优化

### 提示词 5.1：API 测试生成和验证

```markdown
我正在构建 Tibco BW 迁移工具，需要添加 API 测试生成功能。

**当前任务**：基于 Swagger 规范生成 API 测试代码

**要求**：
1. **Swagger 解析器** (`src/features/openapi/swagger-parser.ts`)：
   - 解析 swagger.json 文件
   - 提取 API 端点信息
   - 生成测试用例数据

2. **API 测试生成器** (`src/features/openapi/api-test-generator.ts`)：
   - 生成 JUnit 5 集成测试
   - 生成 Spring Boot Test 配置
   - 支持正向和负向测试用例

3. **测试代码模板**：
   ```java
   @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
   class SearchMoviesControllerIntegrationTest {

       @Test
       void shouldReturnMoviesWhenValidSearchString() {
           // 测试正常搜索场景
       }

       @Test
       void shouldReturnErrorWhenInvalidSearchString() {
           // 测试异常场景
       }
   }
   ```

4. **API 一致性验证**：
   - 对比生成的 API 与原始 Swagger 规范
   - 验证参数类型和响应格式
   - 检查错误处理

**验证要求**：
- 生成的测试代码可编译运行
- 测试覆盖主要 API 场景
- 与原始 Swagger 规范一致

请实现 API 测试生成功能。
```

### 提示词 5.2：性能优化和生产就绪

```markdown
我正在构建 Tibco BW 迁移工具，需要优化性能并准备生产部署。

**当前任务**：优化工具性能和生成代码质量

**要求**：
1. **性能优化**：
   - 并行处理多个文件
   - 缓存解析结果
   - 优化内存使用
   - 增量更新支持

2. **代码质量提升**：
   ```typescript
   // 代码生成选项
   interface CodeGenerationOptions {
     useJSR303Validation: boolean;
     useLombok: boolean;
     useJacksonAnnotations: boolean;
     includeConstructors: boolean;
     includeToString: boolean;
     generateDocumentation: boolean;
   }
   ```

3. **生产环境配置**：
   - 环境变量支持
   - 配置文件分离
   - 日志级别配置
   - 监控集成

4. **部署工具** (`src/utils/deployment-helper.ts`)：
   - Docker 配置生成
   - Kubernetes 部署文件
   - CI/CD 流水线配置

**高级功能**：
```bash
# 批量转换多个项目
tibco-cli batch-convert projects/ -o output/ -p com.company

# 生成部署配置
tibco-cli generate-deployment -t docker -o deployment/

# 性能分析
tibco-cli analyze-performance -i large-project/
```

**验证要求**：
- 处理大型项目时性能良好
- 生成的代码符合生产标准
- 部署配置完整可用

请实现性能优化和生产就绪功能。
```

## 学习路径建议

### 🎯 **适合不同水平的学员**

**初级学员**（熟悉 TypeScript/Node.js）：
1. 从阶段 1 开始，重点学习项目架构设计
2. 逐步实现每个解析器和生成器
3. 重点关注代码结构和测试

**中级学员**（有企业级开发经验）：
1. 可以跳过基础架构，直接从阶段 2 开始
2. 重点关注业务逻辑转换的复杂性
3. 深入理解 Tibco BW 和 Spring Boot 的差异

**高级学员**（有迁移工具开发经验）：
1. 可以从阶段 3 开始，重点关注自动化流程
2. 深入研究性能优化和错误处理
3. 扩展工具支持更多的 Tibco BW 特性

### 📚 **学习成果验证**

每个阶段完成后，学员应该能够：
- **阶段 1**：解析 XSD 文件并生成 Java 模型
- **阶段 2**：解析 BWP 文件并生成 Spring Boot 代码
- **阶段 3**：创建完整的 CLI 工具
- **阶段 4**：实现测试和问题修复
- **阶段 5**：优化工具并准备生产使用

### 🔧 **实践建议**

1. **渐进式开发**：每个阶段都要有可运行的代码
2. **测试驱动**：先写测试，再实现功能
3. **真实数据**：使用提供的示例项目进行测试
4. **文档记录**：记录遇到的问题和解决方案
5. **代码审查**：定期检查代码质量和架构设计

这个多轮提示词设计让学员能够从零开始构建一个完整的企业级迁移工具，同时学习到遗留系统迁移的核心技术和最佳实践。
