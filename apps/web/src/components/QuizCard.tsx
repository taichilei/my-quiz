import { useMemo } from 'react';
import type { Question } from '../types';
import { recordApi } from '../api/client';
import { useOrientation } from '../hooks/useOrientation';

const USER_ID = 'default-user';

interface Props {
  questions: Question[];
  shuffle?: boolean;
  currentIndex: number;
  selectedAnswer: string | boolean;
  showResult: boolean;
  correctCount: number;
  finished: boolean;
  onCurrentIndexChange: (index: number) => void;
  onSelectedAnswerChange: (answer: string | boolean) => void;
  onShowResultChange: (show: boolean) => void;
  onCorrectCountChange: (count: number | ((prev: number) => number)) => void;
  onFinishedChange: (finished: boolean) => void;
  onFinish: () => void;
}

const JUDGE_ANSWER_LABELS = {
  true: '正确',
  false: '错误',
} as const;

export default function QuizCard({
  questions,
  shuffle = false,
  currentIndex,
  selectedAnswer,
  showResult,
  correctCount,
  finished,
  onCurrentIndexChange,
  onSelectedAnswerChange,
  onShowResultChange,
  onCorrectCountChange,
  onFinishedChange,
  onFinish,
}: Props) {
  const { isLandscape } = useOrientation();

  const displayQuestions = useMemo(() => {
    if (shuffle) {
      return [...questions].sort(() => Math.random() - 0.5);
    }
    return questions;
  }, [questions, shuffle]);

  const currentQuestion = displayQuestions[currentIndex];

  const checkAnswer = (
    userAnswer: string | boolean,
    correctAnswer: string | boolean
  ): boolean => {
    if (
      currentQuestion.type === 'multiple' &&
      typeof userAnswer === 'string' &&
      typeof correctAnswer === 'string'
    ) {
      return (
        userAnswer.split(',').sort().join(',') ===
        correctAnswer.split(',').sort().join(',')
      );
    }
    return userAnswer === correctAnswer;
  };

  const handleSelect = (answer: string | boolean) => {
    if (showResult) return;
    onSelectedAnswerChange(answer);
    onShowResultChange(true);

    const correct = checkAnswer(answer, currentQuestion.answer);
    if (correct) {
      onCorrectCountChange((c) => c + 1);
    }

    recordApi
      .create({
        userId: USER_ID,
        questionId: currentQuestion.id,
        userAnswer: answer as string,
        isCorrect: correct,
        answeredAt: Date.now(),
      })
      .catch((err) => console.error('Failed to record answer:', err));
  };

  const handleDontKnow = () => {
    if (showResult) return;
    onSelectedAnswerChange('');
    onShowResultChange(true);

    const correct = checkAnswer('', currentQuestion.answer);
    recordApi
      .create({
        userId: USER_ID,
        questionId: currentQuestion.id,
        userAnswer: '',
        isCorrect: correct,
        answeredAt: Date.now(),
      })
      .catch((err) => console.error('Failed to record answer:', err));
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= displayQuestions.length) {
      onFinishedChange(true);
    } else {
      onCurrentIndexChange(currentIndex + 1);
      onSelectedAnswerChange('');
      onShowResultChange(false);
    }
  };

  const handleFinish = () => {
    onFinishedChange(false);
    onCurrentIndexChange(0);
    onSelectedAnswerChange('');
    onShowResultChange(false);
    onCorrectCountChange(0);
    onFinish();
  };

  const formatAnswer = (answer: string | boolean): string => {
    if (typeof answer === 'boolean') {
      return JUDGE_ANSWER_LABELS[String(answer) as keyof typeof JUDGE_ANSWER_LABELS];
    }
    return answer;
  };

  const progressPercent = Math.round(
    ((currentIndex + (showResult ? 1 : 0)) / displayQuestions.length) * 100
  );

  if (questions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center transition-colors duration-300">
        <div className="text-5xl mb-4">📚</div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">暂无题目，请先添加题目</p>
      </div>
    );
  }

  if (finished) {
    const accuracy = Math.round((correctCount / displayQuestions.length) * 100);
    const isExcellent = accuracy >= 80;
    const isGood = accuracy >= 60;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center slide-up transition-colors duration-300">
        <div className="text-6xl mb-4">
          {isExcellent ? '🎉' : isGood ? '👍' : '💪'}
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">答题完成！</h2>

        <div className="relative w-32 h-32 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              className="fill-none stroke-gray-200 dark:stroke-gray-700"
              strokeWidth="8"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              className={`fill-none transition-all duration-1000 ${
                isExcellent
                  ? 'stroke-green-500'
                  : isGood
                  ? 'stroke-blue-500'
                  : 'stroke-orange-500'
              }`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${accuracy * 3.52} 352`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-800 dark:text-white">{accuracy}%</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">正确率</span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{correctCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">正确</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">
                {displayQuestions.length - correctCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">错误</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{displayQuestions.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">总计</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleFinish}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/25 btn-press"
        >
          返回继续刷题
        </button>
      </div>
    );
  }

  const typeLabels = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
  };

  const isCorrect =
    showResult && checkAnswer(selectedAnswer, currentQuestion.answer);

  const getOptionClass = (
    isSelected: boolean,
    isCorrectOption: boolean,
    showResult: boolean
  ): string => {
    let baseClass =
      'w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 btn-press ';

    if (showResult) {
      if (isSelected && isCorrectOption) {
        return baseClass + 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400';
      } else if (isSelected && !isCorrectOption) {
        return baseClass + 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400';
      } else if (isCorrectOption) {
        return baseClass + 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400';
      }
      return baseClass + 'border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500';
    } else if (isSelected) {
      return baseClass + 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400';
    }
    return (
      baseClass +
      'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300'
    );
  };

  const QuestionContent = () => (
    <div className={isLandscape ? 'pr-6 border-r border-gray-200 dark:border-gray-700' : 'mb-6'}>
      <p className="text-gray-800 dark:text-white text-base leading-relaxed mb-4">
        {currentQuestion.content}
      </p>
      {currentQuestion.images && currentQuestion.images.length > 0 && (
        <div className="space-y-3">
          {currentQuestion.images.map((image, index) => (
            <div
              key={index}
              className="rounded-xl overflow-hidden border dark:border-gray-700 shadow-sm"
            >
              <img
                src={image}
                alt={`Question image ${index + 1}`}
                className="w-full h-auto object-contain"
                style={{ maxHeight: isLandscape ? '200px' : '300px' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const JudgeOptions = () => (
    <>
      <div className="space-y-3 mb-4">
        {([true, false] as const).map((opt) => {
          const optLabel =
            JUDGE_ANSWER_LABELS[String(opt) as 'true' | 'false'];
          const isSelected = selectedAnswer === opt;
          const isCorrectAnswer = opt === (currentQuestion.answer as boolean);

          return (
            <button
              key={String(opt)}
              onClick={() => handleSelect(opt)}
              disabled={showResult}
              className={getOptionClass(isSelected, isCorrectAnswer, showResult)}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {opt ? '✓' : '✕'}
                </span>
                {optLabel}
                {showResult && isCorrectAnswer && (
                  <span className="ml-auto text-green-500">✓</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <ActionButtons isJudge />
    </>
  );

  const SingleOptions = () => (
    <>
      <div className="space-y-3 mb-4">
        {currentQuestion.options?.map((opt, idx) => {
          const label = String.fromCharCode(65 + idx);
          const isSelected = selectedAnswer === label;
          const isCorrectAnswer = label === currentQuestion.answer;

          return (
            <button
              key={idx}
              onClick={() => handleSelect(label)}
              disabled={showResult}
              className={getOptionClass(isSelected, isCorrectAnswer, showResult)}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {label}
                </span>
                {opt}
                {showResult && isCorrectAnswer && (
                  <span className="ml-auto text-green-500">✓</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <ActionButtons />
    </>
  );

  const MultipleOptions = () => (
    <>
      <div className="space-y-3 mb-4">
        {(() => {
          const selectedArr =
            typeof selectedAnswer === 'string'
              ? selectedAnswer.split(',').filter(Boolean)
              : [];
          const correctArr =
            typeof currentQuestion.answer === 'string'
              ? currentQuestion.answer.split(',').filter(Boolean)
              : [];

          return currentQuestion.options?.map((opt, idx) => {
            const label = String.fromCharCode(65 + idx);
            const isSelected = selectedArr.includes(label);
            const isCorrectOption = correctArr.includes(label);

            const handleMultiSelect = (label: string) => {
              if (showResult) return;

              const newSelected = selectedArr.includes(label)
                ? selectedArr.filter((s) => s !== label)
                : [...selectedArr, label].sort();

              if (newSelected.length > 0) {
                onSelectedAnswerChange(newSelected.join(','));
              }
            };

            return (
              <button
                key={idx}
                onClick={() => handleMultiSelect(label)}
                disabled={showResult}
                className={getOptionClass(isSelected, isCorrectOption, showResult)}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold transition-colors ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {isSelected ? '✓' : label}
                  </span>
                  {opt}
                  {showResult && isCorrectOption && (
                    <span className="ml-auto text-green-500">✓</span>
                  )}
                </span>
              </button>
            );
          });
        })()}
      </div>
      <ActionButtons isMultiple />
    </>
  );

  const ActionButtons = ({ isJudge = false, isMultiple = false } = {}) => {
    const selectedArr =
      typeof selectedAnswer === 'string'
        ? selectedAnswer.split(',').filter(Boolean)
        : [];

    const confirmMultiAnswer = () => {
      if (selectedArr.length === 0 || showResult) return;
      onShowResultChange(true);

      const correct = checkAnswer(selectedAnswer, currentQuestion.answer);
      if (correct) {
        onCorrectCountChange((c) => c + 1);
      }

      recordApi
        .create({
          userId: USER_ID,
          questionId: currentQuestion.id,
          userAnswer: selectedAnswer as string,
          isCorrect: correct,
          answeredAt: Date.now(),
        })
        .catch((err) => console.error('Failed to record answer:', err));
    };

    return (
      <>
        {!showResult ? (
          isMultiple ? (
            <div className="space-y-3">
              <button
                onClick={confirmMultiAnswer}
                disabled={selectedArr.length === 0}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed btn-press"
              >
                ✅ 确认答案 ({selectedArr.length} 已选)
              </button>
              <button
                onClick={handleDontKnow}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors btn-press"
              >
                🤔 我不会，看答案
              </button>
            </div>
          ) : (
            <button
              onClick={handleDontKnow}
              className="w-full mb-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors btn-press"
            >
              🤔 我不会，看答案
            </button>
          )
        ) : (
          <>
            <div
              className={`p-4 rounded-xl mb-4 fade-in ${
                isCorrect
                  ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
              }`}
            >
              <p
                className={`font-medium flex items-center gap-2 ${
                  isCorrect
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                {selectedAnswer === '' ? (
                  <>
                    <span>⏭️</span>
                    未作答，正确答案：{formatAnswer(currentQuestion.answer)}
                  </>
                ) : isCorrect ? (
                  <>
                    <span>🎉</span>
                    回答正确！
                  </>
                ) : (
                  <>
                    <span>😅</span>
                    回答错误，正确答案：{formatAnswer(currentQuestion.answer)}
                  </>
                )}
              </p>
              {currentQuestion.explanation && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 pl-7">
                  💡 {currentQuestion.explanation}
                </p>
              )}
            </div>

            <button
              onClick={nextQuestion}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/25 btn-press"
            >
              {currentIndex + 1 >= displayQuestions.length ? '🎯 完成' : '下一题 →'}
            </button>
          </>
        )}
      </>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 slide-up transition-colors duration-300 ${isLandscape ? 'min-h-[400px]' : ''}`}>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {currentIndex + 1} / {displayQuestions.length}
        </span>
        <div className="flex items-center gap-2">
          {isLandscape && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
              横屏模式
            </span>
          )}
          <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full font-medium">
            {typeLabels[currentQuestion.type]}
          </span>
        </div>
      </div>

      <div className={`${isLandscape ? 'flex flex-row' : ''}`}>
        <div className={isLandscape ? 'w-1/2 flex-shrink-0' : ''}>
          <QuestionContent />
        </div>
        <div className={isLandscape ? 'w-1/2 pl-6' : ''}>
          {currentQuestion.type === 'judge' && <JudgeOptions />}
          {currentQuestion.type === 'single' && <SingleOptions />}
          {currentQuestion.type === 'multiple' && <MultipleOptions />}
        </div>
      </div>
    </div>
  );
}
