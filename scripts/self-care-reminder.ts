// Name: Self Care Reminder
// Description: This script will remind you to take a break from the computer every now and then.
// Schedule: 0,30 */2 * * *

import { getRandomItemFromArray } from '../lib/utils';

notify({
    title: "🥰 Self Care Reminder",
    message: getRandomItemFromArray((await db('well-being')).data.selfCareReminders)
});