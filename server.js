const express = require('express');
const browserManager = require('./src/utils/browserManager');
// 环境变量
require('dotenv-expand').expand(require('dotenv').config());
const testRoutes = require('./src/routes/testRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const HEADLESS = process.env.HEADLESS !== 'false';
const TIMEOUT = parseInt(process.env.TIMEOUT || '30000');

// 限制允许接收的 JSON 请求体最大大小为 50MB。默认通常是 100KB
app.use(express.json({limit: '50mb'}));
// 日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    // 将控制权交给下一个中间件或路由处理器，确保请求继续执行
    next();
});

app.get('/midscene/health', async (req, res) => {
    const {browser} = await browserManager.getBrowser();
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        headless: process.env.HEADLESS !== 'false',
        initialized: !!browser,
    });
});

// 挂载新的脚本执行路由
app.use('/api/exec', testRoutes);

// 404处理
app.use((req, res, next) => {
    res.status(404).json({
        code: 404,
        message: '接口不存在',
        path: req.originalUrl,
        method: req.method
    });
});


// 全局错误处理
app.use((err, req, res, next) => {
    console.error('全局错误:',err);

    res.status(err.status || 500).json({
        code: err.status || 500,
        message: err.message || '服务器内部错误'
    });
});

// 优雅关闭
process.on('SIGINT', async () => {
    await browserManager.cleanup();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await browserManager.cleanup();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`✅ Midscene 服务运行在 http://localhost:${PORT}`);
    console.log(`   - 模式: ${HEADLESS ? '无头' : '有头'}`);
    console.log(`   - 超时: ${TIMEOUT}ms`);
    console.log('');
    console.log('=== 原有接口 ===');
    console.log(`   - 健康检查: GET  /midscene/health`);
    console.log('');
    console.log('=== 脚本 REST API 接口 ===');
    console.log(`   - 执行动态脚本:    POST /api/exec/execute`);
    console.log(`   - 执行存储脚本:    POST /api/exec/execute/stored`);
    console.log(`   - 查询测试报告:    GET  /api/exec/reports/{taskId}`);
    console.log(`   - 查询报告列表:    GET  /api/exec/reports`);
    console.log(`   - 删除测试报告:    DELETE /api/exec/reports/{taskId}`);
    console.log(`   - 查询活跃任务:    GET  /api/exec/tasks/active`);
    console.log(`   - API健康检查:     GET  /api/exec/health`);
});