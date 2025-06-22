import axios from 'axios';
import { API_BASE_URL, TEXT } from '../constants';
import type { ApiRequestConfig, ApiError } from '../types/api';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export async function apiRequest<T>(config: ApiRequestConfig): Promise<T> {
  try {
    const response = await axiosInstance.request<T>(config);
    return response.data;
  } catch (error: any) {
    let apiError: ApiError = {
      message: error?.message || TEXT.apiRequestUnknownError,
      status: error?.response?.status,
      data: error?.response?.data,
    };
    console.error(TEXT.apiRequestError, apiError);
    throw apiError;
  }
} 