import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import QuizCard from './QuizCard';

// 测试数据
const mockSingleQuestion = {
  id: 1,
  type: 'single' as const,
  content: 'React Native 中，用于跨平台布局的核心样式单位是？',
  options: ['px - 像素', 'dp - 设备独立像素', '% - 百分比', 'rem - 相对单位'],
  answer: 'B',
  explanation: 'React Native 所有尺寸都是无单位的，代表设备独立像素。',
};

const mockMultipleQuestion = {
  id: 2,
  type: 'multiple' as const,
  content: '以下哪些是 React Native 的核心组件？',
  options: ['View - 容器组件', 'Text - 文本组件', 'Image - 图片组件', 'Button - HTML按钮'],
  answer: 'A,B,C',
  explanation: 'React Native 提供 View、Text、Image 等跨平台核心组件。',
};

const mockJudgeQuestion = {
  id: 3,
  type: 'judge' as const,
  content: 'React Native 可以同时开发 iOS 和 Android 两个平台的应用。',
  answer: true,
  explanation: 'React Native 的核心设计就是「一次编写，处处运行」。',
};

const mockProps = {
  currentIndex: 0,
  totalQuestions: 3,
  onAnswer: jest.fn(),
  onNext: jest.fn(),
};

describe('QuizCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染题干和题号', () => {
      render(<QuizCard question={mockSingleQuestion} {...mockProps} />);

      expect(screen.getByText('React Native 中，用于跨平台布局的核心样式单位是？')).toBeTruthy();
      expect(screen.getByText('1 / 3')).toBeTruthy();
      expect(screen.getByText('单选题')).toBeTruthy();
    });

    it('应该渲染所有选项', () => {
      render(<QuizCard question={mockSingleQuestion} {...mockProps} />);

      expect(screen.getByText('px - 像素')).toBeTruthy();
      expect(screen.getByText('dp - 设备独立像素')).toBeTruthy();
      expect(screen.getByText('% - 百分比')).toBeTruthy();
      expect(screen.getByText('rem - 相对单位')).toBeTruthy();
    });

    it('应该渲染「我不会，看答案」按钮', () => {
      render(<QuizCard question={mockSingleQuestion} {...mockProps} />);
      expect(screen.getByText('🤔 我不会，看答案')).toBeTruthy();
    });
  });

  describe('单选题', () => {
    it('点击正确选项应该显示成功', () => {
      render(<QuizCard question={mockSingleQuestion} {...mockProps} />);

      fireEvent.press(screen.getByText('dp - 设备独立像素'));

      expect(screen.getByText('🎉 回答正确！')).toBeTruthy();
      expect(mockProps.onAnswer).toHaveBeenCalledWith('B', true);
    });

    it('点击错误选项应该显示失败', () => {
      render(<QuizCard question={mockSingleQuestion} {...mockProps} />);

      fireEvent.press(screen.getByText('px - 像素'));

      expect(screen.getByText('😅 回答错误，正确答案：B')).toBeTruthy();
      expect(mockProps.onAnswer).toHaveBeenCalledWith('A', false);
    });

    it('应该显示解析', () => {
      render(<QuizCard question={mockSingleQuestion} {...mockProps} />);

      fireEvent.press(screen.getByText('dp - 设备独立像素'));

      expect(screen.getByText('💡 React Native 所有尺寸都是无单位的，代表设备独立像素。')).toBeTruthy();
    });

    it('应该显示下一题按钮', () => {
      render(<QuizCard question={mockSingleQuestion} {...mockProps} />);

      fireEvent.press(screen.getByText('dp - 设备独立像素'));

      expect(screen.getByText('下一题 →')).toBeTruthy();
    });
  });

  describe('判断题', () => {
    it('点击正确应该显示成功', () => {
      render(<QuizCard question={mockJudgeQuestion} {...mockProps} />);

      fireEvent.press(screen.getByText('正确'));

      expect(screen.getByText('🎉 回答正确！')).toBeTruthy();
      expect(mockProps.onAnswer).toHaveBeenCalledWith(true, true);
    });

    it('点击错误应该显示失败', () => {
      render(<QuizCard question={mockJudgeQuestion} {...mockProps} />);

      fireEvent.press(screen.getByText('错误'));

      expect(screen.getByText('😅 回答错误，正确答案：正确')).toBeTruthy();
      expect(mockProps.onAnswer).toHaveBeenCalledWith(false, false);
    });
  });

  describe('多选题', () => {
    it('应该显示「确认答案」按钮', () => {
      render(<QuizCard question={mockMultipleQuestion} {...mockProps} />);

      expect(screen.getByText('✅ 确认答案 (0 已选)')).toBeTruthy();
    });

    it('选中选项后应该更新已选数量', () => {
      render(<QuizCard question={mockMultipleQuestion} {...mockProps} />);

      fireEvent.press(screen.getByText('View - 容器组件'));
      expect(screen.getByText('✅ 确认答案 (1 已选)')).toBeTruthy();

      fireEvent.press(screen.getByText('Text - 文本组件'));
      expect(screen.getByText('✅ 确认答案 (2 已选)')).toBeTruthy();
    });

    it('取消选中应该减少已选数量', () => {
      render(<QuizCard question={mockMultipleQuestion} {...mockProps} />);

      fireEvent.press(screen.getByText('View - 容器组件'));
      fireEvent.press(screen.getByText('View - 容器组件'));

      expect(screen.getByText('✅ 确认答案 (0 已选)')).toBeTruthy();
    });

    it('未选中任何选项时确认按钮应该不可用', () => {
      render(<QuizCard question={mockMultipleQuestion} {...mockProps} />);

      const button = screen.getByText('✅ 确认答案 (0 已选)');
      fireEvent.press(button);

      // 确认按钮点击后不应该显示结果
      expect(screen.queryByText('🎉 回答正确！')).toBeNull();
    });
  });

  describe('「我不会」功能', () => {
    it('点击我不会应该直接显示答案', () => {
      render(<QuizCard question={mockSingleQuestion} {...mockProps} />);

      fireEvent.press(screen.getByText('🤔 我不会，看答案'));

      expect(screen.getByText('⏭️ 未作答，正确答案：B')).toBeTruthy();
      expect(mockProps.onAnswer).toHaveBeenCalledWith('', false);
    });
  });

  describe('下一题', () => {
    it('点击下一题应该调用 onNext 回调', () => {
      render(<QuizCard question={mockSingleQuestion} {...mockProps} />);

      fireEvent.press(screen.getByText('dp - 设备独立像素'));
      fireEvent.press(screen.getByText('下一题 →'));

      expect(mockProps.onNext).toHaveBeenCalledTimes(1);
    });

    it('最后一题应该显示「完成」', () => {
      render(
        <QuizCard
          question={mockSingleQuestion}
          currentIndex={2}
          totalQuestions={3}
          onAnswer={jest.fn()}
          onNext={jest.fn()}
        />
      );

      fireEvent.press(screen.getByText('dp - 设备独立像素'));

      expect(screen.getByText('🎯 完成')).toBeTruthy();
    });
  });
});
