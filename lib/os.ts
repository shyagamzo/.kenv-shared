type ScreenshotDesktop = typeof import('screenshot-desktop');

export async function captureScreenshotToFile(...args: Parameters<ScreenshotDesktop>): Promise<string | Buffer>
{
    const screenshot: ScreenshotDesktop = await npm('screenshot-desktop');

    return screenshot(...args);
}

export async function enumarateDisplays(): Promise<{ id: number; name: string; }[]>
{
    const screenshot: ScreenshotDesktop = await npm('screenshot-desktop');

    return screenshot.listDisplays();
}