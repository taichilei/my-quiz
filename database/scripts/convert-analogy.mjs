
// 转换类比推理90题到项目JSON格式
import fs from 'fs';

const txtPath = '/Users/tai/Projects/my-quiz/database/test/类比推理90题.txt';
const outputPath = '/Users/tai/Projects/my-quiz/database/test/类比推理90题.json';

const content = fs.readFileSync(txtPath, 'utf8');
const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

const questions = [];
let currentQuestion = null;
let currentOptions = [];
let questionIndex = 1;

// 分割一行中的多个选项 (如 "A.xxx B.yyy C.zzz D.www")
function splitOptionsInLine(line) {
  const options = [];
  // 匹配 A. 或 A 开头的选项
  const parts = line.split(/(?=[A-D][\.．\s])/);
  for (let part of parts) {
    part = part.trim();
    if (!part) continue;
    // 去掉选项标号
    const match = part.match(/^[A-D][\.．]?\s*(.*)/);
    if (match) {
      options.push(match[1]);
    } else {
      options.push(part);
    }
  }
  return options;
}

for (const line of lines) {
  // 跳过广告
  if (line.includes('微信') || line.includes('PAGE') || line.includes('国企央企')) {
    continue;
  }

  // 检查是否是新题开头: "1. ..." 或 "61、..."
  const questionMatch = line.match(/^(\d+)[.．、]\s*(.*)/);
  if (questionMatch) {
    // 保存上一题
    if (currentQuestion && currentOptions.length > 0) {
      questions.push({
        ...currentQuestion,
        options: [...currentOptions],
      });
    }
    // 开始新题
    currentQuestion = {
      type: 'single',
      content: questionMatch[2],
      answer: '',
      explanation: '',
      difficulty: 2,
      tags: ['类比推理'],
      exam: {
        name: '公务员考试',
        year: 0,
        subject: '判断推理',
        part: '类比推理',
        order: questionIndex++,
      },
    };
    currentOptions = [];
    continue;
  }

  // 检查这一行是否包含多个选项 (A. ... B. ...)
  if (line.match(/[A-D]\./) && (line.match(/[A-D]\./g) || []).length > 1) {
    const split = splitOptionsInLine(line);
    currentOptions.push(...split);
    continue;
  }

  // 检查是否是选项: "A...." "B...." ...
  const optionMatch = line.match(/^[A-D][\.．、]?\s*(.*)/);
  if (optionMatch && currentQuestion) {
    currentOptions.push(optionMatch[1]);
    continue;
  }

  // 检查是否包含答案: "答案：B"
  if (line.includes('答案：') || line.includes('答案:') || line.match(/^答案/)) {
    const ansMatch = line.match(/答案[:：]\s*([A-Za-z])/);
    if (ansMatch && currentQuestion) {
      currentQuestion.answer = ansMatch[1].toUpperCase();
      // 如果本行还有解析，提取出来
      if (line.includes('解析：') || line.includes('解析:')) {
        const parts = line.split(/解析[:：]?/);
        if (parts[1]) {
          currentQuestion.explanation = parts[1].trim();
        }
      }
      continue;
    }
  }
  // 行开头就是答案，比如 "B..."
  const startAnswerMatch = line.match(/^([A-Za-z])\s+/);
  if (startAnswerMatch && currentQuestion && !currentQuestion.answer) {
    currentQuestion.answer = startAnswerMatch[1].toUpperCase();
    // 剩下的是解析
    const rest = line.replace(/^[A-Za-z]\s+/, '');
    if (rest) {
      currentQuestion.explanation = rest;
    }
    continue;
  }

  // 检查答案在开头，后面跟解析 "B 解析 ..."
  const answerWithParseMatch = line.match(/^([A-Za-z])\s+解析\s*(.*)/);
  if (answerWithParseMatch && currentQuestion) {
    currentQuestion.answer = answerWithParseMatch[1].toUpperCase();
    currentQuestion.explanation = answerWithParseMatch[2].trim();
    continue;
  }

  // 检查是否是解析: "解析：..."
  if (line.startsWith('解析：') || line.startsWith('解析: ')) {
    let explanation = line;
    if (explanation.startsWith('解析：')) {
      explanation = explanation.slice(3);
    } else {
      explanation = explanation.slice(3);
    }
    if (currentQuestion) {
      currentQuestion.explanation = explanation.trim();
    }
    continue;
  }

  // 如果已经有答案了，追加到解析
  if (currentQuestion && currentQuestion.answer) {
    if (currentQuestion.explanation) {
      currentQuestion.explanation += ' ' + line;
    } else {
      currentQuestion.explanation = line;
    }
    continue;
  }

  // 如果内容为空，跳过
  if (!line.trim()) continue;

  // 其他情况，可能是题干换行，追加到content
  if (currentQuestion && currentOptions.length === 0) {
    currentQuestion.content += ' ' + line;
  }
}

// 保存最后一题
if (currentQuestion && currentOptions.length > 0) {
  // 处理最后一题可能没有答案解析的情况
  if (!currentQuestion.answer && currentOptions.length > 4) {
    // 最后一个可能是答案
    const last = currentOptions.pop();
    const ansMatch = last.match(/^([A-Za-z])/);
    if (ansMatch) {
      currentQuestion.answer = ansMatch[1].toUpperCase();
      currentQuestion.explanation = last.replace(/^[A-Za-z]\s*/, '');
    }
  }
  questions.push({
    ...currentQuestion,
    options: [...currentOptions],
  });
}

// 后处理：补全一些缺失的答案解析（有些题目的格式有点乱）
questions.forEach((q, i) => {
  if (!q.answer && q.options.length > 4) {
    // 如果选项超过4个，说明最后一个选项其实是答案+解析
    const last = q.options.pop();
    const ansMatch = last.match(/^([A-Za-z])[。．]?\s*(.*)/);
    if (ansMatch) {
      q.answer = ansMatch[1].toUpperCase();
      q.explanation = ansMatch[2];
    }
  }
  // 修复题干序号残留
  q.content = q.content.replace(/^(\d+)\s+/, '');
  // 清理多余空格
  q.content = q.content.replace(/\s+/g, ' ').trim();
  if (q.explanation) q.explanation = q.explanation.replace(/\s+/g, ' ').trim();
});

// 过滤掉不完整的题目（没有答案的）
const validQuestions = questions.filter(q => q.options.length === 4 && q.answer);
const invalid = questions.filter(q => q.options.length !== 4 || !q.answer);

console.log(`转换完成！`);
console.log(`  - 完整题目: ${validQuestions.length} 道`);
console.log(`  - 不完整: ${invalid.length} 道（格式问题无法解析）`);
validQuestions.forEach((q, i) => {
  console.log(`${i + 1}. ${q.content.slice(0, 40).padEnd(40)} -> ${q.options.length} 选项, 答案: ${q.answer}`);
});

if (invalid.length > 0) {
  console.log(`\n不完整题目（需要手动修复）:`);
  invalid.forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.content.slice(0, 40)} - ${q.options.length} 选项, 答案: ${q.answer || '缺失'}`);
  });
}

// 写入JSON文件
fs.writeFileSync(outputPath, JSON.stringify(validQuestions, null, 2), 'utf8');
console.log(`\n已保存 ${validQuestions.length} 道题到: ${outputPath}`);
