export async function touchFile(filePath: string): Promise<void>
{
    const fs = await import('fs/promises');

    const now = new Date();

    return fs.utimes(filePath, now, now);
}