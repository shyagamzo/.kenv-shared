import '@johnlindquist/kit';

import { Configuration, CreateChatCompletionRequest, CreateChatCompletionResponse, OpenAIApi } from 'openai';
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
    stream?: false;
}

export interface ChatCompletionState
{
    currentPart: string;
    fullText: string;
}

type CompletionObserver = Partial<Omit<Observer<ChatCompletionState>, 'complete'>> & { complete?: (fullText: string) => void };

function shouldStreamCompletion(params: ChatCompletionParams): boolean
{
    return params.stream === undefined;
}

function createCompletionRequestConfig(params: ChatCompletionParams): CreateChatCompletionRequest
{
    const messages: CreateChatCompletionRequest['messages'] = [{ role: 'user', content: params.prompt }];

    if (params.systemPrompt)
        messages.unshift({ role: 'system', content: params.systemPrompt });
    
    return {
        messages,
        model: 'gpt-3.5-turbo',
        n: 1,
        ...(shouldStreamCompletion(params) ? { stream: true } : {}),
    };
}

function createCompletionRequestOptions(params: ChatCompletionParams): { responseType: 'stream' } | undefined
{
    return shouldStreamCompletion(params) ? { responseType: 'stream' } : undefined;
}

function extractCompletionRequestData(params: ChatCompletionParams, data: CreateChatCompletionResponse, observer: CompletionObserver): Promise<string>
{
    if (!shouldStreamCompletion(params))
    {
        const content = data.choices[0].message?.content ?? '';
        
        observer.next?.({ currentPart: content, fullText: content });
        observer.complete?.(content);

        return Promise.resolve(content);
    }

    return new Promise((resolve, reject) =>
    {
        const dataStreamer = data as any;

        let fullText = '';

        debugger;
        dataStreamer.on('data', async (data: { toString: () => string; }) =>
        {
            debugger;
            const lines = data.toString().split('\n').filter(line => line.trim() !== '');

            for (const line of lines)
            {
                const message = line.replace(/^data: /, '');

                if (message === '[DONE]') return;

                try
                {
                    const parsedResponse = JSON.parse(message);
                    const content = parsedResponse.choices[0].delta['content'];

                    fullText += content ?? '';

                    content && observer.next?.({ currentPart: content, fullText });
                } catch (err)
                {
                    reportError(err, 'Could not JSON parse OpenAI stream message');
                }
            }
        });

        dataStreamer.on('end', () =>
        {
            observer.complete?.(fullText);
            resolve(fullText);
        });

        dataStreamer.on('error', reportError);

        
        function reportError(err: unknown, message?: string)
        {
            const errorDetails = new Error(message ?? 'OpenAI stream failed.');

            (errorDetails as any)['originalError'] = err;

            observer.error?.(errorDetails);
            reject(errorDetails);
        }
    });
}

export async function createChatCompletionStream(params: ChatCompletionParams, observer?: CompletionObserver): Promise<string>
{
    const openAI = await initOpenAI();
    const { data, request } = await openAI.createChatCompletion(
        createCompletionRequestConfig(params),
        createCompletionRequestOptions(params)
    );

    // If the user presses escape or closes the app, abort the request
    // This avoids the request to continue running in the background or a ui that keeps popping up
    onExit(() => request.abort());
    
    return extractCompletionRequestData(params, data, observer ?? {});
}

export async function createTranscription(audioFile: File): Promise<string>
{
    const openAI = await initOpenAI();

    const { data } = await openAI.createTranscription(audioFile, 'whisper-1', 'Format your response as markdown');

    return data.text;
}