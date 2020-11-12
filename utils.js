'use strict';

const fs = require('fs');
const util = require('util');

const exists = util.promisify(fs.access);

module.exports = {
    fileExists(path) {
        return new Promise((resolve, reject) => {
            exists(path, fs.F_OK).then(ok => {
                resolve(true);
            }).catch(err => {
                resolve(false);
            });
        });
    }
};