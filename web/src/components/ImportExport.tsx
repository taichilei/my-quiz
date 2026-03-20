import { useState, useRef } from 'react';
import { importQuestionBank, exportQuestionsJson } from '../utils/import';
import { getQuestions, importQuestions, clearQuestions } from '../db';

interface Props {
  onImported: () => void;
}

export default function ImportExport({ onImported }: Props) {
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);

    try {
      const result = await importQuestionBank(file);

      if (result.success) {
        await importQuestions(result.questions);
        setMessage({
          type: 'success',
          text: `成功导入 ${result.questions.length} 道题目${result.errors.length > 0 ? `，${result.errors.length} 道格式错误被跳过` : ''}`,
        });
        onImported();
      } else {
        setMessage({
          type: 'error',
          text: result.errors.join('；') || '导入失败',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '导入失败',
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    try {
      const questions = await getQuestions();
      if (questions.length === 0) {
        setMessage({ type: 'error', text: '没有可导出的题目' });
        return;
      }
      exportQuestionsJson(questions, `questions_${Date.now()}.json`);
      setMessage({ type: 'success', text: `成功导出 ${questions.length} 道题目` });
    } catch (error) {
      setMessage({ type: 'error', text: '导出失败' });
    }
  };

  const handleClear = async () => {
    if (!confirm('确定要清空所有题目吗？此操作不可恢复！')) return;

    try {
      await clearQuestions();
      setMessage({ type: 'success', text: '已清空所有题目' });
      onImported();
    } catch (error) {
      setMessage({ type: 'error', text: '清空失败' });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">导入导出</h2>

      {/* 导入 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          导入题库（JSON 格式）
        </label>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={importing}
            className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          支持题目数组或题库格式，参考 question-banks/ 目录下的文件
        </p>
      </div>

      {/* 导出 */}
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          导出题目
        </button>
        <button
          onClick={handleClear}
          className="px-4 bg-red-50 text-red-600 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors"
        >
          清空
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
