import { PSM } from 'tesseract.js';

export async function recognizeText(imagePath: string, language: string)
{
    const { createWorker }: typeof import('tesseract.js') = await npm('tesseract.js');
    const worker = await createWorker();

    await worker.loadLanguage(language);
    await worker.initialize(language);
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });

    const { data } = await worker.recognize(imagePath);

    await worker.terminate();

    return data.text;
}