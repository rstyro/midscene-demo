# Midscene Demo

基于 @midscene/web 的 AI 驱动网页自动化测试框架演示项目。

## 功能特性

- 🤖 **AI 驱动测试**: 集成豆包、GLM 等多种大语言模型
- 🌐 **浏览器自动化**: 基于 Playwright 的网页操作能力
- 📝 **脚本执行**: 支持动态脚本和存储脚本的执行
- 📊 **报告管理**: 完整的测试报告生成和管理功能
- 🔌 **REST API**: 提供标准化的 API 接口

## 技术栈

- **Node.js** - 运行时环境
- **Express 5.x** - Web 服务器框架
- **Playwright** - 浏览器自动化工具
- **@midscene/web** - AI 网页理解与交互库
- **dotenv** - 环境变量管理

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

复制 `.env` 文件并配置 AI 模型密钥：

```bash
# 配置 ARK_API_KEY 环境变量
# 或直接修改 .env 文件中的模型配置
```

### 启动服务

```bash
# 开发模式
pnpm run dev

# 生产模式
pnpm run start
```

服务启动后访问: http://localhost:3000

## API 接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/midscene/health` | GET | 健康检查 |
| `/api/exec/execute` | POST | 执行动态脚本 |
| `/api/exec/execute/stored` | POST | 执行存储脚本 |
| `/api/exec/reports/{taskId}` | GET | 查询测试报告 |
| `/api/exec/reports` | GET | 查询报告列表 |
| `/api/exec/reports/{taskId}` | DELETE | 删除测试报告 |
| `/api/exec/tasks/active` | GET | 查询活跃任务 |
| `/api/exec/health` | GET | API 健康检查 |

## 项目结构

```
midscene-demo/
├── src/
│   ├── routes/          # 路由定义
│   │   └── testRoutes.js
│   ├── services/        # 服务层
│   │   └── scriptExecutor.js
│   ├── test/            # 测试脚本
│   │   └── 必应检索日历.js
│   └── utils/           # 工具函数
│       ├── browserManager.js
│       ├── reportManager.js
│       └── sandbox.js
├── midscene_run/        # 运行日志和报告
│   ├── log/             # 日志文件
│   └── report/          # 测试报告
├── reports/             # JSON 报告
├── .env                 # 环境变量配置
├── package.json         # 项目配置
└── server.js            # 服务入口
```

## 使用示例

执行存储的测试脚本：

```bash
curl -X POST http://localhost:3000/api/exec/execute/stored \
  -H "Content-Type: application/json" \
  -d '{"scriptName": "D:\\midscene-demo\\src\\test\\必应检索日历.js"}'
```

执行动态脚本：

```bash
curl -X POST http://localhost:3000/api/exec/execute \
  -H "Content-Type: application/json" \
  -d '{
    "script": "await page.goto(\"https://www.bing.com\"); console.log(\"页面已加载\");"
  }'
```