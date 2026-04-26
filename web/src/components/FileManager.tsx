import { useState, useEffect } from 'react';
import type { Upload } from '../types';
import { uploadApi } from '../api/client';

interface Props {
  onRefetch?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN');
}

function getStatusText(status: Upload['status']): string {
  const map: Record<Upload['status'], string> = {
    pending: '等待解析',
    parsing: '解析中',
    parsed: '已解析',
    failed: '解析失败',
  };
  return map[status];
}

function getStatusClass(status: Upload['status']): string {
  const map: Record<Upload['status'], string> = {
    pending: 'bg-gray-100 text-gray-700',
    parsing: 'bg-yellow-100 text-yellow-700',
    parsed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };
  return map[status];
}

export default function FileManager({ onRefetch }: Props) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<Upload | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteQuestions, setDeleteQuestions] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await uploadApi.list();
      setUploads(data);
    } catch (err) {
      console.error('Failed to load uploads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await uploadApi.upload(formData);
      setShowUploadModal(false);
      loadFiles();
      if (onRefetch) {
        onRefetch();
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('上传失败: ' + (err as Error).message);
    } finally {
      setUploading(false);
      // 清除 input 值，允许重复上传同名文件
      e.target.value = '';
    }
  };

  const handleEdit = (file: Upload) => {
    setSelectedFile(file);
    setEditTitle(file.title);
    setEditDescription(file.description);
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!selectedFile) return;

    try {
      await uploadApi.update(selectedFile.id, {
        title: editTitle,
        description: editDescription,
      });
      setShowEditModal(false);
      setSelectedFile(null);
      loadFiles();
    } catch (err) {
      console.error('Update failed:', err);
      alert('更新失败: ' + (err as Error).message);
    }
  };

  const handleDelete = (file: Upload) => {
    setSelectedFile(file);
    setDeleteQuestions(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedFile) return;

    try {
      await uploadApi.delete(selectedFile.id, deleteQuestions);
      setShowDeleteModal(false);
      setSelectedFile(null);
      loadFiles();
      if (onRefetch && deleteQuestions) {
        onRefetch();
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('删除失败: ' + (err as Error).message);
    }
  };

  const handleDownload = (file: Upload) => {
    uploadApi.download(file.id);
  };

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">文件管理</h3>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          上传新文件
        </button>
      </div>

      {/* 文件列表 */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : uploads.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
          <p>还没有上传任何文件</p>
          <p className="text-sm mt-2">点击「上传新文件」开始</p>
        </div>
      ) : (
        <div className="space-y-3">
          {uploads.map((upload) => (
            <div key={upload.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 truncate">
                    {upload.title || upload.fileName}
                  </h4>
                  {upload.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {upload.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-gray-500">
                      {formatFileSize(upload.fileSize)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${getStatusClass(upload.status)}`}
                    >
                      {getStatusText(upload.status)}
                    </span>
                    {upload.errorMsg && (
                      <span className="text-xs text-red-500">
                        {upload.errorMsg}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    上传时间: {formatDate(upload.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleDownload(upload)}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                  >
                    下载
                  </button>
                  <button
                    onClick={() => handleEdit(upload)}
                    className="px-3 py-1 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(upload)}
                    className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 上传弹窗 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">上传文件</h3>
            <p className="text-sm text-gray-500 mb-4">
              支持 PDF、Word、图片等格式。上传后的文件可以用于解析题目。
            </p>
            <input
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                disabled={uploading}
              >
                取消
              </button>
            </div>
            {uploading && (
              <div className="mt-4 text-sm text-gray-500">上传中...</div>
            )}
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {showEditModal && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">编辑文件信息</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标题
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="可选，描述文件内容"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteModal && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-red-600">
              确认删除
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              你确定要删除文件「{selectedFile.title || selectedFile.fileName}
              」吗？
            </p>
            <label className="flex items-center gap-2 p-3 border rounded-lg mb-6 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={deleteQuestions}
                onChange={(e) => setDeleteQuestions(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                同时删除该文件解析出的所有题目
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
