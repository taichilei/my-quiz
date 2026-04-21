import { useRef, useState } from 'react';
import type { Question } from '../types';
import { deleteQuestion, importQuestions, clearQuestions } from '../db';
import { importQuestionBank, exportQuestionsJson } from '../utils/import';
import QuestionForm from './QuestionForm';

interface Props {
  questions: Question[];
  onUpdated: () => void;
}

// 按试卷分组
function groupByExam(questions: Question[]): Map<string, Question[]> {
  const map = new Map<string, Question[]>();
  questions.forEach(q => {
    const key = q.exam?.name || '未分类';
    const list = map.get(key) || [];
    list.push(q);
    map.set(key, list);
  });
  // 按试卷内题目顺序排序
  map.forEach(list => {
    list.sort((a, b) => (a.exam?.order || 0) - (b.exam?.order || 0));
  });
  return map;
}

export default function QuestionList({ questions, onUpdated }: Props) {
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedExam, setExpandedExam] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const examGroups = groupByExam(questions);

  // 文件上传
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          text: `成功导入 ${result.questions.length} 道题目`,
        });
        onUpdated();
      } else {
        setMessage({ type: 'error', text: result.errors.join('；') || '导入失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '导入失败' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 导出
  const handleExport = () => {
    if (questions.length === 0) {
      setMessage({ type: 'error', text: '没有可导出的题目' });
      return;
    }
    exportQuestionsJson(questions, `questions_${Date.now()}.json`);
    setMessage({ type: 'success', text: `成功导出 ${questions.length} 道题目` });
  };

  // 清空
  const handleClear = async () => {
    if (!confirm('确定要清空所有题目吗？此操作不可恢复！')) return;
    await clearQuestions();
    setMessage({ type: 'success', text: '已清空所有题目' });
    onUpdated();
  };

  // 删除单题
  const handleDelete = async (id: string) => {
    if (confirm('确定删除这道题目吗？')) {
      await deleteQuestion(id);
      onUpdated();
    }
  };

  // 删除整个试卷
  const handleDeleteExam = async (examName: string) => {
    const examQuestions = examGroups.get(examName) || [];
    if (!confirm(`确定要删除「${examName}」的所有 ${examQuestions.length} 道题目吗？`)) return;
    for (const q of examQuestions) {
      await deleteQuestion(q.id);
    }
    onUpdated();
  };

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">导入题库</h2>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            disabled={importing}
            className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

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

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* 试卷列表 */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">试卷列表</h2>

        {examGroups.size === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            暂无题目，请先导入题库
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from(examGroups.entries()).map(([examName, examQuestions]) => (
              <div key={examName} className="bg-white rounded-lg shadow overflow-hidden">
                {/* 试卷头部 */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedExam(expandedExam === examName ? null : examName)}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedExam === examName ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-800">{examName}</h3>
                      <p className="text-sm text-gray-500">{examQuestions.length} 道题目</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteExam(examName);
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    删除
                  </button>
                </div>

                {/* 展开的题目列表 */}
                {expandedExam === examName && (
                  <div className="border-t px-4 py-3 space-y-3 bg-gray-50">
                    {examQuestions.map((q, idx) => (
                      <div key={q.id} className="bg-white rounded p-3 text-sm">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <span className="text-gray-400 mr-2">{idx + 1}.</span>
                            <span className="text-gray-800">{q.content}</span>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setEditingQuestion(q)}
                              className="text-blue-400 hover:text-blue-600 text-xs"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDelete(q.id)}
                              className="text-red-400 hover:text-red-600 text-xs"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 编辑题目表单 */}
        {editingQuestion && (
          <QuestionForm
            editingQuestion={editingQuestion}
            onSaved={() => {
              setEditingQuestion(null);
              onUpdated();
            }}
            onCancel={() => setEditingQuestion(null)}
          />
        )}

        {/* 添加新题目表单 */}
        {!editingQuestion && <QuestionForm onSaved={onUpdated} />}
      </div>
    </div>
  );
}
