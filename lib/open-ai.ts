import '@johnlindquist/kit';

import { Configuration, CreateChatCompletionRequest, OpenAIApi } from 'openai';
import { Observer } from 'rxjs';

export async function initOpenAI(): Promise<OpenAIApi>
{
    const apiKey = await env("OPENAI_API_KEY", {
        hint: `Grab a key from <a href="https://platform.openai.com/account/api-keys">here</a>`,
    });

    const configuration = new Configuration({ apiKey });
    const openai = new OpenAIApi(configuration);

    return openai;
}

export interface ChatCompletionParams
{
    prompt: string;
    systemPrompt?: string;
}

export interface ChatCompletionState
{
    currentPart: string;
    fullText: string;
}

type CompletionObserver = Partial<Omit<Observer<ChatCompletionState>, 'complete'>> & { complete: (fullText: string) => void };

export async function createChatCompletionStream(params: ChatCompletionParams, { next, error, complete }: CompletionObserver): Promise<void>
{
    const openAI = await initOpenAI();

    const messages: CreateChatCompletionRequest['messages'] = [{ role: 'user', content: params.prompt }];

    if (params.systemPrompt)
        messages.unshift({ role: 'system', content: params.systemPrompt });

    try
    {
        const { data, request } = await openAI.createChatCompletion({
            messages,
            model: 'gpt-3.5-turbo',
            max_tokens: 1000,
            n: 1,
            stream: true,
        }, { responseType: 'stream' });

        const dataStreamer = data as any;

        let fullContent = '';

        // If the user presses escape or closes the app, abort the request
        // This avoids the request to continue running in the background or a ui that keeps popping up
        onExit(() => request.abort());

        dataStreamer.on('data', async data =>
        {
            const lines = data.toString().split('\n').filter(line => line.trim() !== '');

            for (const line of lines)
            {
                const message = line.replace(/^data: /, '');

                if (message === '[DONE]') return;

                try
                {
                    const parsedResponse = JSON.parse(message);
                    const content = parsedResponse.choices[0].delta['content'];

                    content && next({ currentPart: content, fullText: fullContent += content });
                } catch (err)
                {
                    console.log('Could not JSON parse stream message', message, err);
                    const errorDetails = new Error('Could not JSON parse OpenAI stream message');

                    errorDetails['textualResponse'] = message;
                    errorDetails['originalError'] = err;

                    error(errorDetails);
                }
            }
        });

        dataStreamer.on('end', () => complete(fullContent));
    }
    catch (err)
    {
        const errorDetails = new Error('OpenAI stream failed.');

        errorDetails['originalError'] = err;

        error(errorDetails);
    }
}

export async function createTranscription(audioFile: File): Promise<string>
{
    const openAI = await initOpenAI();

    const { data } = await openAI.createTranscription(audioFile, 'whisper-1', 'Format your response as markdown');

    return data.text;
}