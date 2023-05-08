import { WidgetAPI } from '@johnlindquist/kit/types/pro';

import type { CategorizedDropItems, WidgetDropCategory, WidgetDropTypesMap } from '../types/widget.type';
import { dropHandler, reduceCategorizedItems } from './drop-utils';

export type BasketState = { content: CategorizedDropItems };

export class DropBasket
{
    private _data: CategorizedDropItems = {};

    public readonly id: string = uuid();
    
    constructor(public readonly widget: WidgetAPI)
    {    
        widget.onDrop(dropHandler((data) => this.addItems(data)));
    
        widget.onMouseDown(({  }) =>
        {
        
        });
    
        widget.onClose(this.destroy.bind(this));
    }

    public destroy(): void
    {
        this.widget.close();
    }

    public get data(): CategorizedDropItems
    {
        return structuredClone(this._data);
    }

    public set data(data: CategorizedDropItems)
    {
        this._data = structuredClone(data);

        this.widget.setState({ content: this._data } satisfies BasketState);
    }

    public addItems(data: CategorizedDropItems): void
    {
        const newData = reduceCategorizedItems(data, (result, category, items) =>
        {
            // Not sure why TS can't infer these types. It didn't infer them inside an if block either.
            result[category as string] = category === 'files' || category === 'images'
                ? aggregateFilesNoDuplicates(result, category, items as CategorizedDropItems['files' | 'images'])
                : aggregateItemsNoDuplicates(result, category, items);
            
            return result;
        }, this._data);
    
        this.data = newData;
    }
}

function aggregateItemsNoDuplicates<Category extends Exclude<WidgetDropCategory, 'files' | 'images'>>(result: CategorizedDropItems, category: Category, items: CategorizedDropItems[Category]): CategorizedDropItems[Category]
{
    return [...new Set([...result[category], ...items])] as CategorizedDropItems[Category];
}

function aggregateFilesNoDuplicates<Category extends 'files' | 'images'>(existing: CategorizedDropItems, category: Category, items: CategorizedDropItems[Category]): CategorizedDropItems[Category]
{
    const existingItems = (existing[category] ?? []) as CategorizedDropItems[Category];

    return [
        ...existingItems,
        ...items.filter(({ info: newInfo }) => existingItems.every(({ info: existingInfo }) => newInfo.path !== existingInfo.path))
    ] as CategorizedDropItems[Category];
}