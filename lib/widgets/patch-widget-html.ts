import { HtmlFilePath, JsFilePath } from '../types/paths.types';

export async function patchWidgetHtml(widgetHtmlPath: HtmlFilePath, ...jsPatchPaths: JsFilePath[]): Promise<string>
{
    const html = await readFile(widgetHtmlPath, 'utf8');
    const patchScripts = await Promise.all(jsPatchPaths.map(patchPath => readFile(patchPath, 'utf8').then(content => ({ patchPath, content }))));

    const framePadding = '='.repeat(8);

    const patch = patchScripts.map(({ patchPath, content }) =>
    {
        const header = `🩹 ${ patchPath }`;
        const footer = `🩹 End of ${ patchPath }`;

        const wrapSection = (title: string) =>
        {
            const frame = '='.repeat(framePadding.length + title.length + 2);
            const content = `${ framePadding } ${ title } ${ framePadding }`;
            return `
                // ${ frame }
                // ${ content }
                // ${ frame }
            `;
        }
        
        return `
        ${ wrapSection(header) }
        ${ content }
        ${ wrapSection(footer) }
    `.trim();
    }).join('\n');
    
    return `
        ${ html }
        <script>
        ${ patch }
        </script>
    `.trim();
}

export async function patchDroppableWidgetHtml(path: HtmlFilePath): Promise<string>
{
    return patchWidgetHtml(path, './lib/drop-zone/_widget-drop-info-patch.js');
}
