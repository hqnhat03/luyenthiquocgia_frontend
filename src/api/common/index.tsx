import axios from "axios";

/**
 * commonAxios — Public API instance, baseURL: /api/v1
 * Không cần authentication. Dùng cho các endpoint /common/* không yêu cầu token.
 */
export const commonAxios = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")}/api/v1`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
