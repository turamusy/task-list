/**
 * ApiRequestConfig — тип для конфигурации запроса к API (обёртка над axios).
 */
import { AxiosRequestConfig } from 'axios';

export type ApiRequestConfig = AxiosRequestConfig;

/**
 * ApiError — тип для ошибок API.
 */
export interface ApiError {
  message: string;
  status?: number;
  data?: any;
} 