import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  questionApi,
  recordApi,
  examApi,
  type Question,
  type AnswerRecord,
} from './client';

// Declare global for TypeScript
declare const global: {
  fetch: Mock;
};

// Mock fetch 全局
global.fetch = vi.fn();

describe('api/client.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('questionApi', () => {
    it('list should fetch all questions', async () => {
      const mockQuestions = [
        { id: 1, type: 'single', content: 'Q1', answer: 'A' },
        { id: 2, type: 'judge', content: 'Q2', answer: true },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockQuestions),
      });

      const questions = await questionApi.list();

      expect(global.fetch).toHaveBeenCalled();
      const [url] = global.fetch.mock.calls[0];
      expect(url).toContain('/api/questions');
      expect(questions).toEqual(mockQuestions);
    });

    it('list should accept filter params', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await questionApi.list({ exam: '江苏省考', year: 2021, type: 'single' });

      expect(global.fetch).toHaveBeenCalled();
      const [url] = global.fetch.mock.calls[0];
      expect(url).toContain('exam=');
      expect(url).toContain('year=2021');
      expect(url).toContain('type=single');
    });

    it('list should throw on error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      await expect(questionApi.list()).rejects.toThrow('Server error');
    });

    it('get should fetch single question', async () => {
      const mockQuestion = {
        id: 1,
        type: 'single',
        content: 'Q1',
        answer: 'A',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockQuestion),
      });

      const question = await questionApi.get(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/questions/1'),
        expect.any(Object)
      );
      expect(question).toEqual(mockQuestion);
    });

    it('create should POST question', async () => {
      const newQuestion = {
        type: 'single',
        content: 'New Q',
        answer: 'A',
        createdAt: Date.now(),
      };
      const createdQuestion = { id: 123, ...newQuestion };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createdQuestion),
      });

      const result = await questionApi.create(
        newQuestion as Omit<Question, 'id'>
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/questions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newQuestion),
        })
      );
      expect(result.id).toBe(123);
    });

    it('update should PUT question', async () => {
      const updates = { content: 'Updated content' };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'updated' }),
      });

      await questionApi.update(1, updates as Partial<Question>);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/questions/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      );
    });

    it('delete should DELETE question', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'deleted' }),
      });

      await questionApi.delete(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/questions/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('examApi', () => {
    it('list should fetch all exams', async () => {
      const mockExams = [
        {
          name: '江苏省考',
          year: 2021,
          subject: '综合',
          part: '客观题',
          count: 100,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockExams),
      });

      const exams = await examApi.list();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/exams'),
        expect.any(Object)
      );
      expect(exams).toEqual(mockExams);
    });
  });

  describe('recordApi', () => {
    it('create should POST record', async () => {
      const newRecord = {
        userId: 'user_123',
        questionId: 456,
        userAnswer: 'A',
        isCorrect: true,
        answeredAt: Date.now(),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 123, ...newRecord }),
      });

      const result = await recordApi.create(
        newRecord as Omit<AnswerRecord, 'id'>
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/records'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newRecord),
        })
      );
      expect(result.id).toBe(123);
    });

    it('list should fetch user records', async () => {
      const mockRecords = [
        { id: 1, userId: 'user_123', questionId: 1, isCorrect: true },
        { id: 2, userId: 'user_123', questionId: 2, isCorrect: false },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRecords),
      });

      const records = await recordApi.list('user_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/records/user_123'),
        expect.any(Object)
      );
      expect(records).toEqual(mockRecords);
    });

    it('list should accept question filter', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await recordApi.list('user_123', 456);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('questionId=456'),
        expect.any(Object)
      );
    });

    it('stats should fetch user stats', async () => {
      const mockStats = { total: 100, correct: 80, rate: 80 };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

      const stats = await recordApi.stats('user_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/records/user_123/stats'),
        expect.any(Object)
      );
      expect(stats.total).toBe(100);
      expect(stats.correct).toBe(80);
      expect(stats.rate).toBe(80);
    });
  });
});
