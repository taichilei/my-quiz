import {useState, useEffect} from 'react';
import ImportExport from './ImportExport';
import WrongNotes from './WrongNotes';
import {questionApi, recordApi} from '../api/client';
import {useTheme} from '../context/ThemeContext';
import type {Question} from '../types';

const USER_ID = 'default-user';

interface Stats {
  total: number;
  correct: number;
  rate: number;
}

interface Props {
  onStartWrongNotes: (questions: Question[], title: string) => void;
}

export default function Profile({onStartWrongNotes}: Props) {
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [stats, setStats] = useState<Stats>({total: 0, correct: 0, rate: 0});
  const [loading, setLoading] = useState(true);
  const {theme, toggleTheme} = useTheme();

  const loadStats = async () => {
    setLoading(true);
    const [questions, statsData] = await Promise.all([
      questionApi.list(),
      recordApi.stats(USER_ID),
    ]);
    setTotalQuestions(questions.length);
    // 统计错题数量 - 从记录中统计答错的题目
    const records = await recordApi.list(USER_ID);
    const wrongQuestionIds = new Set<number>();
    records.forEach((r) => {
      if (!r.isCorrect) {
        wrongQuestionIds.add(r.questionId);
      }
    });
    setWrongCount(wrongQuestionIds.size);
    setStats(statsData);
    setLoading(false);
  };

  const handleImported = () => {
    void loadStats();
    // 刷新后会自动更新题库数量
  };

  useEffect(() => {
    void loadStats();
  }, []);

  return (
    <div className="space-y-4">
      {/* 统计面板 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">学习统计</h3>
        {loading ? (
          <div className="text-gray-500 text-center py-4">加载中...</div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {totalQuestions}
              </div>
              <div className="text-sm text-gray-500">总题数</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {wrongCount}
              </div>
              <div className="text-sm text-gray-500">错题数</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.total > 0 ? `${Math.round(stats.rate * 100)}%` : '-'}
              </div>
              <div className="text-sm text-gray-500">正确率</div>
            </div>
          </div>
        )}
      </div>

      {/* 外观设置 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">外观设置</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">深色模式</span>
          <button
            onClick={toggleTheme}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {theme === 'dark' ? '已开启' : '已关闭'}
          </button>
        </div>
      </div>

      {/* 错题本入口 */}
      {!loading && wrongCount > 0 && (
        <WrongNotes onStartQuiz={onStartWrongNotes}/>
      )}

      {/* 导入导出 */}
      <ImportExport onImported={handleImported}/>

      {/* 应用信息 */}
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
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
            <p className="mt-1">
              支持 JSON 数组格式，每道题需包含 id、type、content、answer 等字段
            </p>
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
          项目地址：
          <a
            href="https://github.com/taichilei/my-quiz"
            className="text-blue-500 hover:underline"
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
