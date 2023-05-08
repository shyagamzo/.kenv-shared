// Name: Screen OCR
// Description: Capture a screenshot and recognize the text using tesseract.js

import '@johnlindquist/kit';
import { captureScreenshotToFile, enumarateDisplays } from '../lib/os';
import { recognizeText } from '../lib/image-processing';

const display = await arg('Select a display:', (await enumarateDisplays()).map(({ id, name }) => ({ name, value: id })));

const tempFile = kenvPath(`/tmp/screenshot-${ Date.now() }.png`);

await captureScreenshotToFile({ screen: display, filename: tempFile, format: 'png' });

const languages = [
    { name: 'Spanish', value: 'spa' },
    { name: 'English', value: 'eng' }
];

// if ctrl is pressed, show a modal to select a language
const selectedLanguage = flag.ctrl
    ? await arg('Select a language:', languages)
    : 'eng';

// Hide the Kit modal before capturing the screenshot
await hide();

notify(`🧐 Recognizing text on screen. Please wait...`);

const text = await recognizeText(tempFile, selectedLanguage);

if (text)
{
    await clipboard.writeText(text.trim());

    inspect(text);

    notify({
        title: '✨ OCR Completed',
        message: 'Text recognized and copied to clipboard'
    });
}
else
{
    notify('No text found in the screenshot');
}

// Clean up temporary file
await remove(tempFile);
