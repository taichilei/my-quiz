import { useRef, useState, useCallback } from 'react';
import type { Question } from '../types';
import { questionApi } from '../api/client';
import { importQuestionBank, exportQuestionsJson } from '../utils/import';
import QuestionForm from './QuestionForm';
import FileManager from './FileManager';

interface Props {
  questions: Question[];
  onUpdated: () => void;
}

// 按试卷分组
function groupByExam(questions: Question[]): Map<string, Question[]> {
  const map = new Map<string, Question[]>();
  questions.forEach((q) => {
    const key = q.exam?.name || '未分类';
    const list = map.get(key) || [];
    list.push(q);
    map.set(key, list);
  });
  // 按试卷内题目顺序排序
  map.forEach((list) => {
    list.sort((a, b) => (a.exam?.order || 0) - (b.exam?.order || 0));
  });
  return map;
}

type Tab = 'questions' | 'files';

export default function QuestionList({ questions, onUpdated }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('questions');
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [expandedExam, setExpandedExam] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const examGroups = groupByExam(questions);

  // 处理文件导入
  const processFile = async (file: File) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setMessage({ type: 'error', text: '只支持 JSON 文件' });
      return;
    }

    setImporting(true);
    setMessage(null);

    try {
      const result = await importQuestionBank(file);
      if (result.success) {
        // 批量导入到服务器
        let imported = 0;
        for (const q of result.questions) {
          await questionApi.create(q);
          imported++;
        }
        setMessage({
          type: 'success',
          text: `成功导入 ${imported} 道题目`,
        });
        onUpdated();
      } else {
        setMessage({
          type: 'error',
          text: result.errors.join('；') || '导入失败',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: '导入失败: ' + (error as Error).message,
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // 拖拽事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  }, []);

  // 点击上传区域触发文件选择
  const handleAreaClick = () => {
    if (!importing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 导出
  const handleExport = () => {
    if (questions.length === 0) {
      setMessage({ type: 'error', text: '没有可导出的题目' });
      return;
    }
    exportQuestionsJson(questions, `questions_${Date.now()}.json`);
    setMessage({
      type: 'success',
      text: `成功导出 ${questions.length} 道题目`,
    });
  };

  // 清空所有题目
  const handleClear = async () => {
    if (!confirm('确定要清空所有题目吗？此操作不可恢复！')) return;

    try {
      for (const q of questions) {
        await questionApi.delete(q.id);
      }
      setMessage({ type: 'success', text: '已清空所有题目' });
      onUpdated();
    } catch (error) {
      setMessage({
        type: 'error',
        text: '清空失败: ' + (error as Error).message,
      });
    }
  };

  // 删除单题
  const handleDelete = async (id: number) => {
    if (confirm('确定删除这道题目吗？')) {
      await questionApi.delete(id);
      onUpdated();
    }
  };

  // 删除整个试卷
  const handleDeleteExam = async (examName: string) => {
    const examQuestions = examGroups.get(examName) || [];
    if (
      !confirm(
        `确定要删除「${examName}」的所有 ${examQuestions.length} 道题目吗？`
      )
    )
      return;
    for (const q of examQuestions) {
      await questionApi.delete(q.id);
    }
    onUpdated();
  };

  return (
    <div className="space-y-4">
      {/* 标签切换 */}
      <div className="bg-white rounded-lg shadow p-1 flex">
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'questions'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          题目列表
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'files'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          文件管理
        </button>
      </div>

      {/* 题目列表 tab */}
      {activeTab === 'questions' && (
        <>
          {/* 上传区域 - 支持拖拽 */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">导入题库</h2>

            {/* 拖拽上传区域 */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleAreaClick}
              className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : importing
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
          `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={importing}
                className="hidden"
              />

              {importing ? (
                <div className="space-y-2">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600">正在导入...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      拖拽 JSON 文件到此处
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      或点击此处选择文件
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    支持 .json 格式，文件中包含题目数组
                  </p>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                disabled={questions.length === 0}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                导出全部题目
              </button>
              <button
                onClick={handleClear}
                disabled={questions.length === 0}
                className="px-6 bg-red-50 text-red-600 py-3 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                清空题库
              </button>
            </div>

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

          {/* 试卷列表 */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-800">试卷列表</h2>

            {examGroups.size === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                暂无题目，请先导入题库
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from(examGroups.entries()).map(
                  ([examName, examQuestions]) => (
                    <div
                      key={examName}
                      className="bg-white rounded-lg shadow overflow-hidden"
                    >
                      {/* 试卷头部 */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          setExpandedExam(
                            expandedExam === examName ? null : examName
                          )
                        }
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
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          <div>
                            <h3 className="font-medium text-gray-800">
                              {examName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {examQuestions.length} 道题目
                            </p>
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
                            <div
                              key={q.id}
                              className="bg-white rounded p-3 text-sm"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                  <span className="text-gray-400 mr-2">
                                    {idx + 1}.
                                  </span>
                                  <span className="text-gray-800">
                                    {q.content}
                                  </span>
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
                  )
                )}
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
        </>
      )}

      {/* 文件管理 tab */}
      {activeTab === 'files' && <FileManager onRefetch={onUpdated} />}
    </div>
  );
}
