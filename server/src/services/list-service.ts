import { state } from '../state/state';
import { IGetItemsResponse, IListItem } from '../types/types';

/**
 * Получить список элементов с пагинацией и поиском.
 * @param offset - смещение для пагинации
 * @param limit - размер страницы
 * @param queryParams - поисковый запрос (опционально)
 * @returns Объект с массивом элементов и общим количеством
 */
export function getItems(offset: number, limit: number, queryParams?: string): IGetItemsResponse {
  let filteredOrder = state.order;

  if (queryParams) {
    filteredOrder = state.order.filter(item =>
      item.toLowerCase().includes(queryParams.toLowerCase())
    );
  }

  const sliced = filteredOrder.slice(offset, offset + limit);
    const items: IListItem[] = sliced.map(value => {
        const idNumber = parseInt(value.split(' ')[1], 10);

        return {
            id: idNumber,
            value,
            selected: state.selected.has(idNumber),
        }
    });

  return { items, total: filteredOrder.length };
}

/**
 * Обновить состояние выбора элемента.
 * @param id - идентификатор элемента
 * @param selected - новое состояние выбора
 * @returns true если операция успешна, false в случае ошибки
 */
export function updateSelection(id: number, selected: boolean): boolean {
  try {
    if (selected) {
      state.selected.add(id);
    } else {
      state.selected.delete(id);
    }
    return true
  } catch (e) {
    return false
  }
}

/**
 * Изменить порядок элементов (переместить элемент после указанного).
 * @param id - идентификатор перемещаемого элемента
 * @param afterId - идентификатор элемента, после которого вставить (null для вставки в начало)
 * @returns true если операция успешна, false если элемент не найден
 */
export function reorderItem(id: number, afterId: number | null): boolean {
  try {
    const currentIndex = state.order.indexOf(`Item ${id}`);
    if (currentIndex === -1) return false;

    state.order.splice(currentIndex, 1);

    const insertIndex = afterId !== null ? state.order.indexOf(`Item ${afterId}`) + 1 : 0;
    state.order.splice(insertIndex, 0, `Item ${id}`);

    return true;
  } catch (e) {
    return false;
  }
}