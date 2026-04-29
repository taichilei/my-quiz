import { useMemo, useState } from 'react';
import type { Question, DataSourceType, QuizMode } from '../types';

interface ExamGroup {
  name: string;
  year?: number;
  subject?: string;
  parts: {
    part: string;
    count: number;
  }[];
  totalCount: number;
}

interface Props {
  questions: Question[];
  onSelectExam: (
    questions: Question[],
    examName?: string,
    part?: string
  ) => void;
  onSelectAll: (questions: Question[]) => void;
  quizMode: QuizMode;
  onQuizModeChange: (mode: QuizMode) => void;
}

const modeLabels: Record<QuizMode, string> = {
  unanswered: '只刷未做题',
  wrong: '只刷错题',
  all: '全部题目',
};

const modeIcons: Record<QuizMode, string> = {
  unanswered: '📚',
  wrong: '❌',
  all: '📝',
};

export default function ExamSelector({
  questions,
  onSelectExam,
  onSelectAll,
  quizMode,
  onQuizModeChange,
}: Props) {
  const [selectedSourceType, setSelectedSourceType] = useState<
    DataSourceType | 'all'
  >('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // 获取所有标签
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    questions.forEach((q) => {
      if (q.tags) {
        q.tags.forEach((tag) => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [questions]);

  // 按来源类型和标签过滤题目
  const filteredQuestions = useMemo(() => {
    let filtered = questions;
    if (selectedSourceType !== 'all') {
      filtered = filtered.filter((q) => q.sourceType === selectedSourceType);
    }
    if (selectedTag !== 'all') {
      filtered = filtered.filter((q) => q.tags?.includes(selectedTag));
    }
    return filtered;
  }, [questions, selectedSourceType, selectedTag]);

  // 按试卷分组
  const examGroups = useMemo(() => {
    const groups: Map<string, ExamGroup> = new Map();
    const noExamQuestions: Question[] = [];

    filteredQuestions.forEach((q) => {
      if (!q.exam) {
        noExamQuestions.push(q);
        return;
      }

      const key = q.exam.name;
      if (!groups.has(key)) {
        groups.set(key, {
          name: q.exam.name,
          year: q.exam.year,
          subject: q.exam.subject,
          parts: [],
          totalCount: 0,
        });
      }

      const group = groups.get(key)!;
      group.totalCount++;

      // 按部分分组
      const partName = q.exam.part || '未分类';
      const existingPart = group.parts.find((p) => p.part === partName);
      if (existingPart) {
        existingPart.count++;
      } else {
        group.parts.push({ part: partName, count: 1 });
      }
    });

    // 按年份排序
    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      const yearA = a.year || 0;
      const yearB = b.year || 0;
      return yearB - yearA;
    });

    return { groups: sortedGroups, noExamCount: noExamQuestions.length };
  }, [filteredQuestions]);

  const handleSelectPart = (examName: string, part: string) => {
    const filtered = filteredQuestions.filter(
      (q) => q.exam?.name === examName && q.exam?.part === part
    );
    // 按 order 排序
    filtered.sort((a, b) => (a.examOrder || 0) - (b.examOrder || 0));
    onSelectExam(filtered, examName, part);
  };

  const handleSelectExam = (examName: string) => {
    const filtered = filteredQuestions.filter((q) => q.exam?.name === examName);
    filtered.sort((a, b) => {
      const partCompare = (a.exam?.part || '').localeCompare(
        b.exam?.part || ''
      );
      if (partCompare !== 0) return partCompare;
      return (a.examOrder || 0) - (b.examOrder || 0);
    });
    onSelectExam(filtered, examName);
  };

  // 统计信息
  const stats = useMemo(() => {
    const typeCount = {
      single: 0,
      multiple: 0,
      judge: 0,
    };
    filteredQuestions.forEach((q) => {
      typeCount[q.type]++;
    });
    return typeCount;
  }, [filteredQuestions]);

  return (
    <div className="space-y-4 fade-in">
      {/* 刷题模式 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 transition-colors duration-300">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <span>⚙️</span>
          刷题模式
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(['unanswered', 'wrong', 'all'] as QuizMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onQuizModeChange(mode)}
              className={`py-3 rounded-xl font-medium transition-all duration-300 flex flex-col items-center gap-1 btn-press ${
                quizMode === mode
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="text-lg">{modeIcons[mode]}</span>
              <span className="text-xs">{modeLabels[mode]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 数据来源过滤器 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 transition-colors duration-300">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <span>📊</span>
          数据来源
        </h3>
        <div className="flex gap-2">
          {(['all', 'human', 'machine'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedSourceType(type)}
              className={`flex-1 py-2 rounded-xl font-medium transition-all duration-300 btn-press text-sm ${
                selectedSourceType === type
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type === 'all' ? '全部' : type === 'human' ? '人工' : '机器'}
            </button>
          ))}
        </div>
      </div>

      {/* 标签筛选 */}
      {allTags.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 transition-colors duration-300">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <span>🏷️</span>
            按标签筛选
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 btn-press ${
                selectedTag === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              全部
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 btn-press ${
                  selectedTag === tag
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 全部题目 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 transition-colors duration-300 card-shadow">
        <button
          onClick={() => onSelectAll(filteredQuestions)}
          className="w-full text-left btn-press"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/25">
                📚
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">全部题目</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  单选 {stats.single} · 多选 {stats.multiple} · 判断 {stats.judge}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-500">
                  {filteredQuestions.length}
                </span>
                <p className="text-xs text-gray-400 dark:text-gray-500">题</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      {/* 试卷列表 */}
      {examGroups.groups.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1 flex items-center gap-2">
            <span>📋</span>
            按试卷练习
          </h2>
          {examGroups.groups.map((group, index) => (
            <div
              key={group.name}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-300 card-shadow slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* 试卷标题 */}
              <button
                onClick={() => handleSelectExam(group.name)}
                className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b dark:border-gray-700 transition-colors btn-press"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-md">
                      📝
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white">{group.name}</h3>
                      {group.subject && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {group.subject}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-500">
                      {group.totalCount}
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* 部分列表 */}
              <div className="divide-y dark:divide-gray-700">
                {group.parts.map((p) => (
                  <button
                    key={p.part}
                    onClick={() => handleSelectPart(group.name, p.part)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between transition-colors btn-press"
                  >
                    <span className="text-gray-600 dark:text-gray-300 pl-13">{p.part}</span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">{p.count} 题 →</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 未分类题目 */}
      {examGroups.noExamCount > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 transition-colors duration-300 card-shadow">
          <button
            onClick={() => {
              const filtered = questions.filter((q) => !q.exam);
              onSelectExam(filtered, '未分类题目');
            }}
            className="w-full text-left btn-press"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center text-white shadow-md">
                  📂
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white">未分类题目</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">未指定考试来源</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-400 dark:text-gray-500">
                  {examGroups.noExamCount}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* 空状态 */}
      {questions.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-10 text-center transition-colors duration-300">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">暂无题目</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">请先添加或导入题目开始刷题</p>
        </div>
      )}
    </div>
  );
}
