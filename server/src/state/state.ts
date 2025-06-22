import { IState } from "../types/types";

/**
 * Глобальное состояние приложения.
 * 
 * Содержит:
 * - order: массив из 1,000,000 элементов с именами "Item 1", "Item 2", etc.
 * - selected: пустое множество для хранения выбранных элементов
 */
export const state: IState = {
  order: Array.from({ length: 1000000 }, (_, i) => `Item ${i + 1}`),
  selected: new Set<number>(),
};