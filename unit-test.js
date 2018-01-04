'use strict';

const proxyquire = require('proxyquire');
const sinon = require('sinon');
const download = require('./index.js');
let foo;

describe('Download Top Depended on Packages', function() {
  describe('downloadPackages', function() {
    let getDependenciesStub;
    let downloadUnpackStub;
    before(function () {
      getDependenciesStub = sinon.stub(download, 'getDependencies');
      downloadUnpackStub = sinon.stub(download, 'downloadUnpack');

      foo = proxyquire('./index.js', {
        download: {
          getDependencies: getDependenciesStub,
          downloadUnpack: downloadUnpackStub
        }
      });

      getDependenciesStub.returns(['a']);
      downloadUnpackStub.returns('success');
    });

    after(function () {
      download.getDependencies.restore();
      download.downloadUnpack.restore();
    });

    it('calls get dependencies and then calls downloadUnpack for each', function () {

      const result = foo.downloadPackages(1,'null');
      assert.eq(result,'success');
    })
  });
  //
  // describe('getDependencies', function() {
  //   it('calls scrapeDependencies and return an array the size of n', function() {
  //
  //   })
  // });
  //
  // describe('scrapeDependencies', function() {
  //   it('return an array of size 37 with the last field being a url', function() {
  //
  //   })
  // });
  //
  // describe('downloadUnpack', function() {
  //   it('downloads and unpacks the tar file', function() {
  //
  //   })
  // });
});
