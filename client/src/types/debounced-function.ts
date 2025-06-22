/**
 * DebouncedFunction — тип для функции с дебаунсом.
 * Используется для типизации возвращаемого значения useDebounce.
 */
export type DebouncedFunction<T extends (...args: any[]) => void> = (...args: Parameters<T>) => void;
