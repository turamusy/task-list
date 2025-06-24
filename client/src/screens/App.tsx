import { useEffect, useState, useRef, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, UniqueIdentifier, closestCenter } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import '../index.css';
import { getItems, postOrderItem, postSelectItem } from '../api/api';
import { IListItem } from '../interfaces/list-item';
import { BATCH_SIZE, TEXT } from '../constants';
import SortableItem from '../components/sortable-item';
import { useDebounce } from '../utils/debounce';

/**
 * App.tsx — основной экран приложения.
 * 
 * Реализует:
 * - Сортируемый список с поддержкой drag-and-drop
 * - Бесконечную прокрутку (infinite scroll)
 * - Поиск с дебаунсом
 * - Оптимистичное обновление UI при drag-and-drop и выборе
 * - Обработку ошибок и загрузки
 * 
 * Использует dnd-kit, кастомный debounce, TailwindCSS.
 */
const App = () => {
  /**
   * list — Map всех элементов (id -> IListItem)
   * selectedIds — Set выделенных элементов
   * mainIds — id элементов основного списка (в порядке отображения)
   * searchIds — id элементов в поиске (в порядке отображения)
   * isSearching — режим поиска
   * searchTerm — поисковый запрос
   * hasMore/searchHasMore — индикаторы наличия следующей страницы
   * loading — индикатор загрузки
   * activeId — id текущего перетаскиваемого элемента
   * searchReordered — флаг, указывающий, был ли изменён порядок в поиске
   */
  const [list, setList] = useState<Map<number, IListItem>>(new Map());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [mainIds, setMainIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  /** Состояния для поиска */
  const [searchIds, setSearchIds] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchHasMore, setSearchHasMore] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchReordered, setSearchReordered] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  /** Добавить/обновить элементы в list. */
  const updateItems = useCallback((newItems: IListItem[]) => {
    setList(prev => {
      const prevList = new Map(prev);
      newItems.forEach(item => prevList.set(item.id, item));
      return prevList;
    });
  }, []);

  /** Валидация и установка коллекции для выбранных айди */
  const validateSelectedIdsSet = useCallback((prevState: Set<number>, nextState: IListItem[]): Set<number> => {
    const newSelectedIds = new Set(prevState);
    nextState.forEach(item => {
      if (item.selected) {
        newSelectedIds.add(item.id);
      } else {
        newSelectedIds.delete(item.id);
      }
    });
    return newSelectedIds;
  }, []);

  /** Загрузка первой порции данных */
  const loadInitial = useCallback(async () => {
    try {
      const firstBatch = await getItems(0, BATCH_SIZE);
      updateItems(firstBatch.items);
      setMainIds(firstBatch.items.map(i => i.id));
      setHasMore(firstBatch.items.length === BATCH_SIZE);
      setSelectedIds(prev => (validateSelectedIdsSet(prev, firstBatch.items)));
    } catch (e) {
      console.error(TEXT.errorLoadItems, e);
    } finally {
      setLoading(false);
    }
  }, [updateItems, validateSelectedIdsSet]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  /** Загрузка следующей порции данных (основной список или поиск) */
  const loadMore = async () => {
    try {
      setLoading(true);
      if (isSearching) {
        const nextSearchBatch = (await getItems(searchIds.length, BATCH_SIZE, searchTerm)).items;
        updateItems(nextSearchBatch);
        setSearchIds(prev => [...prev, ...nextSearchBatch.map(i => i.id)]);
        setSearchHasMore(nextSearchBatch.length === BATCH_SIZE);
        setSelectedIds(prev => (validateSelectedIdsSet(prev, nextSearchBatch)));
      } else {
        const nextBatch = (await getItems(mainIds.length, BATCH_SIZE)).items;
        updateItems(nextBatch);
        setMainIds(prev => [...prev, ...nextBatch.map(i => i.id)]);
        setHasMore(nextBatch.length === BATCH_SIZE);
        setSelectedIds(prev => (validateSelectedIdsSet(prev, nextBatch)));
      }
    } catch (e) {
      console.error(TEXT.errorLoadMore, e);
    } finally {
      setLoading(false);
    }
  };

  /** Обработка скролла для бесконечной подгрузки */
  const handleScroll = () => {
    const el = containerRef.current;
    const handledHasMoreValue = isSearching ? searchHasMore : hasMore;

    if (loading || !el || !handledHasMoreValue) return;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      loadMore();
    }
  };

  /** Обработка ввода в поисковую строку (обновляет состояние поиска) */
  const handleSearchInput = async (term: string) => {
    setSearchTerm(term);
    setIsSearching(!!term);
    if (!term) {
      setSearchIds([]);
      setSearchHasMore(true);
    }
  };

  /** Обработка поиска с задержкой (дебаунс) */
  const handleSearchResponse = useCallback(async (term: string) => {
    if (!term) return;

    setLoading(true);
    try {
      const firstSearchBatch = await getItems(0, BATCH_SIZE, term);
      updateItems(firstSearchBatch.items);
      setSearchIds(firstSearchBatch.items.map(i => i.id));
      setSearchHasMore(firstSearchBatch.items.length === BATCH_SIZE);
      setSelectedIds(prev => validateSelectedIdsSet(prev, firstSearchBatch.items));
    } catch (e) {
      console.error(TEXT.errorLoadItems, e);
      setSearchIds([]);
      setSearchHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [updateItems, validateSelectedIdsSet]);

  const debouncedHandleSearch = useDebounce(handleSearchResponse, 400);

  /** Триггерим поиск при изменении searchTerm */
  useEffect(() => {
    debouncedHandleSearch(searchTerm);
  }, [debouncedHandleSearch, searchTerm]);

  /** Обработка переключения. Переключаем селектор сразу, если какая либо ошибка то откатываем. */
  const toggleSelection = async (id: number) => {
    setSelectedIds(prev => {
      const newSelectedIds = new Set(prev);
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }
      return newSelectedIds;
    });
    try {
      await postSelectItem(id, !selectedIds.has(id));
    } catch (err) {
      setSelectedIds(prev => {
        const newSelectedIds = new Set(prev);
        if (newSelectedIds.has(id)) {
          newSelectedIds.delete(id);
        } else {
          newSelectedIds.add(id);
        }
        return newSelectedIds;
      });
      alert(TEXT.alertSelect);
    }
  };

  /** Обработка начала перетаскивания элемента */
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  /** Обработка конца перетаскивания. Optimistic UI, меняем состояние сразу, если ответ от сервера с ошибкой то откатываем состояние. */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const ids = isSearching ? searchIds : mainIds;
      const oldIndex = ids.findIndex(i => i === active.id);
      const newIndex = ids.findIndex(i => i === over?.id);
      const newOrder = arrayMove(ids, oldIndex, newIndex);

      if (isSearching) {
        setSearchIds(newOrder);
        setSearchReordered(true);
      } else {
        setMainIds(newOrder);
      }
      setActiveId(null);

      try {
        await postOrderItem(Number(active.id), Number(over?.id) ?? null);
      } catch (e) {
        if (isSearching) {
          setSearchIds(ids);
          setSearchReordered(false);
        } else {
          setMainIds(ids);
        }
        alert(TEXT.errorOrder);
      }
    } else {
      setActiveId(null);
    }
  };

  /** Валидация порядка элементов после поиска. Перезагружает основной список с текущим количеством загруженных элементов для синхронизации порядка. */
  const validateOrderAfterSearch = useCallback(async () => {
    const count = mainIds.length || BATCH_SIZE;
    const data = await getItems(0, count);

    updateItems(data.items);
    setMainIds(data.items.map(i => i.id));
    setHasMore(data.items.length === count && data.items.length > 0);
    setSelectedIds(prev => validateSelectedIdsSet(prev, data.items));
    setSearchReordered(false);
  }, [mainIds.length, updateItems, validateSelectedIdsSet])

  useEffect(() => {
    if (!isSearching && searchReordered) {
      validateOrderAfterSearch();
    }
  }, [validateOrderAfterSearch, isSearching, searchReordered]);

  if (loading && mainIds.length === 0) return <div className="p-4">{TEXT.loading}</div>;

  /** Массив id для текущего отображения (основной список или поиск) */
  const idsToRender = isSearching ? searchIds : mainIds;
  /** Массив элементов для рендера */
  const itemsToRender = idsToRender.map(id => list.get(id)).filter((item): item is IListItem => item !== undefined);
  /** Текущий перетаскиваемый элемент */
  const activeDndItem = list.get(Number(activeId));

  /** Функция рендера DND контента */
  const renderSortableContent = (): JSX.Element => {
    return <div className="flex-1 overflow-auto touch-pan-y" ref={containerRef} onScroll={handleScroll} >
      <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={idsToRender} strategy={verticalListSortingStrategy} >
          {itemsToRender.map(item => (
            <SortableItem
              key={item.id}
              item={item}
              onToggle={() => toggleSelection(item.id)}
              isDraggable={!isSearching || (isSearching && searchIds.length > 1)}
              isActive={item.id === activeId}
              selected={selectedIds.has(item.id)}
            />
          ))}
        </SortableContext>
        <DragOverlay>
          {activeDndItem ? (
            <SortableItem
              key={activeDndItem.id}
              item={activeDndItem}
              onToggle={() => toggleSelection(activeDndItem.id)}
              selected={selectedIds.has(activeDndItem.id)}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      {!hasMore && !isSearching && (
        <div className="text-center text-gray-500 mt-4">{TEXT.endOfList}</div>
      )}
      {!searchHasMore && isSearching && (
        <div className="text-center text-gray-500 mt-4">{TEXT.endOfList}</div>
      )}
    </div>
  };

  return (
    <div className="flex flex-col p-4 w-full max-w-6xl mx-auto h-[80vh]">
      <h1 className="text-2xl font-bold mb-4">{TEXT.title}</h1>
      <input
        type="text"
        placeholder={TEXT.searchPlaceholder}
        className="p-2 border rounded mb-4"
        value={searchTerm}
        onChange={(e) => handleSearchInput(e.target.value)}
      />
      {renderSortableContent()}
    </div>
  );
};

export default App;