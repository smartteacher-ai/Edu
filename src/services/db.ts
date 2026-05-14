import { ContentSource, EducationalOutput } from '../store/useStore';
import { useStore } from '../store/useStore';

export const saveContentToDB = async (content: ContentSource, userId: string) => {
  useStore.getState().addContent({ ...content, isFavorite: false });
};

export const deleteContentFromDB = async (contentId: string) => {
  useStore.getState().deleteContent(contentId);
};

export const saveOutputToDB = async (output: EducationalOutput, userId: string) => {
  useStore.getState().addOutput({ ...output, isFavorite: false });
};

export const deleteOutputFromDB = async (outputId: string) => {
  useStore.getState().deleteOutput(outputId);
};

export const toggleContentFavoriteDB = async (contentId: string, isFavorite: boolean) => {
  useStore.setState(state => ({
    contents: state.contents.map(c => c.id === contentId ? { ...c, isFavorite } : c)
  }));
};

export const toggleOutputFavoriteDB = async (outputId: string, isFavorite: boolean) => {
  useStore.setState(state => ({
    outputs: state.outputs.map(c => c.id === outputId ? { ...c, isFavorite } : c)
  }));
};

export const updateContentTagsDB = async (contentId: string, tags: string[]) => {
  useStore.setState(state => ({
    contents: state.contents.map(c => c.id === contentId ? { ...c, tags } : c)
  }));
};

export const updateContentRawTextDB = async (contentId: string, rawText: string) => {
  useStore.setState(state => ({
    contents: state.contents.map(c => c.id === contentId ? { ...c, rawText } : c)
  }));
};
