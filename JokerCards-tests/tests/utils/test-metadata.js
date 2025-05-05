/**
 * 测试元数据配置
 * 用于存储测试目的、范围、方法等信息
 */

const testMetadata = {
  // 测试类型元数据
  types: {
    unit: {
      purpose: '验证FoolCards游戏代码单元（如类、函数、方法）的正确性，确保每个组件按预期工作。',
      scope: '覆盖游戏核心组件，包括卡牌、游戏管理器、AI对手、场景效果和特殊牌型等。',
      methods: '使用Jest测试框架，通过模拟依赖项和环境，对各个组件进行隔离测试。',
      environment: {
        hardware: '标准开发环境',
        software: 'Node.js 14+, Jest 29.7.0',
        dependencies: '模拟的Cocos Creator环境',
      },
    },
    functional: {
      purpose: '验证FoolCards游戏功能的正确性，确保各个功能模块能够正常工作并满足需求。',
      scope: '覆盖游戏核心功能，包括出牌、换牌、回合管理、分数计算等。',
      methods: '使用Jest测试框架，通过模拟游戏环境，测试各个功能模块的行为。',
      environment: {
        hardware: '标准开发环境',
        software: 'Node.js 14+, Jest 29.7.0',
        dependencies: '模拟的Cocos Creator环境',
      },
    },
    performance: {
      purpose: '评估FoolCards游戏性能，确保游戏在各种条件下能够流畅运行。',
      scope:
        '覆盖游戏性能关键点，包括卡牌初始化、游戏回合管理、AI决策、特殊牌型检测和场景效果应用等。',
      methods: '使用Jest测试框架，通过测量操作执行时间，评估性能表现。',
      environment: {
        hardware: '标准开发环境',
        software: 'Node.js 14+, Jest 29.7.0',
        dependencies: '模拟的Cocos Creator环境',
      },
    },
    system: {
      purpose: '验证整个FoolCards游戏系统的正确性，确保各个组件能够协同工作。',
      scope: '覆盖整个游戏系统，包括游戏初始化、回合管理、游戏结束等。',
      methods: '使用Jest测试框架，通过模拟完整游戏环境，测试系统级别的行为。',
      environment: {
        hardware: '标准开发环境',
        software: 'Node.js 14+, Jest 29.7.0',
        dependencies: '模拟的Cocos Creator环境',
      },
    },
    blackbox: {
      purpose: '从用户视角验证FoolCards游戏行为，不关注内部实现细节。',
      scope: '覆盖用户可见的游戏功能，包括游戏流程、交互和结果。',
      methods: '使用Jest测试框架，通过模拟用户操作，测试游戏的外部行为。',
      environment: {
        hardware: '标准开发环境',
        software: 'Node.js 14+, Jest 29.7.0',
        dependencies: '模拟的Cocos Creator环境',
      },
    },
    whitebox: {
      purpose: '从内部实现角度验证FoolCards游戏行为，关注代码路径和边界条件。',
      scope: '覆盖游戏内部实现细节，包括算法、数据结构和边界条件。',
      methods: '使用Jest测试框架，通过直接访问内部实现，测试代码路径和边界条件。',
      environment: {
        hardware: '标准开发环境',
        software: 'Node.js 14+, Jest 29.7.0',
        dependencies: '模拟的Cocos Creator环境',
      },
    },
    all: {
      purpose: '全面验证FoolCards游戏的各个方面，确保整体质量。',
      scope: '覆盖所有测试类型，包括单元测试、功能测试、性能测试、系统测试、黑盒测试和白盒测试。',
      methods: '使用Jest测试框架，综合各种测试方法，全面评估游戏质量。',
      environment: {
        hardware: '标准开发环境',
        software: 'Node.js 14+, Jest 29.7.0',
        dependencies: '模拟的Cocos Creator环境',
      },
    },
  },

  // 测试环境通用信息
  environment: {
    hardware: {
      cpu: '现代多核处理器',
      memory: '8GB+ RAM',
      gpu: '支持WebGL的图形卡',
    },
    software: {
      os: 'Windows 10/11, macOS, Linux',
      browser: 'Chrome 90+, Firefox 90+, Safari 14+',
      node: 'Node.js 14.16.0',
      npm: 'npm 6.14.11',
    },
    dependencies: {
      cocos: 'Cocos Creator 3.8.5',
      jest: 'Jest 29.7.0',
      babel: '@babel/core 7.23.7',
    },
  },

  // 测试结论与展望模板
  conclusionTemplates: {
    success: {
      conclusion: '测试结果表明，所有测试用例均已通过，游戏功能符合预期。',
      outlook: '未来可以考虑增加更多测试用例，覆盖更多边界条件和异常情况，进一步提高游戏质量。',
    },
    partial: {
      conclusion: '测试结果表明，部分测试用例未通过，需要进一步修复相关问题。',
      outlook: '建议优先修复失败的测试用例，并增加更多测试用例，覆盖更多边界条件和异常情况。',
    },
    failure: {
      conclusion: '测试结果表明，大部分测试用例未通过，游戏功能存在严重问题。',
      outlook: '建议全面检查代码，修复所有失败的测试用例，并重新设计测试策略，确保游戏质量。',
    },
  },

  // 问题与建议模板
  recommendationTemplates: {
    performance: {
      issue: '部分操作执行时间超过预期，可能影响游戏流畅度。',
      recommendation: '建议优化相关算法和数据结构，减少不必要的计算和内存使用。',
    },
    compatibility: {
      issue: '在某些浏览器或设备上可能存在兼容性问题。',
      recommendation: '建议增加更多兼容性测试，并使用特性检测而非浏览器检测来处理兼容性问题。',
    },
    usability: {
      issue: '部分游戏交互可能不够直观，影响用户体验。',
      recommendation: '建议进行用户测试，收集反馈，并优化游戏交互设计。',
    },
    security: {
      issue: '可能存在安全风险，如数据泄露或注入攻击。',
      recommendation: '建议进行安全审计，并采用安全最佳实践，如输入验证、数据加密等。',
    },
    maintainability: {
      issue: '代码结构可能不够清晰，影响后续维护。',
      recommendation: '建议重构部分代码，提高代码可读性和可维护性，并增加文档和注释。',
    },
  },
};

module.exports = testMetadata;
