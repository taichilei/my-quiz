import { useMemo } from 'react';
import type { Question } from '../types';

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
  onSelectExam: (questions: Question[], examName?: string, part?: string) => void;
  onSelectAll: (questions: Question[]) => void;
}

export default function ExamSelector({ questions, onSelectExam, onSelectAll }: Props) {
  // 按试卷分组
  const examGroups = useMemo(() => {
    const groups: Map<string, ExamGroup> = new Map();
    const noExamQuestions: Question[] = [];

    questions.forEach(q => {
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
      const existingPart = group.parts.find(p => p.part === partName);
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
  }, [questions]);

  const handleSelectPart = (examName: string, part: string) => {
    const filtered = questions.filter(
      q => q.exam?.name === examName && q.exam?.part === part
    );
    // 按 order 排序
    filtered.sort((a, b) => (a.exam?.order || 0) - (b.exam?.order || 0));
    onSelectExam(filtered, examName, part);
  };

  const handleSelectExam = (examName: string) => {
    const filtered = questions.filter(q => q.exam?.name === examName);
    filtered.sort((a, b) => {
      const partCompare = (a.exam?.part || '').localeCompare(b.exam?.part || '');
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
    questions.forEach(q => {
      typeCount[q.type]++;
    });
    return typeCount;
  }, [questions]);

  return (
    <div className="space-y-4">
      {/* 全部题目 */}
      <div className="bg-white rounded-lg shadow p-4">
        <button
          onClick={() => onSelectAll(questions)}
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
              {questions.length}
            </div>
          </div>
        </button>
      </div>

      {/* 试卷列表 */}
      {examGroups.groups.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 px-1">按试卷练习</h2>
          {examGroups.groups.map(group => (
            <div key={group.name} className="bg-white rounded-lg shadow overflow-hidden">
              {/* 试卷标题 */}
              <button
                onClick={() => handleSelectExam(group.name)}
                className="w-full p-4 text-left hover:bg-gray-50 border-b"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">{group.name}</h3>
                    {group.subject && (
                      <p className="text-xs text-gray-400 mt-0.5">{group.subject}</p>
                    )}
                  </div>
                  <div className="text-lg font-bold text-blue-500">
                    {group.totalCount}
                  </div>
                </div>
              </button>

              {/* 部分列表 */}
              <div className="divide-y">
                {group.parts.map(p => (
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
              const filtered = questions.filter(q => !q.exam);
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
