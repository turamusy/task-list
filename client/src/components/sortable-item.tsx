import { useSortable } from "@dnd-kit/sortable";
import React from "react";
import { IListItem } from "../interfaces/list-item";
import { CSS } from '@dnd-kit/utilities';

/** 
 * Комонент списка. 
 * Отображает один элемент списка с возможностью перетаскивания и выбора.
 * @param item - элемент списка, который нужно отобразить
 * @param onToggle - функция для обработки переключения состояния выбора элемента
 * @param isDraggable - флаг, указывающий, можно ли перетаскивать элемент(используется для отключения во время поиска)
 */
const SortableItem = React.memo(({ item, onToggle, isDraggable }: { item: IListItem; onToggle: (item: IListItem) => void; isDraggable?: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-5 border rounded shadow mb-2 ${item.selected ? 'bg-blue-300' : 'bg-blue-100'}`}
    >
      {isDraggable ? <div
        className="cursor-grab flex-1"
        {...listeners}
        {...attributes}
      >
        <span>☰</span>
        <span className='ml-5'>{item.value}</span>
      </div> : <span className='ml-5'>{item.value}</span>} 
      <input
        type="checkbox"
        checked={item.selected}
        onChange={() => onToggle(item)}
        className="ml-2"
      />
    </div>
  );
});

export default SortableItem;