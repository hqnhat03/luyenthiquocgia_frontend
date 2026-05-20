/**
 * Mapping from Screen Codes (Backend) to Readable Keys (Frontend)
 */
export const SCREEN_MAP: Record<string, string> = {
  "A_01_00": "dashboard",
  "A_03_00": "course_list",
  "A_03_01": "course_detail",
  "A_03_02": "course_create",
  "A_03_03": "course_edit",
  "A_03_04": "course_delete",
  "A_04_00": "teacher_list",
  "A_05_00": "student_list",
  "A_06_00": "guardian_list",
  "A_07_00": "class_list",
  "A_07_01": "class_detail",
  "A_08_00": "article_list",
  "A_09_00": "role_list",
  "A_10_00": "permission_manage",
  "A_11_00": "subject_list",
  "A_12_00": "level_list",
  "A_13_00": "course_registration_list",
  "A_14_00": "activity_log_list",
  "A_15_00": "lecture_list",
  "A_16_00": "student_in_course_list",
  "A_17_00": "admin_list",
  "A_18_00": "guardian_list",
};

/**
 * Get permission key from screen code
 */
export const getPermissionKey = (screenCode: string): string => {
  return SCREEN_MAP[screenCode] || screenCode;
};

/**
 * Get screen code from permission key
 */
export const getScreenCode = (permissionKey: string): string | undefined => {
  return Object.keys(SCREEN_MAP).find(key => SCREEN_MAP[key] === permissionKey);
};
