import { useState, useEffect } from 'react';
import type { Question } from './types';
import { getQuestions, initQuestions } from './db';
import QuestionList from './components/QuestionList';
import QuizCard from './components/QuizCard';
import ExamSelector from './components/ExamSelector';
import Profile from './components/Profile';

type Tab = 'quiz' | 'list' | 'profile';

export default function App() {
  const [tab, setTab] = useState<Tab>('quiz');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // 刷题状态
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [quizTitle, setQuizTitle] = useState<string>('');
  const [isQuizActive, setIsQuizActive] = useState(false);

  const loadQuestions = async () => {
    await initQuestions();
    const data = await getQuestions();
    setQuestions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  // 开始刷题
  const handleStartQuiz = (selectedQuestions: Question[], examName?: string, part?: string) => {
    setQuizQuestions(selectedQuestions);
    if (examName && part) {
      setQuizTitle(`${examName} - ${part}`);
    } else if (examName) {
      setQuizTitle(examName);
    } else {
      setQuizTitle('全部题目');
    }
    setIsQuizActive(true);
  };

  // 是否随机打乱（全部题目时打乱，选择试卷时保持顺序）
  const shouldShuffle = quizTitle === '全部题目';

  // 返回试卷选择
  const handleBackToExamSelect = () => {
    setIsQuizActive(false);
    setQuizQuestions([]);
    setQuizTitle('');
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
          <p className="text-sm text-gray-500 mt-1">共 {questions.length} 道题目</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-20">
        {/* 刷题模式：试卷选择 or 刷题卡片 */}
        {tab === 'quiz' && (
          isQuizActive ? (
            <div>
              {/* 返回按钮和标题 */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={handleBackToExamSelect}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-lg font-medium text-gray-800">{quizTitle}</h2>
              </div>
              <QuizCard
                questions={quizQuestions}
                onFinish={handleBackToExamSelect}
                shuffle={shouldShuffle}
              />
            </div>
          ) : (
            <ExamSelector
              questions={questions}
              onSelectExam={handleStartQuiz}
              onSelectAll={handleStartQuiz}
            />
          )
        )}

        {/* 题库列表 */}
        {tab === 'list' && (
          <QuestionList
            questions={questions}
            onUpdated={loadQuestions}
          />
        )}

        {/* 我的 */}
        {tab === 'profile' && <Profile />}
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
    </div>
  );
}
