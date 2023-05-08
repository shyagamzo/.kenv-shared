// Name: Gist It
// Description: Creates a gist of the selected scripts and their lib dependencies.
// Author: Shy Agam
// Twitter: @shyagam
// GitHub: https://github.com/BeSpunky

import '@johnlindquist/kit';
import { extractDependenciesRecursively, toLibFilePath } from '../lib/dependency-graph';
import { scriptChoices } from '../lib/utils';
import { TsFilePath } from '../lib/types/paths.types';
import { pulseGlow, fadeIn, bounce } from '../lib/ux';
import { multiArg } from '../lib/ui';

type GistFilesRecord = Record<string, { content: string }>;

// ***** Main *****
(async function()
{
    const selectedScripts = await multiArg({
        placeholder: `Choose scripts...`,
        hint: 'Only .ts files are supported',
        height: 600,
    }, () => scriptChoices({ valueAs: s => s }));

    let files: GistFilesRecord = {};
    const visitedDependencies = new Set<TsFilePath>();

    for (const { filePath, command, name } of selectedScripts) {
        ui(workingMd(`Gathering dependencies for '${ name }'...`), true);

        // Adding '_\\' at the beginning to make the script file show at the top of the Gist
        const scriptName = `_\\${ command }.ts`;

        Object.assign(files, await produceGistFileRecord(scriptName, filePath as TsFilePath));
        Object.assign(files, await produceGistFileRecordsForDependencies(filePath as TsFilePath, visitedDependencies));
    }

    ui(workingMd(`Creating gist... 🔨`));

    const url = await createGist("Selected Scripts", files);

    await copy(url);

    ui(doneMd(url), false);
})();

// ***** Helpers *****
async function produceGistFileRecord(scriptName: string, scriptPath: TsFilePath): Promise<GistFilesRecord>
{
    return ({ [scriptName]: { content: await readFile(scriptPath, 'utf-8') } });
}

async function produceGistFileRecordsForDependencies(scriptPath: TsFilePath, visitedDependencies: Set<TsFilePath>): Promise<GistFilesRecord>
{
    const dependencies = await extractDependenciesRecursively(scriptPath, visitedDependencies);

    const files = {};

    for (const dependency of dependencies)
    {
        if (visitedDependencies.has(dependency)) continue;

        visitedDependencies.add(dependency);

        // Gists show in alphabetical order. After trial and error, I found that the best way to give lib files less precedence
        // is to replace '../' with '__/', then give the main script name a prefix of '_\\' (see above).
        // GitHub doesn't allow slashes in file names, so we replace them with backslashes.
        const libFilePath = toLibFilePath(dependency);
        const libFileName = toLibFilePath(dependency, true).replace('../', '__/').replaceAll('/', '\\');

        Object.assign(files, await produceGistFileRecord(libFileName, libFilePath));
    }

    return files;
}

// Gist creation based on Gregor Martynus's script: https://github.com/johnlindquist/kit/discussions/266
async function createGist(description: string, files: GistFilesRecord): Promise<string>
{
    const { Octokit } = await import('scriptkit-octokit');

    const octokit = new Octokit({ auth: { scopes: ["gist"] } });

    try
    {
        const { data } = await octokit.rest.gists.create({
            description: `ScriptKit Script: ${ description }`,
            public: true,
            files
        });

        return data.html_url;
    }
    catch (e) { inspect(e); }
}

// ******* UI ********
function workingMd(text: string)
{
    return `
<h1>🧑‍🍳 Cooking Gist...</h1>

<br/>

${ pulseGlow(text) }
`;
}

function doneMd(url: string)
{
    return `
${fadeIn('<h1>✨ Gist created successfully! 🥳</h1>')}

<br/>

The url is in your clipboard. 📋

<br/>

[Click here to open your Gist](${ url }).

${ bounce('☝️')}
`;
}

function ui(markdown: string, loading?: boolean): void
{
    if (loading !== undefined)
        setRunning(loading);

    div({
        html: md(markdown, 'text-lg'),
        footer: '✨ Gist It',
    }, 'flex items-center justify-center h-full text-center');
}
