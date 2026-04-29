
// 转换 2025 招聘笔试 PDF 文本到项目JSON格式
import fs from 'fs';

const txtPath = '/Users/tai/Projects/my-quiz/database/test/2025招聘笔试.txt';
const outputPath = '/Users/tai/Projects/my-quiz/database/test/2025招聘笔试.json';

let content = fs.readFileSync(txtPath, 'utf8');
// 移除换页符
content = content.replace(/\f/g, '\n');
const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

// 过滤掉页眉页脚广告
const filteredLines = lines.filter(line => {
  if (line.includes('专业网校课程') || line.includes('职业考试学习平台')) return false;
  if (line.match(/^\d+$/) && line.length < 5) return false; // 页码
  return true;
});

const questions = [];
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
    subject: '综合能力',
    part: '真题',
    order: 1,
  },
};
let order = 1;

for (const line of filteredLines) {
  // 检查是否是新题开头: "1. ..." 或 "165.【单项选择题】..."
  let questionMatch = line.match(/^(\d+)\.\s*(?:【单项选择题】\s*)?(.*)/);
  if (questionMatch) {
    // 保存上一题（至少要有内容、3个以上选项、答案）
    if (current.content && current.options.length >= 3 && current.answer) {
      current.exam.order = order++;
      // 判断学科分类
      if (current.content.match(/(?:利率|货币|汇率|黄金|债券|股票|银行|金融|GDP|失业|财政|信用|通货膨胀|资本|储蓄)/i)) {
        current.tags = ['金融', '经济'];
        current.exam.subject = '经济金融';
      } else if (current.content.match(/(?: According|Which of the following|文章|阅读|author|question)/i)) {
        current.tags = ['英语', '阅读理解'];
        current.exam.subject = '英语';
      } else {
        current.tags = ['行测'];
        current.exam.subject = '行测';
      }
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
        subject: '综合能力',
        part: '真题',
        order: order++,
      },
    };
    continue;
  }

  // 检查是否是选项: "A. ..." "B. ..." ... (也可能是 "A...." 没有空格)
  const optionMatch = line.match(/^([A-Z])\.\s*(.*)/);
  if (optionMatch) {
    current.options.push(optionMatch[2]);
    continue;
  }

  // 检查是否是参考答案
  const answerMatch = line.match(/^参考答案：\s*([A-Z])/);
  if (answerMatch) {
    current.answer = answerMatch[1];
    continue;
  }

  // 检查是否是解析开头 【解析】
  if (line.includes('【解析】') || line.includes('解析：')) {
    let exp = line.replace(/.*【解析】/, '').replace(/.*解析：/, '').trim();
    current.explanation = exp;
    continue;
  }

  // 如果已经有答案了，后面都是解析，直接追加
  if (current.answer) {
    current.explanation += ' ' + line;
    continue;
  }

  // 如果还没有答案，也没有选项，说明是题干换行
  if (current.options.length === 0) {
    current.content += ' ' + line;
    continue;
  }

  // 最后一种情况：选项已经有了，答案还没出，选项换行（这种情况很少）
  if (current.options.length > 0 && !current.answer) {
    // 追加到最后一个选项
    if (current.options.length > 0) {
      current.options[current.options.length - 1] += ' ' + line;
    }
    continue;
  }

  // 其他情况，默认追加到解析
  if (current.answer) {
    current.explanation += ' ' + line;
  }
}

// 保存最后一题
if (current.content && current.options.length >= 3 && current.answer) {
  current.exam.order = order++;
  if (current.content.match(/(?:利率|货币|汇率|黄金|债券|股票|银行|金融|GDP|失业|财政|信用)/i)) {
    current.tags = ['金融', '经济'];
    current.exam.subject = '经济金融';
  } else if (current.content.match(/(?: According|Which of the following|文章|阅读|author|question)/i)) {
    current.tags = ['英语', '阅读理解'];
    current.exam.subject = '英语';
  } else {
    current.tags = ['行测'];
    current.exam.subject = '行测';
  }
  questions.push({...current});
}

console.log(`转换完成！共 ${questions.length} 道题目`);
questions.slice(0, 20).forEach((q, i) => {
  console.log(`${i + 1}. [${q.exam.subject}] ${q.content.slice(0, 40)}... -> ${q.options.length} 选项, 答案: ${q.answer}`);
});
if (questions.length > 20) {
  console.log(`... 还有 ${questions.length - 20} 题`);
}

// 清理多余空格
questions.forEach(q => {
  q.content = q.content.replace(/\s+/g, ' ').trim();
  q.options = q.options.map(opt => opt.replace(/\s+/g, ' ').trim());
  if (q.explanation) q.explanation = q.explanation.replace(/\s+/g, ' ').trim();
});

// 写入JSON文件
fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf8');
console.log(`\n已保存到: ${outputPath}`);
