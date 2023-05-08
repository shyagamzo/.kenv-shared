// Name: Find Script Dependencies
// Description: Recursively finds all lib files that are imported by a script.
// Author: Shy Agam
// Twitter: @shyagam
// GitHub: https://github.com/BeSpunky

import "@johnlindquist/kit"
import { extractDependenciesRecursively, toLibFilePath } from '../lib/dependency-graph';
import { scriptChoices } from '../lib/utils';
import { TsFilePath } from '../lib/types/paths.types';

const scriptPath = await arg({
    placeholder: `Choose a script...`,
    height: 600,
    hint: 'Only .ts files are supported'
}, () => scriptChoices({ valueAs: 'filePath' })) as TsFilePath;

const dependencies = await extractDependenciesRecursively(scriptPath);

inspect(dependencies.map((dep) => toLibFilePath(dep)));