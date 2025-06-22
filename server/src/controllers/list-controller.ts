import { Request, Response } from 'express';
import { getItems, reorderItem, updateSelection } from '../services/list-service';
import { IGetItemsResponse, IOrderRequest, ISelectRequest } from '../types/types';

/**
 * Обработчик GET запроса для получения списка элементов с пагинацией и поиском.
 * @param req - Express request объект
 * @param res - Express response объект
 */
export function handleGetItems(req: Request, res: Response): void {
  try {
    const offset: number = parseInt(<string>req.query.offset) || 0;
    const limit: number = parseInt(<string>req.query.limit) || 20;
    const queryParams: string = <string>req.query.q || '';

    const data: IGetItemsResponse = getItems(offset, limit, queryParams);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
}

/**
 * Обработчик POST запроса для изменения состояния выбора элемента.
 * @param req - Express request объект с телом запроса { id, selected }
 * @param res - Express response объект
 */
export function handleSelect(req: Request, res: Response): void {
  try {
    const { id, selected }: ISelectRequest = req.body;

    const success: boolean = updateSelection(id, selected);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid ID or selection' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update selection' });
  }
}

/**
 * Обработчик POST запроса для изменения порядка элементов (drag-and-drop).
 * @param req - Express request объект с телом запроса { id, afterId }
 * @param res - Express response объект
 */
export function handleReorder(req: Request, res: Response): void {
  try {
    const { id, afterId }: IOrderRequest = req.body;
    const success: boolean = reorderItem(id, afterId);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Item not found' });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reorder item'})
  }
}
