import { useState } from 'react';
import type { Question, QuestionType, Difficulty, ExamRef } from '../types';
import { saveQuestion, generateId } from '../db';

interface Props {
  onSaved: () => void;
}

export default function QuestionForm({ onSaved }: Props) {
  const [type, setType] = useState<QuestionType>('single');
  const [content, setContent] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [answer, setAnswer] = useState<string | boolean>('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  // 考试信息
  const [examName, setExamName] = useState('');
  const [examYear, setExamYear] = useState<string>('');
  const [examSubject, setExamSubject] = useState('');
  const [examPart, setExamPart] = useState('');
  const [examOrder, setExamOrder] = useState<string>('');

  const resetForm = () => {
    setType('single');
    setContent('');
    setOptions(['', '', '', '']);
    setAnswer('');
    setExplanation('');
    setDifficulty('');
    setTags('');
    setExamName('');
    setExamYear('');
    setExamSubject('');
    setExamPart('');
    setExamOrder('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    if (!content.trim()) return;
    if (type === 'judge' && answer === '') return;
    if (type !== 'judge' && !answer) return;
    if ((type === 'single' || type === 'multiple') && options.some(o => !o.trim())) {
      alert('请填写所有选项');
      return;
    }

    setSaving(true);
    try {
      // 构建考试信息
      let exam: ExamRef | undefined;
      if (examName && examPart && examOrder) {
        exam = {
          name: examName.trim(),
          year: examYear ? parseInt(examYear) : undefined,
          subject: examSubject.trim() || undefined,
          part: examPart.trim(),
          order: parseInt(examOrder),
        };
      }

      const question: Question = {
        id: generateId(),
        type,
        content: content.trim(),
        options: type === 'judge' ? undefined : options.map(o => o.trim()),
        answer: type === 'judge' ? answer as boolean : answer as string,
        explanation: explanation.trim() || undefined,
        difficulty: difficulty || undefined,
        tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        exam,
        createdAt: Date.now(),
      };

      await saveQuestion(question);
      resetForm();
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">添加题目</h2>

      {/* 题目类型 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">题目类型</label>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as QuestionType);
            setAnswer('');
          }}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="single">单选题</option>
          <option value="multiple">多选题</option>
          <option value="judge">判断题</option>
        </select>
      </div>

      {/* 题目内容 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">题目内容</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="输入题目内容..."
          required
        />
      </div>

      {/* 选项（非判断题） */}
      {type !== 'judge' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">选项</label>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <input
                key={idx}
                type="text"
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`选项 ${String.fromCharCode(65 + idx)}`}
                required
              />
            ))}
          </div>
        </div>
      )}

      {/* 答案 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          答案 {type === 'multiple' && '（多选用逗号分隔，如：A,B,C）'}
        </label>
        {type === 'judge' ? (
          <select
            value={answer === true ? 'true' : answer === false ? 'false' : ''}
            onChange={(e) => {
              if (e.target.value === 'true') setAnswer(true);
              else if (e.target.value === 'false') setAnswer(false);
              else setAnswer('');
            }}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">请选择</option>
            <option value="true">正确</option>
            <option value="false">错误</option>
          </select>
        ) : type === 'single' ? (
          <select
            value={answer as string}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">请选择</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        ) : (
          <input
            type="text"
            value={answer as string}
            onChange={(e) => setAnswer(e.target.value.toUpperCase())}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入答案，如：A,B,C"
            required
          />
        )}
      </div>

      {/* 解析 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">解析（可选）</label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="输入解析..."
        />
      </div>

      {/* 难度 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">难度（可选）</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value ? parseInt(e.target.value) as Difficulty : '')}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">请选择</option>
          <option value="1">简单</option>
          <option value="2">中等</option>
          <option value="3">困难</option>
        </select>
      </div>

      {/* 标签 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">标签（可选，逗号分隔）</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="如：计算机, 网络"
        />
      </div>

      {/* 考试信息 */}
      <details className="border rounded-lg p-3">
        <summary className="cursor-pointer text-sm font-medium text-gray-700">考试信息（可选）</summary>
        <div className="mt-3 space-y-3">
          <input
            type="text"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="考试名称，如：2017年下半年江苏省事业单位招聘考试"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={examYear}
              onChange={(e) => setExamYear(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="年份，如：2017"
            />
            <input
              type="text"
              value={examSubject}
              onChange={(e) => setExamSubject(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="科目"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={examPart}
              onChange={(e) => setExamPart(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="部分，如：客观题"
            />
            <input
              type="number"
              value={examOrder}
              onChange={(e) => setExamOrder(e.target.value)}
              className="w-24 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="题号"
              min="1"
            />
          </div>
        </div>
      </details>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
      >
        {saving ? '保存中...' : '添加题目'}
      </button>
    </form>
  );
}
