/**
 * 简单的HTTP服务器，用于提供HTML文件
 * 使用方法：
 * 1. 安装Node.js
 * 2. 在命令行中运行：node server.js
 * 3. 在浏览器中访问：http://localhost:8080
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 支持的MIME类型
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 解析请求的URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // 默认提供index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // 获取文件的完整路径
  const filePath = path.join(__dirname, pathname);
  
  // 获取文件扩展名
  const extname = path.extname(filePath);
  
  // 默认的内容类型
  let contentType = mimeTypes[extname] || 'application/octet-stream';
  
  // 读取文件
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 文件不存在
        fs.readFile(path.join(__dirname, '404.html'), (err, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        // 服务器错误
        res.writeHead(500);
        res.end(`服务器错误: ${err.code}`);
      }
    } else {
      // 成功响应
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// 设置服务器端口
const port = 8080;

// 启动服务器
server.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}/`);
  console.log(`按Ctrl+C停止服务器`);
});
