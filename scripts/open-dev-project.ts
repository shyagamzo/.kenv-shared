// Name: Open Dev Project
// Description: Opens a project in VSCode
// Shortcut: ctrl shift .

import '@johnlindquist/kit';
import { Choice } from '@johnlindquist/kit';

const ignoredFolders = [
    'node_modules',
    'dist',
    'build',
    'out',
    'bin',
    '.angular',
    '.pnpm-store',
    '.git',
    '.vscode',
    '.idea',
    'tmp',
    'temp',
    'logs'
];

async function getProjects(parentDir: string): Promise<Choice<string>[]>
{
    const codeDir = ls(parentDir);
    const choices: Choice<string>[] = [];

    for (const dir of codeDir)
    {
        if (ignoredFolders.some(ignored => dir.includes(ignored))) continue;

        const fullPath = path.join(parentDir, dir);
        const packageJsonPath = path.join(fullPath, 'package.json');

        if (await isFile(packageJsonPath))
        {
            const packageJson = await readJson(packageJsonPath);

            choices.push({
                name: packageJson.name,
                value: fullPath,
                description: fullPath,
            });
        }
        else
        {
            choices.push(...(await getProjects(fullPath)));
        }
    }

    return choices;
}

const projectFolders = [
    `C:/Boxed/Projects`,
    `C:/Boxed/Desktop`
];

const choice = await arg('Which project?', () =>
    Promise.all(projectFolders.map(getProjects))
           .then(choices => choices.flat())
);

if (choice)
    exec(`code ${ choice }`)
