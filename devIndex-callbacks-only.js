'use strict';

const fs      = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const regDown = require('npm-registry-download');

const domTarget = 'a.name';
const packDir = './packages';
const url = 'https://www.npmjs.com/browse/depended';

// will download top ten
request(url, function(error, response, body) {
  if (error) return console.error(error);
  let $ = cheerio.load(body);
  $(domTarget).slice(0, 10).each(function() {
    if(error) return console.error(error);
    if(response !== 200) return console.log(response);
    let dependency = $(this).text();
    let location = packDir + '/' + dependency;
    if (!fs.exists(location)) {
      fs.mkdir(location);
    }
    regDown(dependency, {
      dir: packDir + '/' + dependency
    });
  });
});

