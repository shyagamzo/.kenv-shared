import { CategorizedDropItems, DroppedDataSchema, WidgetDropCategory, WidgetDropMessage } from '../types/widget.type';
import { SchemaErrorHandling, piped } from '../script-interop/piped';

export function dropHandler(process: (data: CategorizedDropItems, targetId: string) => void | Promise<void>): (message: WidgetDropMessage) => Promise<void>
{
    return async ({ dataTransfer, targetId }: WidgetDropMessage) =>
    {
        if (!dataTransfer) return;

        const categories = Object.keys(dataTransfer) as WidgetDropCategory[];

        if (!categories.length)
        {
            notify({ title: '📥 Drop Basket', message: 'Nothing recognized.' });

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

export const pipedDragged = (schemaErrorHandling?: SchemaErrorHandling, ...args: Parameters<typeof arg>) => piped({ ExpectedSchema: DroppedDataSchema, ...schemaErrorHandling }, ...args);

export const pipedFiles = (schemaErrorHandling?: SchemaErrorHandling, ...args: Parameters<typeof arg>) => pipedDragged(schemaErrorHandling, ...args).then(({ files }) => files);
export const pipedImages = (schemaErrorHandling?: SchemaErrorHandling, ...args: Parameters<typeof arg>) => pipedDragged(schemaErrorHandling, ...args).then(({ images }) => images);
export const pipedVideos = (schemaErrorHandling?: SchemaErrorHandling, ...args: Parameters<typeof arg>) => pipedDragged(schemaErrorHandling, ...args).then(({ videos }) => videos);
export const pipedApps = (schemaErrorHandling?: SchemaErrorHandling, ...args: Parameters<typeof arg>) => pipedDragged(schemaErrorHandling, ...args).then(({ apps }) => apps);
export const pipedTexts = (schemaErrorHandling?: SchemaErrorHandling, ...args: Parameters<typeof arg>) => pipedDragged(schemaErrorHandling, ...args).then(({ texts }) => texts);
export const pipedUris = (schemaErrorHandling?: SchemaErrorHandling, ...args: Parameters<typeof arg>) => pipedDragged(schemaErrorHandling, ...args).then(({ uris }) => uris);
export const pipedHtmls = (schemaErrorHandling?: SchemaErrorHandling, ...args: Parameters<typeof arg>) => pipedDragged(schemaErrorHandling, ...args).then(({ htmls }) => htmls);
export const pipedOthers = (schemaErrorHandling?: SchemaErrorHandling, ...args: Parameters<typeof arg>) => pipedDragged(schemaErrorHandling, ...args).then(({ others }) => others);
