import type { QuizMode } from '../types';

interface Props {
  onSelectMode: (mode: QuizMode) => void;
  onCancel: () => void;
}

const modeOptions = [
  {
    value: 'unanswered' as const,
    title: '再来一遍',
    description: '重置刷题，重新开始刷未做题',
  },
  {
    value: 'wrong' as const,
    title: '只刷错题',
    description: '只练习之前做错的题目',
  },
  {
    value: 'all' as const,
    title: '全部随机',
    description: '混合所有题目随机刷题',
  },
];

export default function QuizFinishModal({ onSelectMode, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-3">
          恭喜！全部题目已完成
        </h2>
        <p className="text-gray-600 mb-6">
          当前题库所有题目都已经做过了，请选择接下来的刷题模式：
        </p>
        <div className="space-y-3 mb-6">
          {modeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelectMode(option.value)}
              className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-800">{option.title}</div>
              <div className="text-sm text-gray-500">{option.description}</div>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}
