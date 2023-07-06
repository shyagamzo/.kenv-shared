import screenshot from 'screenshot-desktop';

export async function captureScreenshotToFile(...args: Parameters<typeof screenshot>): Promise<string | Buffer>
{
    return screenshot(...args);
}

export async function enumarateDisplays(): Promise<{ id: number; name: string; }[]>
{
    return screenshot.listDisplays();
}

export async function ySnappedToScreenBottom(elementHeight: number, considerTaskbar: boolean = true): Promise<number>
{
    const screen = (await getScreens()).at(-1);

    return screen ? screen.bounds.height - (considerTaskbar ? 50 : 0) - elementHeight : 0;
}