// Name: Fast Drop
// Description: A drop zone that allows you to quickly pipe files to a script or collect them in a basket.
// Author: Shy Agam
// Twitter: @shyagam

import '@johnlindquist/kit';
import { WidgetAPI, WidgetOptions } from '@johnlindquist/kit/types/pro';

import type { CategorizedDropItems } from '../lib/types/widget.type';

import { BasketState, DropBasket } from '../lib/drop-zone/drop-basket';
import { dropHandler } from '../lib/drop-zone/drop-utils';
import { patchDroppableWidgetHtml } from '../lib/widgets/patch-widget-html';

const dropZoneHTML = await patchDroppableWidgetHtml('./lib/drop-zone/drop-zone.html');

const screens = await getScreens();
const screen = screens.at(-1);

const width = 300;
const height = 500;
const xMargin = 25;
const yMargin = xMargin + 50; // Same distance as xMargin, but with a little extra for the Windows taskbar
const x = (screen?.size.width ?? width) - width - xMargin;
const y = (screen?.size.height ?? height) - height - yMargin;

const baskets = new Map<string, DropBasket>();

const dropZoneSetup: WidgetOptions = {
    alwaysOnTop: true,
    x, y,
    width, height,
    roundedCorners: true,
    draggable: true,
    containerClass: 'h-full p-7'
};

const dropZone = await widget(dropZoneHTML, dropZoneSetup);

dropZone.onDrop(dropHandler(async (data, targetId) =>
{
    if (targetId === 'pipe')
    {
        await pipeItems(data);   
    }
    else if (targetId === 'collect')
    {
        await createBasket(data);
    }
}));

dropZone.onClick(async ({ targetId }) =>
{
    if (targetId === 'clear') clearAll();
});

onExit(() =>
{
    dropZone.close();

    clearAll();
});

async function pipeItems(items: CategorizedDropItems)
{
    const scripts = await getScripts(true);

    const script = await arg('Where do you want to pipe the files to?', scripts.map(({ name, description, command }) => ({
        name,
        description,
        value: command
    })));

    await run(script, JSON.stringify(items));
}

async function createBasket(data: CategorizedDropItems): Promise<DropBasket>
{
    const widget = await createDropBasketWidget();
    const basket = new DropBasket(widget, data);
        
    baskets.set(basket.id, basket);
    basket.widget.onClose(() => baskets.delete(basket.id));

    positionNewBasket(basket);

    return basket;
}

let basketHtml: string | null = null;

async function createDropBasketWidget(initialState?: CategorizedDropItems): Promise<WidgetAPI>
{
    if (!basketHtml) basketHtml = await patchDroppableWidgetHtml('./lib/drop-zone/drop-basket.html');
    
    const basketSetup: WidgetOptions = {
        alwaysOnTop: true,
        width,
        roundedCorners: true,
        draggable: true,
        frame: true,
        containerClass: 'h-full p-7 overflow-auto',
        state: { content: initialState ?? {} } satisfies BasketState
    };

    return widget(basketHtml, basketSetup);
}

function clearAll(): void
{
    baskets.forEach(basket => basket.destroy());
    baskets.clear();
}

function positionNewBasket(basket: DropBasket): void
{
    if (!screen) return;

    const basketsPerRow = Math.floor(screen.size.width / (width + xMargin));
    const index = Array.from(baskets.values()).indexOf(basket);
    const column = index % basketsPerRow + 1;
    const row = Math.floor(index / basketsPerRow);
    const x = screen.size.width - column * (width + xMargin);
    const y = yMargin + (height + 20) * row;

    basket.widget.setPosition(x, y);
}