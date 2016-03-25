var request = require('request');
var cheerio = require('cheerio');
var util = require('util');

var CHROME_UA = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36';
var URL_FORMAT = 'http://www.kaist.ac.kr/_prog/fodlst/index.php?site_dvs_cd=kr&menu_dvs_cd=050303&dvs_cd=%s&stt_dt=%s&site_dvs=';

var cafeCodeToParam = {
    north: 'fclt',
    west: 'west',
    east1: 'east1',
    east2: 'east2',
    faculty: 'emp',
    munji: 'icc',
    hwaam: 'hwaam'
};

var generateURL = function(code, date) {
    return util.format(URL_FORMAT, code, date);
}

exports.scrapeMenu = function(cafeCode, date, meal, onReturn) {
    var onResponse = function(error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            var text =
                $('table.menuTb tbody tr td').eq(meal).text();
            onReturn(text);
        } else {
            console.log("Error: Can't access the web page");
            console.log("Error: Status Code : " + response.statusCode);
        }
    }

    var options = {
        url: generateURL(cafeCodeToParam[cafeCode], date),
        headers: {
            'User-Agent': CHROME_UA
        }
    };

    request(options, onResponse);
}
