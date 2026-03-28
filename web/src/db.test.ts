import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as db from './db'

// Mock 模块
vi.mock('localforage', () => ({
  default: {
    config: vi.fn(),
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}))

vi.mock('./api/client', () => ({
  questionApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  recordApi: {
    create: vi.fn(),
    stats: vi.fn(),
  },
}))

import localforage from 'localforage'
import { questionApi, recordApi } from './api/client'

describe('db.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('getUserId', () => {
    it('should return existing userId if set', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue('user_existing123')

      const userId = await db.getUserId()

      expect(userId).toBe('user_existing123')
      expect(localforage.getItem).toHaveBeenCalledWith('userId')
    })

    it('should generate new userId if not exists', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue(null)
      vi.mocked(localforage.setItem).mockResolvedValue()

      const userId = await db.getUserId()

      expect(userId).toMatch(/^user_/)
      expect(localforage.setItem).toHaveBeenCalledWith(
        'userId',
        expect.any(String)
      )
    })
  })

  describe('getQuestions', () => {
    it('should fetch from API when available', async () => {
      const mockQuestions = [
        { id: '1', type: 'single', content: 'Q1' },
      ]
      vi.mocked(questionApi.list).mockResolvedValue(mockQuestions as any)

      const questions = await db.getQuestions()

      expect(questionApi.list).toHaveBeenCalled()
      expect(questions).toEqual(mockQuestions)
    })

    it('should fallback to localforage when API fails', async () => {
      vi.mocked(questionApi.list).mockRejectedValue(new Error('API unavailable'))
      vi.mocked(localforage.getItem).mockResolvedValue([
        { id: '1', type: 'single', content: 'Local Q' },
      ])

      const questions = await db.getQuestions()

      expect(questionApi.list).toHaveBeenCalled()
      expect(localforage.getItem).toHaveBeenCalledWith('questions')
      expect(questions).toEqual([{ id: '1', type: 'single', content: 'Local Q' }])
    })

    it('should return empty array when no data', async () => {
      vi.mocked(questionApi.list).mockRejectedValue(new Error('API unavailable'))
      vi.mocked(localforage.getItem).mockResolvedValue(null)

      const questions = await db.getQuestions()

      expect(questions).toEqual([])
    })
  })

  describe('saveQuestion', () => {
    it('should save to API when available', async () => {
      vi.mocked(questionApi.create).mockResolvedValue({ id: 'new1' } as any)

      await db.saveQuestion({ id: 'new1', type: 'single', content: 'Q', answer: 'A', createdAt: Date.now() } as any)

      expect(questionApi.create).toHaveBeenCalled()
    })

    it('should fallback to localforage when API fails', async () => {
      vi.mocked(questionApi.create).mockRejectedValue(new Error('API unavailable'))
      vi.mocked(localforage.getItem).mockResolvedValue([])
      vi.mocked(localforage.setItem).mockResolvedValue()

      const question = { id: 'new1', type: 'single', content: 'Q', answer: 'A', createdAt: Date.now() }
      await db.saveQuestion(question as any)

      expect(questionApi.create).toHaveBeenCalled()
      expect(localforage.setItem).toHaveBeenCalled()
    })
  })

  describe('updateQuestion', () => {
    it('should update via API when available', async () => {
      vi.mocked(questionApi.update).mockResolvedValue({} as any)

      await db.updateQuestion('1', { content: 'Updated' })

      expect(questionApi.update).toHaveBeenCalledWith('1', { content: 'Updated' })
    })

    it('should fallback to localforage when API fails', async () => {
      vi.mocked(questionApi.update).mockRejectedValue(new Error('API unavailable'))
      vi.mocked(localforage.getItem).mockResolvedValue([
        { id: '1', type: 'single', content: 'Q1', answer: 'A', createdAt: 123, updatedAt: 123 },
      ])
      vi.mocked(localforage.setItem).mockResolvedValue()

      await db.updateQuestion('1', { content: 'Updated' })

      expect(localforage.setItem).toHaveBeenCalled()
    })
  })

  describe('deleteQuestion', () => {
    it('should delete via API when available', async () => {
      vi.mocked(questionApi.delete).mockResolvedValue({} as any)

      await db.deleteQuestion('1')

      expect(questionApi.delete).toHaveBeenCalledWith('1')
    })

    it('should fallback to localforage when API fails', async () => {
      vi.mocked(questionApi.delete).mockRejectedValue(new Error('API unavailable'))
      vi.mocked(localforage.getItem).mockResolvedValue([
        { id: '1', type: 'single', content: 'Q1', answer: 'A', createdAt: 123 },
        { id: '2', type: 'single', content: 'Q2', answer: 'B', createdAt: 124 },
      ])
      vi.mocked(localforage.setItem).mockResolvedValue()

      await db.deleteQuestion('1')

      expect(localforage.setItem).toHaveBeenCalledWith(
        'questions',
        [{ id: '2', type: 'single', content: 'Q2', answer: 'B', createdAt: 124 }]
      )
    })
  })

  describe('importQuestions', () => {
    it('should import via API when available', async () => {
      vi.mocked(questionApi.create).mockResolvedValue({} as any)

      const questions = [
        { id: '1', type: 'single', content: 'Q1', answer: 'A', createdAt: Date.now() },
      ]
      await db.importQuestions(questions as any)

      expect(questionApi.create).toHaveBeenCalledTimes(1)
    })

    it('should fallback to localforage when API fails', async () => {
      vi.mocked(questionApi.create).mockRejectedValue(new Error('API unavailable'))
      vi.mocked(localforage.getItem).mockResolvedValue([
        { id: 'existing1', type: 'single', content: 'Existing', answer: 'A', createdAt: 123 },
      ])
      vi.mocked(localforage.setItem).mockResolvedValue()

      const newQuestions = [
        { id: 'existing1', type: 'single', content: 'Existing', answer: 'A', createdAt: 123 },
        { id: 'new1', type: 'single', content: 'New', answer: 'B', createdAt: 124 },
      ]
      await db.importQuestions(newQuestions as any)

      // 应该只添加不重复的题目
      expect(localforage.setItem).toHaveBeenCalledWith(
        'questions',
        expect.arrayContaining([
          expect.objectContaining({ id: 'existing1' }),
          expect.objectContaining({ id: 'new1' }),
        ])
      )
    })
  })

  describe('recordAnswer', () => {
    it('should record via API when available', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue('user_test123')
      vi.mocked(recordApi.create).mockResolvedValue({} as any)

      await db.recordAnswer('q1', 'A', true, 30)

      expect(recordApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_test123',
          questionId: 'q1',
          userAnswer: 'A',
          isCorrect: true,
          timeSpent: 30,
        })
      )
    })

    it('should fallback to localforage when API fails', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue('user_test123')
      vi.mocked(recordApi.create).mockRejectedValue(new Error('API unavailable'))
      vi.mocked(localforage.getItem).mockResolvedValueOnce('user_test123') // for getUserId
      vi.mocked(localforage.getItem).mockResolvedValueOnce([
        { id: 'q1', type: 'single', content: 'Q1', answer: 'A', createdAt: 123, answerHistory: [] },
      ])
      vi.mocked(localforage.setItem).mockResolvedValue()

      await db.recordAnswer('q1', 'A', true, 30)

      expect(localforage.setItem).toHaveBeenCalled()
    })
  })

  describe('getStats', () => {
    it('should fetch stats from API', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue('user_test123')
      vi.mocked(recordApi.stats).mockResolvedValue({ total: 100, correct: 80, rate: 80 })

      const stats = await db.getStats()

      expect(recordApi.stats).toHaveBeenCalledWith('user_test123')
      expect(stats).toEqual({ total: 100, correct: 80, rate: 80 })
    })

    it('should return zeros when API fails', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue('user_test123')
      vi.mocked(recordApi.stats).mockRejectedValue(new Error('API unavailable'))

      const stats = await db.getStats()

      expect(stats).toEqual({ total: 0, correct: 0, rate: 0 })
    })
  })

  describe('clearQuestions', () => {
    it('should clear local questions', async () => {
      vi.mocked(localforage.setItem).mockResolvedValue()

      await db.clearQuestions()

      expect(localforage.setItem).toHaveBeenCalledWith('questions', [])
      expect(localforage.setItem).toHaveBeenCalledWith('initialized', false)
    })
  })

  describe('reloadQuestionBanks', () => {
    it('should return 0 (not supported in API mode)', async () => {
      const result = await db.reloadQuestionBanks()

      expect(result).toBe(0)
    })
  })
})
