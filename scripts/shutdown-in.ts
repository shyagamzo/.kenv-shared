// Name: Shutdown In
// Description: Shutdown your computer in X minutes

import '@johnlindquist/kit';

const minutes = await arg({
    placeholder: 'Delay in minutes',
    type: 'number'
});

if (!minutes)
{
    notify('No delay specified');
    exit();
}

exec(`shutdown /s /t ${ parseInt(minutes) * 60 }`);