import playwright from 'playwright';
import * as Cheerio from 'cheerio';
import path from 'node:path';
import fs from 'fs';

(async () => {
    const browser = await playwright.chromium.launch({
        executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", headless: false
    });
    const context = await browser.newContext({
        storageState: './user.json'
    });
    const page = await context.newPage();
    await page.goto('https://accounts.airlinesim.aero/auth/login');
    await page.waitForLoadState('networkidle');
    await page.goto('https://free2.airlinesim.aero/');
    await page.waitForLoadState('networkidle');
    await page.goto('https://free2.airlinesim.aero/app/aircraft/manufacturers?1');
    await page.waitForLoadState('networkidle');
    
    let html = await page.content();
    const currentUrl = new URL(page.url());
    const families = await getAirplaneFamilies(currentUrl, html);

    const allModels: Record<string, Record<string, Record<string, string>>> = {}; 

    for (const [familyName, id] of Object.entries(families)) {
        await page.goto(`https://free2.airlinesim.aero/action/enterprise/aircraftsFamily?id=${id}`);
        html = await page.content();
        const models = await getAirplaneModels(currentUrl, html);
        allModels[familyName] = {}; 
     
        for (const [modelName, modelId] of Object.entries(models)) {
            await page.goto(`https://free2.airlinesim.aero/action/enterprise/aircraftsType?id=${modelId}`);
            const modelHtml = await page.content();
            const modelData = await scrapeModelData(currentUrl, modelHtml);
            
            allModels[familyName][modelName] = modelData;
        }
    }

    console.log('Families: ', families);
    console.log('Models: ', allModels);

    const airplanesData = {
        families,
        models: allModels
    };

    fs.writeFileSync(path.join(__dirname, 'airplanes.json'), JSON.stringify(airplanesData, null, 2), 'utf-8');
    console.log('Data saved to airplanes.json');

    await context.storageState({
        path: './user.json'
    });
})();

async function getAirplaneFamilies(currentUrl: URL, html: string): Promise<Record<string, number>> {
    const families: Record<string, number> = {};
    const $ = Cheerio.load(html);
    const links = $('a.type-link[href]');
    links.each((_, e) => {
        const href = e.attribs['href'];
        const hrefResult = path.join(currentUrl.pathname, href);
        const hrefURL = new URL(hrefResult.replaceAll('\\', '/'), currentUrl);
        families[$(e).text()] = parseInt(hrefURL.searchParams.get('id') || '', 10);
    });
    return families;
}

async function getAirplaneModels(currentUrl: URL, html: string): Promise<Record<string, number>> {
    const models: Record<string, number> = {};
    const $ = Cheerio.load(html);
    const links = $('table tbody tr td:first-child a');
    links.each((_, e) => {
        const href = e.attribs['href'];
        const hrefURL = new URL(href, currentUrl);
        models[$(e).text().trim()] = parseInt(hrefURL.searchParams.get('id') || '', 10);
    });
    return models;
}

async function scrapeModelData(currentUrl: URL, html: string): Promise<Record<string, string>> {
    const data: Record<string, string> = {};
    const $ = Cheerio.load(html);

    $('table.table-hover tbody tr').each((_, row) => {
        const label = $(row).find('td:first-child').text().trim();
        const value = $(row).find('td.text-right').text().trim();

        switch (label) {
            case 'MTOW':
                data['MTOW'] = value;
                break;
            case 'Range':
                data['Range'] = value;
                break;
            case 'Speed':
                data['Speed'] = value;
                break;
            case 'Ground roll takeoff':
                data['Ground roll takeoff'] = value;
                break;
            case 'Ground roll landing':
                data['Ground roll landing'] = value;
                break;
            default:
                break;
        }
    });

    return data;
}
