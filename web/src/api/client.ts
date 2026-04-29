import type {
  Question,
  ExamRef,
  AnswerRecord,
  QuizSession,
  Upload,
} from '../types';
import { getDeviceId, APP_VERSION, CLIENT_TYPE } from '../utils/device';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * 多端信息 Header
 * 用于后端识别请求来自哪个端、哪个版本
 */
function getClientHeaders(): Record<string, string> {
  return {
    'X-Client-Type': CLIENT_TYPE,
    'X-App-Version': APP_VERSION,
    'X-Device-Id': getDeviceId(),
  };
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getClientHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Re-export types from central types file
export type { Question, ExamRef as Exam, AnswerRecord, QuizSession };

export interface ExamInfo {
  name: string;
  year: number;
  subject: string;
  part: string;
  count: number;
}

// Question APIs
export const questionApi = {
  list: (params?: {
    exam?: string;
    year?: number;
    subject?: string;
    type?: string;
    tag?: string;
  }) => {
    const query = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return request<Question[]>(`/api/questions${query ? `?${query}` : ''}`);
  },

  get: (id: number) => request<Question>(`/api/questions/${id}`),

  create: (question: Omit<Question, 'id'>) =>
    request<Question>('/api/questions', {
      method: 'POST',
      body: JSON.stringify(question),
    }),

  update: (id: number, question: Partial<Question>) =>
    request<Question>(`/api/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(question),
    }),

  delete: (id: number) =>
    request<{ message: string }>(`/api/questions/${id}`, {
      method: 'DELETE',
    }),
};

// Exam APIs
export const examApi = {
  list: () => request<ExamInfo[]>('/api/exams'),
};

// Record APIs
export const recordApi = {
  create: (record: Omit<AnswerRecord, 'id'>) =>
    request<AnswerRecord>('/api/records', {
      method: 'POST',
      body: JSON.stringify(record),
    }),

  list: (userId: string, questionId?: number) => {
    const query = questionId ? `?questionId=${questionId}` : '';
    return request<AnswerRecord[]>(`/api/records/${userId}${query}`);
  },

  stats: (userId: string) =>
    request<{ total: number; correct: number; rate: number }>(
      `/api/records/${userId}/stats`
    ),
};

// Session APIs (unfinished quiz progress for cross-device sync)
export const sessionApi = {
  getCurrent: () => request<QuizSession>('/api/session/current'),

  upsert: (session: Omit<QuizSession, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<QuizSession>('/api/session', {
      method: 'POST',
      body: JSON.stringify(session),
    }),

  deleteCurrent: () =>
    request<{ message: string }>('/api/session/current', {
      method: 'DELETE',
    }),
};

// Upload APIs (file management)
export const uploadApi = {
  list: () => request<Upload[]>('/api/uploads'),

  get: (id: number) => request<Upload>(`/api/uploads/${id}`),

  upload: (formData: FormData) => {
    return fetch(`${API_BASE}/api/uploads`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    }).then((res) => {
      if (!res.ok) {
        return res
          .json()
          .catch(() => ({ error: 'Upload failed' }))
          .then((err) => {
            throw new Error(err.error || 'Upload failed');
          });
      }
      return res.json() as Promise<Upload>;
    });
  },

  update: (id: number, data: { title: string; description: string }) =>
    request<Upload>(`/api/uploads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number, deleteQuestions: boolean) =>
    request<{ message: string }>(
      `/api/uploads/${id}?deleteQuestions=${deleteQuestions}`,
      {
        method: 'DELETE',
      }
    ),

  download: (id: number) => {
    window.open(`${API_BASE}/api/uploads/${id}/download`, '_blank');
  },
};
