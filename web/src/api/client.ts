const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
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
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<Question[]>(`/api/questions${query ? `?${query}` : ''}`);
  },

  get: (id: string) =>
    request<Question>(`/api/questions/${id}`),

  create: (question: Omit<Question, 'id'>) =>
    request<Question>('/api/questions', {
      method: 'POST',
      body: JSON.stringify(question),
    }),

  update: (id: string, question: Partial<Question>) =>
    request<Question>(`/api/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(question),
    }),

  delete: (id: string) =>
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

  list: (userId: string, questionId?: string) => {
    const query = questionId ? `?questionId=${questionId}` : '';
    return request<AnswerRecord[]>(`/api/records/${userId}${query}`);
  },

  stats: (userId: string) =>
    request<{ total: number; correct: number; rate: number }>(
      `/api/records/${userId}/stats`
    ),
};

// Types
export interface Question {
  id: string;
  type: 'single' | 'multiple' | 'judge';
  content: string;
  options: string[];
  answer: string;
  explanation?: string;
  difficulty: number;
  tags?: string[];
  exam?: Exam;
  images?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Exam {
  name: string;
  year: number;
  subject: string;
  part?: string;
  order: number;
}

export interface ExamInfo {
  name: string;
  year: number;
  subject: string;
  part: string;
  count: number;
}

export interface AnswerRecord {
  id?: string;
  userId: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent?: number;
  answeredAt: number;
}
