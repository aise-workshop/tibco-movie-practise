# TIBCO Movie Example

## 分阶段迁移模板

### 📋 阶段 1：项目分析

```markdown
我需要分析一个 Tibco BW 项目的迁移可行性。

**项目路径**：`{TIBCO_BW_PROJECT_PATH}`

请帮我：

1. **结构分析**：
   ```bash
   # 验证 BWP 文件
   find {TIBCO_BW_PROJECT_PATH} -name "*.bwp" -exec node dist/cli.js validate -i {} \;
   
   # 检查项目结构
   node dist/cli.js auto {TIBCO_BW_PROJECT_PATH} --no-deploy --no-app-start
   ```

2. **生成分析报告**：
   - BWP 文件数量和复杂度
   - XSD Schema 结构
   - 外部依赖识别
   - 潜在风险评估

3. **制定迁移计划**：
   - 优先级排序
   - 分阶段策略
   - 资源需求评估

请提供详细的分析结果和建议的迁移路径。
```

### 🔧 阶段 2：核心转换

```markdown
我已完成项目分析，现在需要执行核心转换。

**当前状态**：项目分析完成，准备开始转换
**目标**：生成可编译的 Spring Boot 代码

请帮我：

1. **执行转换**：
   ```bash
   node dist/cli.js auto {TIBCO_BW_PROJECT_PATH} -p {PACKAGE_NAME} --no-app-start
   ```

2. **验证生成结果**：
   - 检查生成的 Controller 和 Service
   - 验证 XSD 模型类
   - 确认 application.properties 配置

3. **修复常见问题**：
   - toString 方法问题
   - 外部 API 配置
   - 数据类型映射

4. **编译验证**：
   ```bash
   cd spring-boilerplate
   mvn compile
   ```

请确保生成的代码结构正确且能编译通过。
```

### 🧪 阶段 3：API 测试验证

```markdown
我已完成代码转换，现在需要验证 API 功能。

**当前状态**：Spring Boot 代码生成完成，编译通过
**目标**：验证 API 功能正确性

请帮我：

1. **生成并执行 API 测试**：
   ```bash
   node dist/cli.js test-api {TIBCO_BW_PROJECT_PATH} \
     --spring-boot-project spring-boilerplate \
     -p {PACKAGE_NAME} \
     --port 8080
   ```

2. **验证检查点**：
   - [ ] Spring Boot 应用启动成功
   - [ ] API 端点响应正确
   - [ ] 与原始 Swagger 规范一致
   - [ ] 外部 API 调用正常

3. **功能测试**：
   ```bash
   # 测试主要 API
   curl "http://localhost:8080/movies?searchString=batman"
   
   # 验证响应格式
   # 预期：{"search":[...],"totalResults":"613","response":"True"}
   ```

4. **问题排查**：
   - 如果 API 返回空数据，检查外部 API 配置
   - 如果启动失败，检查依赖和配置
   - 如果测试失败，分析错误日志

请确保所有 API 功能正常工作。
```

## 问题解决模板

### 🔍 配置问题诊断

```markdown
我的 Tibco BW 迁移项目遇到配置相关问题。

**问题描述**：{具体问题描述}
**错误信息**：
```
{错误日志}
```

请帮我：

1. **诊断问题**：
   - 分析错误日志
   - 检查相关配置文件
   - 识别根本原因

2. **解决方案**：
   - 提供具体的修复步骤
   - 更新配置文件
   - 验证修复效果

3. **预防措施**：
   - 避免类似问题的最佳实践
   - 配置验证方法

请提供详细的解决方案和验证步骤。
```

### 🚨 API 调用问题修复

```markdown
我的迁移项目中外部 API 调用有问题。

**问题现象**：
- API 返回空数据或错误
- 外部服务调用失败
- 参数映射不正确

**当前配置**：
- 项目路径：{TIBCO_BW_PROJECT_PATH}
- 生成的代码路径：spring-boilerplate

请帮我：

1. **分析原始配置**：
   - 检查 .substvar 文件中的 API 配置
   - 分析 BWP 文件中的外部服务调用
   - 验证参数映射规则

2. **修复生成的代码**：
   - 更新 application.properties
   - 修正 Service 类中的 API 调用
   - 调整参数映射逻辑

3. **验证修复**：
   ```bash
   # 重新启动应用
   cd spring-boilerplate
   mvn spring-boot:run
   
   # 测试 API
   curl "http://localhost:8080/movies?searchString=batman"
   ```

请确保外部 API 调用正常工作。
```



