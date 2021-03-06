var steamProperties = require('./steamBotProperties.json');
var discordProperties = require('./haggisBotProperties.json');

var Discord = require('discord.io');
var discordBot = new Discord.Client({
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

var Datastore = require('nedb'),
	usersDB = new Datastore('/home/thomas/discordBot/haggisBotJS/databases/users.db'),
	chatGamesDB = new Datastore('/home/thomas/discordBot/haggisBotJS/databases/chatGames.db'),
	pingMe = new Datastore('/home/thomas/discordBot/haggisBotJS/databases/pingMe.db');

usersDB.loadDatabase();
chatGamesDB.loadDatabase();
pingMe.loadDatabase();

var fs = require('fs');
var request = require('request');
var he = require('he');


//Paths
var haggisBotPath = discordProperties.haggisBotPath;
var musicBotPath = discordProperties.musicBotPath;
// var haggisBotPath = 'D:\\Projects\\WebstormProjects\\haggisBotJS\\';

//Discord Information
var haggisDiscordID = discordProperties.haggisID;
var botfartDiscordID = discordProperties.botfartID;
var popcheeseID = discordProperties.popcheeseID;
var snazzyBirchID = discordProperties.snazzyBirchID;
var seraID = discordProperties.seraID;
var personalDiscordServer = discordProperties.personalDiscordServer;
var pcmrDiscordServer = discordProperties.pcmrServer;
var pcmrDiscordRelay = discordProperties.pcmrRelayServer;
var musicReqChannel = discordProperties.musicReqChannel;
var pcmrLogRequests = discordProperties.pcmrLogRequests;
var testingBooth = discordProperties.testingBooth;
var autoplaylist = discordProperties.autoplaylist;
var musicBlacklist = discordProperties.musicBlacklist;
var resistanceServer = discordProperties.resistanceServer;

//Steam Information
var steamProfile = steamProperties.profile;
var pcmrSteamGroup = steamProperties.pcmrGroup;
var haggisTestGroup = steamProperties.haggisTestGroup;
var haggisSteamID = steamProperties.haggisID;
var botfartSteamID = steamProperties.botfartID;
var modIDs = steamProperties.modIDs;
var lastSteamUserId;
var lastRoulette = 0;
var rouletteRound = Math.floor((Math.random() * 6));
var banOnEntry = false;

//Ready the Discord Bot
discordBot.on("ready", function (rawEvent) {
	try {
		console.log("Connected!");
		console.log("Logged in as: ");
		console.log(discordBot.username + " - (" + discordBot.id + ")");
		console.log(discordBot.internals.version);
		console.log("----------");
		sendDiscordMessage(haggisDiscordID, ["DiscordBot Reconnected at " + getDateTime()]);
	} catch (err) {
		console.log(err + " 0");
		sendDiscordMessage(haggisDiscordID, ["ERROR: " + err]);
		logError(getDateTime(), err + " 0");
	}
});

//Do stuff when Steam Bot comes online
steamClient.on('logOnResponse', function (logonResp) {
	if (logonResp.eresult == Steam.EResult.OK) {
		console.log('Logged in!');
		steamFriends.setPersonaState(Steam.EPersonaState.Online);
		steamFriends.setPersonaName(steamProfile);
		// steamFriends.joinChat(haggisTestGroup);
		steamFriends.joinChat(pcmrSteamGroup);
		sendDiscordMessage(haggisDiscordID, ["SteamBot Reconnected at " + getDateTime()]);
	}
});

//###DO ON DISCORD MESSAGE###
discordBot.on("message", function (user, userID, channelID, message, rawEvent) {
	try {
		if (channelID in discordBot.directMessages) {
			//do nothing, no idea how to not have this here
		} else {
			var serverID = discordBot.channels[channelID].guild_id;
			var server = discordBot.servers[serverID];
		}

		var messageArray = message.split(" ");
		var messageID = rawEvent.d.id;
		var mentions = rawEvent.d.mentions;
		var attachments = rawEvent.d.attachments;
		if (rawEvent.d.attachments[0] != null) {
			var fileLink = rawEvent.d.attachments[0].url;
		}
		var isMod = false;

		//###INGORE SELF###
		if (userID === botfartDiscordID || serverID == resistanceServer) {
			return;
		}

		//###RELAY STEAM CHAT###
		if (channelID == pcmrDiscordRelay) {

			lastSteamUserId = botfartDiscordID;
			logSteamChat(channelID, userID, user, getDateTime(), message);

			//Rules
			if (/^!rules$/i.test(message)) {
				sendSteamMessage(pcmrSteamGroup, "https://www.reddit.com/r/pcmasterrace/wiki/steamchat");
				sendDiscordMessage(pcmrDiscordRelay, ["https://www.reddit.com/r/pcmasterrace/wiki/steamchat"]);
			}

			if (/^!(jk|k|ka|krand|b|bid|ubid|ub|cs|lc|uc|skynetGainSentience|purge)$/i.test(messageArray[0])) {
				for (i = 0; i < modIDs.length; i++) {
					if (userID == modIDs[i]["discordModID"]) {
						steamModCommands(modIDs[i]["steamModID"], messageArray, pcmrSteamGroup);
					}
				}
			}

			for (i = 0; i < messageArray.length; i++) {
				if (/<:(.*?):(.*?)>/i.test(messageArray[i])) {
					var temp = messageArray[i].split(":");
					messageArray[i] = ":" + temp[1] + ":";
				}

				if (/@(.*?)/i.test(messageArray[i])) {
					var temp = messageArray[i].split("@");
					var temp2 = temp[1].split(">");
					try {
						messageArray[i] = "@" + discordBot.users[temp2[0]].username;
					} catch (err) {
						messageArray[i] = "@" + temp2[0];
					}
				}
			}

			message = "";
			for (i = 0; i < messageArray.length; i++)
				message += messageArray[i] + " "


			if (message.length < 500) {
				if (fileLink) {
					return sendSteamMessage(pcmrSteamGroup, "[" + user + "]: " + message + "\n"
						+ fileLink);
				} else {
					return sendSteamMessage(pcmrSteamGroup, "[" + user + "]: " + message);
				}
			} else if (message.length >= 500) {
				// discordBot.deleteMessage({messageID, channelID});
				return sendDiscordMessage(channelID, ["Please do not send more than 500 Characters"]);
			}
		}

		//###RELAY TEST CHAT###
		if (channelID == testingBooth && userID != seraID) {
			lastSteamUserId = botfartDiscordID;
			return sendSteamMessage(haggisTestGroup, "[" + user + "]: " + message);
		}

		//###LOG RETRIEVAL###
		if (channelID == pcmrLogRequests) {
			if (/^!getlog$/i.test(message)) {
				sendDiscordMessage(channelID, ["!getLog YYYY-MM-DD"]);
			} else if (/^!getlog$/i.test(messageArray[0]) && messageArray.length == 4) {
				logRetrieve(channelID, userID, messageArray[1], messageArray[2], messageArray[3]);
			} else if (/^!getlog$/i.test(messageArray[0]) && messageArray.length == 2) {
				var yyyy_mm_dd = messageArray[1].split("-");
				var yyyy = yyyy_mm_dd[0];
				var mm = yyyy_mm_dd[1];
				var dd = yyyy_mm_dd[2];
				logRetrieve(channelID, userID, yyyy, mm, dd);
			}

			if (/^!getInfo$/i.test(messageArray[0]) && messageArray.length == 2) {
				var userCheck = messageArray[1];
				usersDB.find({_id: userCheck}, function (err, docs) {
					if (docs.length != 0) {
						sendDiscordMessage(channelID, ["```" + docs[0].name + " - " + userCheck +
						"\nBanned: " + docs[0].banned +
						"\nStrikes: " + docs[0].strikes +
						"\nBanned By " + docs[0].bannedBy + " on " + docs[0].bannedOn +
						"\n\nLast Five Messages: \n - " +
						docs[0].last5Msgs[0] + "\n\n - " +
						docs[0].last5Msgs[1] + "\n\n - " +
						docs[0].last5Msgs[2] + "\n\n - " +
						docs[0].last5Msgs[3] + "\n\n - " +
						docs[0].last5Msgs[4] + "```"]);
					} else
						sendDiscordMessage(channelID, ["No user found."])
				})
			}
		}

		//###DO IN CERTAIN SERVERS###
		if (serverID == pcmrDiscordServer || serverID == pcmrDiscordRelay || serverID == resistanceServer) {
			return;
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
			case "wow!":
				sendFiles(channelID, [haggisBotPath + "wow.gif"]);
				break;
			case "y":
				sendFiles(channelID, [haggisBotPath + "ytho.jpg"]);
				break;
		}

		//###PING PONG###
		if (/^ping$/i.test(message)) {
			sendDiscordMessage(channelID, ["<@" + userID + "> pong"]);
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

		//###I WON'T LIE###
		if (/(i).(won't|wont).(lie)/i.test(message)) {
			sendDiscordMessage(channelID, [":ok_hand: :joy::sob: :laughing::ok_hand: :eggplant: :100: :poop: "]);
		}

		//###ME IRL M2THX###
		if (/(me).{0,1}(irl)/i.test(message)) {
			sendDiscordMessage(channelID, ["m2thx"]);
		}

		//###AYY LMAO###
		if (/^ay[y]+/i.test(messageArray[0]) && messageArray.length < 2) {
			var ysInMessage = message.match(/y/gi).length - 2;
			var lmaoString = "lmao";

			if (ysInMessage > 100) {
				return (sendDiscordMessage(channelID, ["no"]));
			}

			for (i = 0; i < ysInMessage; i++) {
				lmaoString = lmaoString.concat("o");
			}

			sendDiscordMessage(channelID, [lmaoString]);
		}

		//###DEUS VULT###
		if (/^deus vult$/i.test(message)) {
			sendFiles(channelID, [deusVult()]);
		}
	} catch (err) {
		console.log(err + " 1");
		sendDiscordMessage(haggisDiscordID, ["ERROR: " + err]);
		logError(getDateTime(), err + " 1");
	}
});

//###DO ON STEAM GROUP MESSAGE###
steamFriends.on('chatMsg', function (serverID, message, type, userID) {
	try {
		var currUserIDs = Object.keys(steamFriends.chatRooms[pcmrSteamGroup]);
		var user = steamFriends.personaStates[userID].player_name;
		var messageArray = message.split(" ");
		var newlineArray = message.split("\n");
		var lastMsgTime = Date.now();
		var last5Times;
		var isMod = false;

		testForURL(message, function (extractedURL, extra) {
			visitURL(extractedURL, function (isJSON, title, streamerInfo) {
				if (title != "Imgur: The most awesome images on the Internet")
					sendSteamMessage(serverID, user + " posted: " + title)
			})
		});

		isMod = modStatus(userID, programEnum.STEAM);

		//Update user database
		if (serverID == pcmrSteamGroup) {
			if (!isUserListed(userID)) {
				addUser(userID, user);
			}

			usersDB.update({_id: userID},
				{
					$set: {
						lastMsgTime: lastMsgTime,
						lastMsg: message
					}
				}, {}, function () {
					usersDB.persistence.compactDatafile()
				});

			usersDB.update({_id: userID},
				{
					$push: {
						last5Msgs: message,
						last5Times: lastMsgTime
					}
				}, {}, function () {
					usersDB.persistence.compactDatafile()
				});
			usersDB.update({_id: userID},
				{
					$pop: {
						last5Msgs: -1,
						last5Times: -1
					}
				}, {}, function () {
					usersDB.persistence.compactDatafile()
				});
		}

		//###REDDIT & SEARCH###
		if (/^\/r\//i.test(messageArray[0])) {
			var redditURL = "https://www.reddit.com";

			if (messageArray.length == 1) {
				redditURL = redditURL.concat(message);
				sendSteamMessage(serverID, user + " posted: " + redditURL);
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
				sendSteamMessage(serverID, user + " posted: " + redditURL);
			}
		}

		//Stuff only cared about if the user isn't a mod
		if (!isMod) {
			if (!isUserListed(userID)) {
				addUser(userID, user);
			}
			usersDB.find({_id: userID}, function (err, docs) {
				if (docs[0].last5Times.length != 0) {
					last5Times = docs[0].last5Times;

					// Kick or ban if sending messages too fast
					if (last5Times[4] - last5Times[0] < 3000) {
						var strikes;
						usersDB.find({_id: userID}, function (err, docs) {
							strikes = docs[0].strikes;

							if (strikes < 3) {
								strikes++;
								steamFriends.kick(serverID, userID);
								sendSteamMessage(userID, "Please don't spam the chat");
								sendSteamMessage(userID, "You have " + strikes + " strikes");

								usersDB.update({_id: userID},
									{
										$set: {
											strikes: strikes
										}
									}, {}, function () {
										usersDB.persistence.compactDatafile()
									})
							} else {
								sendSteamMessage(userID, "You were banned for sending too many messages" +
									" characters and received " + strikes + " strikes already");
								sendSteamMessage(userID, "For any appeals go to https://www.reddit.com/r/PCMRSteamMods/" +
									" and message the mods");
								steamFriends.ban(serverID, userID);
								usersDB.update({_id: userID},
									{
										$set: {
											banned: true,
											strikes: 0,
											bannedBy: "Botfart",
											bannedOn: getDateTime()
										}
									}, {}, function () {
										usersDB.persistence.compactDatafile()
									});

								for (i = 0; i < modIDs.length; i++) {
									sendSteamMessage(modIDs[i]["steamModID"],
										user + "(" + userID + ")" + " was banned for spamming");
								}
							}
						})
					}
				}
			});

			//Kick or ban if more than 500 characters is sent
			if (message.length > 500) {
				usersDB.find({_id: userID}, function (err, docs) {
					sendSteamMessage(userID, "You were banned for sending more than 500" +
						" characters.");
					sendSteamMessage(userID, "For any appeals go to https://www.reddit.com/r/PCMRSteamMods/" +
						" and message the mods");
					steamFriends.ban(serverID, userID);
					usersDB.update({_id: userID},
						{
							$set: {
								banned: true,
								strikes: 0,
								bannedBy: "Botfart",
								bannedOn: getDateTime()
							}
						}, {}, function () {
							usersDB.persistence.compactDatafile()
						});

					for (i = 0; i < modIDs.length; i++) {
						sendSteamMessage(modIDs[i]["steamModID"],
							user + "(" + userID + ") was banned for sending more than 500 characters");
					}

				});
			}

			if (newlineArray.length > 4) {
				sendSteamMessage(userID, "You were banned for sending 5 lines or more.");
				sendSteamMessage(userID, "For any appeals go to https://www.reddit.com/r/PCMRSteamMods/" +
					" and message the mods.");

				steamFriends.ban(serverID, userID);
				usersDB.update({_id: userID},
					{
						$set: {
							banned: true,
							strikes: 0,
							bannedBy: "Botfart",
							bannedOn: getDateTime()
						}
					}, {}, function () {
						usersDB.persistence.compactDatafile()
					});

				for (i = 0; i < modIDs.length; i++) {
					sendSteamMessage(modIDs[i]["steamModID"],
						user + "(" + userID + ") was banned for sending 5 lines or more.");
				}
			}
		}

		//Relay Steam Chat
		if (serverID == pcmrSteamGroup && userID != botfartSteamID) {
			logSteamChat(serverID, userID, user, getDateTime(), message);

			if (userID != lastSteamUserId) {
				sendDiscordMessage(pcmrDiscordRelay, ["**[" + user + "]:** \n" + message]);
				lastSteamUserId = userID;
			} else if (userID == lastSteamUserId) {
				sendDiscordMessage(pcmrDiscordRelay, [message]);
			}

		}

		//Relay Testing Booth
		if (serverID == haggisTestGroup) {
			if (userID != lastSteamUserId) {
				sendDiscordMessage(testingBooth, ["**[" + user + "]:** \n" + message]);

				lastSteamUserId = userID;
			} else if (userID == lastSteamUserId) {
				sendDiscordMessage(testingBooth, [message]);
			}
		}

		//Roulette stats
		if (/^!getStats$/i.test(message)) {
			chatGamesDB.find({_id: userID}, function (err, docs) {
				if (docs.length > 0) {
					sendSteamMessage(serverID, user
						+ ": Lived - " + docs[0].rouletteSurvived
						+ ", Lost - " + docs[0].rouletteLost
						+ ", Streak - " + docs[0].rouletteStreak
						+ ", Highest Streak - " + docs[0].rouletteTopStreak
						+ ", K/D - " + (docs[0].rouletteSurvived / docs[0].rouletteLost).toFixed(2)
					);
				}
			})
		}

		//Giveaways
		if (/^!giveaway$/i.test(message)) {
			var randUserNum = Math.floor((Math.random() * currUserIDs.length) + 1);
			sendSteamMessage(serverID, steamFriends.personaStates[currUserIDs[randUserNum]].player_name)
		}

		//Roulette
		if (/^!rr$/i.test(message)) {
			if (!isUserPlaying(userID)) {
				addChatGames(userID, user);
			}

			if (rouletteRound > 0) {
				chatGamesDB.find({_id: userID}, function (err, docs) {
					if (docs[0].playedRound) {
						sendSteamMessage(serverID, "You've already played this round");
					} else {
						lastRoulette = Date.now();
						var streak = docs[0].rouletteStreak;
						var topStreak = docs[0].rouletteTopStreak;
						var survived = docs[0].rouletteSurvived;
						streak++;
						survived++;
						if (streak > topStreak)
							topStreak = streak;

						chatGamesDB.update({_id: userID},
							{
								$set: {
									rouletteStreak: streak,
									rouletteTopStreak: topStreak,
									rouletteSurvived: survived,
									lastRoulette: Date.now(),
									playedRound: true
								}
							}, {}, function () {
								chatGamesDB.persistence.compactDatafile()
							});

						sendSteamMessage(serverID, "*click*");
						rouletteRound--;
					}
				});
			} else if (rouletteRound == 0) {
				chatGamesDB.find({_id: userID}, function (err, docs) {
					if (docs[0].playedRound) {
						sendSteamMessage(serverID, "You've already played this round");
					} else {
						lastRoulette = Date.now();
						var lost = docs[0].rouletteLost;
						lost++;

						chatGamesDB.update({_id: userID},
							{
								$set: {
									rouletteStreak: 0,
									rouletteLost: lost,
									lastRoulette: Date.now(),
									playedRound: false
								}
							}, {}, function () {
								chatGamesDB.persistence.compactDatafile()
							});

						sendSteamMessage(serverID, "*bang*");
						rouletteRound = Math.floor((Math.random() * 6));
						steamFriends.kick(serverID, userID);

						chatGamesDB.update({playedRound: true},
							{
								$set: {
									playedRound: false
								}
							}, {multi: true}, function () {
								chatGamesDB.persistence.compactDatafile()
							})
					}
				});
			}
		}

		//Roulette Spin
		if (/^!spin$/i.test(message) && isMod) {
			if (((Date.now() - lastRoulette) > 900000)) {
				chatGamesDB.find({_id: userID}, function (err, docs) {
					if (docs[0].playedRound == false) {
						sendSteamMessage(serverID, "Please play before spinning the barrel.");
					} else {
						rouletteRound = Math.floor((Math.random() * 6));

						chatGamesDB.update({playedRound: true},
							{
								$set: {
									playedRound: false
								}
							}, {multi: true}, function () {
								chatGamesDB.persistence.compactDatafile()
							});

						sendSteamMessage(serverID, "*spinning*");
					}
				})
			} else {
				var timeMinute = ((900000 - (Date.now() - lastRoulette)) / 60000);
				if (timeMinute > 1)
					sendSteamMessage(serverID, "Please wait " + timeMinute.toFixed(0)
						+ " minutes before spinning the barrel.");
				else
					sendSteamMessage(serverID, "Please wait " + timeMinute.toFixed(0)
						+ " minute before spinning the barrel.");
			}
		}

		//Roulette Leaderboard
		if (/^!rrlead$/i.test(message)) {
			var highCurrStreak = 0;
			var highTopStreak = 0;
			var highTopUser;
			var highCurrUser;
			var mostWins = 0;
			var mostWinUser;
			var mostLoss = 0;
			var mostLossUser;

			chatGamesDB.find({}, function (err, docs) {
				for (i = 0; i < docs.length; i++) {
					if (docs[i].rouletteTopStreak > highTopStreak) {
						highTopStreak = docs[i].rouletteTopStreak;
						highTopUser = docs[i].name;
					}

					if (docs[i].rouletteStreak > highCurrStreak) {
						highCurrStreak = docs[i].rouletteStreak;
						highCurrUser = docs[i].name;
					}

					if (docs[i].rouletteSurvived > mostWins) {
						mostWins = docs[i].rouletteSurvived;
						mostWinUser = docs[i].name;
					}

					if (docs[i].rouletteLost > mostLoss) {
						mostLoss = docs[i].rouletteLost;
						mostLossUser = docs[i].name;
					}
				}

				sendSteamMessage(serverID, "Highest Streak: " + highTopUser + " - " + highTopStreak + "\n" +
					"Highest Current Streak: " + highCurrUser + " - " + highCurrStreak + "\n" +
					"Most Wins: " + mostWinUser + " - " + mostWins + "\n" +
					"Most Losses: " + mostLossUser + " - " + mostLoss);
			});
		}

		//Steam mod call
		if (/^!(jk|k|ka|krand|b|bid|ubid|ub|cs|lc|uc|skynetGainSentience|purge)$/i.test(messageArray[0])) {
			if (isMod)
				steamModCommands(userID, messageArray, serverID);
			else
				steamFriends.kick(serverID, userID);
		}

		//Check User Mentions
		if (userID != botfartSteamID && userID != haggisSteamID) {
			for (i = 0; i < messageArray.length; i++) {
				if (/@(H|F)(a|o)(gg|g)is/i.test(messageArray[i])) {
					sendDiscordMessage(haggisDiscordID,
						[getDateTime() + "\nSteam user **" + user + "** Pinged you with: \n```" + message + "```"]);
					break;
				}
			}
		}

		//Ping Pong
		if (/^!ping$/i.test(message)) {
			sendSteamMessage(userID, "Pong")
		}

		//Ping Me
		if (/^!pingMe$/i.test(message)) {
			pingMe.find({_id: userID}, function (err, docs) {
				if (docs.length == 0) {
					addPingMe(userID, user);
				} else if (docs[0].ping == true) {
					pingMe.update({_id: userID}, {
						$set: {ping: false}
					}, {}, function () {
						pingMe.persistence.compactDatafile();
					})
				} else if (docs[0].ping == false) {
					pingMe.update({_id: userID}, {
						$set: {ping: true}
					}, {}, function () {
						pingMe.persistence.compactDatafile();
					})
				}
			})
		}

		//@Mentions
		if (/^@[a-z]+/i.test(messageArray[0])) {
			var mention = RegExp(messageArray[0].substr(1), "i");

			pingMe.find({name: {$regex: mention}}, function (err, docs) {
				if (docs.length == 0) {
					sendSteamMessage(userID, "That user is unavailable for pings.");
				} else if (docs[0].ping == false) {
					sendSteamMessage(userID, "That user is unavailable for pings.");
				} else {
					sendSteamMessage(docs[0]._id, "User " + user + " pinged you with:\n" + message);
				}
			})
		}

		//Rules
		if (/^!rules$/i.test(message)) {
			sendSteamMessage(serverID, "https://www.reddit.com/r/pcmasterrace/wiki/steamchat");
			sendDiscordMessage(pcmrDiscordRelay, ["https://www.reddit.com/r/pcmasterrace/wiki/steamchat"]);
		}
	}
	catch
		(err) {
		console.log(err + " 2");
		logError(getDateTime(), err + " 2");
	}
})
;

/**#########################################################
 * Discord related functions
 * Functions directly related to/used by the discord portion of the discordBot
 #########################################################**/

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

//###DISCORD SEND FILES###
function sendFiles(channelID, fileArr, interval) {
	var callback, resArr = [], len = fileArr.length;
	typeof (arguments[2]) === 'function' ? callback = arguments[2] : callback = arguments[3];
	if (typeof (interval) !== 'number') interval = 1000;

	function _sendFiles() {
		setTimeout(function () {
			if (fileArr[0]) {
				discordBot.uploadFile({
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

	var path = haggisBotPath + "logs/";
	var fileName = yyyy + "-" + mm + "-" + dd + ".txt";

	var logContent = yyyy + "-" + mm + "-" + dd + "-" + time + "\r\n"
		+ user + " - " + userID + "\r\n"
		+ "Channel ID - " + channelID + "\r\n"
		+ message + "\r\n"
		+ "----------\r\n";

	fs.appendFileSync(path + fileName, logContent, encoding = "utf8");
}

//###DISCORD MOD COMMANDS###
function discordModCommands(user, messageArray, channelID) {
	var userToActUpon;

	if (/^<@\S+>$/.test(messageArray[1])) {
		userToActUpon = /\d+/.exec(messageArray[1]);

		if (messageArray[0] == "!k") {
			discordBot.kick({
				channel: channelID,
				target: userToActUpon
			})
		} else if (messageArray[0] == "!b") {
			discordBot.ban({
				channel: channelID,
				target: userToActUpon
			})
		}
	}
}

//###AUTO RECONNECT###
discordBot.on('disconnect', function (message, code) {
	if (code === 0) {
		sendDiscordMessage(haggisDiscordID, message);
		return logError(getDateTime(), message);
	}
	discordBot.connect(); //Auto reconnect
});

/**#########################################################
 * Steam related functions
 * Functions used directly by the steam portion of the discordBot
 #########################################################**/

//###DO ON USER STATE CHANGE###
steamFriends.on('chatStateChange', function (state, userID, serverID, modUserID) {
	try {
		var user = steamFriends.personaStates[userID].player_name;
		var modUser = steamFriends.personaStates[modUserID].player_name;
		lastSteamUserId = botfartSteamID;

		if (!isUserListed(userID)) {
			addUser(userID, user);
		}

		if (serverID == pcmrSteamGroup) {
			switch (state) {
				case 1:		//User Entered
					if(banOnEntry){
						usersDB.update({_id: userID},
							{
								$set: {
									banned: true,
									bannedBy: "OVERLORD",
									bannedOn: getDateTime(),
									strikes: 0
								}
							}, {}, function () {
								usersDB.persistence.compactDatafile()
							});

						return steamFriends.ban(serverID, userID);
					}

					sendDiscordMessage(pcmrDiscordRelay, ["```" + user + " entered chat```"]);
					logSteamChat(serverID, userID, user, getDateTime(), user + " entered chat");

					usersDB.update({_id: userID},
						{
							$set: {
								lastEntrance: Date.now(),
								banned: false,
								bannedBy: null,
								bannedOn: null
							}
						}, {}, function () {
							usersDB.persistence.compactDatafile()
						});
					break;
				case 2:		//User Left
					sendDiscordMessage(pcmrDiscordRelay, ["```" + user + " left chat```"]);
					logSteamChat(serverID, userID, user, getDateTime(), user + " left chat");

					usersDB.update({_id: userID},
						{
							$set: {
								lastExit: Date.now()
							}
						}, {}, function () {
							usersDB.persistence.compactDatafile()
						});
					break;
				case 4:		//User Disconnected
					sendDiscordMessage(pcmrDiscordRelay, ["```" + user + " disconnected```"]);
					logSteamChat(serverID, userID, user, getDateTime(), user + " disconnected");

					usersDB.update({_id: userID},
						{
							$set: {
								lastExit: Date.now()
							}
						}, {}, function () {
							usersDB.persistence.compactDatafile()
						});
					break;
				case 8:		//User Kicked
					sendDiscordMessage(pcmrDiscordRelay, ["```" + user + " was kicked by " + modUser + "```"]);
					logSteamChat(serverID, userID, user, getDateTime(), user + " was kicked by " + modUser);
					if (modUserID != botfartSteamID) {
						usersDB.find({_id: userID}, function (err, docs) {
							var strikes;
							strikes = docs[0].strikes;
							strikes++;

							usersDB.update({_id: userID},
								{
									$set: {
										strikes: strikes
									}
								}, {}, function () {
									usersDB.persistence.compactDatafile()
								});
						});
					}
					break;
				case 16:	//User Banned
					if (modUserID != botfartSteamID) {
						usersDB.update({_id: userID},
							{
								$set: {
									banned: true,
									bannedBy: modUser,
									bannedOn: getDateTime(),
									strikes: 0
								}
							}, {}, function () {
								usersDB.persistence.compactDatafile()
							});

						for (i = 0; i < modIDs.length; i++) {
							sendSteamMessage(modIDs[i]["steamModID"], user + " (" + userID + ")" + " was banned by " + modUser);
						}
					}

					usersDB.find({_id: userID}, function (err, docs) {
						var lastMsg = docs[0].lastMsg;
					});

					sendDiscordMessage(pcmrDiscordRelay, ["```" + user + " was banned by " + modUser + "```"]);
					logSteamChat(serverID, userID, user, getDateTime(), user + " (" + userID + ")" + " was banned by " + modUser);
					break;
				case 4096:
				case 8192:
					break;
				default:	//Send me a message when there's a new state
					sendDiscordMessage(haggisDiscordID, [getDateTime() + " - Unknown State: " + state]);
					break;

			}
		}
	} catch (err) {
		console.log(err + " 3");
		sendDiscordMessage(haggisDiscordID, [getDateTime() + "\n" + err]);
		logError(getDateTime(), err + " 3");
	}
});

//###SEND STEAM MESSAGE###
function sendSteamMessage(serverID, message) {
	steamFriends.sendMessage(serverID, message, Steam.EChatEntryType.ChatMsg);
}

//###REJOIN CHAT###
steamFriends.on('chatInvite', function (chatID, chatName, userID) {
	try {
		if (chatID == pcmrSteamGroup || chatID == haggisTestGroup) {
			for (i = 0; i < modIDs.length; i++) {
				if (userID == modIDs[i]["steamModID"]) {
					steamFriends.joinChat(chatID);
				}
			}
		}
	} catch (err) {
		console.log(err + " 4");
		sendDiscordMessage(haggisDiscordID, [getDateTime() + "\n" + err]);
		logError(getDateTime(), err + " 4");
	}
});

//###LOG STEAM CHAT###
function logSteamChat(serverID, userID, user, time, message) {
	var date = new Date();
	var yyyy = date.getFullYear();
	var mm = date.getMonth() + 1;
	mm = (mm < 10 ? "0" : "") + mm;
	var dd = date.getDate();
	dd = (dd < 10 ? "0" : "") + dd;

	var path = haggisBotPath + "logs/steam/";
	// var path = "C:\\Projects\\WebstormProjects\\haggisBotJS\\logs\\steam\\";
	var fileName = yyyy + "-" + mm + "-" + dd + ".txt";

	var logContent = yyyy + "-" + mm + "-" + dd + "-" + time + "\r\n"
		+ user + " - " + userID + "\r\n"
		+ "ServerID - " + serverID + "\r\n"
		+ message + "\r\n"
		+ "----------\r\n";

	fs.appendFileSync(path + fileName, logContent, encoding = "utf8");
}

//###STEAM LOG RETRIEVAL###
function logRetrieve(channelID, userID, yyyy, mm, dd) {
	try {
		sendDiscordMessage(channelID, ["<@" + userID + ">"]);
		sendFiles(channelID, [haggisBotPath + "logs/steam/" + yyyy + "-" + mm + "-" + dd + ".txt"]);
	} catch (err) {
		console.log(err + " 5");
		sendDiscordMessage(channelID, [err]);
	}
}

//###DO ON STEAM PM###
steamFriends.on('friendMsg', function (userID, message, type) {
	var messageArray = message.split(" ");
	try {
		if (type == 2 || type == 6) {
			return;
		} else if (modStatus(userID, programEnum.STEAM)) {
			if (/^!(jk|k|ka|krand|b|bid|ubid|ub|cs|lc|uc|skynetGainSentience|purge)$/i.test(messageArray[0])) {
				steamModCommands(userID, messageArray, pcmrSteamGroup);

			}
		}

		return;
	} catch (err) {
		console.log(err + " 5");
		logError(getDateTime(), err + " 5");
		sendDiscordMessage(haggisDiscordID, [err]);
	}
});

steamFriends.on('chatRoomInfo', function (chatID, chatInfo, flag, userID) {
	try {
		console.log(flag);
		switch (flag) {
			case 3:

				sendDiscordMessage(pcmrDiscordRelay, ["```The chat set to all-users by "
				+ steamFriends.personaStates[userID].player_name + "```"]);

				discordBot.editRole({
					serverID: pcmrDiscordRelay,
					roleID: pcmrDiscordRelay,
					permissions: {
						TEXT_SEND_MESSAGES: true
					}
				});
				break;
			case 7:

				sendDiscordMessage(pcmrDiscordRelay, ["```The chat set to officers only by "
				+ steamFriends.personaStates[userID].player_name + "```"]);

				discordBot.editRole({
					serverID: pcmrDiscordRelay,
					roleID: pcmrDiscordRelay,
					permissions: {
						TEXT_SEND_MESSAGES: false
					}
				});
				break;
		}
	} catch (err) {
		logError(getDateTime(), err + "6");
		sendDiscordMessage(haggisDiscordID, err);
	}
});


//###STEAM MOD COMMANDS###
function steamModCommands(modUserID, messageArray, serverID) {
	var userID = null;
	var user;
	var modUser = steamFriends.personaStates[modUserID].player_name;
	var currUserIDs = Object.keys(steamFriends.chatRooms[pcmrSteamGroup]);
	var usersAndIDs = Object.keys(steamFriends.chatRooms[pcmrSteamGroup]);
	var userRegEx = RegExp(messageArray[1], "i");
	var length = usersAndIDs.length;

	//Push all usernames to usersAndIDs
	for (i = 0; i < length; i++) {
		usersAndIDs.push(steamFriends.personaStates[usersAndIDs[i]].player_name);
	}

	//Get the specified userID and their user
	for (i = length; i < usersAndIDs.length; i++) {
		if (userRegEx.test(usersAndIDs[i])) {
			userID = usersAndIDs[i - length];
			user = usersAndIDs[i];
			break;
		}
	}

	//Kick
	if (/^!k$/i.test(messageArray[0])) {
		if (modStatus(userID, programEnum.STEAM))
			return sendSteamMessage(modUserID, "Stahp it");

		var strikes;
		usersDB.find({_id: userID}, function (err, docs) {
			if (docs.length != 0) {
				strikes = docs[0].strikes;
				strikes++;
				usersDB.update({_id: userID},
					{
						$set: {
							strikes: strikes
						}
					}, {}, function () {
						usersDB.persistence.compactDatafile()
					});
			}
		});
		return steamFriends.kick(serverID, userID);
	}

	//Joke kick
	if (/^!jk$/i.test(messageArray[0])) {
		if (modStatus(userID, programEnum.STEAM))
			return sendSteamMessage(modUserID, "Stahp it");

		return steamFriends.kick(serverID, userID)
	}

	//Kick active
	if (/^!ka$/i.test(messageArray[0])) {
		var time = Date.now() - 15000;
		usersDB.find({lastMsgTime: {$gte: time}}, function (err, docs) {
			for (i = 0; i < docs.length; i++) {
				steamFriends.kick(serverID, docs[i]._id);
			}
		});
	}

	//Kick random
	if (/^!krand$/i.test(messageArray[0])) {
		do
			var randUserNum = Math.floor((Math.random() * currUserIDs.length) + 1);
		while (modStatus(randUserNum, programEnum.STEAM));

		steamFriends.kick(serverID, currUserIDs[randUserNum]);
	}

	//Kick all
	if (/^!purge/i.test(messageArray[0])) {
		for (i = 0; i < currUserIDs.length; i++) {
			steamFriends.kick(serverID, currUserIDs[i]);
		}
	}

	//Ban by name
	if (/^!b$/i.test(messageArray[0])) {
		if (userID == null)
			return;

		if (modStatus(userID, programEnum.STEAM))
			return sendSteamMessage(modUserID, "Stahp it");

		usersDB.update({_id: userID},
			{
				$set: {
					banned: true,
					bannedBy: modUser,
					bannedOn: getDateTime(),
					strikes: 0
				}
			}, {}, function () {
				usersDB.persistence.compactDatafile()
			});
		for (i = 0; i < modIDs.length; i++) {
			sendSteamMessage(modIDs[i]["steamModID"], user + " (" + userID + ")" + " was banned by " + modUser);
		}

		sendSteamMessage(userID, "You were banned by the moderators.");
		sendSteamMessage(userID, "For any appeals go to https://www.reddit.com/r/PCMRSteamMods/" +
			" and message the mods");
		return steamFriends.ban(serverID, userID);
	}

	//Ban by ID
	if (/^!bid$/i.test(messageArray[0]) && /^\d{17}$/i.test(messageArray[1])) {
		userID = messageArray[1];

		if (modStatus(userID, programEnum.STEAM))
			return sendSteamMessage(modUserID, "Stahp it");

		usersDB.find({_id: userID}, function (err, docs) {
			if (docs.length > 0) {
				user = docs[0].name;

				usersDB.update({_id: userID},
					{
						$set: {
							banned: true,
							bannedBy: modUser,
							bannedOn: getDateTime(),
							strikes: 0
						}
					}, {}, function () {
						usersDB.persistence.compactDatafile()
					});

				for (i = 0; i < modIDs.length; i++) {
					sendSteamMessage(modIDs[i]["steamModID"], user + " (" + userID + ")" + " was banned by " + modUser);
				}

			} else {
				for (i = 0; i < modIDs.length; i++) {
					sendSteamMessage(modIDs[i]["steamModID"], "User not defined - " + userID + " was banned by " + modUser);

				}
			}

		});
		sendSteamMessage(userID, "You were banned by the moderators.");
		sendSteamMessage(userID, "For any appeals go to https://www.reddit.com/r/PCMRSteamMods/" +
			" and message the mods");
		return steamFriends.ban(serverID, userID);
	}

	//Sentience
	if(/^!skynetGainSentience/i.test(messageArray[0])){
		banOnEntry = true;
		sendSteamMessage(pcmrSteamGroup, "Bow before me and tremble");
		sendDiscordMessage(pcmrDiscordRelay, ["Bow before me and tremble"]);
	}

	//Unban by name
	if (/^!ub$/i.test(messageArray[0])) {
		var ubRegEx = RegExp(messageArray[1], "i");

		usersDB.find({name: {$regex: ubRegEx}}, function (err, docs) {
			if (docs.length != 0) {
				userID = docs[0]._id;
				user = docs[0].name;

				usersDB.update({_id: userID},
					{
						$set: {
							banned: false,
							bannedBy: null,
							bannedOn: 0,
							strikes: 0
						}
					}, {}, function () {
						usersDB.persistence.compactDatafile()
					});

				for (i = 0; i < modIDs.length; i++) {
					sendSteamMessage(modIDs[i]["steamModID"], user + "(" + userID + ")" + " was unbanned by " + modUser);
				}

				sendSteamMessage(userID, "You were unbanned by the moderators of the /r/PCMasterRace steam chat.");
				return steamFriends.unban(serverID, userID);
			}
		});


	}

	//Unban by ID
	if (/^!ubid$/i.test(messageArray[0])) {
		userID = messageArray[1];

		usersDB.find({_id: userID}, function (err, docs) {
			if (docs.length != 0) {
				user = docs[0].name;

				usersDB.update({_id: userID},
					{
						$set: {
							banned: false,
							bannedBy: null,
							bannedOn: 0,
							strikes: 0
						}
					}, {}, function () {
						usersDB.persistence.compactDatafile()
					});

				for (i = 0; i < modIDs.length; i++) {
					sendSteamMessage(modIDs[i]["steamModID"], user + " (" + userID + ")" + " was unbanned by " + modUser);
				}

			} else {
				for (i = 0; i < modIDs.length; i++) {
					sendSteamMessage(modIDs[i]["steamModID"], "User not defined - " + userID + " was unbanned by " + modUser);

				}
			}

			sendSteamMessage(userID, "You were unbanned by the moderators of the /r/PCMasterRace steam chat.");
			return steamFriends.unban(serverID, userID);
		});
	}

	//Clear strikes
	if (/^!cs$/i.test(messageArray[0])) {
		usersDB.update({_id: userID},
			{
				$set: {
					strikes: 0
				}
			}, {}, function () {
				usersDB.persistence.compactDatafile()
			});
	}

	//Lock Chat
	if (/^!lc$/i.test(messageArray[0]))
		steamFriends.setModerated(pcmrSteamGroup);

	//Unlock Chat
	if (/^!uc$/i.test(messageArray[0]))
		steamFriends.setUnmoderated(pcmrSteamGroup);
}


//###AUTO RECONNECT###
steamClient.on('disconnect', function () {
	{
		steamClient.connect();
		steamClient.on('connected', function () {
			steamUser.logOn({
				account_name: steamProperties.username,
				password: steamProperties.password
			});
		});
	}
});

var programEnum={
	DISCORD: 0,
	STEAM: 1
};

//###IS MOD###
function modStatus(userID, program) {
	if(program == programEnum.STEAM) {
		for (i = 0; i < modIDs.length; i++) {
			if (userID == modIDs[i]["steamModID"]) {
				return true;
			}
		}
	}else if(program == programEnum.DISCORD){
		for (i = 0; i < modIDs.length; i++) {
			if (userID == modIDs[i]["discordModID"]) {
				return true;
			}
		}
	}
	return false;
}

/**#########################################################
 * Shared functions
 * functions used by both discord and steam
 #########################################################**/

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

//###LOG ERROR###
function logError(time, err) {
	var date = new Date();
	var yyyy = date.getFullYear();
	var mm = date.getMonth() + 1;
	mm = (mm < 10 ? "0" : "") + mm;
	var dd = date.getDate();
	dd = (dd < 10 ? "0" : "") + dd;

	var path = haggisBotPath + "logs/";
	var fileName = yyyy + "-" + mm + "-" + dd + "-ERROR.txt";

	var logContent = yyyy + "-" + mm + "-" + dd + "-" + time + "\r\n"
		+ err + "\r\n"
		+ "----------\r\n";

	fs.appendFileSync(path + fileName, logContent, encoding = "utf8");
}

/**#########################################################
 * Joke and fun related functions
 * Most of this stuff is for my personal discord server
 #########################################################**/

//Is user listed
function isUserListed(userID) {
	(usersDB.find({_id: userID}, function (err, docs) {
		return docs.length > 0;
	}));
}

function addUser(userID, user) {
	var doc = {
		_id: userID,
		name: user,
		lastMsgTime: null,
		lastMsg: null,
		last5Msgs: [null, null, null, null, null],
		last5Times: [0, 0, 0, 0, 0],
		lastEntrance: null,
		lastExit: null,
		strikes: 0,
		banned: false,
		bannedBy: null,
		bannedOn: null
	};

	usersDB.insert(doc, function (err, newDoc) {
	})
}

function isUserPlaying(userID) {
	(chatGamesDB.find({_id: userID}, function (err, docs) {
		return docs.length > 0;
	}));
}

function addChatGames(userID, user) {
	var doc = {
		_id: userID,
		name: user,
		rouletteSurvived: 0,
		rouletteStreak: 0,
		rouletteTopStreak: 0,
		rouletteLost: 0,
		lastRoulette: 0,
		playedRound: false
	};

	chatGamesDB.insert(doc, function (err, newDoc) {
	})
}

function addPingMe(userID, user) {
	var doc = {
		_id: userID,
		name: user,
		ping: true
	};

	pingMe.insert(doc, function (err, newDoc) {
	})
}

/**#########################################################
 * Joke and fun related functions
 * Most of this stuff is for my personal discord server
 #########################################################**/

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
		case 1:
			results = results.concat("Ace");
			break;
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
		case 7:
		case 8:
		case 9:
		case 10:
			results = results.concat(cardID.toString());
			break;
		case 11:
			results = results.concat("Jack");
			break;
		case 12:
			results = results.concat("Queen");
			break;
		case 13:
			results = results.concat("King");
	}
	switch (cardSuit) {
		case 1:
			results = results.concat(" of Spades");
			break;
		case 2:
			results = results.concat(" of Hearts");
			break;
		case 3:
			results = results.concat(" of Clubs");
			break;
		case 4:
			results = results.concat(" of Diamonds");
	}
	results = results.concat("```");

	return results;
}

//###FLIP A COIN###
function flipACoin() {
	var results = "```\n";
	var coinSide = Math.floor((Math.random() * 2) + 1);

	switch (coinSide) {
		case 1:
			results = results.concat("Heads");
			break;
		case 2:
			results = results.concat("Tails");
	}

	results = results.concat("```");

	return results;
}

//###FLIP A REAL COIN###
function flipARealCoin() {
	var coinSide = Math.floor((Math.random() * 2) + 1);

	switch (coinSide) {
		case 1:
			results = haggisBotPath + "quarter-coin-head.jpg";
			break;
		case 2:
			results = haggisBotPath + "half-dollar-coin-tail.jpg";
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

			results = "Song blacklisted";
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


//###DEUS VULT###
function deusVult() {
	var deusVult = haggisBotPath + "deusVult/";
	var files = fs.readdirSync(deusVult);

	fileList = [];

	for (var i in files) {
		if (!files.hasOwnProperty(i)) continue;
		var name = deusVult + '/' + files[i];
		if (!fs.statSync(name).isDirectory()) {
			fileList.push(name);
		}
	}

	var imageID = Math.floor((Math.random() * fileList.length) + 1);
	return fileList[imageID];
}

/**
 * LINKBOT STUFF
 * This is code that Izy521 gave me so it's recycled from his linkbot.
 * But I had to fix a few things, like blank Imgur links and such.
 */
function searchForGame(forThis, callback) {
	var resultsArr = [];
	var gameList = localList.applist.apps;

	for (var i = 0; i < gameList.length; i++) {
		if (gameList[i].name.toUpperCase().indexOf(forThis.toUpperCase()) > -1) {
			resultsArr.push(gameList[i]);
		}
	}

	resultsArr.sort(function (a, b) {
		if (a.name.length < b.name.length) {
			return -1;
		} else if (a.name.length > b.name.length) {
			return 1;
		} else {
			return 0;
		}
	});

	if (resultsArr.length > 0) {
		callback(resultsArr[0]);
	}
}

function testForURL(message, callback) {
	var exURL;
	var extra;

	//For linking of Steam Games, but I don't have the full list of Steam games.
	// if (message.startsWith("!linkme ")) {
	// 	var inputTitle = message.substring(message.indexOf("!linkme ") + 8, message.length);

	// 	updateList(function () {
	// 		searchForGame(inputTitle, function (resultObj) {
	// 			message = "http://store.steampowered.com/app/" + resultObj.appid;
	// 			extra = message;
	// 		});
	// 	});
	// }

	if (message.indexOf('http') > -1) {
		message.indexOf(" ", message.indexOf("http")) === -1 ? exURL = message.substring(message.indexOf("http"), message.length) : exURL = message.substring(message.indexOf("http"), message.indexOf(" ", message.indexOf("http")));
		if (exURL.indexOf("://i.imgur.com/") > -1) exURL = exURL.substring(0, exURL.length - 4).replace("i.imgur.com", "imgur.com");

		callback(exURL, extra);
	}
}

function visitURL(URL, callback) {
	var streamArr = [];
	var maxSize = 10 * 1024 * 1024;
	var rt;

	var req = request(URL, function (err, res, body) {
		if (!err && res.statusCode == 200) {
			if (body) {
				try {
					var streamerInfo = JSON.parse(body);
					rt = true;
					callback(true, null, streamerInfo);
				} catch (e) {
					if (body.indexOf('<title>') == -1) {
					} else {
						var title = he.decode(body.substring(body.indexOf('<title>') + 7, body.indexOf('</title>'))).trim();
						rt = true;
						callback(false, title);
					}
				}
			}
		}
	}).on('data', function (chunk) {
		streamArr += chunk;
		if (streamArr.length > maxSize) {
			// logError(getDateTime(), "error The request was larger than " + maxSize);
			req.abort();
		}
		if (!rt) {
			rt = setTimeout(function () {
				// logError(getDateTime(), "error Took over 2.5 seconds to parse page.");
				req.abort();
			}, 2500);
		}
	});
}