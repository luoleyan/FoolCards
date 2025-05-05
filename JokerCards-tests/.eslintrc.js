module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // 错误级别规则
    'no-console': 'off', // 允许使用console
    'no-debugger': 'error', // 禁止使用debugger
    'no-var': 'error', // 禁止使用var
    'prefer-const': 'error', // 建议使用const
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // 未使用的变量警告，忽略以_开头的参数
    'no-empty': 'warn', // 空块语句警告

    // 代码风格规则
    indent: ['error', 2, { SwitchCase: 1 }], // 使用2个空格缩进
    quotes: ['error', 'single', { avoidEscape: true }], // 使用单引号
    semi: ['error', 'always'], // 始终使用分号
    'comma-dangle': ['error', 'always-multiline'], // 多行时尾随逗号
    'arrow-parens': ['error', 'always'], // 箭头函数参数始终使用括号
    'max-len': ['warn', { code: 100, ignoreComments: true }], // 行长度限制

    // 最佳实践规则
    eqeqeq: ['error', 'always'], // 始终使用===和!==
    curly: ['error', 'all'], // 始终使用大括号
    'no-eval': 'error', // 禁止使用eval
    'no-implied-eval': 'error', // 禁止使用隐式eval
    'no-return-await': 'error', // 禁止不必要的return await
    'require-await': 'warn', // 异步函数应该使用await

    // ES6+规则
    'arrow-body-style': ['error', 'as-needed'], // 箭头函数体风格
    'prefer-arrow-callback': 'error', // 优先使用箭头函数作为回调
    'prefer-template': 'error', // 优先使用模板字符串
    'no-useless-rename': 'error', // 禁止不必要的重命名
    'object-shorthand': ['error', 'always'], // 使用对象简写
    'prefer-rest-params': 'error', // 优先使用剩余参数
    'prefer-spread': 'error', // 优先使用扩展运算符

    // Prettier集成规则
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: true,
        trailingComma: 'all',
        bracketSpacing: true,
        printWidth: 100,
        tabWidth: 2,
        arrowParens: 'always',
      },
    ],
  },
  overrides: [
    {
      // 测试文件的特殊规则
      files: ['**/*.test.js', '**/*_test.js', '**/tests/**/*.js'],
      rules: {
        'max-len': 'off', // 测试文件不限制行长度
        'no-unused-expressions': 'off', // 允许未使用的表达式（用于断言库）
      },
    },
  ],
};
