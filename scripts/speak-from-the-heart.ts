// Name: Speak from the heart
// Shortcut: ctrl+shift+alt+e

import "@johnlindquist/kit"
import { ChatCompletionState, createChatCompletionStream } from '../lib/open-ai';
import { showOrUpdateCompletionDiv } from '../lib/open-ai-ui';
import { getSpokenText } from '../lib/microphone';
import { sayIt } from '../lib/speech';
import { getRandomItemFromArray } from '../lib/utils';

const { data } = await db('prompts', true);

const askForInput = data.askForInput as string[];
const promptForInput = getRandomItemFromArray(askForInput);

await sayIt(promptForInput);

toast(promptForInput);

const spokenText = await getSpokenText(promptForInput);

// Compensate for a period at the end of the spoken text and remove it, so it can match the abort keywords
const request = spokenText.replace(/[.]$/, '')
// Compensate for the recording of the prompt and remove it from the spoken text
// This won't work if the recording started after the prompt has started, but It's good enough for now.
                          .replace(promptForInput, '').trim();

if (request === '')
{
    await sayIt(`I couldn't understand what you were saying...`);
    exit();
}

if (['cancel', 'abort', 'stop', 'dismiss'].includes(request.toLowerCase()))
    exit();

const files = await readdir(kenvPath('scripts'), { withFileTypes: false });

let continueToChatCompletion = true;

for (const file of files)
{
    if (file.replace('-', ' ').toLowerCase().startsWith((request.toLowerCase())))
    {
        await run(kenvPath('scripts', file));

        continueToChatCompletion = false;

        break;
    }
}

if (continueToChatCompletion)
{
    let response = '';

    const handleResponse = async ({ fullText }: ChatCompletionState): ReturnType<typeof showOrUpdateCompletionDiv> =>
    {
        response = fullText;

        const markdown = `
# ${ request }

${ response }
        `;
    
        return await showOrUpdateCompletionDiv(markdown);
    };

    await createChatCompletionStream({ prompt: request }, {
        next: handleResponse,
        error: log,
        complete: () => sayIt(response),
    });
}