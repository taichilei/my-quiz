/**
 * My-Quiz 设计系统
 * 与 Web 端 Tailwind 配色保持一致
 *
 * 设计 Token 来源：Tailwind CSS 默认配色
 */

import { Platform } from 'react-native';

// 主色调（蓝色系，与 Web 一致）
const primary = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6', // 主色
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
};

// 中性色（灰色系）
const gray = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
};

// 语义色
const semantic = {
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export const Colors = {
  light: {
    // 基础
    text: gray[900],
    textSecondary: gray[600],
    textTertiary: gray[500],
    background: gray[50],
    backgroundSecondary: '#ffffff',
    backgroundTertiary: gray[100],

    // 品牌
    tint: primary[500],
    tintHover: primary[600],
    tintActive: primary[700],

    // 图标
    icon: gray[500],
    iconActive: primary[500],

    // 导航栏
    tabIconDefault: gray[400],
    tabIconSelected: primary[500],

    // 边框
    border: gray[200],
    borderFocus: primary[300],

    // 语义
    success: semantic.success,
    warning: semantic.warning,
    error: semantic.error,
    info: semantic.info,
  },
  dark: {
    // 基础
    text: gray[50],
    textSecondary: gray[300],
    textTertiary: gray[400],
    background: gray[900],
    backgroundSecondary: gray[800],
    backgroundTertiary: gray[700],

    // 品牌
    tint: primary[400],
    tintHover: primary[300],
    tintActive: primary[200],

    // 图标
    icon: gray[400],
    iconActive: primary[400],

    // 导航栏
    tabIconDefault: gray[500],
    tabIconSelected: primary[400],

    // 边框
    border: gray[700],
    borderFocus: primary[600],

    // 语义
    success: semantic.success,
    warning: semantic.warning,
    error: semantic.error,
    info: semantic.info,
  },
};

// 间距系统（8px 基准网格）
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

// 圆角系统
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// 字体系统
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// 字号系统
export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

// 字重
export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
