import '@johnlindquist/kit';

const speechStream = new (class SpeechQueue
{
    private textQueue: string[] = [];
    private isSpeaking: boolean = false;
    private feed: string = '';
    private finalizeFeedDebounced: () => void;

    constructor(private readonly config: { waitForDelimiter: number, estimatedWordsPerMinute: number })
    {
        this.finalizeFeedDebounced = _.debounce(this.finalizeFeed.bind(this), config.waitForDelimiter);

        onExit(() =>
        {
            this.textQueue = [];
            this.feed = '';

            sayIt('');
        });
    }

    public addText(text: string): void
    {
        this.feed += text;
        this.processAccumulatedText();
        this.finalizeFeedDebounced();
    }

    private processAccumulatedText(): void
    {
        const delimiters = /([.,;:!?\n])/;

        const delimiterMatch = this.feed.match(delimiters);

        if (delimiterMatch)
        {
            const delimiterIndex = delimiterMatch.index;

            const textUntilDelimiter = this.feed.slice(0, delimiterIndex + 1);
            this.textQueue.push(textUntilDelimiter.trim());

            this.feed = this.feed.slice(delimiterIndex + 1);
        }

        this.processQueue();
    }

    private finalizeFeed(): void
    {
        if (this.feed)
        {
            this.textQueue.push(this.feed.trim());
            this.feed = '';
            this.processQueue();
        }
    }

    private processQueue(): void
    {
        if (this.isSpeaking || this.textQueue.length === 0) return;

        this.isSpeaking = true;

        const textToSpeak = this.textQueue.shift();

        this.waitForSpeechEnd(textToSpeak);
        sayIt(textToSpeak);
    }

    private waitForSpeechEnd(text: string): void
    {
        const estimatedSpeechDuration = this.estimateSpeechDuration(text);

        setTimeout(() =>
        {
            this.isSpeaking = false;
            this.processQueue();
        }, estimatedSpeechDuration);
    }

    private estimateSpeechDuration(text: string): number
    {
        const wordsPerMinute = this.config.estimatedWordsPerMinute; // Average speaking rate
        const words = text.trim().split(/\s+/).length;
        const minutes = words / wordsPerMinute;

        return minutes * 60 * 1000; // Convert to milliseconds
    }
})({
    waitForDelimiter: 4000,
    estimatedWordsPerMinute: 185
});

export function sayIt(text: string): ReturnType<typeof say>
{
    return say(text, { name: 'Microsoft Zira - English (United States)', rate: 1.3 });
}

export function queueSpeech(text: string)
{
    speechStream.addText(text);
}