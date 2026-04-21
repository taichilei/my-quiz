import { useState, useEffect, useRef } from 'react';
import type { Question, QuestionType, Difficulty, ExamRef } from '../types';
import { saveQuestion, generateId, updateQuestion, uploadFile, deleteUploadedFile } from '../db';

interface Props {
  onSaved: () => void;
  editingQuestion?: Question | null;
  onCancel?: () => void;
}

export default function QuestionForm({ onSaved, editingQuestion, onCancel }: Props) {
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

  // 图片
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 编辑模式：填充现有数据
  useEffect(() => {
    if (editingQuestion) {
      setType(editingQuestion.type);
      setContent(editingQuestion.content);
      setAnswer(editingQuestion.answer);
      setExplanation(editingQuestion.explanation || '');
      setDifficulty(editingQuestion.difficulty || '');
      setTags(editingQuestion.tags ? editingQuestion.tags.join(', ') : '');
      setCurrentImages(editingQuestion.images || []);
      if (editingQuestion.options) {
        // 确保至少有4个选项
        const filledOptions = [...editingQuestion.options];
        while (filledOptions.length < 4) {
          filledOptions.push('');
        }
        setOptions(filledOptions);
      } else {
        setOptions(['', '', '', '']);
      }
      if (editingQuestion.exam) {
        setExamName(editingQuestion.exam.name);
        setExamYear(editingQuestion.exam.year ? String(editingQuestion.exam.year) : '');
        setExamSubject(editingQuestion.exam.subject || '');
        setExamPart(editingQuestion.exam.part);
        setExamOrder(String(editingQuestion.exam.order));
      } else {
        setExamName('');
        setExamYear('');
        setExamSubject('');
        setExamPart('');
        setExamOrder('');
      }
    } else {
      // 重置表单
      setType('single');
      setContent('');
      setOptions(['', '', '', '']);
      setAnswer('');
      setExplanation('');
      setDifficulty('');
      setTags('');
      setCurrentImages([]);
      setExamName('');
      setExamYear('');
      setExamSubject('');
      setExamPart('');
      setExamOrder('');
    }
  }, [editingQuestion]);

  const resetForm = () => {
    setType('single');
    setContent('');
    setOptions(['', '', '', '']);
    setAnswer('');
    setExplanation('');
    setDifficulty('');
    setTags('');
    setCurrentImages([]);
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
    if ((type === 'single' || type === 'multiple') && options.filter(o => o.trim()).length > 0 && options.some(o => !o.trim())) {
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

      if (editingQuestion) {
        // 更新现有题目
        const updated: Question = {
          ...editingQuestion,
          type,
          content: content.trim(),
          options: type === 'judge' ? undefined : options.map(o => o.trim()).filter(Boolean),
          answer: type === 'judge' ? answer as boolean : answer as string,
          explanation: explanation.trim() || undefined,
          difficulty: difficulty || undefined,
          tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
          images: currentImages.length > 0 ? currentImages : undefined,
          exam,
          updatedAt: Date.now(),
        };
        await updateQuestion(editingQuestion.id, updated);
      } else {
        // 创建新题目
        const question: Question = {
          id: generateId(),
          type,
          content: content.trim(),
          options: type === 'judge' ? undefined : options.map(o => o.trim()),
          answer: type === 'judge' ? answer as boolean : answer as string,
          explanation: explanation.trim() || undefined,
          difficulty: difficulty || undefined,
          tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
          images: currentImages.length > 0 ? currentImages : undefined,
          exam,
          createdAt: Date.now(),
        };
        await saveQuestion(question);
        resetForm();
      }

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      setCurrentImages([...currentImages, uploaded.url]);
    } catch (error) {
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = currentImages.filter((_, i) => i !== index);
    setCurrentImages(newImages);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">
        {editingQuestion ? '编辑题目' : '添加题目'}
      </h2>

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

      {/* 图片（可选） */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">题目图片（可选）</label>
        {/* 已上传图片预览 */}
        {currentImages.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {currentImages.map((url, index) => (
              <div key={index} className="relative border rounded-lg overflow-hidden">
                <img src={url} alt={`图片 ${index + 1}`} className="w-full h-auto" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {/* 上传按钮 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {uploading && <p className="text-sm text-gray-500 mt-1">上传中...</p>}
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

      <div className="flex gap-2">
        {editingQuestion && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className={`${editingQuestion ? 'flex-1' : 'w-full'} bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors`}
        >
          {saving ? '保存中...' : (editingQuestion ? '保存修改' : '添加题目')}
        </button>
      </div>
    </form>
  );
}
