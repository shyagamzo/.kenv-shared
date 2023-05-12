// Preview: docs
// Name: Self Care Assistant
// Description: This script will remind you to take a break from the computer every now and then.
// Author: Shy Agam
// Twitter: @shyagam
// GitHub: https://github.com/BeSpunky
// Schedule: 0,30 */2 * * *

import '@johnlindquist/kit';
import { getRandomItemFromArray } from '../lib/utils';
import { ChatCompletionState, createChatCompletionStream } from '../lib/open-ai';
import { codeblock } from '../lib/ui';

const storage = await db({ selfCareReminders: [] });

(async () => {
    await ensurePhrasesExist();

    notify({
        title: "🥰 Self Care Reminder",
        message: getRandomItemFromArray(storage.selfCareReminders)
    });
})();

async function ensurePhrasesExist(): Promise<void>
{
    if (storage.selfCareReminders?.length) return;

    await ensureUserWantsToGeneratePhrases();

    const displayProgress = ({ fullText }: ChatCompletionState) =>
    {
        div(md(`
# Generating motivational phrases...
${ codeblock(fullText) }
        `));
    };

    setFooter('💖 Generating motivational phrases. Please wait...');
    displayProgress({ fullText: '', currentPart: '' });
    setRunning(true);

    const parseAndStorePhrases = async (fullText: string) =>
    {
        storage.selfCareReminders = JSON.parse(fullText).selfCareReminders;

        await storage.write();
        
        setRunning(false);
        setFooter(`🥰 All set! Generated ${ storage.selfCareReminders.length } phrases.`);
        setEnter('Close');
    };

    const phrasesToProduce = 40;
    
    await createChatCompletionStream({
        prompt: `Generate ${ phrasesToProduce} different phrases which can motivate me to reflect on my physical situation during my work time,
        so I can take a moment to focus on myself and see if I need a break, to stretch, or a glass of water.
        Make the phrases unintrusive, polite, suggestive and friendly.
        Here are a couple of examples:
        "How are you feeling right now?"
        "What does your body tell you?"
        
        Respond in the following plain JSON format: { selfCareReminders: [...the phrases] }.
        Use 2 spaces for indentation.
        Only respond with the JSON. Nothing else.
        `
    }, { next: displayProgress, complete: parseAndStorePhrases });
}

async function ensureUserWantsToGeneratePhrases()
{
    const markdown = `
# 👋🥰 Hi there,

I'm your self-care assistant.  
In order to do my job, I need to configure myself.

**I'll have to access OpenAI for a second...**  
**Would you like to do that now?**
`;

    const shouldGenerate = await div({
        html: md(markdown),
        enter: 'Yes Please!',
        shortcuts: [
            { key: 'N', name: 'Not right now', bar: 'right', onPress() { submit('N'); } },
        ]
    });

    if (shouldGenerate === 'N') exit();
}
