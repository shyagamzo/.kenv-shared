import { Choice, PromptConfig } from '@johnlindquist/kit/types/core';

type MultiSelectConfig = {
    styleSelected?: <T>(choice: Choice<T>) => string;
    styleUnselected?: <T>(choice: Choice<T>) => string;
};

export async function multiArg(
    ...[placeholderOrConfig, choicesOrPanel, multiConfig]: [...Parameters<typeof arg>, MultiSelectConfig?]
)
{
    const defaultHtml = (emoji: string, { name, description }: Choice) => /* html */`
        <div class="flex flex-row overflow-x-hidden items-center h-full">
            <span class="mr-2">${ emoji }</span>
            <div class="flex flex-col max-w-full overflow-x-hidden max-h-full">
                <div class="text-base truncate"><span>${ name }</span></div>
                ${ description ? `<div class="pb-1 truncate text-xs opacity-60"><span>${ description }</span></div>` : '' }
            </div>
        </div>
    `;

    const config = {
        styleSelected: (choice) => choice.html ? `✅ ${ choice.html }` : defaultHtml('✅', choice),
        styleUnselected: (choice) => choice.html ? `🔹 ${ choice.html }` : defaultHtml('🔹', choice),
        ...multiConfig
    } satisfies MultiSelectConfig;

    let selectedChoiceIds = new Set<string>();
    let selecting = true;

    if (!placeholderOrConfig)
        placeholderOrConfig = { placeholder: 'Select one or more items' };
    else if (typeof placeholderOrConfig === 'string')
        placeholderOrConfig = { placeholder: placeholderOrConfig };

    const patchedOptions = {
        ...placeholderOrConfig,
        // Change the description of the Enter key
        enter: 'Toggle Selection',
        // Add a shortcut to accept the current selection
        shortcuts: [
            ...(placeholderOrConfig.shortcuts ?? []),
            {
                key: 'ctrl+enter',
                name: 'Accept',
                bar: 'right',
                onPress()
                {
                    selecting = false;
                    submit('');
                }
            }
        ]
    } satisfies PromptConfig;

    async function produceChoices(): Promise<Choice<any>[]>
    {
        const choicesSource = choicesOrPanel ?? patchedOptions.choices;

        if (!choicesSource) return [];

        const rawChoices = await (typeof choicesSource === 'function' ? choicesSource('') : choicesSource);

        const stringToChoice = (choice: string): Choice => ({ id: choice, name: choice, value: choice });
        
        if (Array.isArray(rawChoices) && rawChoices.length > 0)
        {
            return typeof rawChoices[0] === 'string'
                ? (rawChoices as string[]).map(stringToChoice)
                : rawChoices as Choice[];
        }

        return rawChoices ? [stringToChoice(rawChoices as string)] : [];
    }

    const allChoices = await produceChoices();

    const choiceId = (choice: Choice) => choice.id ?? choice.name;

    const choicesById = new Map(
        allChoices.map(choice => [choiceId(choice), choice])
    );

    async function filterAndPatchChoices(input: string): Promise<Choice<any>[]>
    {
        const loweredInput = input.toLowerCase();

        const hasInput = (choice: Choice) => choice.name.toLowerCase().includes(loweredInput) || choice.description?.includes(loweredInput);

        const filteredChoices = allChoices.filter(hasInput);

        return filteredChoices.map((choice) =>
        {
            return {
                ...choice,
                html: selectedChoiceIds.has(choiceId(choice))
                    ? config.styleSelected(choice)
                    : config.styleUnselected(choice),
            };
        });
    }

    while (selecting)
    {
        const choiceValue = await arg(patchedOptions, filterAndPatchChoices);

        if (!choiceValue) continue;
        // Set the preselected value to the last choice, so the next arg call would stay focused on it
        patchedOptions.defaultValue = choiceValue;

        const id = choiceId(allChoices.find(choice => _.isEqual(choice.value, choiceValue)));
        selectedChoiceIds.has(id) ? selectedChoiceIds.delete(id) : selectedChoiceIds.add(id);
    }

    const selectedValues = [...selectedChoiceIds.values()].map(id => choicesById.get(id)).map(choice => choice.value);

    return selectedValues;
}