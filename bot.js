var Botkit = require('botkit');
var os = require('os');
var moment = require('moment');
var util = require('util');
var scraper = require('./scraper.js');

var DATE_FORMAT = 'YYYY-MM-DD';
var INVAL_MESSAGE_RESP = ":confused: 무슨 말인지 모르겠어요. *!밥 도움말* 을 확인하세요.";
var EMPTY_MENU_RESP = ":disappointed: %s %s에 %s 식당은 운영하지 않아요.";
var MENU_FORMAT = ":rice: *%s* *%s* 식당 *%s* 식단:\n>>>%s"

var MAX_WORDS_IN_MSG = 3;


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var controller = Botkit.slackbot();

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

var cafeNameToCode = {
    '북측': 'north',
    '서측': 'west',
    '동측': 'east1',
    '동측2': 'east2',
    '교수회관': 'faculty',
    '문지': 'munji',
    '화암': 'hwaam'
};
var defaultCafeName = '교수회관';

var mealToId = {
    '아침': 0,
    '점심': 1,
    '저녁': 2
};

var dateKeyToDiff = {
    '어제': -1,
    '오늘': 0,
    '내일': 1
};

var HELP_CMD = '도움말';
var HELP_MESSAGE = '사용법: *!밥 [날짜] [식당] [식사시간]* (순서는 상관 없음)\n' +
    '>>>날짜: *어제, 오늘, 내일* 혹은 *YYYY-MM-DD* 형식의 날짜 (기본: 오늘)\n' +
    '식당: *북측, 서측, 동측, 동측2, 교수회관, 문지, 화암* (기본: 교수회관)\n' +
    '시간: *아침, 점심, 저녁* (기본: < 10시 - 아침, < 2시 - 점심, > 2시 저녁)\n';


var isValidDate = function(string) {
    return moment(string, DATE_FORMAT, true).isValid();
};

var getDefaultMealName = function() {
    var h = moment().hour();
    return h < 10 ? '아침' : (h < 14 ? '점심' : '저녁');
};

var messageHandler = function(bot, message) {
    var msgArr = message.match.length > 1 ? message.match[1].split(' ') : [];

    var cafeName = defaultCafeName;
    var mealName = getDefaultMealName();
    var date = moment().format(DATE_FORMAT);

    var cafeCode = cafeNameToCode[defaultCafeName];
    var mealId = mealToId[mealName];


    var validityCheckArr = Array(MAX_WORDS_IN_MSG);
    var valid = true;
    var i;

    if (msgArr.length == 1 && msgArr[0] === HELP_CMD) {
        bot.reply(message, HELP_MESSAGE);
        return;
    }

    if (msgArr.length > MAX_WORDS_IN_MSG) {
        bot.reply(message, INVAL_MESSAGE_RESP);
        return;
    }

    for (i = 0; i < msgArr.length; ++i) {
        word = msgArr[i];
        if (word in cafeNameToCode) {
            cafeCode = cafeNameToCode[word];
            cafeNmae = word;
            validityCheckArr[0] += 1;
        } else if (word in mealToId) {
            mealId = mealToId[word];
            mealName = word;
            validityCheckArr[1] += 1;
        } else if (word in dateKeyToDiff) {
            date = moment().add(dateKeyToDiff[word], 'days')
                           .format(DATE_FORMAT);
            validityCheckArr[2] += 1;
        } else if (isValidDate(word)) {
            date = word;
            validityCheckArr[2] += 1;
        } else {
            valid = false;
        }
    }

    for (i = 0; i < validityCheckArr.length; ++i) {
        if (validityCheckArr[i] > 1) {
            valid = false;
            break;
        }
    }

    if (!valid) {
        bot.reply(message, INVAL_MESSAGE_RESP);
        return;
    }

    scraper.scrapeMenu(cafeCode, date, mealId, function(result) {
        bot.reply(message, result == '' ?
                util.format(EMPTY_MENU_RESP, date, mealName, cafeName) :
                util.format(MENU_FORMAT, date, cafeName, mealName, result));
    });
};

controller.hears(['!밥 (.*)', '!밥'], 'direct_message,direct_mention,mention',
        messageHandler);