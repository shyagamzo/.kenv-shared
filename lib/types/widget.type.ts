import type { WidgetMessage } from '@johnlindquist/kit/types/pro';
import { z } from 'zod';

export type DropFile = { name: string, path: string, size: number, type: string, lastModified: string, lastModifiedDate: Date, webkitRelativePath: string };
export type DropImage = DropFile;
export type DropVideo = DropFile;
export type DropAudio = DropFile;
export type DropApp = DropFile;
export type DropText = string;
export type DropUri = string;
export type DropHtml = string;
export type DropOther = string | Record<string, unknown>;

export type WidgetDropCategory = 'files' | 'images' | 'videos' | 'apps' | 'texts' | 'uris' | 'htmls' | 'others';

export type WidgetDropItem<Info, Mime extends string> = { info: Info, mime: Mime };

export const DroppedItemSchema = <InfoSchema extends z.Schema, MimeSchema extends z.ZodString | z.ZodLiteral<string>>(info: InfoSchema, mime: MimeSchema) => z.array(z.object({ info, mime }));
export const DroppedFileItemSchema = <MimeSchema extends z.ZodString | z.ZodLiteral<string>>(mime: MimeSchema) => DroppedItemSchema(z.object({ name: z.string(), path: z.string(), size: z.number(), type: z.string(), lastModified: z.number(), lastModifiedDate: z.string().datetime(), webkitRelativePath: z.string() }), mime);

export const DroppedDataSchema = z.object({
    files: DroppedFileItemSchema(z.literal('')),
    images: DroppedFileItemSchema(z.string().regex(/^image\/.*$/)),
    videos: DroppedFileItemSchema(z.string().regex(/^video\/.*$/)),
    audios: DroppedFileItemSchema(z.string().regex(/^audio\/.*$/)),
    apps: DroppedFileItemSchema(z.string().regex(/^application\/.*$/)),

    texts: DroppedItemSchema(z.string(), z.literal('text/plain')),
    uris: DroppedItemSchema(z.string(), z.string().regex(/^text\/uri.*$/)),
    htmls: DroppedItemSchema(z.string(), z.string().regex(/^text\/html.*$/)),

    others: DroppedItemSchema(z.unknown(), z.string())
}).partial();

export type CategorizedDropItems = z.infer<typeof DroppedDataSchema>;

export type WidgetDropMessage = WidgetMessage & { dataTransfer?: CategorizedDropItems; };