
const mappers = {
    string: {
        'text/plain': 'text',
        'text/html': 'html',
        'text/uri-list': 'uri',
        read: (item) => new Promise(item.getAsString.bind(item))
    },
    file: {
        'image': 'image',
        '': 'file',
        read: (item) => Promise.resolve(fileToJSON(item.getAsFile()))
    }
};

// Because we can't send a File object to the main process, we need to convert it to a JSON object.
// JSON.stringify didn't work as the properties are not enumerable.
// Had to use this trick.
function fileToJSON({ name, path, size, type, lastModified, lastModifiedDate, webkitRelativePath })
{
    return { name, path, size, type, lastModified, lastModifiedDate, webkitRelativePath };
}

document.addEventListener("drop", async (event) =>
{
    event.preventDefault();

    let { id = "" } = event.target.closest("*[id]");

    const { items } = event.dataTransfer;

    // Resolve all items into a big array of { category, info, mime }
    const data = await Promise.all(
        Array.from(items).map(async (item) =>
        {
            const mapper = mappers[item.kind]; // file or string
            const mime = item.type; // text/plain image/png etc
            const type = Object.keys(mapper).find(key => mime.startsWith(key));

            const category = mapper?.[type] ?? 'other';
            let info = await (mapper?.read ?? mappers.string.read)(item);

            if (category === 'other' && typeof info === 'string' && info.length && ['[', '{', '"'].includes(info[0]))
            {
                try { info = JSON.parse(info); }
                catch (e) { console.warn('Could not parse dropped item data to JSON. Keeping as string.', info); }
            }

            return { category, mime, info };
        }, [])
    );

    // Group by category
    const dataByType = data.reduce((acc, { category, info, mime }) =>
    {
        (acc[`${category}s`] ??= []).push({ info, mime });

        return acc;
    }, {});

    // Send items to main process on the `dataTransfer` property, which is different to the `dataset` property
    // produced by ScriptKit. This allows me to ignore Kit's drop messages quickly and use this one.
    ipcRenderer.send("WIDGET_DROP", {
        dataTransfer: dataByType,
        targetId: id,
        widgetId: window.widgetId,
    });
});