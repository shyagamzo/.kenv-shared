import '@johnlindquist/kit';

export function createCompletionHtml(markdown: string): ReturnType<typeof highlight>
{
    return highlight(md(markdown, 'text-md m-6'));
}

export async function showOrUpdateCompletionDiv(markdown: string): ReturnType<typeof div>
{
    const html = await createCompletionHtml(markdown);

    return div({
        html,
        height: 900
    });
}