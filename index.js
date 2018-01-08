'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const regDown = require('npm-registry-download');
const fs = require('fs');
const rimraf = require('rimraf');
const delay = require('delay');

const dependTarget = 'a.name';
const nextUrlTarget = 'a.next';
const packDir = './packages';
const baseUrl = 'https://www.npmjs.com';
const initialUrl = baseUrl + '/browse/depended';
const RETRIES = 2;

module.exports = downloadPackages;

/**
 *This will download the top N(count) depended on dependencies from NPM then
 * call the provided callback. The top dependencies are extracted to
 * ./packages/<dependency-name>.
 * @param count <integer> - number of top dependencies to download
 * @param callback <function> - function to call when the function completes; even if there is an error
 */
async function downloadPackages (count, callback) {
  try {
    let dependencies = await getDependencies(count, initialUrl);
    for(let value of dependencies) {
      await downloadUnpack(value);
    }
  } catch(error) {
    console.error('Error', error);
  } finally {
    callback();
  }
}

/**
 * This function will get the specified number of dependencies from NPM depended.
 * It will start on the page given and continue to the next page until the count
 * is filled.
 * @param count <integer> - the number of dependencies to get
 * @param url <string> - the url for the NPM page to start on
 * @returns {Promise<*[]>}
 */
async function getDependencies(count, url) {
  try {
    let dependencies = [];
    while(await dependencies.length < count) {
      let temp = await scrapeDependencies(url);
      url = await temp.pop();
      console.log(url);
      await dependencies.push(...temp);
    }
    return dependencies.slice(0, count);
  } catch (error) {
    console.error('Error', error);
  }
}

/**
 * This will scrape the specified url looking for the top dependencies downloaded
 * from NPM. The scrape is based off the current dom of NPM(Late 2017). If the
 * scrape errors out it will wait 5 seconds and try once more.
 * @param url <string> - url of specified page of NPM top depended
 * @returns {Promise<Array>} - Array with 37 entries; first 36 are dependencies and last is the url to the next 36
 */
async function scrapeDependencies(url) {
  let dependencies = [];
  for (let i = 1; i <= RETRIES; i++) {
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
      console.error('Error during scrape on attempt: ' + i, error);
    }
    await delay(500);
  }
  return dependencies;
}

/**
 * This function will download a dependency from npm to a package directory.
 * To correct this issue it will then rename the directory to the specified
 * dependency name. If there is an error the function will pause for 5 seconds
 * then retry. Furthermore, to avoid issue each time the function will first try
 * to remove the directory of the specified dependency to avoid duplicate files.
 * @param dependency <string> - the name of the dependency to download
 * @returns {Promise<string>} - response of if the dependency downloaded or not
 */
async function downloadUnpack(dependency) {
  let msg = 'Error downloading ' + dependency;
  for (let i = 1; i <= RETRIES; i++) {
    try {
      await rimraf(packDir + '/' + dependency, function(err) {
        if(err) console.error(err);
      });
      await regDown(dependency, {
        dir: packDir
      });
      await fs.rename(packDir + '/package', packDir + '/' + dependency, function(err) {
        if(err) console.error(err);
      });
      msg = 'downloaded ' + dependency;
      console.log(msg);
      break;
    } catch (error) {
      console.error('Error unpacking ' + dependency + ' on attempt: ' + i, error);
    }
    await delay(500);
  }
  return msg;
}
