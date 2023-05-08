import { TsFilePath } from './types/paths.types';
import { isTsFilePath } from './utils';

export type ScriptDependencyGraph = Record<TsFilePath, TsFilePath[]>;

const DbName = '_update-scripts-dependency-graph';

export class ScriptDependencyGraphManager
{
    private static storage: ReturnType<typeof db<{ graph: ScriptDependencyGraph }>> extends Promise<infer T> ? T : never;
    private static graph: ScriptDependencyGraph;
    private static instance: ScriptDependencyGraphManager;

    public static async init(): Promise<ScriptDependencyGraphManager>
    {
        this.storage ??= await db(DbName, { graph: {} as ScriptDependencyGraph });
        this.graph ??= this.storage.graph;
        this.instance ??= new ScriptDependencyGraphManager();

        return this.instance;
    }

    public async getDependantScripts(libraryPath: TsFilePath): Promise<TsFilePath[]>
    {
        return ScriptDependencyGraphManager.graph[libraryPath] ?? [];
    }

    public async updateDependantScripts(libraryPath: TsFilePath, dependantScriptPaths: TsFilePath[], saveIt: boolean = true): Promise<ScriptDependencyGraph>
    {
        // Aggregate instead of overwriting the library's dependencies to make sure we don't lose any dependencies that were not discovered in the current run.
        const existingUnrelatedScriptPaths = (ScriptDependencyGraphManager.graph[libraryPath] ?? []).filter(path => !dependantScriptPaths.includes(path));
        
        ScriptDependencyGraphManager.graph[libraryPath] = [...new Set([...existingUnrelatedScriptPaths, ...dependantScriptPaths])];
        
        saveIt && ScriptDependencyGraphManager.storage.write();

        return ScriptDependencyGraphManager.graph;
    }

    public async rebuild(saveIt: boolean = true): Promise<ScriptDependencyGraph>
    {
        const scriptPaths = await getAllTsScripts();
        const graph = await createDependencyGraph(scriptPaths);

        ScriptDependencyGraphManager.graph = graph;
        ScriptDependencyGraphManager.storage.graph = graph;
        saveIt && ScriptDependencyGraphManager.storage.write();

        return graph;
    }

    public async partialRebuild(libOrScriptPath: TsFilePath, saveIt: boolean = true): Promise<ScriptDependencyGraph>
    {
        const isScriptPath = (/.*\.kenv[\/\\]scripts[\/\\].*\.ts$/g.test(libOrScriptPath))
            
        const scriptPaths = isScriptPath ? [libOrScriptPath] : await this.getDependantScripts(libOrScriptPath);
        const partialGraph = await createDependencyGraph(scriptPaths);

        await Promise.all(
            Object.entries(partialGraph)
                  .map(([libraryPath, dependantScriptPaths]) => this.updateDependantScripts(libraryPath as TsFilePath, dependantScriptPaths, false))
        );

        saveIt && this.save();

        return ScriptDependencyGraphManager.graph;
    }

    public async save(): Promise<void>
    {
        ScriptDependencyGraphManager.storage.write();
    }
}

export async function getAllTsScripts(): Promise<TsFilePath[]>
{
    const scripts = await readdir('./scripts');
    
    return scripts.filter(isTsFilePath)
                  .map(fileName => kenvPath('scripts', fileName) as TsFilePath);
}

export async function extractImportsFromFile(path: TsFilePath): Promise<TsFilePath[]>
{
    const scriptContent = await readFile(path, 'utf-8');

    const libImportRegex = /import.+from ['"]\.\.\/lib\/(?<dependency>.*)['"]/gm;
    const libs = [];

    let match: RegExpMatchArray | null;

    while ((match = libImportRegex.exec(scriptContent)) !== null)
    {
        // This is necessary to avoid infinite loops with zero-width matches
        if (match.index === libImportRegex.lastIndex)
            ++libImportRegex.lastIndex;
        
        libs.push(match.groups?.dependency);
    }

    return libs ?? [];
}

export function toLibFilePath(libImportExpression: string, relative: boolean = false): TsFilePath
{
    return relative
        ? `../lib/${ libImportExpression }.ts`
        : kenvPath('lib', `${ libImportExpression }.ts`) as TsFilePath;
}

export async function extractDependenciesRecursively(paths: TsFilePath | TsFilePath[], visited: Set<TsFilePath> = new Set()): Promise<TsFilePath[]>
{
    const dependencies: TsFilePath[] = [];

    paths = Array.isArray(paths) ? paths : [paths];

    for (const path of paths)
    {
        if (visited.has(path)) continue;
    
        visited.add(path);
    
        const discoveredImports = await extractImportsFromFile(path);
    
        if (!discoveredImports.length) continue;
    
        const guessedFilePaths = discoveredImports.map(dep => toLibFilePath(dep));
        const tsFiles = await filterNonExistingFiles(guessedFilePaths);
    
        const subDependencies = await extractDependenciesRecursively(tsFiles, visited);
        dependencies.push(...discoveredImports, ...subDependencies);
    }
  
    return dependencies;
}

export async function filterNonExistingFiles(libFilePaths: TsFilePath[]): Promise<TsFilePath[]>
{
    const existingFiles = [];

    for (const libFilePath of libFilePaths)
        await isFile(libFilePath) && existingFiles.push(libFilePath);

    return existingFiles;
}

export async function createDependencyGraph(scriptPaths: TsFilePath[]): Promise<ScriptDependencyGraph>
{
    const dependencyGraph: ScriptDependencyGraph = {};

    for (const scriptPath of scriptPaths)
    {
        const dependencies = await extractDependenciesRecursively(scriptPath);

        for (const dependency of dependencies)
            (dependencyGraph[toLibFilePath(dependency)] ??= []).push(scriptPath);
    }

    return dependencyGraph;
}