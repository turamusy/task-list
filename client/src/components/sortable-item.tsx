import { useSortable } from "@dnd-kit/sortable";
import React from "react";
import { IListItem } from "../interfaces/list-item";
import { CSS } from '@dnd-kit/utilities';
import { TEXT } from "../constants";

/** 
 * Комонент списка. 
 * Отображает один элемент списка с возможностью перетаскивания и выбора.
 * @param item - элемент списка, который нужно отобразить
 * @param onToggle - функция для обработки переключения состояния выбора элемента
 * @param isDraggable - флаг, указывающий, можно ли перетаскивать элемент(используется для отключения во время поиска)
 */
const SortableItem = React.memo(({ item, onToggle, isDraggable = true, isActive, selected }: {
  item: IListItem;
  onToggle: () => void;
  isDraggable?: boolean;
  isActive?: boolean;
  selected?: boolean;
}) => {
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
      className={`flex items-center justify-between py-5 pr-5 border rounded shadow mb-2
        ${!isDraggable ? 'pl-5' : ''}
        ${isActive ? 'opacity-40' : ''} 
        ${selected ? 'bg-blue-300' : 'bg-blue-100'}`}
    >
      {isDraggable ? <div
        className="cursor-grab w-10 touch-pan-x select-none"
        {...listeners}
        {...attributes}
      >
        <span className="text-center justify-center flex items-center">{TEXT.trigramChar}</span>
      </div> : null}
      <span className='flex-1'>{item.value}</span>
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="ml-2"
      />
    </div>
  );
});

export default SortableItem;