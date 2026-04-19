import { collection, doc, setDoc, deleteDoc, getDocs, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ContentSource, EducationalOutput } from '../store/useStore';

export const saveContentToDB = async (content: ContentSource, userId: string) => {
  const contentRef = doc(db, 'contents', content.id);
  await setDoc(contentRef, {
    ...content,
    userId,
    isFavorite: false
  });
};

export const deleteContentFromDB = async (contentId: string) => {
  await deleteDoc(doc(db, 'contents', contentId));
};

export const saveOutputToDB = async (output: EducationalOutput, userId: string) => {
  const outputRef = doc(db, 'outputs', output.id);
  await setDoc(outputRef, {
    ...output,
    userId,
    isFavorite: false
  });
};

export const deleteOutputFromDB = async (outputId: string) => {
  await deleteDoc(doc(db, 'outputs', outputId));
};

export const toggleContentFavoriteDB = async (contentId: string, isFavorite: boolean) => {
  const contentRef = doc(db, 'contents', contentId);
  await updateDoc(contentRef, { isFavorite });
};

export const toggleOutputFavoriteDB = async (outputId: string, isFavorite: boolean) => {
  const outputRef = doc(db, 'outputs', outputId);
  await updateDoc(outputRef, { isFavorite });
};

export const updateContentTagsDB = async (contentId: string, tags: string[]) => {
  const contentRef = doc(db, 'contents', contentId);
  await updateDoc(contentRef, { tags });
};

export const updateContentRawTextDB = async (contentId: string, rawText: string) => {
  const contentRef = doc(db, 'contents', contentId);
  await updateDoc(contentRef, { rawText });
};
