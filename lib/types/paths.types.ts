/**
 * Creates a string pattern that forces .extention at the end.
 */
export type FilePath<Extension extends string = string> = `${ string }.${ Extension }`;

export type HtmlFilePath = FilePath<'html' | 'htm'>;
export type JsFilePath = FilePath<'js' | 'mjs'>;
export type TsFilePath = FilePath<'ts'>;
export type ScriptFilePath = JsFilePath | TsFilePath;
export type JsonFilePath = FilePath<'json'>;
export type CssFilePath = FilePath<'css'>;