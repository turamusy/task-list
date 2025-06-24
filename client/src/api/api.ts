import { ENDPOINTS } from '../constants';
import { IListItem } from '../interfaces/list-item';
import { apiRequest } from './axios';

/**
 * Получить список элементов с пагинацией и поиском.
 * @param offset - смещение для пагинации
 * @param limit - размер страницы
 * @param searchTerm - поисковый запрос (опционально)
 * @returns Promise с объектом: { items, total }
 */
export const getItems = async (offset: number, limit: number, searchTerm?: string): Promise<{items: IListItem[], total: number}> => {
  try {
    return await apiRequest({
      url: ENDPOINTS.items,
      method: 'GET',
      params: {
        offset,
        limit,
        ...(searchTerm ? { q: searchTerm } : {}),
      },
    });
  } catch (e) {
    throw e;
  }
};

/**
 * Отправить выбор элемента (selected/unselected).
 * @param id - id элемента
 * @param selected - новое состояние выбора
 * @returns Promise с ответом сервера
 */
export const postSelectItem = async (id: number, selected: boolean): Promise<{success: boolean}> => {
  try {
    return await apiRequest({
      url: ENDPOINTS.select,
      method: 'POST',
      data: { id, selected },
    });
  } catch (e) {
    throw e;
  }
};

/**
 * Изменить порядок элементов (drag-and-drop).
 * @param id - id перемещаемого элемента
 * @param afterId - id элемента, после которого вставить
 * @returns Promise с ответом сервера
 */
export const postOrderItem = async (id: number, afterId: number | null): Promise<{success: boolean}> => {
  try {
    return await apiRequest({
      url: ENDPOINTS.order,
      method: 'POST',
      data: { id, afterId },
    });
  } catch (e) {
    throw e;
  }
};