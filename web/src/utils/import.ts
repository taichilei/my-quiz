import type {Question, QuestionBankMeta} from '../types';

/**
 * 验证题目格式
 */
export function validateQuestion(q: unknown): q is Question {
    if (typeof q !== 'object' || q === null) return false;

    const question = q as Record<string, unknown>;

    // 必填字段检查
    if (typeof question.id !== 'string' || !question.id) return false;
    if (!['single', 'multiple', 'judge'].includes(question.type as string)) return false;
    if (typeof question.content !== 'string' || !question.content) return false;

    // 答案检查
    if (question.type === 'judge') {
        if (typeof question.answer !== 'boolean') return false;
    } else {
        if (typeof question.answer !== 'string' || !question.answer) return false;
    }

    // 选择题必须有选项
    if (question.type === 'single' || question.type === 'multiple') {
        if (!Array.isArray(question.options) || question.options.length < 2) return false;
    }

    return true;
}

/**
 * 验证题库元信息格式
 */
export function validateMetadata(data: unknown): data is QuestionBankMeta {
    if (typeof data !== 'object' || data === null) return false;

    const meta = data as Record<string, unknown>;

    if (typeof meta.id !== 'string' || !meta.id) return false;
    if (typeof meta.name !== 'string' || !meta.name) return false;

    return true;
}

/**
 * 解析 JSON 文件
 */
export async function parseJsonFile(file: File): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);
                resolve(data);
            } catch (error) {
                reject(new Error('JSON 格式错误'));
            }
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsText(file);
    });
}

/**
 * 导入题库 JSON 文件
 */
export async function importQuestionBank(file: File): Promise<{
    success: boolean;
    questions: Question[];
    meta?: QuestionBankMeta;
    errors: string[];
}> {
    const errors: string[] = [];
    let questions: Question[] = [];
    let meta: QuestionBankMeta | undefined;

    try {
        const data = await parseJsonFile(file);

        // 判断是题库数组还是带元信息的对象
        if (Array.isArray(data)) {
            // 直接是题目数组
            questions = data.filter(q => {
                const valid = validateQuestion(q);
                if (!valid) {
                    errors.push(`题目 ${q?.id || '未知'} 格式错误`);
                }
                return valid;
            });
        } else if (typeof data === 'object' && data !== null) {
            const obj = data as Record<string, unknown>;

            // 可能是带元信息的题库
            if (obj.questions && Array.isArray(obj.questions)) {
                if (obj.metadata && validateMetadata(obj.metadata)) {
                    meta = obj.metadata as QuestionBankMeta;
                }
                questions = (obj.questions as unknown[]).filter(q => {
                    const valid = validateQuestion(q);
                    if (!valid) {
                        errors.push(`题目 ${(q as Record<string, unknown>)?.id || '未知'} 格式错误`);
                    }
                    return valid;
                });
            }
        }

        return {
            success: questions.length > 0,
            questions,
            meta,
            errors,
        };
    } catch (error) {
        return {
            success: false,
            questions: [],
            errors: [error instanceof Error ? error.message : '导入失败'],
        };
    }
}

/**
 * 导出题目为 JSON
 */
export function exportQuestionsJson(questions: Question[], filename: string = 'questions.json'): void {
    const data = JSON.stringify(questions, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
