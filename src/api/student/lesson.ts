import { studentAxios } from "./index";

export interface LessonDetail {
  id: number;
  class_id: number;
  lesson_name: string;
  description: string;
  duration_value: number;
  duration_unit: string;
  sort: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  document_url: string;
  video_url: string;
  status: number;
}

export interface ViewLessonProgress {
  id: number;
  lesson_id: number;
  student_id: number;
  duration: number;
  last_position: number;
  is_completed: boolean;
  watched_percentage: number;
}

export interface UpdateViewLessonPayload {
  lesson_id: number;
  student_id: number;
  duration: number;
  last_position: number;
  is_completed: boolean;
  watched_percentage: number;
}

export const getLessonDetail = async (id: number) => {
  const response = await studentAxios.get<{
    status: string;
    message: string | null;
    data: LessonDetail;
  }>(`/classes/lessons/detail?id=${id}`);
  return response.data;
};

export const getViewLessonProgress = async (student_id: number, lesson_id: number) => {
  const response = await studentAxios.get<{
    status: string;
    message: string | null;
    data: ViewLessonProgress | null;
  }>(`/classes/lessons/info-view-lesson?student_id=${student_id}&lesson_id=${lesson_id}`);
  return response.data;
};

export const updateViewLesson = async (payload: UpdateViewLessonPayload) => {
  const response = await studentAxios.post<{
    status: string;
    message: string | null;
    data: any;
  }>(`/classes/lessons/update-view-lesson`, payload);
  return response.data;
};
