import { useMemo } from 'react';
import type { Question } from '../types';
import { recordApi } from '../api/client';

const USER_ID = 'default-user';

interface Props {
  questions: Question[];
  shuffle?: boolean; // 是否随机打乱题目顺序
  // 状态从App层传入
  currentIndex: number;
  selectedAnswer: string | boolean;
  showResult: boolean;
  correctCount: number;
  finished: boolean;
  // 回调用于更新状态
  onCurrentIndexChange: (index: number) => void;
  onSelectedAnswerChange: (answer: string | boolean) => void;
  onShowResultChange: (show: boolean) => void;
  onCorrectCountChange: (count: number | ((prev: number) => number)) => void;
  onFinishedChange: (finished: boolean) => void;
  onFinish: () => void;
}

// i18n: 判断题答案显示
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
  const displayQuestions = useMemo(() => {
    if (shuffle) {
      return [...questions].sort(() => Math.random() - 0.5);
    }
    return questions;
  }, [questions, shuffle]);

  const currentQuestion = displayQuestions[currentIndex];

  // 检查答案是否正确
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

    // 记录作答到服务器
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

    // 记录作答（未作答也算错误）
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

  // 格式化答案显示
  const formatAnswer = (answer: string | boolean): string => {
    if (typeof answer === 'boolean') {
      return JUDGE_ANSWER_LABELS[
        String(answer) as keyof typeof JUDGE_ANSWER_LABELS
      ];
    }
    return answer;
  };

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        暂无题目，请先添加题目
      </div>
    );
  }

  if (finished) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-4">答题完成！</h2>
        <p className="text-3xl font-bold text-blue-600 mb-2">
          {correctCount} / {displayQuestions.length}
        </p>
        <p className="text-gray-500 mb-6">
          正确率：{Math.round((correctCount / displayQuestions.length) * 100)}%
        </p>
        <button
          onClick={handleFinish}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          返回
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

  // 判断题
  if (currentQuestion.type === 'judge') {
    const judgeOptions = [true, false] as const;
    const correctAnswer = currentQuestion.answer as boolean;

    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {displayQuestions.length}
          </span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
            {typeLabels[currentQuestion.type]}
          </span>
        </div>

        <div className="mb-4">
          <p className="text-gray-800 mb-2">{currentQuestion.content}</p>
          {currentQuestion.images && currentQuestion.images.length > 0 && (
            <div className="space-y-2">
              {currentQuestion.images.map((image, index) => (
                <div key={index} className="rounded-lg overflow-hidden border">
                  <img
                    src={image}
                    alt={`Question image ${index + 1}`}
                    className="w-full h-auto object-contain"
                    style={{ maxHeight: '300px' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 mb-4">
          {judgeOptions.map((opt) => {
            const optLabel =
              JUDGE_ANSWER_LABELS[String(opt) as 'true' | 'false'];
            const isSelected = selectedAnswer === opt;
            const isCorrectAnswer = opt === correctAnswer;

            let btnClass = 'border-gray-200 hover:bg-gray-50';
            if (showResult) {
              if (isSelected && isCorrectAnswer) {
                btnClass = 'bg-green-100 border-green-500 text-green-700';
              } else if (isSelected && !isCorrectAnswer) {
                btnClass = 'bg-red-100 border-red-500 text-red-700';
              } else if (isCorrectAnswer) {
                btnClass = 'bg-green-100 border-green-500 text-green-700';
              }
            } else if (isSelected) {
              btnClass = 'bg-blue-50 border-blue-500';
            }

            return (
              <button
                key={String(opt)}
                onClick={() => handleSelect(opt)}
                disabled={showResult}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${btnClass}`}
              >
                {optLabel}
                {showResult && isCorrectAnswer && (
                  <span className="ml-2">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {!showResult && (
          <button
            onClick={handleDontKnow}
            className="w-full mb-4 bg-gray-100 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            我不会，看答案
          </button>
        )}

        {showResult && (
          <div
            className={`p-3 rounded-lg mb-4 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}
          >
            <p
              className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}
            >
              {selectedAnswer === ''
                ? '未作答，正确答案：' + formatAnswer(correctAnswer)
                : isCorrect
                  ? '回答正确！'
                  : '回答错误，正确答案：' + formatAnswer(correctAnswer)}
            </p>
            {currentQuestion.explanation && (
              <p className="text-sm text-gray-500 mt-1">
                解析：{currentQuestion.explanation}
              </p>
            )}
          </div>
        )}

        {showResult && (
          <button
            onClick={nextQuestion}
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            {currentIndex + 1 >= displayQuestions.length ? '完成' : '下一题'}
          </button>
        )}
      </div>
    );
  }

  // 单选题
  if (currentQuestion.type === 'single') {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {displayQuestions.length}
          </span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
            {typeLabels[currentQuestion.type]}
          </span>
        </div>

        <div className="mb-4">
          <p className="text-gray-800 mb-2">{currentQuestion.content}</p>
          {currentQuestion.images && currentQuestion.images.length > 0 && (
            <div className="space-y-2">
              {currentQuestion.images.map((image, index) => (
                <div key={index} className="rounded-lg overflow-hidden border">
                  <img
                    src={image}
                    alt={`Question image ${index + 1}`}
                    className="w-full h-auto object-contain"
                    style={{ maxHeight: '300px' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 mb-4">
          {currentQuestion.options?.map((opt, idx) => {
            const label = String.fromCharCode(65 + idx);
            const isSelected = selectedAnswer === label;
            const isCorrectAnswer = label === currentQuestion.answer;

            let btnClass = 'border-gray-200 hover:bg-gray-50';
            if (showResult) {
              if (isSelected && isCorrectAnswer) {
                btnClass = 'bg-green-100 border-green-500 text-green-700';
              } else if (isSelected && !isCorrectAnswer) {
                btnClass = 'bg-red-100 border-red-500 text-red-700';
              } else if (isCorrectAnswer) {
                btnClass = 'bg-green-100 border-green-500 text-green-700';
              }
            } else if (isSelected) {
              btnClass = 'bg-blue-50 border-blue-500';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(label)}
                disabled={showResult}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${btnClass}`}
              >
                <span className="font-medium">{label}.</span> {opt}
                {showResult && isCorrectAnswer && (
                  <span className="ml-2">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {!showResult && (
          <button
            onClick={handleDontKnow}
            className="w-full mb-4 bg-gray-100 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            我不会，看答案
          </button>
        )}

        {showResult && (
          <div
            className={`p-3 rounded-lg mb-4 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}
          >
            <p
              className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}
            >
              {selectedAnswer === ''
                ? '未作答，正确答案：' + formatAnswer(currentQuestion.answer)
                : isCorrect
                  ? '回答正确！'
                  : '回答错误，正确答案：' +
                    formatAnswer(currentQuestion.answer)}
            </p>
            {currentQuestion.explanation && (
              <p className="text-sm text-gray-500 mt-1">
                解析：{currentQuestion.explanation}
              </p>
            )}
          </div>
        )}

        {showResult && (
          <button
            onClick={nextQuestion}
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            {currentIndex + 1 >= displayQuestions.length ? '完成' : '下一题'}
          </button>
        )}
      </div>
    );
  }

  // 多选题
  const selectedArr =
    typeof selectedAnswer === 'string'
      ? selectedAnswer.split(',').filter(Boolean)
      : [];
  const correctArr =
    typeof currentQuestion.answer === 'string'
      ? currentQuestion.answer.split(',').filter(Boolean)
      : [];

  const handleMultiSelect = (label: string) => {
    if (showResult) return;

    const newSelected = selectedArr.includes(label)
      ? selectedArr.filter((s) => s !== label)
      : [...selectedArr, label].sort();

    if (newSelected.length > 0) {
      onSelectedAnswerChange(newSelected.join(','));
    }
  };

  const confirmMultiAnswer = () => {
    if (selectedArr.length === 0 || showResult) return;
    onShowResultChange(true);

    const correct = checkAnswer(selectedAnswer, currentQuestion.answer);
    if (correct) {
      onCorrectCountChange((c) => c + 1);
    }

    // 记录作答到服务器
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
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          {currentIndex + 1} / {displayQuestions.length}
        </span>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
          {typeLabels[currentQuestion.type]}
        </span>
      </div>

      <p className="text-gray-800 mb-4">{currentQuestion.content}</p>

      <div className="space-y-2 mb-4">
        {currentQuestion.options?.map((opt, idx) => {
          const label = String.fromCharCode(65 + idx);
          const isSelected = selectedArr.includes(label);
          const isCorrectOption = correctArr.includes(label);

          let btnClass = 'border-gray-200 hover:bg-gray-50';
          if (showResult) {
            if (isSelected && isCorrectOption) {
              btnClass = 'bg-green-100 border-green-500 text-green-700';
            } else if (isSelected && !isCorrectOption) {
              btnClass = 'bg-red-100 border-red-500 text-red-700';
            } else if (!isSelected && isCorrectOption) {
              btnClass = 'bg-green-100 border-green-500 text-green-700';
            }
          } else if (isSelected) {
            btnClass = 'bg-blue-50 border-blue-500';
          }

          return (
            <button
              key={idx}
              onClick={() => handleMultiSelect(label)}
              disabled={showResult}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${btnClass}`}
            >
              <span className="font-medium">{label}.</span> {opt}
              {showResult && isCorrectOption && <span className="ml-2">✓</span>}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div
          className={`p-3 rounded-lg mb-4 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}
        >
          <p
            className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}
          >
            {selectedAnswer === ''
              ? '未作答，正确答案：' + formatAnswer(currentQuestion.answer)
              : isCorrect
                ? '回答正确！'
                : '回答错误，正确答案：' + formatAnswer(currentQuestion.answer)}
          </p>
          {currentQuestion.explanation && (
            <p className="text-sm text-gray-500 mt-1">
              解析：{currentQuestion.explanation}
            </p>
          )}
        </div>
      )}

      {!showResult ? (
        <div className="space-y-2">
          <button
            onClick={confirmMultiAnswer}
            disabled={selectedArr.length === 0}
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            确认答案
          </button>
          <button
            onClick={handleDontKnow}
            className="w-full bg-gray-100 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            我不会，看答案
          </button>
        </div>
      ) : (
        <button
          onClick={nextQuestion}
          className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          {currentIndex + 1 >= displayQuestions.length ? '完成' : '下一题'}
        </button>
      )}
    </div>
  );
}
