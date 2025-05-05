/**
 * 自动替换测试报告中的游戏名称
 * 将所有"JokerCards"替换为"FoolCards"
 */

const fs = require('fs');
const path = require('path');

// 测试报告目录
const REPORTS_DIR = path.join(__dirname, 'test-results');

// 需要替换的文本
const OLD_TEXT = '测试套件 for JokerCards 游戏';
const NEW_TEXT = '测试套件 for FoolCards 游戏';

/**
 * 替换文件中的文本
 * @param {string} filePath - 文件路径
 * @param {string} oldText - 要替换的文本
 * @param {string} newText - 替换后的文本
 * @returns {boolean} - 是否进行了替换
 */
function replaceTextInFile(filePath, oldText, newText) {
  try {
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf8');

    // 检查文件是否包含要替换的文本
    if (!content.includes(oldText)) {
      console.log(`文件 ${filePath} 不包含要替换的文本`);
      return false;
    }

    // 替换文本
    const newContent = content.replace(new RegExp(oldText, 'g'), newText);

    // 写入文件
    fs.writeFileSync(filePath, newContent, 'utf8');

    console.log(`文件 ${filePath} 中的文本已替换`);
    return true;
  } catch (error) {
    console.error(`替换文件 ${filePath} 中的文本时出错:`, error);
    return false;
  }
}

/**
 * 处理目录中的所有HTML文件
 * @param {string} dir - 目录路径
 * @returns {number} - 处理的文件数量
 */
function processDirectory(dir) {
  try {
    // 获取目录中的所有文件
    const files = fs.readdirSync(dir);

    let count = 0;

    // 处理每个文件
    for (const file of files) {
      const filePath = path.join(dir, file);

      // 获取文件状态
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // 如果是目录，递归处理
        count += processDirectory(filePath);
      } else if (stat.isFile() && path.extname(file).toLowerCase() === '.html') {
        // 如果是HTML文件，替换文本
        if (replaceTextInFile(filePath, OLD_TEXT, NEW_TEXT)) {
          count++;
        }
      }
    }

    return count;
  } catch (error) {
    console.error(`处理目录 ${dir} 时出错:`, error);
    return 0;
  }
}

// 主函数
function main() {
  console.log('开始替换测试报告中的游戏名称...');

  // 检查测试报告目录是否存在
  if (!fs.existsSync(REPORTS_DIR)) {
    console.error(`测试报告目录 ${REPORTS_DIR} 不存在`);
    return;
  }

  // 处理测试报告目录
  const count = processDirectory(REPORTS_DIR);

  console.log(`处理完成，共替换了 ${count} 个文件`);
}

// 执行主函数
main();
