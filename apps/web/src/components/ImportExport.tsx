import { useState, useRef, useEffect } from 'react';
import { importQuestionBank, exportQuestionsJson } from '../utils/import';
import {
  getQuestions,
  importQuestions,
  clearQuestions,
  reloadQuestionBanks,
  uploadFile,
  getUploadedFiles,
  deleteUploadedFile,
  clearUploadedFiles,
} from '../db';
import type { UploadedFile } from '../types';

interface Props {
  onImported: () => void;
}

export default function ImportExport({ onImported }: Props) {
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // 加载上传的文件列表
  useEffect(() => {
    const loadFiles = async () => {
      const files = await getUploadedFiles();
      setUploadedFiles(files);
    };
    loadFiles();
  }, []);

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
      setMessage({
        type: 'success',
        text: `成功导出 ${questions.length} 道题目`,
      });
    } catch {
      setMessage({ type: 'error', text: '导出失败' });
    }
  };

  const handleClear = async () => {
    if (!confirm('确定要清空所有题目吗？此操作不可恢复！')) return;

    try {
      await clearQuestions();
      setMessage({ type: 'success', text: '已清空所有题目' });
      onImported();
    } catch {
      setMessage({ type: 'error', text: '清空失败' });
    }
  };

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const uploadedFile = await uploadFile(file);
      setUploadedFiles((prev) => [...prev, uploadedFile]);
      setMessage({ type: 'success', text: `文件 "${file.name}" 上传成功` });
    } catch {
      setMessage({ type: 'error', text: '文件上传失败' });
    } finally {
      setUploading(false);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
    }
  };

  // 处理文件删除
  const handleFileDelete = async (id: string, fileName: string) => {
    if (!confirm(`确定要删除文件 "${fileName}" 吗？`)) return;

    try {
      await deleteUploadedFile(id);
      setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
      setMessage({ type: 'success', text: '文件删除成功' });
    } catch {
      setMessage({ type: 'error', text: '文件删除失败' });
    }
  };

  // 处理清空所有上传文件
  const handleClearFiles = async () => {
    if (!confirm('确定要清空所有上传的文件吗？此操作不可恢复！')) return;

    try {
      await clearUploadedFiles();
      setUploadedFiles([]);
      setMessage({ type: 'success', text: '已清空所有上传文件' });
    } catch {
      setMessage({ type: 'error', text: '清空失败' });
    }
  };

  const handleReloadBanks = async () => {
    try {
      const count = await reloadQuestionBanks();
      if (count > 0) {
        setMessage({ type: 'success', text: `已添加 ${count} 道新题目` });
        onImported();
      } else {
        setMessage({ type: 'success', text: '题库已是最新' });
      }
    } catch {
      setMessage({ type: 'error', text: '刷新题库失败' });
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

      {/* 文件上传 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          上传原文件
        </label>
        <div className="flex gap-2">
          <input
            ref={uploadInputRef}
            type="file"
            accept="*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            onClick={handleClearFiles}
            disabled={uploadedFiles.length === 0}
            className="px-4 bg-red-50 text-red-600 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            清空文件
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          上传原始文件（如 PDF、Word 等），用于后续参考
        </p>
      </div>

      {/* 上传文件列表 */}
      {uploadedFiles.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">已上传文件</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.type || '未知类型'} · {Math.round(file.size / 1024)}{' '}
                      KB · {new Date(file.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    查看
                  </a>
                  <button
                    onClick={() => handleFileDelete(file.id, file.name)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 导出 */}
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          导出题目
        </button>
        <button
          onClick={handleReloadBanks}
          className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
        >
          刷新题库
        </button>
        <button
          onClick={handleClear}
          className="px-4 bg-red-50 text-red-600 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors"
        >
          清空题目
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
