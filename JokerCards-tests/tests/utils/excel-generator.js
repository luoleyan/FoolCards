/**
 * Excel文件生成工具
 * 用于将测试报告数据导出为Excel文件
 */

const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

class ExcelGenerator {
  /**
   * 创建Excel文件
   * @param {string} filePath - 文件保存路径
   * @param {Array} sheets - 工作表配置数组
   * @returns {Promise<string>} - 返回生成的文件路径
   */
  static async createExcelFile(filePath, sheets) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'FoolCards Test Report Generator';
      workbook.lastModifiedBy = 'FoolCards Test System';
      workbook.created = new Date();
      workbook.modified = new Date();

      // 确保目录存在
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 创建工作表
      for (const sheet of sheets) {
        const worksheet = workbook.addWorksheet(sheet.name);

        // 设置列
        worksheet.columns = sheet.columns;

        // 添加数据
        worksheet.addRows(sheet.rows);

        // 设置表头样式
        if (sheet.columns && sheet.columns.length > 0) {
          const headerRow = worksheet.getRow(1);
          headerRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD3D3D3' } // 浅灰色背景
            };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          });
          headerRow.height = 20;
        }

        // 设置数据行样式
        if (sheet.rows && sheet.rows.length > 0) {
          for (let i = 2; i <= sheet.rows.length + 1; i++) {
            const row = worksheet.getRow(i);
            row.eachCell((cell) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };

              // 根据状态设置颜色
              if (sheet.statusColumn && cell.col === sheet.statusColumn) {
                const status = cell.value ? cell.value.toString().toLowerCase() : '';
                if (status.includes('通过') || status.includes('passed')) {
                  cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD8F0D8' } // 浅绿色
                  };
                } else if (status.includes('失败') || status.includes('failed')) {
                  cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF2DEDE' } // 浅红色
                  };
                } else if (status.includes('待定') || status.includes('pending')) {
                  cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFCF8E3' } // 浅黄色
                  };
                }
              }
            });
          }
        }

        // 自动调整列宽
        worksheet.columns.forEach(column => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = Math.min(maxLength + 2, 50); // 最大宽度限制为50
        });
      }

      // 保存文件
      await workbook.xlsx.writeFile(filePath);
      console.log(`Excel文件已生成: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('生成Excel文件时出错:', error);
      throw error;
    }
  }

  /**
   * 生成测试用例表Excel
   * @param {string} outputDir - 输出目录
   * @param {Array} testCases - 测试用例数据
   * @returns {Promise<string>} - 返回生成的文件路径
   */
  static async generateTestCasesExcel(outputDir, testCases) {
    const filePath = path.join(outputDir, 'FoolCards测试用例清单.xlsx');

    const sheets = [{
      name: '测试用例',
      columns: [
        { header: '用例ID', key: 'id', width: 10 },
        { header: '用例名称', key: 'name', width: 20 },
        { header: '用例描述', key: 'description', width: 40 },
        { header: '预期结果', key: 'expectedResult', width: 30 },
        { header: '实际结果', key: 'actualResult', width: 30 },
        { header: '状态', key: 'status', width: 10 }
      ],
      rows: testCases.map(testCase => ({
        id: testCase.id,
        name: testCase.name,
        description: testCase.description,
        expectedResult: testCase.expectedResult,
        actualResult: testCase.actualResult,
        status: testCase.status === 'passed' ? '通过' :
                testCase.status === 'failed' ? '失败' :
                testCase.status === 'pending' ? '待定' : '未知'
      })),
      statusColumn: 6 // 状态列的索引
    }];

    return this.createExcelFile(filePath, sheets);
  }

  /**
   * 生成决策表Excel
   * @param {string} outputDir - 输出目录
   * @param {Object} decisionTable - 决策表数据
   * @returns {Promise<string>} - 返回生成的文件路径
   */
  static async generateDecisionTableExcel(outputDir, decisionTable) {
    const filePath = path.join(outputDir, 'FoolCards决策表.xlsx');

    // 准备列定义
    const columns = [
      { header: '场景', key: 'name', width: 20 }
    ];

    // 添加条件列
    for (let i = 0; i < decisionTable.headers.conditions.length; i++) {
      columns.push({
        header: decisionTable.headers.conditions[i],
        key: `condition_${i}`,
        width: 15
      });
    }

    // 添加动作列
    for (let i = 0; i < decisionTable.headers.actions.length; i++) {
      columns.push({
        header: decisionTable.headers.actions[i],
        key: `action_${i}`,
        width: 15
      });
    }

    // 添加结果列
    for (let i = 0; i < decisionTable.headers.results.length; i++) {
      columns.push({
        header: decisionTable.headers.results[i],
        key: `result_${i}`,
        width: 15
      });
    }

    // 准备行数据
    const rows = decisionTable.scenarios.map(scenario => {
      const row = {
        name: scenario.name
      };

      // 添加条件值
      for (let i = 0; i < scenario.conditions.length; i++) {
        row[`condition_${i}`] = scenario.conditions[i] ? '是' : '否';
      }

      // 添加动作值
      for (let i = 0; i < scenario.actions.length; i++) {
        row[`action_${i}`] = scenario.actions[i] ? '是' : '否';
      }

      // 添加结果值
      for (let i = 0; i < scenario.results.length; i++) {
        row[`result_${i}`] = scenario.results[i] ? '是' : '否';
      }

      return row;
    });

    const sheets = [{
      name: '决策表',
      columns,
      rows
    }];

    return this.createExcelFile(filePath, sheets);
  }

  /**
   * 生成需求追踪矩阵Excel
   * @param {string} outputDir - 输出目录
   * @param {Array} requirements - 需求数据
   * @returns {Promise<string>} - 返回生成的文件路径
   */
  static async generateRequirementMatrixExcel(outputDir, requirements) {
    const filePath = path.join(outputDir, 'FoolCards需求追踪矩阵.xlsx');

    const sheets = [{
      name: '需求追踪矩阵',
      columns: [
        { header: '需求ID', key: 'id', width: 10 },
        { header: '需求描述', key: 'description', width: 40 },
        { header: '优先级', key: 'priority', width: 10 },
        { header: '关联测试用例', key: 'testCases', width: 20 },
        { header: '覆盖状态', key: 'coverage', width: 15 },
        { header: '测试结果', key: 'result', width: 15 }
      ],
      rows: requirements.map(req => ({
        id: req.id,
        description: req.description,
        priority: req.priority,
        testCases: req.testCases ? req.testCases.join(', ') : '无',
        coverage: req.coverage === 'covered' ? '已覆盖' :
                 req.coverage === 'partial' ? '部分覆盖' :
                 req.coverage === 'not-covered' ? '未覆盖' : '未知',
        result: req.result === 'passed' ? '通过' :
               req.result === 'failed' ? '失败' :
               req.result === 'pending' ? '待定' : '未知'
      })),
      statusColumn: 6 // 测试结果列的索引
    }];

    return this.createExcelFile(filePath, sheets);
  }

  /**
   * 生成缺陷跟踪表Excel
   * @param {string} outputDir - 输出目录
   * @param {Array} defects - 缺陷数据
   * @returns {Promise<string>} - 返回生成的文件路径
   */
  static async generateDefectTrackingExcel(outputDir, defects) {
    const filePath = path.join(outputDir, 'FoolCards缺陷跟踪记录.xlsx');

    const sheets = [{
      name: '缺陷跟踪表',
      columns: [
        { header: '缺陷ID', key: 'id', width: 10 },
        { header: '缺陷描述', key: 'description', width: 40 },
        { header: '严重性', key: 'severity', width: 10 },
        { header: '状态', key: 'status', width: 15 },
        { header: '报告日期', key: 'reportDate', width: 15 },
        { header: '关联测试用例', key: 'testCase', width: 15 },
        { header: '解决方案', key: 'solution', width: 30 }
      ],
      rows: defects.map(defect => ({
        id: defect.id,
        description: defect.description,
        severity: defect.severity === 'critical' ? '严重' :
                 defect.severity === 'high' ? '高' :
                 defect.severity === 'medium' ? '中' :
                 defect.severity === 'low' ? '低' : '未知',
        status: defect.status === 'open' ? '未解决' :
               defect.status === 'in-progress' ? '处理中' :
               defect.status === 'fixed' ? '已修复' :
               defect.status === 'closed' ? '已关闭' : '未知',
        reportDate: defect.reportDate,
        testCase: defect.testCase || '无',
        solution: defect.solution || '无'
      })),
      statusColumn: 4 // 状态列的索引
    }];

    return this.createExcelFile(filePath, sheets);
  }
}

module.exports = ExcelGenerator;
