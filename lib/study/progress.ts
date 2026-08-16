export type StudyProgressState = {
  completedTaskIds: string[];
  answers: Record<string, string>;
};

export type StudyProgressParseResult = {
  state: StudyProgressState;
  invalid: boolean;
};

type StoredStudyProgressV1 = StudyProgressState & {
  version: 1;
  updatedAt: string;
};

export function emptyStudyProgress(): StudyProgressState {
  return {
    completedTaskIds: [],
    answers: {},
  };
}

export function getStudyStorageKey(tripId: string) {
  return `travelflow:study:${tripId}`;
}

export function parseStudyProgress(raw: string | null): StudyProgressParseResult {
  if (!raw) return { state: emptyStudyProgress(), invalid: false };

  try {
    const parsed = JSON.parse(raw) as Partial<StoredStudyProgressV1>;
    const hasValidAnswers =
      parsed.answers !== null &&
      typeof parsed.answers === 'object' &&
      !Array.isArray(parsed.answers) &&
      Object.values(parsed.answers).every((answer) => typeof answer === 'string');

    if (
      parsed.version !== 1 ||
      !Array.isArray(parsed.completedTaskIds) ||
      !parsed.completedTaskIds.every((taskId) => typeof taskId === 'string') ||
      !hasValidAnswers
    ) {
      return { state: emptyStudyProgress(), invalid: true };
    }

    const answers = Object.fromEntries(
      Object.entries(parsed.answers as Record<string, string>).filter(([, answer]) => answer.trim().length > 0),
    );

    return {
      state: {
        completedTaskIds: [...new Set(parsed.completedTaskIds)],
        answers,
      },
      invalid: false,
    };
  } catch {
    return { state: emptyStudyProgress(), invalid: true };
  }
}

export function serializeStudyProgress(state: StudyProgressState) {
  const payload: StoredStudyProgressV1 = {
    version: 1,
    completedTaskIds: state.completedTaskIds,
    answers: state.answers,
    updatedAt: new Date().toISOString(),
  };

  return JSON.stringify(payload);
}
