import { useState, useEffect } from 'react';
import type { Question } from '../types';
import { getWrongQuestions } from '../db';

interface Props {
  onStartQuiz: (questions: Question[], title: string) => void;
}

export default function WrongNotes({ onStartQuiz }: Props) {
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWrongQuestions = async () => {
    setLoading(true);
    const questions = await getWrongQuestions();
    setWrongQuestions(questions);
    setLoading(false);
  };

  useEffect(() => {
    loadWrongQuestions();
  }, []);

  const handleStartQuiz = () => {
    if (wrongQuestions.length === 0) return;
    onStartQuiz(wrongQuestions, '错题本');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (wrongQuestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-500">暂无错题，做得不错！</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">错题本</h3>
        <span className="text-sm text-gray-500">共 {wrongQuestions.length} 题</span>
      </div>

      <button
        onClick={handleStartQuiz}
        className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
      >
        开始复习错题
      </button>
    </div>
  );
}
