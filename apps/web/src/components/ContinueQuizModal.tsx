import type { SavedQuizProgress } from '../types';

interface Props {
  progress: SavedQuizProgress;
  onContinue: () => void;
  onCancel: () => void;
}

export default function ContinueQuizModal({
  progress,
  onContinue,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-3">
          发现未完成的刷题
        </h2>
        <p className="text-gray-600 mb-6">
          您上次在 <span className="font-medium">{progress.quizTitle}</span>{' '}
          刷到第{' '}
          <span className="font-medium text-blue-600">
            {progress.currentIndex + 1}
          </span>{' '}
          题，是否继续做题？
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={onContinue}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            继续刷题
          </button>
        </div>
      </div>
    </div>
  );
}
