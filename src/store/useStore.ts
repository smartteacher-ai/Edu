import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

export type ContentType = 'Audio' | 'PDF' | 'Word' | 'Text';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ContentSource {
  id: string;
  title: string;
  type: ContentType;
  rawText: string;
  extractedAt: string;
}

export interface EducationalOutput {
  id: string;
  sourceId: string;
  type: 'Summary' | 'LessonPlan' | 'Quiz' | 'CourseOutline';
  content: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface AppState {
  customApiKey: string | null;
  setCustomApiKey: (key: string | null) => void;
  
  usage: { date: string; count: number };
  incrementUsage: () => void;
  canUseDefaultKey: () => boolean;

  contents: ContentSource[];
  addContent: (content: ContentSource) => void;
  deleteContent: (id: string) => void;

  outputs: EducationalOutput[];
  addOutput: (output: EducationalOutput) => void;
  deleteOutput: (id: string) => void;

  feedbacks: Feedback[];
  addFeedback: (feedback: Feedback) => void;

  hasSeenTutorial: boolean;
  setHasSeenTutorial: (seen: boolean) => void;

  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      customApiKey: null,
      setCustomApiKey: (key) => set({ customApiKey: key }),

      usage: { date: format(new Date(), 'yyyy-MM-dd'), count: 0 },
      incrementUsage: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const { usage } = get();
        if (usage.date !== today) {
          set({ usage: { date: today, count: 1 } });
        } else {
          set({ usage: { ...usage, count: usage.count + 1 } });
        }
      },
      canUseDefaultKey: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const { usage } = get();
        if (usage.date !== today) return true;
        return usage.count < 3;
      },

      contents: [],
      addContent: (content) => set((state) => ({ contents: [content, ...state.contents] })),
      deleteContent: (id) => set((state) => ({ 
        contents: state.contents.filter((c) => c.id !== id),
        outputs: state.outputs.filter((o) => o.sourceId !== id)
      })),

      outputs: [],
      addOutput: (output) => set((state) => ({ outputs: [output, ...state.outputs] })),
      deleteOutput: (id) => set((state) => ({ outputs: state.outputs.filter((o) => o.id !== id) })),

      feedbacks: [],
      addFeedback: (feedback) => set((state) => ({ feedbacks: [feedback, ...state.feedbacks] })),

      hasSeenTutorial: false,
      setHasSeenTutorial: (seen) => set({ hasSeenTutorial: seen }),

      language: navigator.language.startsWith('ar') ? 'ar' : 'en',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'edugenius-storage',
    }
  )
);
