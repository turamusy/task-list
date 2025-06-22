/**
 * IListItem — интерфейс для элемента списка.
 * Используется для отображения и управления элементами в сортируемом списке.
 */
export interface IListItem {
  /** @property id — уникальный идентификатор элемента */
  id: number
  /** @property value — текстовое значение элемента */
  value: string;
  /** @property selected — выбран ли элемент */
  selected: boolean
}
