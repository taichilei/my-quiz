
// 批量导入题目到后端 API
// 自动扫描 database/quizzes/*/questions.json 并导入
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:8080/api/questions';
const QUIZZES_DIR = path.join(process.cwd(), '../quizzes');
const RAW_DIR = path.join(process.cwd(), '../raw');

// 扫描所有 quizzes 子目录中的 questions.json
function findAllQuizFiles() {
  const quizzes = [];
  if (!fs.existsSync(QUIZZES_DIR)) {
    return quizzes;
  }
  const dirs = fs.readdirSync(QUIZZES_DIR);
  for (const dir of dirs) {
    const quizPath = path.join(QUIZZES_DIR, dir, 'questions.json');
    if (fs.existsSync(quizPath)) {
      quizzes.push({
        examName: dir,
        path: quizPath,
      });
    }
  }
  return quizzes;
}

// 检查 raw 目录中哪些原始文件还没转换
function checkUnconvertedRawFiles() {
  const unconverted = [];
  if (!fs.existsSync(RAW_DIR)) {
    return unconverted;
  }
  const files = fs.readdirSync(RAW_DIR);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (['.pdf', '.doc', '.docx', '.txt'].includes(ext)) {
      // 检查 quizzes 目录下是否有对应目录
      const baseName = path.basename(file, ext);
      const quizDir = path.join(QUIZZES_DIR, baseName);
      const quizJson = path.join(quizDir, 'questions.json');
      if (!fs.existsSync(quizJson)) {
        unconverted.push({ file, baseName, path: path.join(RAW_DIR, file) });
      }
    }
  }
  return unconverted;
}

async function importQuestionsFromFile(filePath, examName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const questions = JSON.parse(content);
    if (!Array.isArray(questions)) {
      console.log(`⚠️  ${examName}: 不是题目数组，跳过`);
      return { success: 0, fail: 0, total: 0 };
    }

    console.log(`\n📋 [${examName}] 准备导入 ${questions.length} 道题目...`);

    let success = 0;
    let fail = 0;

    for (const q of questions) {
      // 添加 exam 信息，如果没有的话
      if (!q.exam && q.examName) {
        q.exam = { name: examName };
      }

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(q),
        });

        if (response.ok) {
          success++;
          if (questions.length <= 10 || success % 10 === 0) {
            console.log(`✅ [${success}/${questions.length}] 已导入`);
          }
        } else {
          fail++;
          console.error(`❌ 导入失败 - HTTP ${response.status}`);
        }
      } catch (err) {
        fail++;
        console.error(`❌ ${err.message}`);
      }
    }

    console.log(`✅ [${examName}] 完成: 成功 ${success}, 失败 ${fail}, 总计 ${questions.length}`);
    return { success, fail, total: questions.length };
  } catch (err) {
    console.error(`❌ [${examName}] 读取文件失败: ${err.message}`);
    return { success: 0, fail: 1, total: 0 };
  }
}

async function main() {
  console.log('🔍 扫描题目文件...\n');

  // 1. 检查未转换的原始文件
  const unconverted = checkUnconvertedRawFiles();
  if (unconverted.length > 0) {
    console.log('⚠️  发现以下原始题源尚未转换为 JSON:');
    unconverted.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.file} → 预期在 quizzes/${u.baseName}/questions.json`);
    });
    console.log('');
  } else {
    console.log('✅ 所有原始题源都已转换完成\n');
  }

  // 2. 找到所有需要导入的题目
  const quizFiles = findAllQuizFiles();
  if (quizFiles.length === 0) {
    console.log('❌ 没有找到任何题目文件，请检查 database/quizzes/ 目录');
    process.exit(1);
  }

  console.log(`📚 发现 ${quizFiles.length} 个题库:`);
  quizFiles.forEach((q, i) => {
    console.log(`   ${i + 1}. ${q.examName} → ${q.path}`);
  });
  console.log('');

  // 3. 逐个导入
  let totalSuccess = 0;
  let totalFail = 0;
  let totalQuestions = 0;

  for (const quiz of quizFiles) {
    const result = await importQuestionsFromFile(quiz.path, quiz.examName);
    totalSuccess += result.success;
    totalFail += result.fail;
    totalQuestions += result.total;
  }

  // 4. 汇总
  console.log('\n🎉 批量导入完成！');
  console.log(`   总计题库数: ${quizFiles.length}`);
  console.log(`   总题目数: ${totalQuestions}`);
  console.log(`   成功导入: ${totalSuccess}`);
  console.log(`   导入失败: ${totalFail}`);

  if (unconverted.length > 0) {
    console.log(`\n⚠️  提醒: 还有 ${unconverted.length} 个原始文件需要转换为 JSON 格式`);
  }
}

main().catch(err => {
  console.error('💥 发生错误:', err);
  process.exit(1);
});
