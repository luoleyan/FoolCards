/**
 * Jest测试设置文件
 * 在每个测试文件执行前运行
 */

// 设置测试环境
process.env.NODE_ENV = 'test';

// 模拟全局对象
global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 1,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

global.document = {
  createElement: jest.fn(() => ({
    getContext: jest.fn(() => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8Array(4)
      })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({
        data: new Uint8Array(4)
      })),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
      translate: jest.fn(),
      transform: jest.fn(),
      rotate: jest.fn()
    })),
    style: {},
    width: 800,
    height: 600
  }))
};

global.navigator = {
  userAgent: 'jest'
};

global.Image = class {
  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 100);
  }
};

global.Audio = class {
  constructor() {
    setTimeout(() => {
      if (this.oncanplaythrough) this.oncanplaythrough();
    }, 100);
  }
  
  play() {
    return Promise.resolve();
  }
  
  pause() {}
};

// 扩展Jest匹配器
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      };
    }
  }
});
