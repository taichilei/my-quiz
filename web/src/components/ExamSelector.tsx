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
    filtered.sort((a, b) => (a.exam?.order || 0) - (b.exam?.order || 0));
    onSelectExam(filtered, examName, part);
  };

  const handleSelectExam = (examName: string) => {
    const filtered = filteredQuestions.filter((q) => q.exam?.name === examName);
    filtered.sort((a, b) => {
      const partCompare = (a.exam?.part || '').localeCompare(
        b.exam?.part || ''
      );
      if (partCompare !== 0) return partCompare;
      return (a.exam?.order || 0) - (b.exam?.order || 0);
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
    <div className="space-y-4">
      {/* 刷题模式 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">刷题模式</h3>
        <div className="flex gap-2">
          {(['unanswered', 'wrong', 'all'] as QuizMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onQuizModeChange(mode)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                quizMode === mode
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {modeLabels[mode]}
            </button>
          ))}
        </div>
      </div>

      {/* 数据来源过滤器 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">数据来源</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedSourceType('all')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              selectedSourceType === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setSelectedSourceType('human')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              selectedSourceType === 'human'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            人工
          </button>
          <button
            onClick={() => setSelectedSourceType('machine')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              selectedSourceType === 'machine'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            机器
          </button>
        </div>
      </div>

      {/* 标签筛选 */}
      {allTags.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">按标签筛选</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTag === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 全部题目 */}
      <div className="bg-white rounded-lg shadow p-4">
        <button
          onClick={() => onSelectAll(filteredQuestions)}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">全部题目</h3>
              <p className="text-sm text-gray-500 mt-1">
                单选 {stats.single} / 多选 {stats.multiple} / 判断 {stats.judge}
              </p>
            </div>
            <div className="text-2xl font-bold text-blue-500">
              {filteredQuestions.length}
            </div>
          </div>
        </button>
      </div>

      {/* 试卷列表 */}
      {examGroups.groups.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 px-1">按试卷练习</h2>
          {examGroups.groups.map((group) => (
            <div
              key={group.name}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              {/* 试卷标题 */}
              <button
                onClick={() => handleSelectExam(group.name)}
                className="w-full p-4 text-left hover:bg-gray-50 border-b"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">{group.name}</h3>
                    {group.subject && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {group.subject}
                      </p>
                    )}
                  </div>
                  <div className="text-lg font-bold text-blue-500">
                    {group.totalCount}
                  </div>
                </div>
              </button>

              {/* 部分列表 */}
              <div className="divide-y">
                {group.parts.map((p) => (
                  <button
                    key={p.part}
                    onClick={() => handleSelectPart(group.name, p.part)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span className="text-gray-600">{p.part}</span>
                    <span className="text-sm text-gray-400">{p.count} 题</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 未分类题目 */}
      {examGroups.noExamCount > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <button
            onClick={() => {
              const filtered = questions.filter((q) => !q.exam);
              onSelectExam(filtered, '未分类题目');
            }}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">未分类题目</h3>
                <p className="text-sm text-gray-500 mt-1">未指定考试来源</p>
              </div>
              <div className="text-lg font-bold text-gray-400">
                {examGroups.noExamCount}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* 空状态 */}
      {questions.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          暂无题目，请先添加或导入题目
        </div>
      )}
    </div>
  );
}
