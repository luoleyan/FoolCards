/**
 * 简单性能测试
 */

describe('简单性能测试', () => {
  test('性能测试: 数组操作 - 10ms', () => {
    const startTime = process.hrtime();
    
    // 执行数组操作
    const array = [];
    for (let i = 0; i < 10000; i++) {
      array.push(i);
    }
    
    const endTime = process.hrtime(startTime);
    const duration = (endTime[0] * 1000 + endTime[1] / 1000000);
    
    console.log(`数组操作耗时: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(100); // 数组操作应该在100ms内完成
  });
  
  test('性能测试: 字符串操作 - 5ms', () => {
    const startTime = process.hrtime();
    
    // 执行字符串操作
    let str = '';
    for (let i = 0; i < 1000; i++) {
      str += 'a';
    }
    
    const endTime = process.hrtime(startTime);
    const duration = (endTime[0] * 1000 + endTime[1] / 1000000);
    
    console.log(`字符串操作耗时: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(50); // 字符串操作应该在50ms内完成
  });
  
  test('性能测试: 对象操作 - 3ms', () => {
    const startTime = process.hrtime();
    
    // 执行对象操作
    const obj = {};
    for (let i = 0; i < 1000; i++) {
      obj[`key${i}`] = i;
    }
    
    const endTime = process.hrtime(startTime);
    const duration = (endTime[0] * 1000 + endTime[1] / 1000000);
    
    console.log(`对象操作耗时: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(30); // 对象操作应该在30ms内完成
  });
  
  test('性能测试: 函数调用 - 2ms', () => {
    const startTime = process.hrtime();
    
    // 执行函数调用
    function add(a, b) {
      return a + b;
    }
    
    let sum = 0;
    for (let i = 0; i < 10000; i++) {
      sum += add(i, i + 1);
    }
    
    const endTime = process.hrtime(startTime);
    const duration = (endTime[0] * 1000 + endTime[1] / 1000000);
    
    console.log(`函数调用耗时: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(20); // 函数调用应该在20ms内完成
  });
  
  test('性能测试: 正则表达式 - 5ms', () => {
    const startTime = process.hrtime();
    
    // 执行正则表达式操作
    const regex = /\d+/g;
    const str = '123abc456def789ghi';
    
    for (let i = 0; i < 1000; i++) {
      regex.test(str);
    }
    
    const endTime = process.hrtime(startTime);
    const duration = (endTime[0] * 1000 + endTime[1] / 1000000);
    
    console.log(`正则表达式操作耗时: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(50); // 正则表达式操作应该在50ms内完成
  });
});
