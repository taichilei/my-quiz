// 同步源: apps/web/src/api/client.ts
// 修改时请保持两端一致；v2 升级 OpenAPI codegen 后此文件将自动生成。
//
// 与 Web 版的差异：
// - baseURL 从 expo Constants 的 extra.apiUrl 读取，否则回落到本机调试值
// - DeviceID 从 expo-secure-store 异步读取（首次请求会触发首次读盘，后续缓存在内存）
// - 自动注入 Authorization: Bearer <jwt>，token 由 authStore.setAuthToken() 注入
// - 401 触发 onUnauthorized 回调（authStore 绑定为登出 + 跳登录页）

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  getDeviceId,
  APP_VERSION,
  CLIENT_TYPE,
  PLATFORM,
} from '../utils/device';
import type {
  AuthResponse,
  AnswerRecord,
  Exam,
  ExamInfo,
  Question,
  QuizSession,
  User,
} from '../types';

// ============================================================
// Base config
// ============================================================

/**
 * 解析 API base URL 的优先级：
 *   1. EXPO_PUBLIC_API_URL 环境变量（真机调试时设为 Mac 的 LAN IP）
 *   2. app.json 的 expo.extra.apiUrl
 *   3. 平台默认值：iOS 模拟器走宿主 localhost，Android 模拟器走 10.0.2.2
 */
function resolveApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const fromConfig = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (fromConfig) return fromConfig;
  if (Platform.OS === 'android') return 'http://10.0.2.2:8080';
  return 'http://localhost:8080';
}

const API_BASE: string = resolveApiBase();

let currentToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
let cachedDeviceId: string | null = null;

/** authStore 在登录/恢复 token 后调用 */
export function setAuthToken(token: string | null): void {
  currentToken = token;
}

/** authStore 在 App 启动时调用，绑定 401 回调 */
export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

async function getCachedDeviceId(): Promise<string> {
  if (!cachedDeviceId) cachedDeviceId = await getDeviceId();
  return cachedDeviceId;
}

// ============================================================
// 通用 request
// ============================================================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const deviceId = await getCachedDeviceId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client-Type': CLIENT_TYPE,
    'X-Platform': PLATFORM,
    'X-App-Version': APP_VERSION,
    'X-Device-Id': deviceId,
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    unauthorizedHandler?.();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  // 204 No Content
  if (response.status === 204) return undefined as T;
  return response.json();
}

// ============================================================
// Auth APIs（公开）
// ============================================================

export const authApi = {
  /** 登录：username 字段同时接受用户名或邮箱 */
  login: (params: { username: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  register: (params: {
    username: string;
    password: string;
    email: string;
  }) =>
    request<{ message: string; userId: number }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  verifyEmail: (token: string) =>
    request<{ message: string }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  resendVerification: (email: string) =>
    request<{ message: string }>('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (params: { token: string; newPassword: string }) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: params.token,
        new_password: params.newPassword,
      }),
    }),

  /** Debug：返回后端识别到的客户端信息，验证多端 Header 联调通。 */
  debugClientInfo: () =>
    request<{
      type: string;
      version: string;
      device_id: string;
      platform: string;
      is_mobile: boolean;
    }>('/api/debug/client-info'),
};

// ============================================================
// User APIs（需要 JWT）
// ============================================================

export const userApi = {
  me: () => request<User>('/api/user/me'),

  update: (data: Partial<Pick<User, 'username' | 'email'>>) =>
    request<User>('/api/user/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ============================================================
// Question APIs（需要 JWT，RN 端只读）
// ============================================================

export const questionApi = {
  list: (params?: {
    exam?: string;
    year?: number;
    subject?: string;
    type?: string;
    tag?: string;
  }) => {
    const query = params
      ? new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return request<Question[]>(
      `/api/questions${query ? `?${query}` : ''}`
    );
  },

  get: (id: number) => request<Question>(`/api/questions/${id}`),
};

// ============================================================
// Exam APIs（需要 JWT，RN 端只读）
// ============================================================

export const examApi = {
  list: () => request<ExamInfo[]>('/api/exams'),
  get: (id: number) => request<Exam>(`/api/exams/${id}`),
};

// ============================================================
// Record APIs（需要 JWT）
// ============================================================

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

// ============================================================
// Session APIs（需要 JWT，跨设备同步）
// ============================================================

export const sessionApi = {
  getCurrent: () => request<QuizSession>('/api/session/current'),

  upsert: (session: Omit<QuizSession, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<QuizSession>('/api/session', {
      method: 'POST',
      body: JSON.stringify(session),
    }),

  deleteCurrent: () =>
    request<void>('/api/session/current', {
      method: 'DELETE',
    }),
};
