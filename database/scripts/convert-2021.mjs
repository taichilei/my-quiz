import fs from 'fs';

// 读取原始文件
const mdPath = './2021年4月江苏省事业单位考试选择题/2021_cleaned.md';
const jsonPath = './question-banks/jiangsu-2021-04/questions.json';

const content = fs.readFileSync(mdPath, 'utf-8');

// 按题目分割
const questionBlocks = content.split(/^---$/m);

const questions = [];

for (const block of questionBlocks) {
  if (!block.includes('**第')) continue;

  // 提取题号
  const numMatch = block.match(/\*\*第(\d+)题\*\*/);
  if (!numMatch) continue;
  const num = parseInt(numMatch[1]);

  // 跳过图片题和不完整题目
  if (block.includes('图片题') || block.includes('不完整')) {
    console.log(`跳过第${num}题：图片题或不完整`);
    continue;
  }

  // 提取题目内容（到选项之前）
  const contentMatch = block.match(/\*\*第\d+题\*\*\s*(.+?)(?=\n[A-D]\.|$)/s);
  let questionContent = contentMatch ? contentMatch[1].trim() : '';
  questionContent = questionContent.replace(/\n+/g, ' ').trim();

  // 提取选项
  const options = [];
  const optMatches = block.matchAll(/^([A-D])\.\s*(.+)$/gm);
  for (const m of optMatches) {
    options.push(m[2].trim());
  }

  // 提取答案
  const answerMatch = block.match(/答案[：:]\s*([A-D]+|A,B?C?|正确|错误)/i);
  let answer = answerMatch ? answerMatch[1].trim() : '';
  if (answer === '正确') answer = 'A';
  if (answer === '错误') answer = 'B';

  // 提取解析
  const explanationMatch = block.match(/\*解析[：:]\s*(.+?)(?=\n---|$)/s);
  const explanation = explanationMatch ? explanationMatch[1].trim() : '';

  // 判断题型
  let type = 'single';
  if (answer.includes(',')) type = 'multiple';

  // 确定标签和难度
  let tags = [];
  let difficulty = 1;

  // 根据题目内容判断标签
  if (questionContent.includes('习近平') || questionContent.includes('党史') || questionContent.includes('脱贫攻坚')) {
    tags.push('政治', '时事');
    difficulty = 2;
  } else if (questionContent.includes('德') || questionContent.includes('老子') || questionContent.includes('道')) {
    tags.push('哲学', '传统文化');
    difficulty = 2;
  } else if (questionContent.includes('新冠') || questionContent.includes('疫情') || questionContent.includes('经济')) {
    tags.push('经济', '时事');
    difficulty = 2;
  } else if (questionContent.includes('排序') || questionContent.includes('时间')) {
    tags.push('判断推理');
    difficulty = 2;
  } else if (questionContent.includes('类比') || questionContent.includes('：')) {
    tags.push('判断推理');
    difficulty = 2;
  } else if (questionContent.includes('资料') || questionContent.includes('江苏省') || questionContent.includes('GDP')) {
    tags.push('资料分析');
    difficulty = 2;
  } else if (questionContent.includes('以下哪项') || questionContent.includes('可以得出')) {
    tags.push('逻辑判断');
    difficulty = 2;
  } else {
    tags.push('常识');
    difficulty = 1;
  }

  questions.push({
    id: `q_2021_js_${num}`,
    type,
    content: questionContent,
    options,
    answer,
    explanation: explanation || undefined,
    exam: {
      name: '2021年4月江苏省事业单位招聘考试',
      year: 2021,
      subject: '行政职业能力测验',
      part: '客观题',
      order: num
    },
    difficulty,
    tags,
    createdAt: Date.now()
  });
}

// 写回文件
fs.writeFileSync(jsonPath, JSON.stringify(questions, null, 2));
console.log(`转换完成：${questions.length} 道题目`);
