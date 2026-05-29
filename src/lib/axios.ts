import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const setupAuthInterceptor = (instance: import('axios').AxiosInstance) => {
  instance.interceptors.request.use(
    (config) => {
      if (typeof window !== 'undefined') {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('access_token='))
          ?.split('=')[1];

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

setupAuthInterceptor(api);

// Variables to handle token refresh logic
let isRefreshing = false;
interface FailedRequest {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}

let failedQueue: FailedRequest[] = [];

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

api.interceptors.response.use(
  (response) => {
    // Không bắt 401 cho api login vì nó trả về 200 OK kèm error message trong body
    if (response.config.url?.includes("/login")) {
      return response;
    }

    // Catch successful HTTP requests that have a 401 logical error
    if (response.data && response.data.code === 401 && response.data.message === 'Thông tin đăng nhập không hợp lệ.') {
      return Promise.reject({
        config: response.config,
        response: { status: 401, data: response.data }
      });
    }
    return response;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Không xử lý refresh token cho request login
    if (originalRequest?.url?.includes("/login")) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized: Token might be expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('Token expired. Attempting to refresh...');
        
        let refreshUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')}/api/v1/auth/refresh-token`;
        let method = 'post';

        let userRole = '';
        try {
          const { useAuthStore } = await import('@/store/auth-store');
          userRole = useAuthStore.getState().user?.role || '';
        } catch (e) {
          console.warn('Could not get user role from auth store', e);
        }

        const reqUrl = originalRequest.url || '';
        
        if (userRole === 'admin' || (!userRole && reqUrl.includes('/admin/'))) {
           refreshUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')}/api/v1/admin/refresh`;
           method = 'get';
        } else if (userRole === 'teacher' || (!userRole && reqUrl.includes('/teacher/'))) {
           refreshUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')}/api/v1/teacher/refresh`;
           method = 'get';
        } else if (userRole === 'student' || (!userRole && reqUrl.includes('/student/'))) {
           refreshUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')}/api/v1/student/refresh`;
           method = 'get';
        } else if (userRole === 'parent' || (!userRole && reqUrl.includes('/parent/'))) {
           refreshUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')}/api/v1/parent/refresh`;
           method = 'get';
        }

        // SỬ DỤNG axios trực tiếp thay vì instance 'api' để tránh vòng lặp vô tận (interceptor loop)
        const response = await axios({
          method,
          url: refreshUrl,
          headers: {
            'Authorization': `Bearer ${document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1]}`,
            'Accept': 'application/json',
          }
        });

        if (response.data.status === 'success') {
          const { access_token } = response.data.data;

          // Update Auth Store
          try {
            const { useAuthStore } = await import('@/store/auth-store');
            useAuthStore.getState().setToken(access_token);
          } catch (storeError) {
            console.warn('Auth store not found or could not be updated.', storeError);
            document.cookie = `access_token=${access_token}; path=/; max-age=604800; SameSite=Lax`;
          }

          // 3. Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          processQueue(null, access_token);
          
          return api(originalRequest);
        } else {
          throw new Error(response.data?.message || "Refresh token failed");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Nếu refresh thất bại hoàn toàn -> Logout và về login
        if (typeof window !== 'undefined') {
          console.error('Refresh token failed:', refreshError);
          try {
            const { useAuthStore } = await import('@/store/auth-store');
            useAuthStore.getState().logout();
          } catch {
            document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          }
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }


    return Promise.reject(error);
  }
);

export default api;
