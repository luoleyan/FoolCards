/**
 * 下载测试报告所需的库文件
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 要下载的库文件
const libs = [
  {
    name: 'chart.js',
    url: 'https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js',
    dest: 'test-results/assets/chart.min.js',
  },
  {
    name: 'jspdf',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    dest: 'test-results/assets/jspdf.min.js',
  },
  {
    name: 'html2canvas',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    dest: 'test-results/assets/html2canvas.min.js',
  },
  {
    name: 'html2pdf',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
    dest: 'test-results/assets/html2pdf.min.js',
  },
];

// 确保目录存在
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 下载文件
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`下载失败，状态码: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });

    file.on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// 主函数
async function main() {
  // 确保目录存在
  ensureDirectoryExists(path.dirname(libs[0].dest));

  console.log('开始下载库文件...');

  for (const lib of libs) {
    try {
      console.log(`下载 ${lib.name}...`);
      await downloadFile(lib.url, lib.dest);
      console.log(`✅ ${lib.name} 下载完成`);
    } catch (error) {
      console.error(`❌ ${lib.name} 下载失败: ${error.message}`);
    }
  }

  console.log('库文件下载完成');
}

// 执行主函数
main().catch((error) => {
  console.error('下载过程中发生错误:', error);
  process.exit(1);
});
