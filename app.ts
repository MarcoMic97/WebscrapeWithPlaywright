
import playwright from 'playwright';
import * as Cheerio from 'cheerio';
import path from 'node:path';
import { get } from 'node:http';

(async()=>{
    const browser = await playwright.chromium.launch({
        executablePath:"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", headless:false
    });
    const context = await browser.newContext({
        storageState:'./user.json'
    });
    const page = await context.newPage();
    await page.goto('https://accounts.airlinesim.aero/auth/login');
    await page.waitForLoadState('networkidle');
    await page.goto('https://free2.airlinesim.aero/');
    await page.waitForLoadState('networkidle');
    await page.goto('https://free2.airlinesim.aero/app/aircraft/manufacturers?1');
    await page.waitForLoadState('networkidle');
    var html = await page.content();
    const currentUrl = new URL(page.url())
    const families = await getAirplaneFamilies(currentUrl, html);
    await page.goto('https://free2.airlinesim.aero/action/enterprise/aircraftsFamily?id=2200400');
    await page.waitForLoadState('networkidle');
    var html = await page.content();
    const models = await getAirplaneModels(currentUrl, html);



    console.log('Families: ', families,'\n', 'Models: ', models);

    page.on('close', ()=>{
        context.storageState({
            path:'./user.json'
        })
    })

})();
async function getAirplaneFamilies(currentUrl:URL, html:string): Promise<Record<string, number>> {
    const families:Record<string, number> = {};
    const $ = Cheerio.load(html);
    const links = $('a.type-link[href]');
    links.each((_ , e)=>{
        const href = e.attribs['href']
        const hrefResult = path.join(currentUrl.pathname, href);
        const hrefURL = new URL(hrefResult.replaceAll('\\', '/'), currentUrl);
        families[$(e).text()] = parseInt(hrefURL.searchParams.get('id'), 10);
    });
    return families;
}

// Extract airplane models
async function getAirplaneModels(currentUrl: URL, html: string): Promise<Record<string, number>> {
    const models: Record<string, number> = {};
    const $ = Cheerio.load(html);
    const links = $('table tbody tr td:first-child a'); // Correct selector for model links
    links.each((_, e) => {
        const href = e.attribs['href'];
        const hrefURL = new URL(href, currentUrl); // Simplified URL resolution
        models[$(e).text().trim()] = parseInt(hrefURL.searchParams.get('id') || '', 10);
    });
    return models;
}

