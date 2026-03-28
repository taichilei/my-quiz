import ImportExport from './ImportExport';

export default function Profile() {
  const handleImported = () => {
    // 刷新后会自动更新题库数量
  };

  return (
    <div className="space-y-4">
      {/* 导入导出 */}
      <ImportExport onImported={handleImported} />

      {/* 应用信息 */}
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800">刷题助手</h1>
        <p className="text-sm text-gray-500 mt-1">版本 0.1.0</p>
      </div>

      {/* 功能介绍 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">功能介绍</h2>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">●</span>
            <span>支持单选、多选、判断题型的刷题练习</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">●</span>
            <span>按试卷分类，支持筛选特定试卷进行练习</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">●</span>
            <span>导入 JSON 格式题库，轻松管理题目</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">●</span>
            <span>数据本地存储，离线可用</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">●</span>
            <span>PWA 支持，可添加到主屏幕</span>
          </li>
        </ul>
      </div>

      {/* 使用说明 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">使用说明</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <h3 className="font-medium text-gray-700">1. 导入题库</h3>
            <p className="mt-1">点击「题库」标签，上传 JSON 格式的题库文件</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">2. 开始刷题</h3>
            <p className="mt-1">点击「刷题」标签，选择试卷或全部题目开始练习</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">3. 题库格式</h3>
            <p className="mt-1">支持 JSON 数组格式，每道题需包含 id、type、content、answer 等字段</p>
          </div>
        </div>
      </div>

      {/* 关于 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">关于</h2>
        <p className="text-sm text-gray-600">
          本应用为开源项目，旨在帮助考研、考公、考编等各类考试人群高效复习。
        </p>
        <p className="text-sm text-gray-500 mt-2">
          项目地址：<a href="https://github.com/your-username/my-quiz" className="text-blue-500 hover:underline">GitHub</a>
        </p>
      </div>
    </div>
  );
}
