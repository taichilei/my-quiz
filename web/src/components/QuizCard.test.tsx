import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QuizCard from './QuizCard';
import type { Question } from '../types';

// Declare global for TypeScript
declare const global: {
  localStorage: Storage;
};

// Mock types
const mockQuestion: Question = {
  id: 1,
  type: 'single',
  content: '这是测试题目内容？',
  options: ['A. 选项A', 'B. 选项B', 'C. 选项C', 'D. 选项D'],
  answer: 'A',
  explanation: '这是解析内容',
  createdAt: Date.now(),
};

const mockJudgeQuestion: Question = {
  id: 2,
  type: 'judge',
  content: '判断题内容？',
  answer: true,
  explanation: '正确',
  createdAt: Date.now(),
};

const mockMultipleQuestion: Question = {
  id: 3,
  type: 'multiple',
  content: '多选题内容？',
  options: ['A. 选项A', 'B. 选项B', 'C. 选项C', 'D. 选项D'],
  answer: 'AB',
  explanation: 'AB 是正确选项',
  createdAt: Date.now(),
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as unknown as Storage;

describe('QuizCard Component', () => {
  const mockOnFinish = vi.fn();
  const mockOnCurrentIndexChange = vi.fn();
  const mockOnSelectedAnswerChange = vi.fn();
  const mockOnShowResultChange = vi.fn();
  const mockOnCorrectCountChange = vi.fn();
  const mockOnFinishedChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (questions: Question[]) => {
    return render(
      <BrowserRouter>
        <QuizCard
          questions={questions}
          shuffle={false}
          currentIndex={0}
          selectedAnswer=""
          showResult={false}
          correctCount={0}
          finished={false}
          onCurrentIndexChange={mockOnCurrentIndexChange}
          onSelectedAnswerChange={mockOnSelectedAnswerChange}
          onShowResultChange={mockOnShowResultChange}
          onCorrectCountChange={mockOnCorrectCountChange}
          onFinishedChange={mockOnFinishedChange}
          onFinish={mockOnFinish}
        />
      </BrowserRouter>
    );
  };

  describe('Single Choice Questions', () => {
    it('should render single choice question', () => {
      renderComponent([mockQuestion]);

      expect(screen.getByText('这是测试题目内容？')).toBeInTheDocument();
      expect(screen.getByText('A. 选项A')).toBeInTheDocument();
      expect(screen.getByText('B. 选项B')).toBeInTheDocument();
      expect(screen.getByText('C. 选项C')).toBeInTheDocument();
      expect(screen.getByText('D. 选项D')).toBeInTheDocument();
    });

    it('should show question type badge', () => {
      renderComponent([mockQuestion]);

      expect(screen.getByText('单选题')).toBeInTheDocument();
    });

    it('should show give up button', () => {
      renderComponent([mockQuestion]);

      expect(screen.getByText('我不会，看答案')).toBeInTheDocument();
    });

    it('should show result immediately after selection (single choice)', () => {
      renderComponent([mockQuestion]);

      // 选择答案后直接显示结果
      fireEvent.click(screen.getByText('A. 选项A'));

      // 应该显示回答正确
      expect(screen.getByText(/回答正确/)).toBeInTheDocument();
    });
  });

  describe('Judge Questions', () => {
    it('should render judge question with true/false options', () => {
      renderComponent([mockJudgeQuestion]);

      expect(screen.getByText('判断题内容？')).toBeInTheDocument();
      expect(screen.getByText('正确')).toBeInTheDocument();
      expect(screen.getByText('错误')).toBeInTheDocument();
    });

    it('should show correct result for correct answer', () => {
      renderComponent([mockJudgeQuestion]);

      fireEvent.click(screen.getByText('正确'));

      expect(screen.getByText(/回答正确/)).toBeInTheDocument();
    });

    it('should show wrong result for wrong answer', () => {
      renderComponent([mockJudgeQuestion]);

      fireEvent.click(screen.getByText('错误'));

      expect(screen.getByText(/回答错误/)).toBeInTheDocument();
    });
  });

  describe('Multiple Choice Questions', () => {
    it('should render multiple choice question', () => {
      renderComponent([mockMultipleQuestion]);

      expect(screen.getByText('多选题内容？')).toBeInTheDocument();
    });

    it('should show confirm button for multiple choice', () => {
      renderComponent([mockMultipleQuestion]);

      // 选择答案后需要确认
      fireEvent.click(screen.getByText('A. 选项A'));

      expect(screen.getByText('确认答案')).toBeInTheDocument();
    });
  });

  describe('Question Navigation', () => {
    it('should show progress indicator', () => {
      renderComponent([mockQuestion, mockJudgeQuestion]);

      expect(
        screen.getByText(
          (content) => content.includes('1') && content.includes('/')
        )
      ).toBeInTheDocument();
    });

    it('should show next button after answering', () => {
      renderComponent([mockQuestion, mockJudgeQuestion]);

      // 回答第一题（单选直接显示结果）
      fireEvent.click(screen.getByText('A. 选项A'));

      // 应该显示下一题按钮
      expect(screen.getByText('下一题')).toBeInTheDocument();
    });
  });

  describe('Images', () => {
    it('should render question images', () => {
      const questionWithImage = {
        ...mockQuestion,
        images: ['https://example.com/image.jpg'],
      };

      renderComponent([questionWithImage]);

      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });
  });

  describe('Give Up Feature', () => {
    it('should show explanation when giving up', () => {
      renderComponent([mockQuestion]);

      fireEvent.click(screen.getByText('我不会，看答案'));

      expect(
        screen.getByText((content) => content.includes('解析'))
      ).toBeInTheDocument();
    });
  });

  describe('Finish Screen', () => {
    it('should show finish screen after completing', () => {
      renderComponent([mockQuestion]);

      // 回答问题后点击完成
      fireEvent.click(screen.getByText('A. 选项A'));
      fireEvent.click(screen.getByText((content) => content === '完成'));

      expect(screen.getByText('答题完成！')).toBeInTheDocument();
    });
  });
});
