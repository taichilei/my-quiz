
// 转换 2025 招聘笔试 PDF 文本到项目JSON格式
import fs from 'fs';

const txtPath = '/Users/tai/Projects/my-quiz/database/test/2025招聘笔试.txt';
const outputPath = '/Users/tai/Projects/my-quiz/database/test/2025招聘笔试.json';

const content = fs.readFileSync(txtPath, 'utf8');
const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

// 过滤掉页眉页脚广告
const filteredLines = lines.filter(line => {
  if (line.includes('专业网校课程') || line.includes('职业考试学习平台')) return false;
  if (line.match(/^\d+$/) && line.length < 5) return false; // 页码
  return true;
});

const questions = [];
let state = 'question'; // question -> options -> answer -> explanation
let current = {
  type: 'single',
  content: '',
  options: [],
  answer: '',
  explanation: '',
  difficulty: 2,
  tags: ['金融', '经济'],
  exam: {
    name: '2025招聘笔试',
    year: 2025,
    subject: '专业知识',
    part: '真题',
    order: 1,
  },
};
let order = 1;

for (const line of filteredLines) {
  // 检查是否是新题开头: "1. ..."
  const questionMatch = line.match(/^(\d+)\.\s+(.*)/);
  if (questionMatch) {
    // 保存上一题
    if (current.content && current.options.length === 4 && current.answer) {
      current.exam.order = order++;
      questions.push({...current});
    }
    // 开始新题
    current = {
      type: 'single',
      content: questionMatch[2],
      options: [],
      answer: '',
      explanation: '',
      difficulty: 2,
      tags: ['金融', '经济'],
      exam: {
        name: '2025招聘笔试',
        year: 2025,
        subject: '专业知识',
        part: '真题',
        order: order++,
      },
    };
    state = 'options';
    continue;
  }

  // 检查是否是选项: "A. ..." "B. ..." ...
  const optionMatch = line.match(/^[A-Z]\.\s*(.*)/);
  if (optionMatch && state === 'options') {
    current.options.push(optionMatch[1]);
    continue;
  }

  // 检查是否是参考答案
  const answerMatch = line.match(/^参考答案：\s*([A-Z])/);
  if (answerMatch) {
    current.answer = answerMatch[1];
    state = 'explanation';
    continue;
  }

  // 检查是否是解析开头 【解析】
  if (line.includes('【解析】') || line.includes('解析：')) {
    let exp = line.replace(/.*【解析】/, '').replace(/.*解析：/, '').trim();
    current.explanation = exp;
    continue;
  }

  // 如果在解析状态，追加到解析
  if (state === 'explanation' && current.answer) {
    current.explanation += ' ' + line;
    continue;
  }

  // 如果在 options 状态但不是选项开头，可能是题干换行
  if (state === 'options' && current.options.length === 0) {
    current.content += ' ' + line;
    continue;
  }

  // 其他情况，追加到解析（多行解析）
  if (current.answer) {
    current.explanation += ' ' + line;
  }
}

// 保存最后一题
if (current.content && current.options.length === 4 && current.answer) {
  current.exam.order = order++;
  questions.push({...current});
}

console.log(`转换完成！共 ${questions.length} 道题目`);
questions.forEach((q, i) => {
  console.log(`${i + 1}. ${q.content.slice(0, 50)}... -> ${q.options.length} 选项, 答案: ${q.answer}`);
});

// 清理多余空格
questions.forEach(q => {
  q.content = q.content.replace(/\s+/g, ' ').trim();
  q.options = q.options.map(opt => opt.replace(/\s+/g, ' ').trim());
  if (q.explanation) q.explanation = q.explanation.replace(/\s+/g, ' ').trim();
});

// 写入JSON文件
fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf8');
console.log(`\n已保存到: ${outputPath}`);
