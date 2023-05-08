// Name: Teach me
// Description: Use OpenAI to teach you about a subject

import "@johnlindquist/kit"

import { ChatCompletionState, createChatCompletionStream } from '../lib/open-ai';
import { queueSpeech, sayIt } from '../lib/speech';
import { showOrUpdateCompletionDiv } from '../lib/open-ai-ui';
import { randomId } from '../lib/utils';

interface Lesson
{
    id: number;
    subject: string;
    focus: string;
    markdown: string;
    date: Date;
}

const openHistory = () => db('lessons', [], true);

const history = await openHistory();
const choices = createChoicesFromHistory();

const prevLessonOrSubject = await arg({
    placeholder: 'About...?',
    hint: 'Select a previous lesson or type a new subject',
    strict: false, // Allow user to type a new subject
    choices,
    shortcuts: [
        {
            name: 'Delete',
            key: 'shift+d',
            bar: 'right',
            async onPress(input, state)
            {
                const index = history.data.items.findIndex(({ id }: Lesson) => id === state.focused.value.id);

                if (index > -1)
                {
                    history.data.items.splice(index, 1);

                    await history.write();

                    choices.splice(index, 1);

                    setChoices(choices);
                }
            }
        }
    ],
}) as Lesson | string;

typeof prevLessonOrSubject === 'object' ?
    teachPreviousLesson(prevLessonOrSubject) :
    await teachNewLesson(prevLessonOrSubject);

function createChoicesFromHistory()
{
    return history.data.items.map((lesson: Lesson) => ({
        name: `${ lesson.subject } (${ lesson.focus })`,
        value: lesson,
    }));
}

function teachPreviousLesson(lesson: Lesson)
{
    showLesson(lesson);
    readLesson(lesson);
}

async function teachNewLesson(subject: string)
{
    const focus = await arg({ placeholder: 'Focus on?', strict: false }, [
        { name: '[1] The Basics', value: 'basics' },
        { name: '[2] Concepts', value: 'concepts' },
        { name: '[3] Implementation', value: 'implementation' },
        { name: '[4] Anything', value: 'anything' },
    ]);
    const lesson: Lesson = { id: randomId(), subject, focus, markdown: '', date: new Date() };

    const prompt = `
        Teach me ${ subject }.
        Focus on ${ focus }.
        Format your entire response as Markdown.
    `;

    const appendLessonText = ({ currentPart, fullText }: ChatCompletionState): void =>
    {
        lesson.markdown = fullText;

        showLesson(lesson);

        queueSpeech(currentPart);
    };

    const handleError: (err: any) => void = async (err) =>
    {
        notify({
            icon: '🥲',
            message: `Something went wrong:\n${ err.message }`,
            title: 'OpenAI Error'
        });
    };

    const finalizeLesson = async () =>
    {
        history.data.items.push(lesson);

        await history.write();
    };

    await createChatCompletionStream({
        prompt,
        systemPrompt: `You are an software development wizard who teaches complex subjects in simple ways.`
    },
        {
            next: appendLessonText,
            error: handleError,
            complete: finalizeLesson
        }
    );
}

async function showLesson({ subject, focus, markdown }: Lesson): ReturnType<typeof div>
{
    const fullMarkdown = `
# Teach me about ${ subject }, focusing on ${ focus }

${ markdown }
    `;

    return showOrUpdateCompletionDiv(fullMarkdown)
}

function readLesson(lesson: Lesson): ReturnType<typeof say>
{
    return sayIt(lesson.markdown);
}