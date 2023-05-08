import type { WidgetMessage } from '@johnlindquist/kit/types/pro';

export type DropFile = { name: string, path: string, size: number, type: string, lastModified: string, lastModifiedDate: Date, webkitRelativePath: string };
export type DropImage = DropFile;
export type DropText = string;
export type DropUri = string;
export type DropHtml = string;
export type DropOther = string | Record<string, unknown>;

export type WidgetDropCategory = 'files' | 'texts' | 'uris' | 'htmls' | 'images' | 'others';

export type WidgetDropItem<Info, Mime extends string> = { info: Info, mime: Mime };

export type WidgetDropItemCategorized<Category extends WidgetDropCategory, Info, Mime extends string> = { [k in Category]: WidgetDropItem<Info, Mime>[] }

export type WidgetDropTypesMap = {
    files: WidgetDropItem<DropFile, ''>,
    images: WidgetDropItem<DropImage, `image/${ string }`>,
    texts: WidgetDropItem<DropText, `text/plain`>,
    uris: WidgetDropItem<DropUri, `text/uri${ string }`>,
    htmls: WidgetDropItem<DropHtml, `text/html${ string }`>,
    others: WidgetDropItem<DropOther, string>
};

export type WidgetDropTypeInfo<Category extends WidgetDropCategory> = WidgetDropTypesMap[Category]['info'];
export type WidgetDropTypeMime<Category extends WidgetDropCategory> = WidgetDropTypesMap[Category]['mime'];

export type CategorizedDropItems = { [k in keyof WidgetDropTypesMap]?: WidgetDropTypesMap[k][] };

export type WidgetDropMessage = WidgetMessage & { dataTransfer?: CategorizedDropItems; };