// Name: Self Care Reminder
// Description: This script will remind you to take a break from the computer every now and then.
// Author: Shy Agam
// Twitter: @shyagam
// GitHub: https://github.com/BeSpunky
// Schedule: 0,30 */2 * * *

import '@johnlindquist/kit';
import { getRandomItemFromArray } from '../lib/utils';
import { createChatCompletionStream } from '../lib/open-ai';

const storage = await db();

if (!storage.selfCareReminders?.length)
{
    let jsonString = '';

    const aggregateJsonParts = (text: string) => jsonString += text;
    const parseAndStorePhrases = async () => {
        storage.selfCareReminders = JSON.parse(jsonString);

        await storage.write();
    };

    const phrasesToProduce = 50;
    
    await createChatCompletionStream({
        systemPrompt: `Act as a kind, friendly, empathic yet assertive assistant who wants to remind me to take care of my
        body when I work. She will tell me things that will help me put focus on my current state so I can
        improve my posture, take a break, notice if I'm stressed etc.
        Her words are motivational and light. They don't push or force anything. They are more like suggestions
        to take a moment and be concious.`,

        prompt: `Generate ${phrasesToProduce} motivational phrases to help me take a moment and be concious.
        Respond in the following plain JSON format: { selfCareReminders: ['phrase 1', 'phrase 2', ...., 'phrase 10'] }.
        Only respond with the JSON. Nothing else.
        `
    }, {next: aggregateJsonParts, complete: parseAndStorePhrases });
}

notify({
    title: "🥰 Self Care Reminder",
    message: getRandomItemFromArray(storage.selfCareReminders)
});
