/**
 * Created by thoma on 10/5/2017.
 */
var discordProperties = require('./haggisBotPropertiesV2.json');

var Discord = require('discord.io');
var discordBot = new Discord.Client({
	token: discordProperties.token,
	autorun: true
});

var Datastore = require('nedb'),
	rouletteDB = new Datastore('/home/thomas/discordBot/haggisBotJS/databases/rouletteDB.db');

rouletteDB.loadDatabase();

//Paths
var haggisBotPath = discordProperties.haggisBotPath;

//Discord Information
var haggisID = discordProperties.haggisID;
var botfartDiscordID = discordProperties.botfartID;
var resistanceServer = discordProperties.resistanceServer;

var rouletteRound = 5;

discordBot.on("ready", function (rawEvent) {
	try {
		sendDiscordMessage(haggisID, [getDateTime() + " - Connected"]);
	} catch (err) {
		sendDiscordMessage(haggisID, [getDateTime() + " - Error Connecting: " + err]);
	}
});

discordBot.on("message", function (user, userID, channelID, message, rawEvent) {
	if (/^!rr$/i.test(message))
		roulettePlay(channelID, userID, user);

	if (/^!rrlead$/i.test(message))
		rouletteGetLead(channelID);

	if (/^!rrstats$/i.test(message)) {
		rouletteGetStats(channelID, userID)
	}
});

function roulettePlay(channelID, userID, user) {
	if (!checkRoulette(userID))
		addRoulette(userID, user);

	rouletteDB.find({_id: userID}, function (err, docs) {
		var streak = docs[0].streak;
		var topStreak = docs[0].topStreak;
		var survived = docs[0].survived;
		var lost = docs[0].lost;
		var played = docs[0].played;

		if (played == true)
			sendDiscordMessage(channelID, ["<" + userID + ">: You have already played this round"])
		else {
			if (rouletteRound > 0) {
				streak++;
				survived++;
				if (streak > topStreak)
					topStreak++;
				played = true;

				sendDiscordMessage(channelID, ["<" + userID + "> *click* :gun:"])
			} else if (rouletteRound == 0) {
				streak = 0;
				lost++;
				played = false
				sendDiscordMessage(channelID, ["<" + userID + "> *bang* :gun:"])
			}

			rouletteDB.update({_id: userID},
				{
					$set: {
						streak: streak,
						lost: lost,
						topStreak: topStreak,
						survived: survived,
						last: Date.now(),
						played: true
					}
				}, {}, function () {
					rouletteDB.persistence.compactDatafile()
				})
		}

	});
}

function rouletteGetLead(channelID) {
	var highCurrStreak,
		highCurrUser,
		mostWins,
		mostWinsUser,
		mostLoss,
		mostLossUser;

	rouletteDB.find({}, function (err, docs) {
		for (i = 0; i < docs.length; i++) {
			if (docs[i].streak > highCurrStreak) {
				highCurrStreak = docs[i].streak;
				highCurrUser = docs[i].name;
			}

			if (docs[i].survived > mostWins) {
				mostWins = docs[i].survived;
				mostWinsUser = docs[i].name;
			}

			if (docs[i].lost > mostLoss) {
				mostLoss = docs[i].lost;
				mostLossUser = docs[i].name;
			}

			discordBot.sendMessage({
				to: channelID,
				embed: {
					title: "Roulette Leaderboard",
					color: 0xFF0000,
					fields: [
						{name: "Highest Streak", value: highCurrUser + " - " + highCurrStreak},
						{name: "Most Survived", value: mostWinsUser + " - " + mostWins},
						{name: "Most Lost", value: mostLossUser + " - " + mostLoss}
					]
				}
			});
		}
	})
}

function rouletteGetStats(channelID, userID) {
	rouletteDB.find({_id: userID}, function (err, docs) {
		if (docs.length > 0) {
			var survived, lost, streak, topStreak, ratio;
			survived = docs[0].survived;
			lost = docs[0].lost;
			streak = docs[0].streak;
			topStreak = docs[0].topStreak;
			ratio = survived / lost.toFixed(2);
			discordBot.sendMessage({
				to: channelID,
				embed: {
					title: "Roulette Stats",
					color: 0xFF0000,
					fields: [
						{name: "Lived", value: docs[0].survived},
						{name: "Lost", value: docs[0].lost},
						{name: "Streak", value: docs[0].streak},
						{name: "Top Streak", value: docs[0].topStreak},
						{name: "Ratio", value: docs[0].survived / docs[0].lost.toFixed(2)}
					]
				}
			});
		}
	})
}

//###SEND DISCORD MESSAGE###
function sendDiscordMessage(ID, messageArr, interval) {
	var callback, resArr = [], len = messageArr.length;
	typeof (arguments[2]) === 'function' ? callback = arguments[2] : callback = arguments[3];
	if (typeof (interval) !== 'number') interval = 1000;

	function _sendMessages() {
		setTimeout(function () {
			if (messageArr[0]) {
				discordBot.sendMessage({
					to: ID,
					message: messageArr.shift()
				}, function (err, res) {
					if (err) {
						resArr.push(err);
					} else {
						resArr.push(res);
					}
					if (resArr.length === len) if (typeof (callback) === 'function') callback(resArr);
				});
				_sendMessages();
			}
		}, interval);
	}

	_sendMessages();
}

//###GET DATE AND TIME###
function getDateTime() {
	var date = new Date();

	var year = date.getFullYear();

	var month = date.getMonth() + 1;
	month = (month < 10 ? "0" : "") + month;

	var day = date.getDate();
	day = (day < 10 ? "0" : "") + day;

	var hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;

	var min = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;

	var sec = date.getSeconds();
	sec = (sec < 10 ? "0" : "") + sec;


	return day + "-" + month + "-" + year + ": " + hour + ":" + min + ":" + sec;
}

function addRoulette(userID, user) {
	var doc = {
		_id: userID,
		name: user,
		survived: 0,
		lost: 0,
		streak: 0,
		topStreak: 0,
		last: 0,
		played: false
	};

	rouletteDB.insert(doc, function (err, newDoc) {
	});
}

function checkRoulette(userID) {
	(rouletteDB.find({_id: userID}, function (err, docs) {
		return docs.length > 0;
	}));
}