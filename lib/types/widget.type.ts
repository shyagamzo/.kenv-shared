import type { WidgetMessage } from '@johnlindquist/kit/types/pro';
import { z } from 'zod';

export type WidgetDropCategory = 'files' | 'images' | 'videos' | 'apps' | 'texts' | 'uris' | 'htmls' | 'others';

export const DroppedFileSchema = z.object({
    name: z.string(),
    path: z.string(),
    size: z.number(),
    type: z.string(),
    lastModified: z.number(),
    lastModifiedDate: z.string().datetime(),
    webkitRelativePath: z.string()
});

export const DroppedItemSchema = <InfoSchema extends z.Schema, MimeSchema extends z.ZodString | z.ZodLiteral<string>>(InfoSchema: InfoSchema, MimeSchema: MimeSchema) => z.object({ info: InfoSchema, mime: MimeSchema });

export const DroppedFileItemSchema = DroppedItemSchema(DroppedFileSchema, z.literal(''));
export const DroppedImageItemSchema = DroppedItemSchema(DroppedFileSchema, z.string().regex(/^image\/.*$/));
export const DroppedVideoItemSchema = DroppedItemSchema(DroppedFileSchema, z.string().regex(/^video\/.*$/));
export const DroppedAudioItemSchema = DroppedItemSchema(DroppedFileSchema, z.string().regex(/^audio\/.*$/));
export const DroppedAppItemSchema = DroppedItemSchema(DroppedFileSchema, z.string().regex(/^application\/.*$/));

export const DroppedTextItemSchema = DroppedItemSchema(z.string(), z.literal('text/plain'));
export const DroppedUriItemSchema = DroppedItemSchema(z.string(), z.string().regex(/^text\/uri.*$/));
export const DroppedHtmlItemSchema = DroppedItemSchema(z.string(), z.string().regex(/^text\/html.*$/));

export const DroppedOtherItemSchema = DroppedItemSchema(z.unknown(), z.string());

export const DroppedDataSchema = z.object({
    files: DroppedFileItemSchema.array(),
    images: DroppedImageItemSchema.array(),
    videos: DroppedVideoItemSchema.array(),
    audios: DroppedAudioItemSchema.array(),
    apps: DroppedAppItemSchema.array(),

    texts: DroppedTextItemSchema.array(),
    uris: DroppedUriItemSchema.array(),
    htmls: DroppedHtmlItemSchema.array(),

    others: DroppedOtherItemSchema.array()
}).partial();

export type CategorizedDropItems = z.infer<typeof DroppedDataSchema>;

export type DroppedFile = z.infer<typeof DroppedFileSchema>;
export type DroppedImage = z.infer<typeof DroppedImageItemSchema>;
export type DroppedVideo = z.infer<typeof DroppedVideoItemSchema>;
export type DroppedAudio = z.infer<typeof DroppedAudioItemSchema>;
export type DroppedApp = z.infer<typeof DroppedAppItemSchema>;

export type DroppedText = z.infer<typeof DroppedTextItemSchema>;
export type DroppedUri = z.infer<typeof DroppedUriItemSchema>;
export type DroppedHtml = z.infer<typeof DroppedHtmlItemSchema>;

export type DroppedOther = z.infer<typeof DroppedOtherItemSchema>;

export type WidgetDropMessage = WidgetMessage & { dataTransfer?: CategorizedDropItems; };