import { useState, useEffect, useMemo } from 'react';
import type {
  Question,
  SavedQuizProgress,
  AnswerRecord,
  QuizMode,
  QuizSession,
} from './types';
import { questionApi, recordApi, sessionApi } from './api/client';
import {
  saveQuizProgress,
  getSavedQuizProgress,
  clearQuizProgress,
  hasUnfinishedProgress,
} from './utils/progressStorage';
import QuestionList from './components/QuestionList';
import QuizCard from './components/QuizCard';
import ExamSelector from './components/ExamSelector';
import Profile from './components/Profile';
import ContinueQuizModal from './components/ContinueQuizModal';
import QuizFinishModal from './components/QuizFinishModal';

type Tab = 'quiz' | 'list' | 'profile';

export default function App() {
  const [tab, setTab] = useState<Tab>('quiz');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // 刷题状态（全部提升到App层统一管理，方便保存进度）
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [quizTitle, setQuizTitle] = useState<string>('');
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | boolean>('');
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  // 继续刷题弹框状态
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [savedProgress, setSavedProgress] = useState<SavedQuizProgress | null>(
    null
  );

  // 答题记录（用于过滤已做题）
  const [userRecords, setUserRecords] = useState<AnswerRecord[]>([]);
  // 刷题模式
  const [quizMode, setQuizMode] = useState<QuizMode>('unanswered');
  // 全部完成提示弹窗
  const [showFinishModal, setShowFinishModal] = useState(false);

  // 固定用户 ID（后续可支持多用户登录）
  const USER_ID = 'default-user';

  // 从后端会话转换为本地进度
  const sessionToProgress = (session: QuizSession): SavedQuizProgress => {
    return {
      isQuizActive: true,
      quizQuestionIds: session.questionIds,
      quizTitle: session.quizTitle,
      currentIndex: session.currentIndex,
      selectedAnswer: session.selectedAnswer,
      showResult: session.showResult,
      correctCount: session.correctCount,
      savedAt: session.updatedAt,
    };
  };

  const loadQuestions = async () => {
    try {
      const data = await questionApi.list();
      setQuestions(data);
      // 加载用户答题记录
      const records = await recordApi.list(USER_ID);
      setUserRecords(records);
      setLoading(false);

      // 优先从后端获取未完成会话（跨设备同步）
      try {
        const session = await sessionApi.getCurrent();
        if (session) {
          const progress = sessionToProgress(session);
          setSavedProgress(progress);
          setShowContinueModal(true);
          return; // 后端有会话，使用后端的，不用本地的
        }
      } catch (err: unknown) {
        // 404 就是没有会话，正常继续
        if (err instanceof Error && err.message !== 'no active session') {
          console.error('Failed to fetch session from backend:', err);
        }
      }

      // 后端没有会话，降级检查本地存储
      if (hasUnfinishedProgress()) {
        const progress = getSavedQuizProgress();
        if (progress) {
          setSavedProgress(progress);
          setShowContinueModal(true);
        }
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
      setLoading(false);
      setQuestions([]);
    }
  };

  // 监听进度变化，同时保存到本地 localStorage 和后端
  useEffect(() => {
    const saveToBackend = async () => {
      if (!isQuizActive || finished) return;

      // 保存到后端（跨设备同步）
      try {
        await sessionApi.upsert({
          userId: USER_ID,
          quizTitle,
          questionIds: quizQuestions.map((q) => q.id),
          currentIndex,
          selectedAnswer:
            typeof selectedAnswer === 'string' ? selectedAnswer : '',
          showResult,
          correctCount,
        });
      } catch (err) {
        console.error('Failed to save session to backend:', err);
      }
    };

    // 保存到本地（降级备用）
    if (isQuizActive && !finished) {
      saveQuizProgress({
        isQuizActive,
        quizQuestionIds: quizQuestions.map((q) => q.id),
        quizTitle,
        currentIndex,
        selectedAnswer,
        showResult,
        correctCount,
      });
    }

    saveToBackend();
  }, [
    isQuizActive,
    finished,
    quizQuestions,
    quizTitle,
    currentIndex,
    selectedAnswer,
    showResult,
    correctCount,
  ]);

  useEffect(() => {
    loadQuestions();
  }, []);

  // 根据刷题模式过滤题目
  const getFilteredQuestions = useMemo(() => {
    return (candidateQuestions: Question[]): Question[] => {
      const answeredIds = new Set(userRecords.map((r) => r.questionId));
      const wrongIds = new Set(
        userRecords.filter((r) => !r.isCorrect).map((r) => r.questionId)
      );

      switch (quizMode) {
        case 'unanswered':
          return candidateQuestions.filter((q) => !answeredIds.has(q.id));
        case 'wrong':
          return candidateQuestions.filter((q) => wrongIds.has(q.id));
        case 'all':
          return candidateQuestions;
      }
    };
  }, [userRecords, quizMode]);

  // 开始刷题
  const handleStartQuiz = (
    selectedQuestions: Question[],
    examName?: string,
    part?: string
  ) => {
    // 根据模式过滤题目
    const filteredQuestions = getFilteredQuestions(selectedQuestions);

    // 如果默认模式下没有未做题了，弹出选择弹窗
    if (filteredQuestions.length === 0 && quizMode === 'unanswered') {
      setShowFinishModal(true);
      return;
    }

    setQuizQuestions(filteredQuestions);
    if (examName && part) {
      setQuizTitle(`${examName} - ${part}`);
    } else if (examName) {
      setQuizTitle(examName);
    } else {
      setQuizTitle(`${getQuizModeLabel(quizMode)} - 全部题目`);
    }
    // 重置刷题状态
    setCurrentIndex(0);
    setSelectedAnswer('');
    setShowResult(false);
    setCorrectCount(0);
    setFinished(false);
    setIsQuizActive(true);
    // 清除任何已保存的进度
    clearQuizProgress();
  };

  // 获取刷题模式标签
  const getQuizModeLabel = (mode: QuizMode): string => {
    const labels: Record<QuizMode, string> = {
      unanswered: '未做题',
      wrong: '错题',
      all: '全部',
    };
    return labels[mode];
  };

  // 处理全部完成后选择新模式
  const handleSelectModeAfterFinish = (mode: QuizMode) => {
    setQuizMode(mode);
    setShowFinishModal(false);
    // 重新开始，使用当前选中的模式过滤全部题目
    handleStartQuiz(questions, getQuizModeLabel(mode));
  };

  // 恢复保存的进度
  const handleContinueQuiz = () => {
    if (!savedProgress) return;

    // 根据ID列表从全量题目中匹配
    const restoredQuestions = savedProgress.quizQuestionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter((q): q is Question => q !== undefined);

    if (restoredQuestions.length === 0) {
      clearQuizProgress();
      setShowContinueModal(false);
      setSavedProgress(null);
      return;
    }

    setQuizQuestions(restoredQuestions);
    setQuizTitle(savedProgress.quizTitle);
    setCurrentIndex(savedProgress.currentIndex);
    setSelectedAnswer(savedProgress.selectedAnswer || '');
    setShowResult(savedProgress.showResult);
    setCorrectCount(savedProgress.correctCount);
    setFinished(false);
    setIsQuizActive(true);
    setTab('quiz');

    clearQuizProgress();
    setShowContinueModal(false);
    setSavedProgress(null);
  };

  // 取消恢复，清除保存的进度
  const handleCancelContinue = () => {
    clearQuizProgress();
    sessionApi.deleteCurrent().catch(() => {}); // 忽略错误
    setShowContinueModal(false);
    setSavedProgress(null);
  };

  // 是否随机打乱（全部题目时打乱，选择试卷时保持顺序）
  const shouldShuffle = quizTitle === '全部题目';

  // 返回试卷选择
  const handleBackToExamSelect = () => {
    setIsQuizActive(false);
    setQuizQuestions([]);
    setQuizTitle('');
    setCurrentIndex(0);
    setSelectedAnswer('');
    setShowResult(false);
    setCorrectCount(0);
    setFinished(false);
    // 正常退出，清除保存的进度
    clearQuizProgress();
    // 删除后端会话
    sessionApi
      .deleteCurrent()
      .catch((err) => console.error('Failed to delete session:', err));
  };

  // 完成所有题目
  const handleFinishQuiz = () => {
    handleBackToExamSelect();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 mb-4">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-800">刷题助手</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {questions.length} 道题目
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-20">
        {/* 刷题模式：试卷选择 or 刷题卡片 */}
        {tab === 'quiz' &&
          (isQuizActive ? (
            <div>
              {/* 返回按钮和标题 */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={handleBackToExamSelect}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h2 className="text-lg font-medium text-gray-800">
                  {quizTitle}
                </h2>
              </div>
              <QuizCard
                questions={quizQuestions}
                shuffle={shouldShuffle}
                currentIndex={currentIndex}
                selectedAnswer={selectedAnswer}
                showResult={showResult}
                correctCount={correctCount}
                finished={finished}
                onCurrentIndexChange={setCurrentIndex}
                onSelectedAnswerChange={setSelectedAnswer}
                onShowResultChange={setShowResult}
                onCorrectCountChange={setCorrectCount}
                onFinishedChange={setFinished}
                onFinish={handleFinishQuiz}
              />
            </div>
          ) : (
            <ExamSelector
              questions={questions}
              onSelectExam={handleStartQuiz}
              onSelectAll={handleStartQuiz}
              quizMode={quizMode}
              onQuizModeChange={setQuizMode}
            />
          ))}

        {/* 题库列表 */}
        {tab === 'list' && (
          <QuestionList questions={questions} onUpdated={loadQuestions} />
        )}

        {/* 我的 */}
        {tab === 'profile' && (
          <Profile
            onStartWrongNotes={(questions, title) => {
              handleStartQuiz(questions, title);
              setTab('quiz');
            }}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-3xl mx-auto flex">
          <button
            onClick={() => {
              setTab('quiz');
              setIsQuizActive(false);
            }}
            className={`flex-1 py-3 text-center ${
              tab === 'quiz' ? 'text-blue-500 font-medium' : 'text-gray-500'
            }`}
          >
            刷题
          </button>
          <button
            onClick={() => setTab('list')}
            className={`flex-1 py-3 text-center ${
              tab === 'list' ? 'text-blue-500 font-medium' : 'text-gray-500'
            }`}
          >
            题库
          </button>
          <button
            onClick={() => setTab('profile')}
            className={`flex-1 py-3 text-center ${
              tab === 'profile' ? 'text-blue-500 font-medium' : 'text-gray-500'
            }`}
          >
            我的
          </button>
        </div>
      </nav>

      {/* 继续刷题弹框 */}
      {showContinueModal && savedProgress && (
        <ContinueQuizModal
          progress={savedProgress}
          onContinue={handleContinueQuiz}
          onCancel={handleCancelContinue}
        />
      )}

      {/* 全部完成选择弹窗 */}
      {showFinishModal && (
        <QuizFinishModal
          onSelectMode={handleSelectModeAfterFinish}
          onCancel={() => setShowFinishModal(false)}
        />
      )}
    </div>
  );
}
