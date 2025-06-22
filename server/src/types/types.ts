/**
 * Состояние приложения - содержит порядок элементов и выбранные элементы.
 */
export type IState = {
  /** Массив строк с порядком элементов */
  order: string[];
  /** Множество выбранных элементов по их ID */
  selected: Set<number>;
};

/**
 * Интерфейс для элемента списка.
 */
export interface IListItem {
  /** Уникальный идентификатор элемента */
  id: number;
  /** Текстовое значение элемента */
  value: string;
  /** Выбран ли элемент */
  selected: boolean;
}

/**
 * Ответ API для получения списка элементов.
 */
export interface IGetItemsResponse {
  /** Массив элементов */
  items: IListItem[];
  /** Общее количество элементов */
  total: number
}

/**
 * Запрос на изменение состояния выбора элемента.
 */
export interface ISelectRequest {
  /** ID элемента */
  id: number;
  /** Новое состояние выбора */
  selected: boolean;
}

/**
 * Запрос на изменение порядка элементов.
 */
export interface IOrderRequest {
  /** ID перемещаемого элемента */
  id: number;
  /** ID элемента, после которого вставить (null для вставки в начало) */
  afterId: number | null;
} 