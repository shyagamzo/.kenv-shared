import { createTranscription } from './open-ai';

export async function getSpokenText(promptDescription: string)
{
    const audioStream = await mic({ description: promptDescription, format: 'mp3', onInput: console.log });

    let stream = Readable.from(audioStream);
    // https://github.com/openai/openai-node/issues/77#issuecomment-1463150451
    // @ts-expect-error
    stream.path = "speech.webm"

    // If you're confused by "createTranscription" params, see: https://github.com/openai/openai-node/issues/93#issuecomment-1471285341
    return createTranscription(stream as unknown as File);
}
