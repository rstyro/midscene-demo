const express = require('express');
const ScriptExecutor = require('../services/scriptExecutor');
const ReportManager = require('../utils/reportManager');
const browserManager = require('../utils/browserManager');

const router = express.Router();
const executor = new ScriptExecutor();
const reportManager = new ReportManager();


router.post('/execute', async (req, res) => {
  let pageContext = null;
  try {
    const { scriptContent, params } = req.body;

    if (!scriptContent) {
      return res.status(400).json({ 
        success: false, 
        error: 'scriptContent 不能为空' 
      });
    }
    const { page, agent, context } = await browserManager.createIsolatedPage();
    pageContext = { page, agent, context };
    const report = await executor.executeDynamicScript(scriptContent, { page, agent },params || {});
    res.json(report);
    
  } catch (error) {
    console.error('执行动态脚本异常:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }finally {
    // 无论成功失败，释放此请求的 page 和 context
    if (pageContext) {
      await browserManager.closePageContext(pageContext.context, pageContext.page);
    }
  }
});

router.post('/execute/stored', async (req, res) => {
  let pageContext = null;
  try {
    const { scriptPath, params } = req.body;
    
    if (!scriptPath) {
      return res.status(400).json({ 
        success: false, 
        error: 'scriptPath 不能为空' 
      });
    }
    const { page, agent, context } = await browserManager.createIsolatedPage();
    pageContext = { page, agent, context };
    const report = await executor.executeStoredScript(scriptPath, { page, agent },params || {});
    res.json(report);
    
  } catch (error) {
    console.error('执行存储脚本异常:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }finally {
    // 无论成功失败，释放此请求的 page 和 context
    if (pageContext) {
      await browserManager.closePageContext(pageContext.context, pageContext.page);
    }
  }
});

router.get('/reports/:taskId', (req, res) => {
  const { taskId } = req.params;
  
  if (!taskId) {
    return res.status(400).json({ 
      success: false, 
      error: 'taskId 不能为空' 
    });
  }

  const report = reportManager.getReport(taskId);
  
  if (report) {
    res.json(report);
  } else {
    res.status(404).json({ 
      success: false, 
      error: '报告未找到' 
    });
  }
});

router.get('/reports', (req, res) => {
  const reports = reportManager.listReports();
  res.json({ 
    success: true, 
    reports 
  });
});

router.delete('/reports/:taskId', (req, res) => {
  const { taskId } = req.params;
  
  if (!taskId) {
    return res.status(400).json({ 
      success: false, 
      error: 'taskId 不能为空' 
    });
  }

  const deleted = reportManager.deleteReport(taskId);
  
  if (deleted) {
    res.json({ 
      success: true, 
      message: '报告已删除' 
    });
  } else {
    res.status(404).json({ 
      success: false, 
      error: '报告未找到' 
    });
  }
});

// 查询活跃任务
router.get('/tasks/active', (req, res) => {
  const activeTasks = executor.getActiveTasks();
  res.json({ 
    success: true, 
    activeTasks 
  });
});

// 健康检查
router.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeTasks: executor.getActiveTasks().length
  });
});

module.exports = router;