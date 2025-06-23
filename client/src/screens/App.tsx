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
  const [visibleItems, setVisibleItems] = useState<IListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  /** Состояния для поиска */
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<IListItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchHasMore, setSearchHasMore] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  /** Загрузка первой порции данных */
  const loadInitial = useCallback(async () => {
    try {
      const firstBatch = await getItems(0, BATCH_SIZE)
      setVisibleItems(firstBatch.items);
      setHasMore(firstBatch.items.length === BATCH_SIZE)
    } catch (e) {
      console.error(TEXT.errorLoadItems, e)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial()
  }, [loadInitial]);

  /** Загрузка следующей порции данных (или результатов поиска) */
  const loadMore = async () => {
    try {
      setLoading(true)

      if (isSearching) {
        const nextSearchBatch = (await getItems(searchResults.length, BATCH_SIZE, searchTerm)).items;
        setSearchResults(prev => [...prev, ...nextSearchBatch]);
        setSearchHasMore(nextSearchBatch.length === BATCH_SIZE);
      } else { 
        const nextBatch = (await getItems(visibleItems.length, BATCH_SIZE)).items;
        setVisibleItems(prev => [...prev, ...nextBatch]);
        setHasMore(nextBatch.length === BATCH_SIZE);
      }
    } catch (e) {
      console.error(TEXT.errorLoadMore, e)
    } finally {
      setLoading(false)
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
  };

  /** Обработка поиска с задержкой (дебаунс) */
  const handleSearchResponse = useCallback(async (term: string) => {
    if (!term) return;

    setLoading(true);
    try {
      const firstSearchBatch = await getItems(0, BATCH_SIZE, term);
      setSearchResults(firstSearchBatch.items);
      setSearchHasMore(firstSearchBatch.items.length === BATCH_SIZE);
    } catch (e) {
      console.error(TEXT.errorLoadItems, e);
      setSearchResults([]);
      setSearchHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedHandleSearch = useDebounce(handleSearchResponse, 400);

  /** Триггерим поиск при изменении searchTerm */
  useEffect(() => {
    debouncedHandleSearch(searchTerm); 
  }, [debouncedHandleSearch, searchTerm]);

  /** Обработка начала перетаскивания элемента */
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
  };

  /** Обработка конца перетаскивания. Optimistic UI, меняем состояние сразу, если ответ от сервера с ошибкой то откатываем состояние. */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = visibleItems.findIndex(i => i.id === active.id);
      const newIndex = visibleItems.findIndex(i => i.id === over?.id);
      const newOrder = arrayMove(visibleItems, oldIndex, newIndex);
      setVisibleItems(newOrder);
      try {
        await postOrderItem(Number(active.id), Number(over?.id) ?? null);
      } catch (e) {
        console.error(TEXT.errorOrder, e);
        const rolledBack = arrayMove(newOrder, newIndex, oldIndex);
        setVisibleItems(rolledBack);
        alert(TEXT.alertOrder);
      }
    }
    setActiveId(null);
  };

  /** Обработка переключения. Переключаем селектор сразу, если какая либо ошибка то откатываем. */
  const toggleSelection = async (item: IListItem) => {
    const newSelectedValue = !item.selected;
    const updated = visibleItems.map(i =>
      i.id === item.id ? { ...i, selected: newSelectedValue } : i
    );
    setVisibleItems(updated);
    try {
      await postSelectItem(item.id, !item.selected);
    } catch (err) {
      console.error(TEXT.errorSelect, err);
      setVisibleItems(prev =>
        prev.map(i =>
          i.id === item.id ? { ...i, selected: !newSelectedValue } : i
        )
      );
      alert(TEXT.alertSelect);
    }
  };

  if (loading && visibleItems.length === 0) return <div className="p-4">{TEXT.loading}</div>;

  /** Текущий перетаскиваемый элемент */
  const activeDndItem = visibleItems.find(item => item.id === activeId);
  /** Обработчик состояния для отображения результатов поиска или всех элементов */
  const itemsToRender = isSearching ? searchResults : visibleItems;


  /** Функция рендера DND контента */
  const renderSortableContent = (): JSX.Element => {
    return <div className="flex-1 overflow-auto touch-none" ref={containerRef} onScroll={handleScroll} >
      <DndContext  collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleItems.map(i => i.id)} strategy={verticalListSortingStrategy} >
          {itemsToRender.map(item => (
            <SortableItem key={item.id} item={item} onToggle={toggleSelection} isDraggable={!isSearching} />
          ))}
        </SortableContext>
        <DragOverlay>
          {activeDndItem ? (
            <SortableItem key={activeDndItem.id} item={activeDndItem} onToggle={toggleSelection} />
          ) : null}
        </DragOverlay>
      </DndContext>
      {!hasMore && (
        <div className="text-center text-gray-500 mt-4">{TEXT.endOfList}</div>
      )}
    </div>
  }

  return (
    <div
      className="flex flex-col p-4 w-full max-w-6xl mx-auto h-[80vh]">
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