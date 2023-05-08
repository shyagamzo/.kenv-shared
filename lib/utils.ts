import type { Choice, Script } from '@johnlindquist/kit';
import type { TsFilePath } from './types/paths.types';

export function identity<T>(value: T): T { return value; }

export function getRandomItemFromArray<T>(array: T[]): T
{
    return array[Math.floor(Math.random() * array.length)];
}

export function randomId(): number
{
    return Math.round(Math.random() * 1000000000);
}

export function isTsFilePath(fileName: string): fileName is TsFilePath
{
    return fileName.endsWith('.ts');
}

export function isTsScript(script: Script): script is Script & { filePath: TsFilePath }
{
    return isTsFilePath(script.filePath);
}

export function ensureIsTsFilePath(path: string, message?: string): asserts path is TsFilePath
{
    if (!isTsFilePath(path))
    {
        console.log(message ?? `🤔 '${ path }' is not a ts file. Exiting...`);

        exit();
    }
}

export function ensureIsWatchChangeEvent(event: string): asserts event is 'change'
{
    if (event !== 'change')
    {
        console.log(`🤔 '${ event }' is not a watch change event. Exiting...`);

        exit();
    }
}

interface ScriptChoicesConfig<ValueAs extends keyof Script | ((script: Script) => any)>
{
    scripts: Script[];
    valueAs: ValueAs;
    tsOnly: boolean;
    addPreview: boolean
}

type ScriptChoice<Value extends keyof Script | ((script: Script) => any)> = Choice<
    Value extends keyof Script ? Script[Value] :
    Value extends (script: Script) => infer Return ? Return : never
>;

export async function scriptChoices<ValueAs extends keyof Script | ((script: Script) => any)>(
    {
        scripts,
        valueAs,
        tsOnly = true,
        addPreview = true
    }: Partial<ScriptChoicesConfig<ValueAs>> = {}
): Promise<ScriptChoice<ValueAs>[]>
{
    scripts ??= await getScripts();

    const createValue = (script: Script) =>
        typeof valueAs === 'function'
            ? valueAs(script)
            : script[valueAs as keyof Script ?? 'filePath'];

    return (tsOnly ? scripts.filter(isTsScript) : scripts)
        .map(script => ({
            id: script.name,
            name: script.name,
            description: script.description,
            value: createValue(script),
            preview: addPreview ? () => highlightScript(script) : undefined
        }) satisfies ScriptChoice<ValueAs>);
}

export async function highlightScript(script: Script, language: string = 'ts'): Promise<string>
{
    const scriptContent = await readFile(script.filePath, 'utf-8');

    const markdown = `
\`\`\`${ language }

${ scriptContent }

\`\`\`
    `;

    return highlight(md(markdown, 'p-0 m-0 h-full w-full'), 'h-full w-full');
}