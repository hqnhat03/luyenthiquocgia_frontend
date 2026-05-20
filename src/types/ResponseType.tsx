export interface PaginationMeta {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface SuccessResponse<T> {
    success: true;
    message: string;
    data: T;
    meta?: PaginationMeta | unknown[];
}

export interface FailureResponse {
    success: false;
    message: string;
    errors: unknown[];
    code: number;
}

export type ApiResponse<T> = SuccessResponse<T> | FailureResponse;
