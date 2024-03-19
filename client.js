///////////////////////////////////
// MAIN SCRIPT FOR BLOSSOM BATTLER //
// grassimp :) ////////////////////
///////////////////////////////////

//Discord.JS initiation.
Discord = require('discord.js');
Builders = require('@discordjs/builders');
Rest = require('@discordjs/rest');
ApiTypes = require('discord-api-types/v9');

client = new Discord.Client({
	intents: [
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MEMBERS,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
		Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Discord.Intents.FLAGS.DIRECT_MESSAGES,
	],
	partials: [
		'MESSAGE',
		'CHANNEL',
		'REACTION'
	]
});

// Global functions
require('./global-funcs.js');

// Bot Stuff
utilityFuncs = require(packPath + '/utilityFuncs');
charFuncs = require(packPath + '/charFuncs');
enemyFuncs = require(packPath + '/enemyFuncs');
attackFuncs = require(packPath + '/attackFuncs');
turnFuncs = require(packPath + '/turnFuncs');
skillFuncs = require(packPath + '/skillFuncs');

RF = require(packPath + '/relicFuncs');

//Canvas, for making custom pictures.
Canvas = require('canvas');

//FS, for writing files.
fs = require('fs');
fsP = require("fs/promises");

// File modules.
request = require('request');
nodeFetch = require('node-fetch');
stream = require('stream');
streamP = require('stream/promises');
paths = require("path");

//hatebin, for converting long walls of text into links
hastebin = require('hastebin-gen');

//ArgList class, for the Command class
const ArgList = require(packPath + "/arglist.js");

// Command types
SUB_COMMAND = 1
SUB_COMMAND_GROUP = 2
STRING = 3
INTEGER = 4
BOOLEAN = 5
USER = 6
CHANNEL = 7
ROLE = 8
MENTIONABLE = 9
NUMBER = 10
ATTACHMENT = 11

// stuff that cant be in global-funcs.js :(
leaderSkillTxt = {
	boost: 'Boosts the specified type.',
	discount: 'Takes away the amount of cost specified to the specified type.',
	buff: 'Start the battle with the specified stat buff.',
	debuff: 'Start the battle with the specified stat debuff to the enemy team.',
	status: 'Increased chance to land the specified status effect.',
	crit: 'Increased crit chance to the specified element.',
	money: 'Increased money gain after battle.',
	items: 'Increased item gain after battle.',
	pacify: 'Pacify Enemies by the specified percentage at the start of battle.',
	endure: 'One character in your team can endure one fatal attack.',
	heal: 'Heal the character with the lowest health on the start of your turn.',
}

// Buttons
backButton = new Discord.MessageButton({
	style: 'SECONDARY',
	label: 'Back',
	emoji: '⬅️',
	customId: 'back'
})
forwardButton = new Discord.MessageButton({
	style: 'SECONDARY',
	label: 'Forward',
	emoji: '➡️',
	customId: 'forward'
})
cancelButton = new Discord.MessageButton({
	style: 'SECONDARY',
	label: 'Cancel',
	emoji: '⏸',
	customId: 'cancel'
})
pageButton = new Discord.MessageButton({
	style: 'SECONDARY',
	label: 'Page',
	emoji: '#️⃣',
	customId: 'page'
})

listArray = async(channel, theArray, author, forceIndex) => {
	let index = forceIndex ?? 10;

	const generateEmbed = async start => {
		const current = theArray.slice(start, start + index)
		return new Discord.MessageEmbed({
			title: `Showing results ${start + 1}-${start + current.length} out of ${theArray.length}`,
			fields: await Promise.all(
				current.map(async arrayDefs => ({
					name: arrayDefs.title,
					value: arrayDefs.desc,
					inline: arrayDefs.inline ?? false
				}))
			)
		})
	}

	const canFitOnOnePage = theArray.length <= index
	let embedMessage
	if (canFitOnOnePage) {
		embedMessage = await channel.send({
			embeds: [await generateEmbed(0)]
		})
		return
	}

	embedMessage = await channel.send({
		embeds: [await generateEmbed(0)],
		components: [new Discord.MessageActionRow({components: [backButton, forwardButton, pageButton, cancelButton]})]
	})

	const collector = embedMessage.createMessageComponentCollector({
		filter: ({user}) => user.id == author
	})

	let currentIndex = 0;
	collector.on('collect', async interaction => {
		if (interaction.component.customId != 'cancel' && interaction.component.customId != 'page') {
			if (interaction.customId === 'back') {
				if (currentIndex - index < 0) {
					currentIndex = theArray.length - ((theArray.length % index != 0) ? theArray.length % index : index)
				} else {
					currentIndex -= index
				}
			} else if (interaction.customId === 'forward') {
				if (currentIndex + index >= theArray.length) {
					currentIndex = 0
				} else {
					currentIndex += index
				}
			}

			await interaction.update({
				embeds: [await generateEmbed(currentIndex)],
				components: [
					new Discord.MessageActionRow({components: [backButton, forwardButton, pageButton, cancelButton]}),
				]
			})
		} else if (interaction.component.customId === 'page') {
			channel.send(`Please enter the page number you want to go to.`)
			const pageCollector = channel.createMessageCollector({
				time: 3000
			})

			await new Promise((resolve, reject) => {
				pageCollector.on('collect', async pageInteraction => {
					if (pageInteraction.author.id == author) {
						try {
							const page = parseInt(pageInteraction.content) - 1
							if (page > -1 && page <= Math.floor(theArray.length / index)) {
								currentIndex = page * index
								await interaction.update({
									embeds: [await generateEmbed(currentIndex)],
									components: [
										new Discord.MessageActionRow({components: [backButton, forwardButton, pageButton, cancelButton]}),
									]
								})
								pageCollector.stop()
								resolve()
							} else {
								channel.send(`Please enter a valid page number.`)
								pageCollector.stop()
								resolve()
							}
						} catch (err) {
							channel.send('Please enter a valid page number.')
							pageCollector.stop()
							resolve()
						}
					}
				})
			})
		} else {
			collector.stop()
			await interaction.update({
			embeds: [await generateEmbed(currentIndex)],
			components: []
			})
		}
	})
}

// Daily Quote - Resets at midnight
dailyQuote = {}

let tempQuote = fs.readFileSync(dataPath+'/dailyquote.txt', {flag: 'as+'});
if (tempQuote && tempQuote != '')
	dailyQuote = JSON.parse(tempQuote);

// Daily Skill - Resets at midnight
dailySkill = 'none'

let tempSkill = fs.readFileSync(dataPath+'/dailyskill.txt', {flag: 'as+'});
if (tempSkill && tempSkill != '')
	dailySkill = tempSkill.toString();

// Daily Item - Resets at midnight
dailyItem = {}

let tempItem = fs.readFileSync(dataPath+'/dailyitem.txt', {flag: 'as+'});
if (tempItem && tempItem != '')
	dailyItem = JSON.parse(tempItem);

// Daily Weapon - Resets at midnight
dailyWeapon = {}

let tempWeapon = fs.readFileSync(dataPath+'/dailyweapon.txt', {flag: 'as+'});
if (tempWeapon && tempWeapon != '')
	dailyWeapon = JSON.parse(tempWeapon);

// Daily Armor - Resets at midnight
dailyArmor = {}

let tempArmor = fs.readFileSync(dataPath+'/dailyarmor.txt', {flag: 'as+'});
if (tempArmor && tempArmor != '')
	dailyArmor = JSON.parse(tempArmor);

// Daily Character - Resets at midnight
dailyChar = {}

let tempCharacter = fs.readFileSync(dataPath+'/dailycharacter.txt', {flag: 'as+'});
if (tempCharacter && tempCharacter != '')
dailyChar = JSON.parse(tempCharacter);

// Daily Enemy - Resets at midnight
dailyEnemy = {}

let tempEnemy = fs.readFileSync(dataPath+'/dailyenemy.txt', {flag: 'as+'});
if (tempEnemy && tempEnemy != '')
dailyEnemy = JSON.parse(tempEnemy);

// Daily Enemy Quote - Resets at midnight
dailyEnemyQuote = {}

let tempEnemyQuote = fs.readFileSync(dataPath+'/dailyenemyquote.txt', {flag: 'as+'});
if (tempEnemyQuote && tempEnemyQuote != '')
dailyEnemyQuote = JSON.parse(tempEnemyQuote);

// Daily Ship - Resets at midnight
dailyShip = {}

let tempShip = fs.readFileSync(dataPath+'/dailyship.txt', {flag: 'as+'});
if (tempShip && tempShip != '')
dailyShip = JSON.parse(tempShip);

function resetDailies() {
	dailyQuote = {};
	dailySkill = 'none';
	dailyItem = {};
	dailyWeapon = {};
	dailyArmor = {};
	dailyChar = {};
	dailyEnemy = {};
	dailyEnemyQuote = {};
	dailyShip = {};

	fs.writeFileSync(dataPath+'/dailyquote.txt', '');
	fs.writeFileSync(dataPath+'/dailyskill.txt', '');
	fs.writeFileSync(dataPath+'/dailyitem.txt', '');
	fs.writeFileSync(dataPath+'/dailyweapon.txt', '');
	fs.writeFileSync(dataPath+'/dailyarmor.txt', '');
	fs.writeFileSync(dataPath+'/dailycharacter.txt', '');
	fs.writeFileSync(dataPath+'/dailyenemy.txt', '');
	fs.writeFileSync(dataPath+'/dailyenemyquote.txt', '');
	fs.writeFileSync(dataPath+'/dailyship.txt', '');
}

// reset if the last day isnt... well, the last day.
let lastDay = fs.readFileSync(dataPath+'/lastday.txt', {flag: 'as+'});
if (!lastDay || lastDay != getCurrentDate()) resetDailies();

fs.writeFileSync(dataPath+'/lastday.txt', getCurrentDate());

// reset by time.
function midnightInMS() {
    return new Date().setHours(24, 0, 0, 0) - new Date().getTime()
}

// Global JSONs
skillFile = setUpFile(`${dataPath}/json/skills.json`, true);
shipFile = setUpFile(`${dataPath}/json/ships.json`, true);
pmdFile = setUpFile(`${dataPath}/json/pmdquestions.json`, true);
trialGlobals = setUpFile(`${dataPath}/json/globaltrials.json`, true)

function getDateAfterTwoWeeks() {
	const date = new Date();
	date.setDate(date.getDate() + 14);
	const dateString = date.toISOString();
	return dateString;
}

checkShips();

function resetShips() {
	shipFile = {};
	fs.writeFileSync(`${dataPath}/json/ships.json`, '{}');
}

function checkShips() {
	let lastWeek = fs.readFileSync(dataPath + '/datein2weeks.txt', { flag: 'as+' });
	const today = new Date();
	if (lastWeek && lastWeek <= today.toISOString()) {
		resetShips();
		writeShipDayFile()
	}
	
	if (!lastWeek) writeShipDayFile()
	
	function writeShipDayFile() {
	fs.writeFileSync(dataPath + '/datein2weeks.txt', getDateAfterTwoWeeks());
	}
}

setTimeout(function() {
	resetDailies();
	checkShips()
}, midnightInMS());

typeParsers = {
	Num: ({arg}) => {return (!isNaN(arg) && isFinite(parseInt(arg))) ? parseInt(arg) : undefined},
	Decimal: ({arg}) => {return (!isNaN(arg) && isFinite(parseFloat(arg))) ? parseFloat(arg) : undefined},
	YesNo: ({arg}) => {return (arg) ? (/^\s*(true|yes|ok|y|1|okay)\s*$/i).test(arg.toLowerCase()) : undefined},
	Ping: ({message}) => {return message.mentions.users.first()},
	Channel: ({message, arg}) => {return message.guild.channels.cache.find(c => c.name == arg || c.id == arg || c.id == arg.replace(/[<#>]/g, '')) ? message.guild.channels.cache.find(c => c.name == arg || c.id == arg || c.id == arg.replace(/[<#>]/g, '')).id : undefined},
	RealChannel: ({message, arg}) => {return message.guild.channels.cache.find(c => c.name == arg || c.id == arg || c.id == arg.replace(/[<#>]/g, '')) ?? undefined},
	ID: arg => {},
	Image: ({message}) => {return checkImage(message, undefined, message.attachments.first())},
	JSON: ({message}) => {return message.attachments.first()}
}

// Slash Commands
let cmds = [];

let datatypetoconst = {
	Num: INTEGER,
	Decimal: NUMBER,
	YesNo: BOOLEAN,
	Ping: MENTIONABLE,
	Channel: INTEGER,
	RealChannel: CHANNEL,
	ID: INTEGER,
	Image: ATTACHMENT,
	JSON: ATTACHMENT
}

/*
for (let i in commands) {
	if (cmds.length >= 100) break;

	let c = commands[i];
	if (c.alias) continue;
	if (c.noslash) continue;

	let str = c.desc;
	if (str.length > 100) str = `${str.slice(0, 97)}...`;

	let cmd = new Builders.SlashCommandBuilder()
		.setName(i)
		.setDescription(str);

	// Create a new command
	if (c.args && c.args.length > 0) {
		for (let o of c.args) {
			switch(o.type ?? "Word") {
				default:
					cmd.addStringOption(option =>
						option.setName(o.name.replace(/[ #,%'/()123467890]/g,'').toLowerCase())
							.setDescription(o.desc ?? '???')
							.setRequired(o.forced ?? false)
					)
			}
		}
	}

	cmds.push(cmd);
}

const rest = new Rest.REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			ApiTypes.Routes.applicationCommands(process.env.CLIENTID),
			{ body: cmds },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();
*/

// Run this shit
let folders = ['skills', 'characters', 'enemies', 'party', 'battle', 'items', 'campaign'] // i TOLD YOU there WILL EEEVEN be moreee

for (const i in folders) {
	let files = fs.readdirSync(`${packPath}/${folders[i]}`).filter(file => file.endsWith('.js'));
	for (const file of files) {
		require(`${packPath}/${folders[i]}/${file}`);
	}
}

// Collector Cache
collectors = {}
makeCollector = (channel, vars) => {
	if (collectors[channel.id]) collectors[channel.id].stop();
	collectors[channel.id] = channel.createMessageComponentCollector(vars);
	return collectors[channel.id]
}

client.on("guildCreate", (guild) => {
	makeDirectory(`${dataPath}/json/${guild.id}`);

	// Server Data
	setUpSettings(guild.id)
	setUpFile(`${dataPath}/json/${guild.id}/trials.json`)
	setUpFile(`${dataPath}/json/${guild.id}/parties.json`)
	setUpFile(`${dataPath}/json/${guild.id}/items.json`)
	setUpFile(`${dataPath}/json/${guild.id}/weapons.json`)
	setUpFile(`${dataPath}/json/${guild.id}/armors.json`)
	setUpFile(`${dataPath}/json/${guild.id}/blacksmiths.json`)
	setUpFile(`${dataPath}/json/${guild.id}/skills.json`)
	setUpFile(`${dataPath}/json/${guild.id}/loot.json`)
	setUpFile(`${dataPath}/json/${guild.id}/chests.json`)

	// Character Data
	setUpFile(`${dataPath}/json/${guild.id}/characters.json`)
	setUpFile(`${dataPath}/json/${guild.id}/enemies.json`)
	setUpFile(`${dataPath}/json/${guild.id}/parties.json`)

	//make an embed with a welcome message
	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setTitle('Welcome, everyone!')
		.setDescription(`I'm Blossom Battler, and welcome to my extravagant Real-Time RPG experience.`)
		.addField('What can I do?', `I can do whatever you imagine. This includes:
			**- Characters
			- Items
			- Skills
			- Chests
			- Enemies
			- Etc.**
			I can also do a multitiude of misc. things!`)
		.addField('How can I start?', `Type ${getPrefix(guild.id)}help to get started!`)

	let channel = guild.channels.cache.find(
		(ch) => ch.type === 'GUILD_TEXT',
	);
		
	if (!channel) return console.log('Where should I post?');
		
	//send an image, and then the embed
	channel.send({files: [`${dataPath}/images/Welcome.png`]})
		.then(() => channel.send({embeds: [DiscordEmbed]}))
})

similarity = (s1, s2) => {
	var longer = s1;
	var shorter = s2;
	if (s1.length < s2.length) {
		longer = s2;
		shorter = s1;
	}
	var longerLength = longer.length;
	if (longerLength == 0) {
		return 1.0;
	}
	return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

editDistance = (s1, s2) => {
	s1 = s1.toLowerCase();
	s2 = s2.toLowerCase();

	var costs = new Array();
	for (var i = 0; i <= s1.length; i++) {
		var lastValue = i;
		for (var j = 0; j <= s2.length; j++) {
			if (i == 0)
				costs[j] = j;
			else {
				if (j > 0) {
					var newValue = costs[j - 1];
				if (s1.charAt(i - 1) != s2.charAt(j - 1))
					newValue = Math.min(Math.min(newValue, lastValue),
					costs[j]) + 1;
				costs[j - 1] = lastValue;
				lastValue = newValue;
				}
			}
		}
		if (i > 0)
		costs[s2.length] = lastValue;
	}
	return costs[s2.length];
}

function messageCommand(message, guilded) {
	if (message.author.bot) return;
	if (message.channel.type === 'DM') return message.channel.send("Don't use me in DMs! That's kinda sussy!");

	message.content = message.content.replace(/“/g, '"').replace(/”/g, '"').replace(/[^\S\r\n]/g, " ") // iOS quotation marks & untypable whitespaces

	// Set up directory :)
	makeDirectory(`${dataPath}/json/${message.guild.id}`);

	// Register commands
	prefix = getPrefix(message.guild.id)
	if (!message.content.toLowerCase().startsWith(prefix)) return;

	let args = [...message.content.slice(prefix.length).matchAll(/"([^"]*?)"|[^ ]+/gm)].map(el => el[1] || el[0] || "");
	if (args.length == 0) return;
	
	for (let i in args) {
		if (args[i] === "undefined") return void message.channel.send("Don't even try it.");
	}

	let command = commands[args[0].toLowerCase()];
	
	if (!command) {
		let similarities = [];
		for (const i in commands) {
			let similarityPercent = similarity(args[0].toLowerCase(), i)
			similarityPercent = similarityPercent.toFixed(2)

			if (similarityPercent >= 0.85) {
				args.shift();
				return commands[i].call(message, args, false);
			}

			if (similarityPercent >= 0.6) similarities.push({command: i, similarity: similarityPercent})
		}
		//order based on highest to lowest similarity and then leave only the top 5
		similarities.sort((a, b) => b.similarity - a.similarity)
		similarities = similarities.slice(0, 3)

		if (similarities.length > 0) return similarityButtonCollector(message, similarities, args)
		else return
	} else {
		args.shift();
		command.call(message, args, false);
	}
}

// Discord
client.on("messageCreate", (message) => {
	return messageCommand(message, false);
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = commands[interaction.commandName];

	if (!command) return;

	try {
		let message = {};
		let args = [];

		await interaction.reply({ content: 'This is a test!', ephemeral: true });
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

//last ditch things
makeDirectory(`${dataPath}/userdata`)
makeDirectory(`${dataPath}/error`);

// Token Check
console.log(`${process.env.TOKEN} is the token for Discord, and ${process.env.GUILDED_TOKEN} is the token for Guilded!`);
client.login(process.env.TOKEN);

// Aight
console.log(`The bot is now in session! Enjoy!`)

// Lastly... resend all embeds if a battle errored out!

// On an actual error, either due to my incompetence, others' errors or I suck.
process.on('shardError', err => {
	saveError(err);
});

process.on('unhandledRejection', err => {
	saveError(err);
});

process.on('uncaughtException', err => {
	saveError(err);
});

const path = require("path")

saveError = async (err) => {
	console.log(`Uh oh... We got an error. Logging now.\n\n${err.stack}`);
	let errorText = `${err.stack}`;
	//don't render it on one line
	errorText = errorText.split('\n').join('\n');

	let date = new Date();
	let dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;

	fs.writeFileSync(`./data/error/${dateString}.txt`, errorText);

	if (battleFiles) {
		if (battleFiles.length > 0) {
			fs.writeFileSync('./data/error/battles.txt', JSON.stringify(battleFiles, null, '    '));
			console.log('Written backup of battles');
		}
	}

	await client.channels.cache.get("979841088988807168")?.send(`${(new Date()).toUTCString()}\n\`\`\`\n${err.stack.replace(/\((.+?:\d+:\d+)\)\s*$/gm, (_match, filepath) =>`(${path.basename(filepath)})`)}\`\`\``)

	process.exit(1);
}

async function similarityButtonCollector(message, similarities, args, guilded) {
	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setTitle('Similarities found')
		.setDescription('Seems like the command you were looking for was not found. There were similar ones, but I can\'t tell which one you were looking for.\n\nHere are the top similarities:')
		.addFields(similarities.map(el => {
			return {name: `${getPrefix(message.guild.id)}${el.command} (${el.similarity * 100}% similarity)`, value: commands[el.command].getFullDesc(), inline: false}
		}
	))

	let buttons = []

	for (i in similarities) {
		let similarity = similarities[i]
		buttons.push( makeButton(similarity.command.charAt(0).toUpperCase() + similarity.command.slice(1), null, "green", null, null) )
	}
	buttons.push( makeButton("None", "✖️", "red", null, null) )
	
	let embedMessage = await message.channel.send({
		embeds: [DiscordEmbed],
		components: [new Discord.MessageActionRow({components: buttons})]
	})

	const collector = embedMessage.createMessageComponentCollector({
		filter: ({user}) => user.id == message.author.id
	})

	collector.on('collect', async interaction => {
		if (interaction.component.customId == 'none') {
			embedMessage.delete();
			return collector.stop()
		}

		embedMessage.delete();
		collector.stop()
		args.shift();
		commands[interaction.component.customId].call(message, args, guilded);
	})
}

//error logging
battleFiles = [];

let error = fs.readFileSync('./data/error/battles.txt', {flag: 'as+'});
if (error && error != '') battleFiles = JSON.parse(error);

fs.unlink('./data/error/battles.txt', (err) => {
    if (err) throw err;
    console.log("Deleted the Error.txt and noticed it :)");
});

if (battleFiles.length > 0) {
	console.log("Pulled from Error.txt!");
	for (let btlp of battleFiles) {
		console.log(btlp);
		let btl = setUpFile(btlp, true);

		// Sadly, no battle.
		if (!btl.battling) continue;

		sendError(btl);
	}
}

async function sendError(btl) {
	if (!client.guilds.cache.get(btl.channel.guildId)) return;

	//get server from btl.channel.guildId
	await client.guilds.fetch(btl.channel.guildId).then(guild => {
		//then channel from btl.channel.id
		guild.channels.fetch(btl.channel.id).then(channel => {
			//then message from btl.messageId
			channel.messages.fetch(btl.channel.messages[btl.channel.messages.length - 1]).then(message => {
				//then send error
				message.channel.send("I'm so sorry ;-;\nThis battle got interrupted by some sort of error... I'll restart it from it's last position.").then(msg => {
					//delete after a second
					setTimeout(() => {
						msg.delete();
					}, 5000);

					commands.resendembed.call(msg, []);
				})
			})
		})
	})
}