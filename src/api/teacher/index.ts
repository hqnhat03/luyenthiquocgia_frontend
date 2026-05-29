import axios from "axios";

// Tạo một instance riêng cho teacher với baseURL là /api/v1/teacher
export const teacherAxios = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/teacher`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor: tự gắn token vào header
teacherAxios.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Các biến xử lý queue khi refresh token cho admin
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor 1: Bắt lỗi 401 code từ body
teacherAxios.interceptors.response.use(
  (response) => {
    // Không bắt 401 cho api login vì nó trả về 200 OK kèm error message trong body
    if (response.config.url?.includes("/login")) {
      return response;
    }

    if (
      response.data &&
      response.data.code === 401 &&
      response.data.message === "Thông tin đăng nhập không hợp lệ."
    ) {
      return Promise.reject({
        config: response.config,
        response: { status: 401, data: response.data },
      });
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// Response interceptor 2: Xử lý refresh token CHỈ GỌI api /student/refresh
teacherAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Không xử lý refresh token cho request login
    if (originalRequest?.url?.includes("/login")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return teacherAxios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("Student Token expired. Attempting to refresh...");

        const refreshUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace(
          /\/$/,
          ""
        )}/api/v1/teacher/refresh`;

        // Dùng axios mặc định để gọi refresh, tránh loop
        const response = await axios({
          method: "get",
          url: refreshUrl,
          headers: {
            Authorization: `Bearer ${
              document.cookie
                .split("; ")
                .find((row) => row.startsWith("access_token="))
                ?.split("=")[1]
            }`,
            Accept: "application/json",
          },
        });

        if (response.data.status === "success") {
          const { access_token } = response.data.data;

          try {
            const { useAuthStore } = await import("@/store/auth-store");
            useAuthStore.getState().setToken(access_token);
          } catch (storeError) {
            console.warn("Auth store not updated.", storeError);
            document.cookie = `access_token=${access_token}; path=/; max-age=604800; SameSite=Lax`;
          }

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          processQueue(null, access_token);

          return teacherAxios(originalRequest);
        } else {
          throw new Error(response.data?.message || "Refresh token failed");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);

        if (typeof window !== "undefined") {
          console.error("Student Refresh token failed:", refreshError);
          try {
            const { useAuthStore } = await import("@/store/auth-store");
            useAuthStore.getState().logout();
          } catch {
            document.cookie =
              "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          }
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
