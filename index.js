const puppeteer = require('puppeteer');
var yargs = require('yargs');
const delay = require('delay');
const fs = require('fs');
const path = require('path');

let argv = yargs(process.argv.slice(2))
    .detectLocale(false)
    .usage('$0 [options] <url>', 'Take a screenshot of a webpage', (yargs) => {
        yargs
            .option('width', {
                description: 'Viewport width',
                type: 'number',
                demandOption: false,
                default: 1920,
            })
            .option('height', {
                description: 'Viewport height',
                type: 'number',
                demandOption: false,
                default: 1080,
            })
            .option('outputDir', {
                description: 'Output directory, defaults to current directory',
                type: 'string',
                demandOption: false,
                default: '.',
            })
            .option('filename', {
                description: 'Filename of the produced screenshot',
                type: 'string',
                demandOption: false,
                default: 'screenshot',
            })
            .option('inputDir', {
                description: 'Input directory, defaults to current directory',
                type: 'string',
                demandOption: false,
                default: '.',
            })
            .option('userAgent', {
                description: 'User agent',
                type: 'string',
                demandOption: false,
                default: '',
            })
            .option('cookies', {
                description: 'Cookies in json format as string',
                type: 'string',
                demandOption: false,
                default: '',
            })
            .option('cookiesFile', {
                description: 'Path of the file containing the cookies',
                type: 'string',
                demandOption: false,
                default: '',
            })
            .option('headers', {
                description: 'Headers in json format as string',
                type: 'string',
                demandOption: false,
                default: '',
            })
            .option('headersFile', {
                description: 'Path of the file containing the headers',
                type: 'string',
                demandOption: false,
                default: '',
            })
            .option('delay', {
                description: 'Delay before taking the screenshot in ms',
                type: 'number',
                demandOption: false,
                default: 0,
            })
            .option('timeout', {
                description: 'Timeout for the page to be loaded in ms',
                type: 'number',
                demandOption: false,
                default: 30000,
            })
            .option('waitUntil', {
                description: 'When to declare the page load complete. See https://pptr.dev/api/puppeteer.page.goto for details.',
                type: 'string',
                choices: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
                demandOption: false,
                default: 'load',
            })
            .option('format', {
                description: 'Image format of the screenshot',
                type: 'string',
                choices: ['png', 'jpeg', 'webp'],
                demandOption: false,
                default: 'png',
            })
            .option('fullPage', {
                description: 'Take a screenshot of the full scrollable page',
                type: 'boolean',
                demandOption: false,
                default: false,
            })
            .option('pdf', {
                description: 'Create a PDF file',
                type: 'boolean',
                default: false,
            })
            .option('pdfFormat', {
                description: 'Page Format of the PDF file',
                type: 'string',
                demandOption: false,
                default: 'A4',
            })
            .option('pdfLandscape', {
                description: 'Use Landscape Mode for the PDF file',
                type: 'boolean',
                default: false,
            })
            .option('pdfMargin', {
                description: 'Page Format of the PDF file in json as string',
                description: 'Margins for the PDF file in json as string, e.g. {"top":"30px","left":"30px","bottom":"30px","right":"30px"}',
                type: 'string',
                demandOption: false,
                default: '{"top":"0px","left":"0px","bottom":"0px","right":"0px"}',
            })
            .option('pdfScale', {
                description: 'Scales the rendinger of the PDF file, must a number between 0.1 and 2',
                type: 'number',
                demandOption: false,
                default: 1,
            })
            .positional('url', {
                description:
                    'Url of the webpage you want to take a screenshot of',
                type: 'string',
            })
            .example(
                '$0 https://github.com',
                'Take a screenshot of https://github.com and save it as screenshot.png'
            )
            .example(
                '$0 --cookiesFile=cookies.json https://google.com',
                'Load the cookies from cookies.json, take a screenshot of https://google.com and save it as screenshot.png'
            );
    })
    .help('h')
    .alias('h', 'help')
    .version()
    .alias('version', 'v')
    .wrap(Math.min(yargs.terminalWidth(), 130)).argv;

takeScreenshot(argv);

function takeScreenshot(argv) {
    (async () => {
        const browser = await puppeteer.launch({
            defaultViewport: {
                width: argv.width,
                height: argv.height,
            },
            bindAddress: '0.0.0.0',
            args: [
                '--no-sandbox',
                '--headless',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--remote-debugging-port=9222',
                '--remote-debugging-address=0.0.0.0',
            ],
        });

        const page = await browser.newPage();

        if (argv.userAgent) await page.setUserAgent(argv.userAgent);

        if (argv.cookies) {
            let cookies = JSON.parse(argv.cookies);
            if (Array.isArray(cookies)) {
                await page.setCookie(...cookies);
            } else {
                await page.setCookie(cookies);
            }
        }

        if (argv.cookiesFile) {
            let cookies = JSON.parse(
                fs.readFileSync(path.join(argv.inputDir, argv.cookiesFile))
            );
            if (Array.isArray(cookies)) {
                await page.setCookie(...cookies);
            } else {
                await page.setCookie(cookies);
            }
        }

        if (argv.headers) {
            let headers = JSON.parse(argv.headers);
            if (Array.isArray(headers)) {
                await page.setExtraHTTPHeaders(...headers);
            } else {
                await page.setExtraHTTPHeaders(headers);
            }
        }

        if (argv.headersFile) {
            let headers = JSON.parse(
                fs.readFileSync(path.join(argv.inputDir, argv.headersFile))
            );
            if (Array.isArray(headers)) {
                await page.setExtraHTTPHeaders(...headers);
            } else {
                await page.setExtraHTTPHeaders(headers);
            }
        }

        if (argv.urlLogin) {
            await page.goto(argv.urlLogin, {timeout: argv.timeout, waitUntil: argv.waitUntil});
        }

        await page.goto(argv.url, {timeout: argv.timeout, waitUntil: argv.waitUntil});

        if (argv.delay) await delay(argv.delay);

        await page.screenshot({
            path: path
                .join(argv.outputDir, argv.filename + '.' + argv.format)
                .toString(),
            type: argv.format,
            fullPage: argv.fullPage,
        });
        if (argv.pdf) {
            let margin = JSON.parse(argv.pdfMargin);
            await page.pdf({
                path: path
                    .join(argv.outputDir, argv.filename + '.' + 'pdf')
                    .toString(),
                format: argv.pdfFormat,
                landscape: argv.pdfLandscape,
                margin: margin,
                scale: argv.pdfScale,
            });        
        };

        await browser.close();
    })();
}
