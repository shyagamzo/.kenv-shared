
export function codeblock(code: string, language = ''): string
{
    return `\`\`\`${ language }\n${ code }\n\`\`\``;
}
