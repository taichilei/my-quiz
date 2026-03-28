import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseMarkdownToQuestions(markdown, examName, year, subject) {
  const questions = [];
  const lines = markdown.split('\n');
  let currentQuestion = null;
  let questionIndex = 0;
  let inOptions = false;
  let options = [];
  let images = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('### 第')) {
      if (currentQuestion && currentQuestion.content) {
        questions.push(finalizeQuestion(currentQuestion, examName, year, subject, questionIndex));
        questionIndex++;
      }

      const typeMatch = line.match(/（(单选|多选|判断)/);
      const type = typeMatch ? typeMatch[1] : '单选';
      const typeMap = {
        '单选': 'single',
        '多选': 'multiple',
        '判断': 'judge'
      };

      currentQuestion = {
        type: typeMap[type] || 'single',
        content: '',
        options: typeMap[type] === 'judge' ? undefined : [],
        tags: [],
        difficulty: 1,
        images: []
      };
      inOptions = false;
      options = [];
      images = [];
    } else if (line.startsWith('题目：')) {
      if (currentQuestion) {
        currentQuestion.content = line.substring(3).trim();
      }
    } else if (line.match(/^[A-D]\./)) {
      if (currentQuestion && currentQuestion.options) {
        const option = line.substring(2).trim();
        options.push(option);
        inOptions = true;
      }
    } else if (line.startsWith('**答案**:')) {
      if (currentQuestion) {
        const answerText = line.substring('**答案**:' .length).trim();
        if (currentQuestion.type === 'judge') {
          currentQuestion.answer = answerText === '正确';
        } else {
          currentQuestion.answer = answerText;
        }
      }
    } else if (line.startsWith('**解析**:')) {
      if (currentQuestion) {
        currentQuestion.explanation = line.substring('**解析**:' .length).trim();
      }
    } else if (line.startsWith('**标签**:')) {
      if (currentQuestion) {
        const tagsText = line.substring('**标签**:' .length).trim();
        currentQuestion.tags = tagsText.split(/[,，]/).map(t => t.trim()).filter(Boolean);
      }
    } else if (line.startsWith('**难度**:')) {
      if (currentQuestion) {
        const difficultyText = line.substring('**难度**:' .length).trim();
        currentQuestion.difficulty = parseInt(difficultyText);
      }
    } else if (line.startsWith('**图片**:')) {
      if (currentQuestion) {
        const imagesText = line.substring('**图片**:' .length).trim();
        currentQuestion.images = imagesText.split(/[,，]/).map(img => img.trim()).filter(Boolean);
      }
    } else if (line.startsWith('---')) {
      if (currentQuestion && currentQuestion.content) {
        if (currentQuestion.options && options.length > 0) {
          currentQuestion.options = options;
        }
        questions.push(finalizeQuestion(currentQuestion, examName, year, subject, questionIndex));
        questionIndex++;
        currentQuestion = null;
        inOptions = false;
        options = [];
      }
    }
  }

  if (currentQuestion && currentQuestion.content) {
    if (currentQuestion.options && options.length > 0) {
      currentQuestion.options = options;
    }
    questions.push(finalizeQuestion(currentQuestion, examName, year, subject, questionIndex));
  }

  return questions;
}

function finalizeQuestion(q, examName, year, subject, order) {
  return {
    id: `q_${year}_js_${order + 1}`,
    type: q.type || 'single',
    content: q.content || '',
    answer: q.answer || '',
    options: q.options,
    explanation: q.explanation,
    difficulty: q.difficulty || 1,
    tags: q.tags,
    images: q.images,
    exam: {
      name: examName,
      year,
      subject,
      part: '客观题',
      order: order + 1
    },
    createdAt: Date.now()
  };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node convert-md-to-json.mjs <markdown-file> [output-file]');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace('.md', '.json');

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(inputFile, 'utf-8');
  
  const examName = '2021年4月江苏省事业单位招聘考试';
  const year = 2021;
  const subject = '行政职业能力测验';

  const questions = parseMarkdownToQuestions(markdown, examName, year, subject);

  const outputData = JSON.stringify(questions, null, 2);
  fs.writeFileSync(outputFile, outputData, 'utf-8');

  console.log(`✅ Successfully converted ${questions.length} questions`);
  console.log(`📄 Output: ${outputFile}`);
}

main();
