'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const regDown = require('npm-registry-download');

const dependTarget = 'a.name';
const nextUrlTarget = 'a.next';
const packDir = './packages';
const baseUrl = 'https://www.npmjs.com';
const initialUrl = baseUrl + '/browse/depended';
const RETRIES = 2;

module.exports = {
  downloadPackages,
  getDependencies,
  scrapeDependencies,
  downloadUnpack
};

async function downloadPackages (count, callback) {
  try {
    let dependencies = await getDependencies(count, initialUrl);
    dependencies.forEach( function (current_value) {
      console.log(current_value);
      return downloadUnpack(current_value);
    })
  } catch(error) {
    console.error('Error', error);
  }
}

async function getDependencies (count, url) {
  try {
    let dependencies = [];
    while (await dependencies.length < count) {
      let temp = await scrapeDependencies(url);
      url = temp.pop();
      dependencies.push(...temp);
    }
    return dependencies.slice(0, count);
  } catch (error) {
    console.error('Error', error);
  }
}

async function scrapeDependencies (url) {
  let dependencies = [];
  for (let i = 0; i < RETRIES; i++) {
    try {
      dependencies = [];
      let response = await axios.get(url);
      let $ = await cheerio.load(response.data);
      await $(dependTarget).each(function () {
        dependencies.push($(this).text())
      });
      let nextUrl = baseUrl + $(nextUrlTarget).attr('href');
      await dependencies.push(nextUrl);
      break;
    } catch (error) {
      console.error('Error on Attempt ' + i, error);
    }
  }
  return dependencies;
}

async function downloadUnpack (dependency) {
  let msg = 'Error downloading ' + dependency;
  for (let i = 0; i < RETRIES; i++) {
    try {
      await regDown(dependency, {
        dir: packDir + '/' + dependency
      });
      msg = 'Downloaded and unpacked - ' + dependency;
      break;
    } catch (error) {
      console.error('Error on Attempt ' + i, error);
    }
  }
  return msg;
}
