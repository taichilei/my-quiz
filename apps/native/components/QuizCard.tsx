import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';

interface Question {
  id: number;
  type: 'single' | 'multiple' | 'judge';
  content: string;
  options?: string[];
  answer: string | boolean;
  explanation?: string;
  difficulty?: number;
  tags?: string[];
  images?: string[];
}

interface Props {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  onAnswer?: (answer: string | boolean, isCorrect: boolean) => void;
  onNext?: () => void;
}

const TYPE_LABELS = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
};

const JUDGE_LABELS = {
  true: '正确',
  false: '错误',
};

export default function QuizCard({
  question,
  currentIndex,
  totalQuestions,
  onAnswer,
  onNext,
}: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const theme = useTheme();
  const colors = theme.dark ? Colors.dark : Colors.light;

  const [selectedAnswer, setSelectedAnswer] = useState<string | boolean>('');
  const [showResult, setShowResult] = useState(false);
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>([]);

  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const checkAnswer = (userAnswer: string | boolean): boolean => {
    if (
      question.type === 'multiple' &&
      typeof userAnswer === 'string' &&
      typeof question.answer === 'string'
    ) {
      return (
        userAnswer.split(',').sort().join(',') ===
        question.answer.split(',').sort().join(',')
      );
    }
    return userAnswer === question.answer;
  };

  const isCorrect = showResult && checkAnswer(selectedAnswer);

  const submitAnswer = (answer: string | boolean) => {
    setSelectedAnswer(answer);
    setShowResult(true);
    onAnswer?.(answer, checkAnswer(answer));
  };

  const handleDontKnow = () => {
    submitAnswer('');
  };

  const getOptionStyle = (isSelected: boolean, isCorrectOption: boolean, showResult: boolean) => {
    let style: object[] = [styles.optionButton];

    if (showResult) {
      if ((isSelected && isCorrectOption) || (!isSelected && isCorrectOption)) {
        style.push({
          backgroundColor: colors.success + '20',
          borderColor: colors.success,
        });
      } else if (isSelected && !isCorrectOption) {
        style.push({
          backgroundColor: colors.error + '20',
          borderColor: colors.error,
        });
      } else {
        style.push({
          borderColor: colors.border,
          opacity: 0.5,
        });
      }
    } else if (isSelected) {
      style.push({
        backgroundColor: colors.tint + '20',
        borderColor: colors.tint,
      });
    } else {
      style.push({
        borderColor: colors.border,
      });
    }

    return style;
  };

  const getOptionTextStyle = (isSelected: boolean, isCorrectOption: boolean, showResult: boolean) => {
    if (showResult) {
      if ((isSelected && isCorrectOption) || (!isSelected && isCorrectOption)) {
        return { color: colors.success };
      } else if (isSelected && !isCorrectOption) {
        return { color: colors.error };
      }
      return { color: colors.textTertiary };
    } else if (isSelected) {
      return { color: colors.tint };
    }
    return { color: colors.text };
  };

  const formatAnswer = () => {
    const ans = question.answer;
    if (typeof ans === 'boolean') {
      return ans ? '正确' : '错误';
    }
    return ans.split(',').join('、');
  };

  const QuestionContent = () => (
    <View style={isLandscape && styles.questionContentLandscape}>
      <Text style={[styles.questionText, { color: colors.text }]}>
        {question.content}
      </Text>
      {question.images && question.images.length > 0 && (
        <View style={styles.imagesContainer}>
          {question.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={[
                styles.questionImage,
                { maxHeight: isLandscape ? 150 : 200 },
              ]}
              resizeMode="contain"
            />
          ))}
        </View>
      )}
    </View>
  );

  const JudgeOptions = () => (
    <View style={styles.optionsContainer}>
      {([true, false] as const).map((opt) => {
        const isSelected = selectedAnswer === opt;
        const isCorrectAnswer = opt === question.answer;
        const buttonStyle = getOptionStyle(isSelected, isCorrectAnswer, showResult);

        return (
          <TouchableOpacity
            key={String(opt)}
            style={buttonStyle}
            onPress={() => {
              if (!showResult) submitAnswer(opt);
            }}
            disabled={showResult}
          >
            <View style={styles.optionContent}>
              <View
                style={[
                  styles.optionIndicator,
                  isSelected && styles.optionIndicatorActive,
                ]}
              >
                <Text
                  style={[
                    styles.optionIndicatorText,
                    isSelected && styles.optionIndicatorTextActive,
                  ]}
                >
                  {opt ? '✓' : '✕'}
                </Text>
              </View>
              <Text
                style={[
                  styles.optionLabel,
                  getOptionTextStyle(isSelected, isCorrectAnswer, showResult),
                ]}
              >
                {JUDGE_LABELS[String(opt) as 'true' | 'false']}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const SingleOptions = () => (
    <View style={styles.optionsContainer}>
      {question.options?.map((opt, idx) => {
        const label = String.fromCharCode(65 + idx);
        const isSelected = selectedAnswer === label;
        const isCorrectAnswer = label === question.answer;
        const buttonStyle = getOptionStyle(isSelected, isCorrectAnswer, showResult);

        return (
          <TouchableOpacity
            key={idx}
            style={buttonStyle}
            onPress={() => {
              if (!showResult) submitAnswer(label);
            }}
            disabled={showResult}
          >
            <View style={styles.optionContent}>
              <View
                style={[
                  styles.optionIndicator,
                  isSelected && styles.optionIndicatorActive,
                ]}
              >
                <Text
                  style={[
                    styles.optionIndicatorText,
                    isSelected && styles.optionIndicatorTextActive,
                  ]}
                >
                  {label}
                </Text>
              </View>
              <Text
                style={[
                  styles.optionLabel,
                  getOptionTextStyle(isSelected, isCorrectAnswer, showResult),
                ]}
              >
                {opt}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const MultipleOptions = () => (
    <View style={styles.optionsContainer}>
      {question.options?.map((opt, idx) => {
        const label = String.fromCharCode(65 + idx);
        const isSelected = selectedMultiple.includes(label);
        const correctArr = String(question.answer).split(',').filter(Boolean);
        const isCorrectAnswer = correctArr.includes(label);
        const buttonStyle = getOptionStyle(isSelected, isCorrectAnswer, showResult);

        return (
          <TouchableOpacity
            key={idx}
            style={buttonStyle}
            onPress={() => {
              if (!showResult) {
                const newSelected = isSelected
                  ? selectedMultiple.filter((s) => s !== label)
                  : [...selectedMultiple, label].sort();
                setSelectedMultiple(newSelected);
              }
            }}
            disabled={showResult}
          >
            <View style={styles.optionContent}>
              <View
                style={[
                  styles.optionIndicator,
                  styles.optionIndicatorSquare,
                  isSelected && styles.optionIndicatorActive,
                ]}
              >
                <Text
                  style={[
                    styles.optionIndicatorText,
                    isSelected && styles.optionIndicatorTextActive,
                  ]}
                >
                  {isSelected ? '✓' : label}
                </Text>
              </View>
              <Text
                style={[
                  styles.optionLabel,
                  getOptionTextStyle(isSelected, isCorrectAnswer, showResult),
                ]}
              >
                {opt}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const handleConfirmMultiple = () => {
    if (selectedMultiple.length === 0) return;
    submitAnswer(selectedMultiple.join(','));
  };

  const ActionButtons = ({ isMultiple = false } = {}) => (
    <>
      {!showResult ? (
        isMultiple ? (
          <>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: colors.tint },
                selectedMultiple.length === 0 && styles.buttonDisabled,
              ]}
              onPress={handleConfirmMultiple}
              disabled={selectedMultiple.length === 0}
            >
              <Text style={styles.confirmButtonText}>
                ✅ 确认答案 ({selectedMultiple.length} 已选)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dontKnowButton, { backgroundColor: colors.backgroundTertiary }]}
              onPress={handleDontKnow}
            >
              <Text style={[styles.dontKnowButtonText, { color: colors.textSecondary }]}>
                🤔 我不会，看答案
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.dontKnowButton, { backgroundColor: colors.backgroundTertiary }]}
            onPress={handleDontKnow}
          >
            <Text style={[styles.dontKnowButtonText, { color: colors.textSecondary }]}>
              🤔 我不会，看答案
            </Text>
          </TouchableOpacity>
        )
      ) : (
        <>
          <View
            style={[
              styles.resultContainer,
              {
                backgroundColor: isCorrect ? colors.success + '15' : colors.error + '15',
                borderColor: isCorrect ? colors.success + '40' : colors.error + '40',
              },
            ]}
          >
            <Text style={{ color: isCorrect ? colors.success : colors.error }}>
              {selectedAnswer === '' ? (
                <>⏭️ 未作答，正确答案：{formatAnswer()}</>
              ) : isCorrect ? (
                <>🎉 回答正确！</>
              ) : (
                <>😅 回答错误，正确答案：{formatAnswer()}</>
              )}
            </Text>
            {question.explanation && (
              <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                💡 {question.explanation}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.tint }]}
            onPress={onNext}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex + 1 >= totalQuestions ? '🎯 完成' : '下一题 →'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={[styles.progressBar, { backgroundColor: colors.backgroundTertiary }]}>
        <View style={[styles.progressFill, { width: `${progress}%` }]}>
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.indexText, { color: colors.textSecondary }]}>
          {currentIndex + 1} / {totalQuestions}
        </Text>
        <View style={styles.headerRight}>
          {isLandscape && (
            <View style={[styles.landscapeBadge, { backgroundColor: colors.backgroundTertiary }]}>
              <Text style={[styles.landscapeBadgeText, { color: colors.textSecondary }]}>
                横屏模式
              </Text>
            </View>
          )}
          <View style={[styles.typeTag, { backgroundColor: colors.tint + '15' }]}>
            <Text style={[styles.typeTagText, { color: colors.tint }]}>
              {TYPE_LABELS[question.type]}
            </Text>
          </View>
        </View>
      </View>

      <View style={isLandscape && styles.contentRow}>
        <View style={isLandscape && styles.leftColumn}>
          <QuestionContent />
        </View>
        <View style={isLandscape && styles.rightColumn}>
          {question.type === 'judge' && (
            <>
              <JudgeOptions />
              <ActionButtons />
            </>
          )}
          {question.type === 'single' && (
            <>
              <SingleOptions />
              <ActionButtons />
            </>
          )}
          {question.type === 'multiple' && (
            <>
              <MultipleOptions />
              <ActionButtons isMultiple />
            </>
          )}
        </View>
      </View>

      {!isLandscape && (
        <>
          <QuestionContent />
          {question.type === 'judge' && (
            <>
              <JudgeOptions />
              <ActionButtons />
            </>
          )}
          {question.type === 'single' && (
            <>
              <SingleOptions />
              <ActionButtons />
            </>
          )}
          {question.type === 'multiple' && (
            <>
              <MultipleOptions />
              <ActionButtons isMultiple />
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  landscapeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  landscapeBadgeText: {
    fontSize: FontSize.xs - 1,
  },
  indexText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  typeTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  typeTagText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  contentRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  leftColumn: {
    flex: 1,
    paddingRight: Spacing.md,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E5E7EB',
  },
  rightColumn: {
    flex: 1,
  },
  questionContentLandscape: {
    flex: 1,
  },
  questionText: {
    fontSize: FontSize.base,
    lineHeight: 24,
    marginBottom: Spacing.md,
    fontWeight: FontWeight.medium,
  },
  imagesContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  questionImage: {
    width: '100%',
    borderRadius: BorderRadius.lg,
  },
  optionsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionButton: {
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIndicatorSquare: {
    borderRadius: 6,
  },
  optionIndicatorActive: {
    backgroundColor: '#3B82F6',
  },
  optionIndicatorText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#6B7280',
  },
  optionIndicatorTextActive: {
    color: '#FFFFFF',
  },
  optionLabel: {
    fontSize: FontSize.base,
    flex: 1,
  },
  dontKnowButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dontKnowButtonText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
  confirmButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resultContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  explanationText: {
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  nextButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
});
