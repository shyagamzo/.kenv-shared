import { CategorizedDropItems, WidgetDropCategory, WidgetDropMessage } from '../types/widget.type';

export function dropHandler(process: (data: CategorizedDropItems, targetId: string) => void | Promise<void>): (message: WidgetDropMessage) => Promise<void>
{
    return async ({ dataTransfer, targetId }: WidgetDropMessage) =>
    {
        if (!dataTransfer) return;

        const categories = Object.keys(dataTransfer) as WidgetDropCategory[];

        if (!categories.length)
        {
            notify({ title: '📥 Drop Basket', message: 'Nothing recognized recognized.' });

            return;
        }
        
        const maybePromise = process(dataTransfer, targetId);

        if (maybePromise instanceof Promise) await maybePromise;
    };
}

export function reduceCategorizedItems<Result>(
    data: CategorizedDropItems,
    reducer: <Category extends WidgetDropCategory>(result: Result, category: Category, items: CategorizedDropItems[Category]) => Result,
    initial: Result
): Result
{
    return Object
        .entries(data)
        .reduce((result, [category, items]) => reducer(result, category as WidgetDropCategory, items), initial as Result);
}
