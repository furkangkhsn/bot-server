var https = require('https');
const cheerio = require('cheerio');
const express = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = 8888;

async function getirici(url) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, res => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`Status Code: ${res.statusCode}`));
            }
            let data = '';
            res.on('data', chunk => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
            });
        });
    
        req.on('error', reject);
        // IMPORTANT
        req.end();
    });
}

function resim_sec(url) {
    
}

app.get('/getMarkalar', async (req1, res1) => {
    let markalar = [];
    let data = await getirici('https://www.sahibinden.com/otomobil');
    let $ = cheerio.load(data);
    $('div#searchCategoryContainer li').each(function(i, elem) {
        let araba = $(this);
        let _this = this;
        araba.each((i, elem) => {
            let ar = {};
            ar.marka = $(elem).find('a').text();
            ar.adet = $(elem).find('span').text();
            ar.link = $(elem).find('a').attr('href');
            markalar.push(ar);
        });
    });    
    res1.send(JSON.stringify(markalar));
});

app.post('/getModeller', async (req1, res1) => {
    let secilen = req1.body.secilen;
    let modeller = [];
    let data = await getirici('https://www.sahibinden.com' + secilen);
    let $ = cheerio.load(data);
    $('div#searchCategoryContainer li').each(function(i, elem) {
        let araba = $(this);            
        araba.each((i, elem) => {
            let ar = {};
            ar.model = $(elem).find('a').text();
            ar.adet = $(elem).find('span').text();
            ar.link = $(elem).find('a').attr('href');
            modeller.push(ar);
        });
    });
    
    res1.send(JSON.stringify(modeller));
});

app.post('/getir', async (req1, res1) => {
    let { url } = req1.body;
    let arabalar = [];
    let pages = [];
    let data = await getirici(url);
    let $ = cheerio.load(data, { decodeEntities: false });
    let trs = $('tbody.searchResultsRowClass tr');
    let last_page = $('ul.pageNaviButtons li');
    for (let i = 0; i < last_page.length; i++) {
        const elem = last_page[i];
        pages.push({sayfa: $(elem).text().trim(), link: $(elem).find('a').attr('href')});
    }
    for (let i = 0; i < trs.length; i++) {
        const elem = trs[i];
        let araba = $(elem);
        for (let index = 0; index < araba.length; index++) {
            const elem = araba[index];
            if ($(elem).find('a').attr('href') != undefined) {
                let url2 = 'https://www.sahibinden.com' + $(elem).find('a').attr('href').trim();
                let data2 = await getirici(url2);
                let $2 = cheerio.load(data2, { decodeEntities: false });
                let ar = {};
                let resim_input_id = parseInt($2('input:checked').attr('id').split('_')[1])+1;
                let res_el = `label#label_images_${resim_input_id} img`;
                ar.link = $(elem).find('a').attr('href');

                try {
                    ar.img = $2(res_el).attr('src') || $2('label#label_images_0 img').attr('src');
                } catch (error) {
                    console.error({resim_input_id, url2, res_el, error});
                }
                ar.img = ar.img.trim();
                ar.tip = $(elem).find('td.searchResultsTagAttributeValue').text().trim();
                ar.yil = $($(elem).find('td.searchResultsAttributeValue')[0]).text().trim();
                ar.km = $($(elem).find('td.searchResultsAttributeValue')[1]).text().trim();
                ar.renk = $($(elem).find('td.searchResultsAttributeValue')[2]).text().trim();
                ar.fiyat = $(elem).find('td.searchResultsPriceValue').text().trim().split(' ')[0].split('.').join('');
                ar.il = $(elem).find('td.searchResultsLocationValue').html().split('<br>')[0].trim();
                ar.ilce = $(elem).find('td.searchResultsLocationValue').html().split('<br>')[1].trim();
                arabalar.push(ar);
            }
        }
    }
    res1.send(JSON.stringify({arabalar, pages}));
});

app.listen(port, () => {
    console.log('dinliyorum');
    
});
