import type { WidgetAPI } from '@johnlindquist/kit/types/pro';
import _ from 'lodash';

import type { CategorizedDropItems, WidgetDropCategory } from '../types/widget.type';
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
            result[category] = aggregateItemsNoDuplicates(result, category, items);
            
            return result;
        }, this._data);
    
        this.data = newData;
    }
}

function aggregateItemsNoDuplicates<Category extends WidgetDropCategory>(existing: CategorizedDropItems, category: Category, items: CategorizedDropItems[Category]): CategorizedDropItems[Category]
{
    if (!items) return;

    return _.unionWith(existing[category], items, _.isEqual) as CategorizedDropItems[Category];
}