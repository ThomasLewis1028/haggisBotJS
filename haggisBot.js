var discordProperties = require('/home/thomas/discordBot/haggisBotJS/haggisBotProperties.json');
var steamProperties = require('/home/thomas/discordBot/haggisBotJS/steamBotProperties.json');

var Discordbot = require('discord.io');
var bot = new Discordbot({
	token: discordProperties.token,
	autorun: true
});

var Steam = require('steam');
var steamClient = new Steam.SteamClient();
var steamUser = new Steam.SteamUser(steamClient);
var steamFriends = new Steam.SteamFriends(steamClient);

steamClient.connect();
steamClient.on('connected', function () {
	steamUser.logOn({
		account_name: steamProperties.username,
		password: steamProperties.password
	});
});

var Cleverbot = require('cleverbot-node');
cleverbot = new Cleverbot;

var fs = require('fs');

//Paths
var haggisBotPath = discordProperties.haggisBotPath;
var musicBotPath = discordProperties.musicBotPath;
var steamBotPath = steamProperties.steamBotPath;
//Discord Information
var haggisDiscordID = discordProperties.haggisID;
var botfartDiscordID = discordProperties.botfartID;
var popcheeseID = discordProperties.popcheeseID;
var seraID = discordProperties.seraID;
var pcmrDiscordServer = discordProperties.pcmrServer;
var pcmrDiscordRelay = discordProperties.pcmrRelayServer;
var cleverBotChannel = discordProperties.cleverBotChannel;
var musicReqChannel = discordProperties.musicReqChannel;
var testingBooth = discordProperties.testingBooth;
var autoplaylist = discordProperties.autoplaylist;
var musicBlacklist = discordProperties.musicBlacklist;
//Steam Information
var steamProfile = steamProperties.profile;
var pcmrSteamGroup = steamProperties.pcmrGroup;
var haggisTestGroup = steamProperties.haggisTestGroup;
var haggisSteamID = steamProperties.haggisID;
var botfartSteamID = steamProperties.botfartID;
var steamModIDs = steamProperties.steamMods;
var lastSteamUserId;

//Ready the Discord Bot
bot.on("ready", function (rawEvent) {
	try {
		console.log("Connected!");
		console.log("Logged in as: ");
		console.log(bot.username + " - (" + bot.id + ")");
		console.log(bot.internals.version);
		console.log("----------")

		bot.editUserInfo({
			avatar: fs.readFileSync(haggisBotPath + '/Haggis.jpg', 'base64')
		});

		sendDiscordMessage(haggisDiscordID, ["Reconnected at " + getDateTime()]);
	} catch (err) {
		sendDiscordMessage(haggisDiscordID, ["ERROR: " + err]);
		logError(getDateTime(), err);
	}
});

//Do stuff when Steam Bot comes online
steamClient.on('logOnResponse', function (logonResp) {
	if (logonResp.eresult == Steam.EResult.OK) {
		console.log('Logged in!');
		steamFriends.setPersonaState(Steam.EPersonaState.Online);
		steamFriends.setPersonaName(steamProfile);
		steamFriends.joinChat(haggisTestGroup);
		//steamFriends.joinChat(pcmrSteamGroup);
	}
});

//Prepate Cleverbot
Cleverbot.prepare(function () {
});

//###DO ON DISCORD MESSAGE###
bot.on("message", function (user, userID, channelID, message, rawEvent) {
	try {
		if (channelID in bot.directMessages) {
			//do nothing, no idea how to not have this here
		} else {
			var serverID = bot.channels[channelID].guild_id;
			var server = bot.servers[serverID];
			var roleName = getRoleName(server);
		}

		var mentions = rawEvent.d.mentions;
		var messageArray = message.split(" ");

		//###RELAY STEAM CHAT###
		if (channelID == pcmrDiscordRelay && userID != botfartDiscordID && userID != seraID) {
			lastSteamUserId = botfartDiscordID;
			return sendSteamMessage(pcmrSteamGroup, "[" + user + "]: " + message);
		}

		//###RELAY TEST CHAT###
		if (channelID == testingBooth && userID != botfartDiscordID && userID != seraID) {
			lastSteamUserId = botfartDiscordID;
			return sendSteamMessage(haggisTestGroup, "[" + user + "]: " + message);
		}

		//###FIND MENTIONS###
		for (var key in mentions) {
			if (mentions[key].id === haggisDiscordID && userID != haggisDiscordID && userID != botfartDiscordID) {
				return sendDiscordMessage(haggisDiscordID, [user + " pinged you with \"" + message + "\""]);
			}
		}

		//###FIND NAME###
		if (userID != botfartDiscordID && userID != haggisDiscordID) {
			for (i = 0; i < messageArray.length; i++) {
				if (/^H(a|o)(gg|g)is$/i.test(messageArray[i])) {
					sendDiscordMessage(haggisDiscordID, [getDateTime() + "\n" + user + " pinged you with \"" + message + "\""]);
				} else if (/Thomas/i.test(messageArray[i])) {
					sendDiscordMessage(haggisDiscordID, [getDateTime() + "\n" + user + " pinged you with \"" + message + "\""]);
				}
			}
		}

		if (serverID == pcmrDiscordServer || serverID == pcmrDiscordRelay) {
			return;
		} else if (userID === botfartDiscordID) {
			logDiscordChat(channelID, userID, user, getDateTime(), message);
			return;
		} else if (serverID != pcmrDiscordServer || serverID != pcmrDiscordRelay) {
			logDiscordChat(channelID, userID, user, getDateTime(), message);
		}

		//###SWITCH COMMANDS###
		switch (messageArray[0]) {
			//###REGULAR COMMANDS###
			case "!rollsr":
				sendDiscordMessage(channelID, [rollDiceSR(messageArray[1])]);
				break;
			case "!roll":
				sendDiscordMessage(channelID, [rollDiceSum(messageArray[1], messageArray[2])]);
				break;
			case "!card":
				sendDiscordMessage(channelID, [pickACard()]);
				break;
			case "!flipacoin":
			case "!coinflip":
				sendDiscordMessage(channelID, [flipACoin()]);
				break;
			case "!commands":
				sendDiscordMessage(channelID, ["```\n" +
					"!roll <X> <dY> \n" +
					"!rollsr <X> d6 \n" +
					"!card \n" +
					"!coinflip \n" +
					"!flipacoin \n" +
					"!musiccommands \n" +
					"/r/<subreddit \n" +
					"/r/<subreddit <search query> \n" +
					"lmgtfy <search query> \n" +
					"ping \n" +
					"```"]);
				break;
			case "!musiccommands":
				sendDiscordMessage(channelID, ["```\n" +
					"!play <song link> \n" +
					"!play <song text to search for \n" +
					"!queue - current queue\n" +
					"!np - now playing \n" +
					"!skip \n" +
					"!search [service] [number] <query> \n" +
					"!clear \n" +
					"!pause \n" +
					"!resume \n" +
					"```"]);
				break;

			//###SECRET COMMANDS###
			case "!lenny":
				sendFiles(channelID, [haggisBotPath + "lenny.png"]);
				break;
			case "!fliparealcoin":
				sendFiles(channelID, [flipARealCoin()]);
				break;
			case "kill":
				if (messageArray[1] === "yourself") {
				} else {
					break;
				}
			case "kys":
			case "killyourself":
				sendDiscordMessage(channelID, ["https://youtu.be/2dbR2JZmlWo"]);
				break;
			case "!dickbutt":
				sendFiles(channelID, [richardKiester()]);
				break;
			case "slammin":
			case "SLAMMIN":
				sendDiscordMessage(channelID, ["https://youtu.be/kencI_SLNxw"]);
				break;
			case "wow!":
				sendFiles(channelID, [haggisBotPath + "wow.gif"]);
				break;
			case "!faggot":
				sendFiles(channelID, [qubeyPitts()]);
				break;
			case "9/11":
				sendDiscordMessage(channelID, ["Did you know Steve Buscemi was a volunteer firefighter at 9/11?"]);
				sendFiles(channelID, [steveBuscemi()]);
				break;
			case "y":
				sendFiles(channelID, [haggisBotPath + "ytho.jpg"]);
				break;
			case "!superreallyincrediblysecretcommands":
				sendDiscordMessage(channelID, ["```\n" +
					"kys \n" +
					"kill yourself \n" +
					"killyourself \n" +
					"!lenny \n" +
					"!fliparealcoin \n" +
					"!realcoinflip \n" +
					"!flipthebird \n" +
					"!dickbutt \n" +
					"slammin \n" +
					"SLAMMIN \n" +
					"me irl \n" +
					"meirl \n" +
					"me_irl \n" +
					"wow! \n" +
					"!faggot \n" +
					"9/11 \n" +
					"y \n" +
					"!adminCommands \n" +
					"```"])
				break;
			case "!adminCommands":
				sendDiscordMessage(channelID, ["```\n" +
					"!b @<user> \n" +
					"!k @<user> \n" +
					"```"]);
				break;

		}

		//###PING PONG###
		if (/^ping$/i.test(message)) {
			sendDiscordMessage(channelID, ["<@" + userID + "> pong"]);
		}

		//##ADMIN CALL###
		if (userID == popcheeseID || userID == haggisDiscordID && /^![bk]$/i.test(messageArray[0])) {
			adminCommands(user, messageArray, channelID);
		}

		//###REDDIT & SEARCH###
		if (/^\/r\//i.test(messageArray[0])) {
			var redditURL = "https://www.reddit.com";

			if (messageArray.length == 1) {
				redditURL = redditURL.concat(message);
				sendDiscordMessage(channelID, [redditURL]);
			} else if (messageArray.length > 1) {
				redditURL = redditURL.concat(messageArray[0]);
				redditURL = redditURL.concat("/search?q=");

				for (i = 1; i < messageArray.length; i++) {
					redditURL = redditURL.concat(messageArray[i]);

					if (i != messageArray.length - 1) {
						redditURL = redditURL.concat("+");
					}
				}

				redditURL = redditURL.concat("&restrict_sr=on&sort=relevance&t=all");
				sendDiscordMessage(channelID, [redditURL]);
			}
		}

		//###MUSIC AUTOPLAY LIST###
		if (channelID == musicReqChannel && userID != botfartDiscordID) {
			var youtubeLink = "www.youtube.com/";
			var youtubeShortLink = "https://youtu.be/";

			if (message.indexOf(youtubeLink) > -1) {
				var newArr = message.split("=");
				var newLink = youtubeShortLink.concat(newArr[1]);

				sendDiscordMessage(channelID, [addMusic(newLink, user)]);
			} else if (message.indexOf(youtubeShortLink) > -1) {
				sendDiscordMessage(channelID, [addMusic(message, user)]);
			} else {
				sendDiscordMessage(channelID, ["Please use a YouTube link"]);
			}
		}

		//###LET ME GOOGLE THAT FOR YOU###
		if (messageArray[0] == "lmgtfy") {
			var lmgtfyLink = "http://lmgtfy.com/?q=";
			var lmgtfy = "";

			for (i = 1; i < messageArray.length; i++) {
				lmgtfy = lmgtfy.concat(messageArray[i]);

				if (i != messageArray.length - 1) {
					lmgtfy = lmgtfy.concat("+");
				}
			}

			lmgtfy = lmgtfyLink.concat(lmgtfy);

			sendDiscordMessage(channelID, [lmgtfy]);
		}

		//###CLEVERBOTFART###
		if (channelID == cleverBotChannel && userID != botfartDiscordID) {
			cleverbot.write(message, function (response, err) {
				if (err) {
					console.log(err);
				}
				sendDiscordMessage(channelID, [response.message]);
			});
		}

		//###I WON'T LIE###
		if (/(i).(won't|wont).(lie)/i.test(message)) {
			sendDiscordMessage(channelID, [":ok_hand: :joy::sob: :laughing::ok_hand: :eggplant: :100: :poop: "]);
		}

		//###NO HOMO
		for (i = 0; i < messageArray.length; i++) {
			if (/\bgay\b/i.test(messageArray[i])) {
				sendDiscordMessage(channelID, ["no homo"]);
				break;
			}
		}

		//###ME IRL M2THX###
		if (/(me).{0,1}(irl)/i.test(message)) {
			sendDiscordMessage(channelID, ["m2thx"]);
		}

		//###AYY LMAO###
		if (/^ay[y]+/i.test(messageArray[0]) && messageArray.length < 2) {
			var ysInMessage = message.match(/y/gi).length - 2;
			var lmaoString = "lmao"

			if (ysInMessage > 100) {
				return (sendDiscordMessage(channelID, ["lmaoooo-fuck you"]));
			}

			for (i = 0; i < ysInMessage; i++) {
				lmaoString = lmaoString.concat("o");
			}

			sendDiscordMessage(channelID, [lmaoString]);
		}

		//###OH SHIT WHADDUP###
		if (/(oh).{0,1}(shit)/i.test(message)) {
			sendDiscordMessage(channelID, ["whaddup"]);
		}
	} catch (err) {
		sendDiscordMessage(haggisDiscordID, ["ERROR: " + err]);
		logError(getDateTime(), err);
	}
});

//###DO ON STEAM GROUP MESSAGE###
steamFriends.on('chatMsg', function (serverID, message, type, userID) {
	try {
		var user = steamFriends.personaStates[userID].player_name;

		var messageArray = message.split(" ");

		//Relay Steam Chat
		if (serverID == pcmrSteamGroup) {
			if (userID != lastSteamUserId) {
				sendDiscordMessage(pcmrDiscordRelay, ["**[" + user + "]:** \n" + message]);

				lastSteamUserId = userID;
			} else if (userID == lastSteamUserId) {
				sendDiscordMessage(pcmrDiscordRelay, [message]);
			}
		}

		//Relay Discord Chat
		if (serverID == haggisTestGroup) {
			if (userID != lastSteamUserId) {
				sendDiscordMessage(testingBooth, ["**[" + user + "]:** \n" + message]);

				lastSteamUserId = userID;
			} else if (userID == lastSteamUserId) {
				sendDiscordMessage(testingBooth, [message]);
			}
		}

		if (userID != botfartSteamID && userID != haggisSteamID) {
			for (i = 0; i < messageArray.length; i++) {
				if (/H(a|o)(gg|g)is/i.test(messageArray[i])) {
					sendDiscordMessage(haggisDiscordID, ["Steam user [" + user + "] Pinged you with: " + message]);
				}
			}
		}

		//logSteamChat(serverID, userID, user, getDateTime(), message);
	} catch (err) {
		logError(getDateTime(), err);
	}
});

//###DO ON USER STATE CHANGE###
steamFriends.on('chatStateChange', function (state, userID, serverID, modUserID) {
	try {
		var user = steamFriends.personaStates[userID].player_name;
		var modUser = steamFriends.personaStates[modUserID].player_name;

		switch (state) {
			case 1: sendDiscordMessage(testingBooth, ["```" + user + " entered chat```"]);
				break;
			case 2: sendDiscordMessage(testingBooth, ["```" + user + " left chat```"]);
				break;
			case 8: sendDiscordMessage(testingBooth, ["```" + user + " was kicked by " + modUser + "```"]);
				break;
			case 16: sendDiscordMessage(testingBooth, ["```" + user + " was banned by " + modUser + "```"]);
				break;
		}
	} catch (err) {
		sendDiscordMessage(haggisDiscordID, [getDateTime() + "\n" + err]);
		logError(getDateTime(), err);
	}
});

//###DO ON STEAM PM###
steamFriends.on('friendMsg', function (userID, message, type) {
	if (type == 2 || type == 6) {
		return;
	}

	//If a mod tells the bot to rejoin, it rejoins
	if (/^!rejoin$/i.test(message)) {
		for (i = 0; i < steamModIDs.length; i++) {
			if (userID == steamModIDs[i]) {
				steamClient.disconnect();
				steamClient.connect();
				break;
			}else{
				continue;
			}
		}
	}
})

//###AUTO RECONNECT###
bot.on("disconnected", function () {
	bot.connect(); //Auto reconnect
});

//###SEND DISCORD MESSAGE###
function sendDiscordMessage(ID, messageArr, interval) {
	var callback, resArr = [], len = messageArr.length;
	typeof (arguments[2]) === 'function' ? callback = arguments[2] : callback = arguments[3];
	if (typeof (interval) !== 'number') interval = 1000;

	function _sendMessages() {
		setTimeout(function () {
			if (messageArr[0]) {
				bot.sendMessage({
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

//###SEND STEAM MESSAGE###
function sendSteamMessage(serverID, message) {
	steamFriends.sendMessage(serverID, message, Steam.EChatEntryType.ChatMsg);
}

//###SEND FILES###
function sendFiles(channelID, fileArr, interval) {
	var callback, resArr = [], len = fileArr.length;
	typeof (arguments[2]) === 'function' ? callback = arguments[2] : callback = arguments[3];
	if (typeof (interval) !== 'number') interval = 1000;

	function _sendFiles() {
		setTimeout(function () {
			if (fileArr[0]) {
				bot.uploadFile({
					to: channelID,
					file: fileArr.shift()
				}, function (err, res) {
					if (err) {
						resArr.push(err);
					} else {
						resArr.push(res);
					}
					if (resArr.length === len) if (typeof (callback) === 'function') callback(resArr);
				});
				_sendFiles();
			}
		}, interval);
	}
	_sendFiles();
}

//###LOG DISCORD CHAT###
function logDiscordChat(channelID, userID, user, time, message) {
	var date = new Date();
	var yyyy = date.getFullYear();
	var mm = date.getMonth() + 1;
	mm = (mm < 10 ? "0" : "") + mm;
	var dd = date.getDate();
	dd = (dd < 10 ? "0" : "") + dd;

	var path = haggisBotPath + "logs/"
	var fileName = yyyy + "-" + mm + "-" + dd + ".txt"

	var logContent = yyyy + "-" + mm + "-" + dd + "-" + time + "\r\n"
		+ user + " - " + userID + "\r\n"
		+ "Channel ID - " + channelID + "\r\n"
		+ message + "\r\n"
		+ "----------\r\n";

	fs.appendFileSync(path + fileName, logContent, encoding = "utf8");
}

//###LOG STEAM CHAT###
// function logSteamChat(serverID, userID, user, time, message) {
// 	var date = new Date();
// 	var yyyy = date.getFullYear();
// 	var mm = date.getMonth() + 1;
// 	mm = (mm < 10 ? "0" : "") + mm;
// 	var dd = date.getDate();
// 	dd = (dd < 10 ? "0" : "") + dd;

// 	var path = steamBotPath + "logs/"
// 	var fileName = yyyy + "-" + mm + "-" + dd + ".txt"

// 	var logContent = yyyy + "-" + mm + "-" + dd + "-" + time + "\r\n"
// 		+ user + " - " + userID + "\r\n"
// 		+ "ServerID - " + serverID + "\r\n"
// 		+ message + "\r\n"
// 		+ "----------\r\n";

// 	fs.appendFileSync(path + fileName, logContent, encoding = "utf8");
//}

//###LOG ERROR###
function logError(time, err) {
	var date = new Date();
	var yyyy = date.getFullYear();
	var mm = date.getMonth() + 1;
	mm = (mm < 10 ? "0" : "") + mm;
	var dd = date.getDate();
	dd = (dd < 10 ? "0" : "") + dd;

	var path = haggisBotPath + "logs/"
	var fileName = yyyy + "-" + mm + "-" + dd + "-ERROR.txt"

	var logContent = yyyy + "-" + mm + "-" + dd + "-" + time + "\r\n"
		+ err + "\r\n"
		+ "----------\r\n";

	fs.appendFileSync(path + fileName, logContent, encoding = "utf8");
}

//###GET ROLL NAME### ###BROKEN RIGHT NOW###
function getRoleName(server) {
	for (var role in server.roles) {

		var roleName = server.roles[role].name;
		return roleName;
	}
}

//###ADMIN COMMANDS###
function adminCommands(user, messageArray, channelID) {
	var userToActUpon;

	if (/^<@\S+>$/.test(messageArray[1])) {
		userToActUpon = /\d+/.exec(messageArray[1]);

		if (messageArray[0] == "!k") {
			bot.kick({
				channel: channelID,
				target: userToActUpon
			})
		} else if (messageArray[0] == "!b") {
			bot.ban({
				channel: channelID,
				target: userToActUpon
			})
		}
	}
}

//###GET DATE AND TIME###
function getDateTime() {
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;


    return hour + ":" + min + ":" + sec;
}

//##ROLL DICE SHADOWRUN###
function rollDiceSR(diceNum) {
	var results = "```\nResults: ";
	var successes = 0;
	var glitches = 0;
	var sum = 0;
	var diceResult;

	for (var i = 0; i < diceNum; i++) {
		diceResult = Math.floor((Math.random() * 6) + 1);
		sum += diceResult;

		if (i == 0) {
			results = results.concat("\{", diceResult.toString());
		} else if (i != 0 && i != diceNum - 1) {
			results = results.concat(", ", diceResult.toString());
		} else if (i == diceNum - 1) {
			results = results.concat(", ", diceResult.toString());
		}

		if (diceResult == 5 || diceResult == 6) {
			successes++;
		}
		if (diceResult == 1) {
			glitches++;
		}

	}
	results = results.concat("\}");
	results = results.concat("\n", "Successes: ", successes.toString());
	results = results.concat("\n", "Glitches: ", glitches.toString());
	results = results.concat("\n", "Sum: ", sum.toString());
	results = results.concat("```");

	return results;
}

//###ROLL DICE SUM###
function rollDiceSum(diceNum, diceSide) {
	var results = "```\nResults: ";
	var sum = 0;
	var diceResult = 0;

	for (var i = 0; i < diceNum; i++) {
		diceResult = Math.floor((Math.random() * diceSide) + 1);
		sum += diceResult;

		if (i == 0) {
			results = results.concat("\{", diceResult.toString());
		} else if (i != 0 && i != diceNum - 1) {
			results = results.concat(", ", diceResult.toString());
		} else if (i == diceNum - 1) {
			results = results.concat(", ", diceResult.toString());
		}
	}
	results = results.concat("\}");
	results = results.concat("\n", "Sum: ", sum.toString());
	results = results.concat("```");

	return results;
}

//###PICK A CARD###
function pickACard() {
	var results = "```\n";
	var cardSuit = Math.floor((Math.random() * 4) + 1);
	var cardID = Math.floor((Math.random() * 13) + 1);

	switch (cardID) {
		case 1: results = results.concat("Ace");
			break;
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
		case 7:
		case 8:
		case 9:
		case 10: results = results.concat(cardID.toString());
			break;
		case 11: results = results.concat("Jack");
			break;
		case 12: results = results.concat("Queen");
			break;
		case 13: results = results.concat("King");
	}
	switch (cardSuit) {
		case 1: results = results.concat(" of Spades");
			break;
		case 2: results = results.concat(" of Hearts");
			break;
		case 3: results = results.concat(" of Clubs");
			break;
		case 4: results = results.concat(" of Diamonds");
	}
	results = results.concat("```");

	return results;
}

//###FLIP A COIN###
function flipACoin() {
	var results = "```\n";
	var coinSide = Math.floor((Math.random() * 2) + 1);

	switch (coinSide) {
		case 1: results = results.concat("Heads");
			break;
		case 2: results = results.concat("Tails");
	}

	results = results.concat("```");

	return results;
}

//###FLIP A REAL COIN###
function flipARealCoin() {
	var coinSide = Math.floor((Math.random() * 2) + 1);

	switch (coinSide) {
		case 1: results = haggisBotPath + "quarter-coin-head.jpg";
			break;
		case 2: results = haggisBotPath + "half-dollar-coin-tail.jpg";
	}


	return results;
}

//###ADD MUSIC###
function addMusic(link, name) {
	var autoplaylistContent = fs.readFileSync(autoplaylist, encoding = 'utf8');
	var autoplaylistArray = autoplaylistContent.split("\r\n");
	var musicBlacklistContent = fs.readFileSync(musicBlacklist, encoding = 'utf8');
	var musicBlacklistArray = musicBlacklistContent.split("\r\n");
	var songExists = false;
	var songBlacklisted = false;

	for (i = 0; i < musicBlacklistArray.length; i++) {
		if (musicBlacklistArray[i] == link) {
			songBlacklisted = true;

			results = "Song blacklisted, fuck off";
		}
	}

	for (i = 0; i < autoplaylistArray.length; i++) {
		if (autoplaylistArray[i] == link) {
			songExists = true;

			results = "Song already exists";
		}
	}

	if (songExists == false && songBlacklisted == false) {
		fs.appendFileSync(autoplaylist, link + '\r\n', encoding = 'utf8');

		results = "Song added to autoplaylist";

		sendDiscordMessage(haggisDiscordID, [name + " added " + link + " to autoplay list"]);
	}

	return results;
}

//###STEVE BUSCEMI###
function steveBuscemi() {
	var steveFolder = haggisBotPath + "steveBuscemi/";
    var files = fs.readdirSync(steveFolder);

	fileList = [];

    for (var i in files) {
        if (!files.hasOwnProperty(i)) continue;
        var name = steveFolder + '/' + files[i];
        if (!fs.statSync(name).isDirectory()) {
            fileList.push(name);
        }
    }

	var imageID = Math.floor((Math.random() * fileList.length) + 1);
	return fileList[imageID];
}

//###ADAM###
function adamClick() {
	var adamFolder = haggisBotPath + "adamClick/";
    var files = fs.readdirSync(adamFolder);

	fileList = [];

    for (var i in files) {
        if (!files.hasOwnProperty(i)) continue;
        var name = adamFolder + '/' + files[i];
        if (!fs.statSync(name).isDirectory()) {
            fileList.push(name);
        }
    }

	var imageID = Math.floor((Math.random() * fileList.length) + 1);
	return fileList[imageID];
}

//###QUINNLAN###
function qubeyPitts() {
	var qFolder = haggisBotPath + "Quinnlan/";
    var files = fs.readdirSync(qFolder);

	fileList = [];

    for (var i in files) {
        if (!files.hasOwnProperty(i)) continue;
        var name = qFolder + '/' + files[i];
        if (!fs.statSync(name).isDirectory()) {
            fileList.push(name);
        }
    }

	var imageID = Math.floor((Math.random() * fileList.length) + 1);
	return fileList[imageID];
}

//###DICKBUTT###
function richardKiester() {
	var dickbuttFolder = haggisBotPath + "DickButt/"
	var files = fs.readdirSync(dickbuttFolder);

	fileList = [];

    for (var i in files) {
        if (!files.hasOwnProperty(i)) continue;
        var name = dickbuttFolder + '/' + files[i];
        if (!fs.statSync(name).isDirectory()) {
            fileList.push(name);
        }
    }

	var imageID = Math.floor((Math.random() * fileList.length) + 1);
	return fileList[imageID];
}