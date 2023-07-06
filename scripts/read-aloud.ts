// Name: Read Aloud
// Shortcut: ctrl shift r

import "@johnlindquist/kit"

let text = await getSelectedText();

log(`selected: ` + text);

if (!text.trim())
    text = await clipboard.readText();

log(`clipboard: ` + text);

if (!text.trim())
    text = await editor('Enter text to read:');

text = text.trim();

if (text)
    await say(text.trim());
else
    await say('Nothing to read');