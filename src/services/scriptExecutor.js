const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const IsolatedSandbox = require('../utils/sandbox');
const ReportManager = require('../utils/reportManager');

class ScriptExecutor {
  constructor() {
    this.reportManager = new ReportManager();
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureDirs();
    this.activeTasks = new Map();
  }

  ensureDirs() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 执行动态脚本内容
   * @param {string} scriptContent - JavaScript 代码（支持 async/await）
   * @param {Object} injections - 注入到沙箱的全局对象，通常包含 page, agent 等
   * @param {Object} params - 普通参数对象，可通过全局变量 params 访问
   */
  async executeDynamicScript(scriptContent, injections = {}, params = {}) {
    const taskId = uuidv4();
    
    const report = {
      taskId,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      status: 'running',
      steps: [],
      params,
      scriptType: 'dynamic'
    };

    this.activeTasks.set(taskId, {
      status: 'running',
      startTime: Date.now()
    });

    const stepLogs = [];
    const addStep = (stepName, status, details = {}) => {
      const step = {
        stepName,
        status,
        timestamp: new Date().toISOString(),
        ...details
      };
      stepLogs.push(step);
      report.steps.push(step);
      console.log(`[${taskId}] [${status.toUpperCase()}] ${stepName}`,details || '无');
    };

    let sandbox = null;
    try {
      console.log(`[${taskId}] 开始执行动态脚本`);

      // 1. 创建并初始化沙箱
      sandbox = new IsolatedSandbox({ memoryLimit: 512 });
      await sandbox.init();

      // 2. 注入步骤记录函数和工具
      const sandboxAPI = {
        __addStep: (stepName, status, details) => {
          addStep(stepName, status, details);
        },
        __log: (...args) => console.log(`[${taskId}]`, ...args),
        __error: (...args) => console.error(`[${taskId}]`, ...args),
      };
      await sandbox.injectAPI(sandboxAPI);

      // 3. 注入外部需要的浏览器对象（page, agent 等）
      if (injections && Object.keys(injections).length > 0) {
        await sandbox.injectAPI(injections);
      }

      addStep('初始化沙箱环境', 'success');

      // 4. 准备全局参数（将以普通变量形式存在于脚本中）
      const globalParams = {
        taskId,
        params,
      };

      addStep('编译并执行脚本', 'success');
      // console.log(`scriptContent=`, scriptContent);

      // 5. 执行脚本
      const result = await sandbox.execute(scriptContent, globalParams);
      console.log("result=",result)
      if (result.success) {
        addStep('脚本执行完成', 'success', { duration: result.duration });
        report.status = 'completed';
        report.result = result.result;
        report.duration = result.duration + 'ms';
        console.log(`[${taskId}] 脚本执行成功，耗时: ${result.duration}ms`);
      } else {
        addStep('脚本执行失败', 'failed', { error: result.error });
        report.status = 'failed';
        report.error = result.error;
        report.duration = result.duration + 'ms';
        console.error(`[${taskId}] 脚本执行失败: ${result.error}`);
      }

    } catch (error) {
      report.status = 'failed';
      report.error = error.message;
      report.steps.push({
        stepName: '异常捕获',
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error.message
      });
      console.error(`[${taskId}] 执行异常: ${error.message}`);
    } finally {
      report.endTime = new Date().toISOString();
      if (!report.duration) {
        const ms = (new Date(report.endTime) - new Date(report.startTime));
        report.duration = ms + 'ms';
      }

      // 保存报告
      await this.reportManager.saveReport(taskId, report);
      this.activeTasks.delete(taskId);

      // 清理沙箱资源
      if (sandbox) {
        await sandbox.dispose();
      }
    }

    return report;
  }

  /**
   * 执行存储的脚本文件
   * @param {string} scriptPath - 脚本文件路径
   * @param {Object} injections - 注入到沙箱的对象
   * @param {Object} params - 普通参数
   */
  async executeStoredScript(scriptPath, injections = {}, params = {}) {
    const taskId = uuidv4();
    
    const report = {
      taskId,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      status: 'running',
      steps: [],
      params,
      scriptType: 'stored',
      scriptPath
    };

    this.activeTasks.set(taskId, {
      status: 'running',
      startTime: Date.now()
    });

    try {
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`脚本文件不存在: ${scriptPath}`);
      }

      const scriptContent = fs.readFileSync(scriptPath, 'utf8');
      return await this.executeDynamicScript(scriptContent, injections, params);

    } catch (error) {
      report.status = 'failed';
      report.error = error.message;
      report.endTime = new Date().toISOString();
      const ms = (new Date(report.endTime) - new Date(report.startTime));
      report.duration = ms + 'ms';

      await this.reportManager.saveReport(taskId, report);
      this.activeTasks.delete(taskId);
      
      return report;
    }
  }

  getActiveTasks() {
    const tasks = [];
    for (const [taskId, info] of this.activeTasks.entries()) {
      tasks.push({
        taskId,
        status: info.status,
        runningTime: (Date.now() - info.startTime) / 1000 + '秒'
      });
    }
    return tasks;
  }

  async shutdown() {
    // 如果有全局的 sandbox 资源需要清理，但这里每个任务独立创建，无需额外清理
    console.log('ScriptExecutor shutdown complete');
  }
}

module.exports = ScriptExecutor;