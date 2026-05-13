// 沙箱 sandbox.js - 使用 Node.js 内置 vm 模块，支持传递 page/agent 等复杂对象
const vm = require('vm');

class IsolatedSandbox {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 60000, // 默认60秒
    };
    this.context = null;
  }

  async init() {
    if (this.context) return;
    // 创建基础上下文，注入常用的全局工具
    const sandbox = {
      console: {
        log: (...args) => console.log('[Sandbox]', ...args),
        error: (...args) => console.error('[Sandbox]', ...args),
        warn: (...args) => console.warn('[Sandbox]', ...args),
        info: (...args) => console.info('[Sandbox]', ...args),
      },
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      Buffer: Buffer,
      // 注意：不提供 require 和 process，保持基本安全
    };
    // 冻结 console 方法避免被篡改
    Object.freeze(sandbox.console);
    this.context = vm.createContext(sandbox);
  }

  /**
   * 注入外部 API 到沙箱全局对象中
   * @param {Object} apiMap 键值对，例如 { page, agent, __addStep }
   */
  async injectAPI(apiMap) {
    await this.init();
    for (const [key, value] of Object.entries(apiMap)) {
      this.context[key] = value;
    }
  }

  /**
   * 执行脚本
   * @param {string} scriptContent - 脚本代码字符串
   * @param {Object} contextParams - 额外的全局参数（会被注入）
   * @returns {Promise<{success: boolean, result?: any, error?: string, duration?: number}>}
   */
  async execute(scriptContent, contextParams = {}) {
    await this.init();
    const startTime = Date.now();

    // 合并参数到上下文
    for (const [key, value] of Object.entries(contextParams)) {
      this.context[key] = value;
    }

    // 包装脚本为 async 函数，方便捕获 return 值
    // 注意：用户脚本可以直接使用 await，并且最后返回的值会被捕获
    const wrappedScript = `(async () => { ${scriptContent} })()`;

    try {
      const script = new vm.Script(wrappedScript, {
        timeout: this.options.timeout,
        displayErrors: true,
      });
      const result = await script.runInContext(this.context);
      return {
        success: true,
        result,
        duration: Date.now() - startTime,
      };
    } catch (err) {
      console.error('Sandbox execution error:', err);
      return {
        success: false,
        error: err.message,
        stack: err.stack,
        duration: Date.now() - startTime,
      };
    }
  }

  async dispose() {
    // 释放上下文（gc 会回收）
    this.context = null;
  }
}

module.exports = IsolatedSandbox;