/**
 * Permission Helper — Mapping screen_code ↔ permissionKey
 *
 * Quy tắc đặt tên screen_code: A_{module}_{action}
 *   00 = list, 01 = detail, 02 = add, 03 = edit, 04 = delete/flow
 *
 * codeToPermissionKey bao gồm cả màn hình list (_00) lẫn action-level.
 * - Màn hình list: dùng cho sidebar menu filter (ví dụ: "admin:view")
 * - Action-level: dùng cho Can component (ví dụ: "admin:add")
 *
 * Tài liệu gốc: docs/phan_quyen_man_hinh.md
 */

// screen_code → permissionKey
export const codeToPermissionKey: Record<string, string> = {
  // ─── Dashboard ───────────────────────────────────
  "A_01_00": "dashboard:view",

  // ─── Quản lý Admin ───────────────────────────────
  "A_02_00": "admin:view",
  "A_02_01": "admin:detail",
  "A_02_02": "admin:add",
  "A_02_03": "admin:edit",

  // ─── Quản lý Giáo viên ───────────────────────────
  "A_02_10": "teacher:view",
  "A_02_11": "teacher:detail",
  "A_02_12": "teacher:add",
  "A_02_13": "teacher:edit",
  "A_02_14": "teacher:delete",

  // ─── Quản lý Học sinh ────────────────────────────
  "A_02_20": "student:view",
  "A_02_21": "student:detail",
  "A_02_22": "student:add",
  "A_02_23": "student:edit",
  "A_02_24": "student:delete",

  // ─── Quản lý Vai trò ─────────────────────────────
  "A_02_30": "userRole:view",
  "A_02_31": "userRole:add",
  "A_02_32": "userRole:edit",
  "A_02_33": "userRole:delete",

  // ─── Phân quyền màn hình ─────────────────────────
  "A_02_40": "permissions:view",

  // ─── Quản lý Phụ huynh ───────────────────────────
  "A_02_50": "parent:view",
  "A_02_51": "parent:detail",
  "A_02_52": "parent:add",
  "A_02_53": "parent:edit",
  "A_02_54": "parent:delete",

  // ─── Khóa học ────────────────────────────────────
  "A_03_00": "course:view",
  "A_03_01": "course:detail",
  "A_03_02": "course:add",
  "A_03_03": "course:edit",
  "A_03_04": "course:delete",

  // ─── Lớp học ─────────────────────────────────────
  "A_04_00": "class:view",
  "A_04_01": "class:detail",
  "A_04_02": "class:add",
  "A_04_03": "class:edit",
  "A_04_04": "class:delete",

  // ─── Bài giảng ───────────────────────────────────
  "A_05_00": "lesson:view",
  "A_05_01": "lesson:detail",
  "A_05_02": "lesson:add",
  "A_05_03": "lesson:edit",
  "A_05_04": "lesson:delete",

  // ─── Môn học ─────────────────────────────────────
  "A_06_00": "subject:view",
  "A_06_01": "subject:detail",
  "A_06_02": "subject:add",
  "A_06_03": "subject:edit",
  "A_06_04": "subject:delete",

  // ─── Trình độ ────────────────────────────────────
  "A_07_00": "level:view",
  "A_07_01": "level:detail",
  "A_07_02": "level:add",
  "A_07_03": "level:edit",
  "A_07_04": "level:delete",

  // ─── Tin tức ─────────────────────────────────────
  "A_08_00": "news:view",
  "A_08_01": "news:detail",
  "A_08_02": "news:add",
  "A_08_03": "news:edit",
  "A_08_04": "news:delete",

  // ─── Đăng ký khóa học ────────────────────────────
  "A_09_00": "courseRegistration:view",
  "A_09_01": "courseRegistration:detail",
  "A_09_02": "courseRegistration:add",
  "A_09_03": "courseRegistration:edit",
  "A_09_04": "courseRegistration:delete",

  // ─── Câu hỏi & Chatbot ───────────────────────────
  "A_10_00": "question:view",
  "A_10_01": "question:detail",
  "A_10_02": "question:add",
  "A_10_03": "question:edit",
  "A_10_04": "question:delete",
};

/**
 * Legacy key mapping — hỗ trợ backward-compat với code cũ
 * dùng key dạng "admin_list", "admin_create", etc.
 */
const legacyKeyToPermKey: Record<string, string> = {
  // Admin
  "admin_list": "admin:view",
  "admin_detail": "admin:detail",
  "admin_create": "admin:add",
  "admin_edit": "admin:edit",
  "admin_delete": "admin:delete",

  // Teacher
  "teacher_list": "teacher:view",
  "teacher_detail": "teacher:detail",
  "teacher_create": "teacher:add",
  "teacher_edit": "teacher:edit",
  "teacher_delete": "teacher:delete",

  // Student
  "student_list": "student:view",
  "student_detail": "student:detail",
  "student_create": "student:add",
  "student_edit": "student:edit",
  "student_delete": "student:delete",

  // Parent / Guardian
  "guardian_list": "parent:view",
  "guardian_detail": "parent:detail",
  "guardian_create": "parent:add",
  "guardian_edit": "parent:edit",
  "guardian_delete": "parent:delete",
  "parent_list": "parent:view",
  "parent_detail": "parent:detail",
  "parent_create": "parent:add",
  "parent_edit": "parent:edit",
  "parent_delete": "parent:delete",

  // Role
  "role_list": "userRole:view",
  "role_create": "userRole:add",
  "role_edit": "userRole:edit",
  "role_delete": "userRole:delete",

  // Permissions
  "permission_manage": "permissions:view",

  // Course
  "course_list": "course:view",
  "course_detail": "course:detail",
  "course_create": "course:add",
  "course_edit": "course:edit",
  "course_delete": "course:delete",

  // Class
  "class_list": "class:view",
  "class_detail": "class:detail",
  "class_create": "class:add",
  "class_edit": "class:edit",
  "class_delete": "class:delete",

  // Lesson / Lecture
  "lecture_list": "lesson:view",
  "lecture_detail": "lesson:detail",
  "lecture_create": "lesson:add",
  "lecture_edit": "lesson:edit",
  "lecture_delete": "lesson:delete",
  "lesson_list": "lesson:view",
  "lesson_detail": "lesson:detail",
  "lesson_create": "lesson:add",
  "lesson_edit": "lesson:edit",
  "lesson_delete": "lesson:delete",

  // Subject
  "subject_list": "subject:view",
  "subject_create": "subject:add",
  "subject_edit": "subject:edit",
  "subject_delete": "subject:delete",

  // Level
  "level_list": "level:view",
  "level_create": "level:add",
  "level_edit": "level:edit",
  "level_delete": "level:delete",

  // News
  "news_list": "news:view",
  "news_create": "news:add",
  "news_edit": "news:edit",
  "news_delete": "news:delete",

  // Course Registration
  "course_registration_list": "courseRegistration:view",

  // Dashboard
  "dashboard": "dashboard:view",

  // Student in course
  "student_in_course_list": "student:view",
  "student_in_course_create": "student:add",
  "student_in_course_edit": "student:edit",
  "student_in_course_delete": "student:delete",
};

/**
 * Chuẩn hóa bất kỳ dạng key nào về permissionKey chuẩn
 * Hỗ trợ: screen_code ("A_02_00"), permissionKey ("admin:view"), legacy ("admin_list")
 */
export const normalizeToPermissionKey = (input: string): string | undefined => {
  // Đã là permissionKey chuẩn (có dấu ':')
  if (input.includes(":")) return input;

  // Là screen_code (bắt đầu bằng 'A_')
  if (input.startsWith("A_")) return codeToPermissionKey[input];

  // Legacy key
  return legacyKeyToPermKey[input];
};

/**
 * Lấy screen_code từ permissionKey
 */
export const getScreenCodeFromKey = (permissionKey: string): string | undefined =>
  Object.keys(codeToPermissionKey).find(
    (code) => codeToPermissionKey[code] === permissionKey
  );

/**
 * Lấy permissionKey từ screen_code
 */
export const getPermissionKeyFromCode = (screenCode: string): string | undefined =>
  codeToPermissionKey[screenCode];

// ─── Backward-compat aliases ────────────────────────────────────
/** @deprecated Dùng getScreenCodeFromKey */
export const getScreenCode = getScreenCodeFromKey;

/** @deprecated Dùng getPermissionKeyFromCode */
export const getPermissionKey = (screenCode: string): string =>
  codeToPermissionKey[screenCode] || screenCode;

/** @deprecated Dùng codeToPermissionKey */
export const SCREEN_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(codeToPermissionKey).map(([code, key]) => [code, key])
);
