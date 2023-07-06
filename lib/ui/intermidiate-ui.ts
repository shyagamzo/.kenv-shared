export function ui({ html, loading, footer }: { html: string, footer?: string, loading?: boolean }): void
{
    if (loading !== undefined)
        setRunning(loading);

    div({
        html,
        footer
    }, 'flex items-center justify-center h-full text-center');
}