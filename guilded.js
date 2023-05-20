///////////////////////////////////
// GUILDED SCRIPT FOR BLOSSOM BATTLER //
// grassimp :) ////////////////////
///////////////////////////////////

//Discord.JS initiation.
// Global functions
require('./global-funcs.js');

// Guilded
Guilded = require('guilded.js');

gclient = new Guilded.Client({
  token: process.env.GUILDED_TOKEN,
});

// Guilded
gclient.on("messageCreated", async message => {
	if (!message) return;
//	if (message.author.type === 0) return;
//	if (message.channel.type === 'DM') return message.channel.send("Don't use me in DMs! That's kinda sussy!");

	// Set up directory :)
	makeDirectory(`${dataPath}/json/${message.serverId}`);

	// Register commands
	prefix = getPrefix(message.serverId);
	if (!message.content.toLowerCase().startsWith(prefix)) return;

	message.content = message.content.replace(/“/g, '"').replace(/”/g, '"') // iOS quotation marks 

	let args = [...message.content.slice(prefix.length).matchAll(/"([^"]*?)"|[^ ]+/gm)].map(el => el[1] || el[0] || "");
	if (args.length == 0) return;
	
	for (let i in args) {
		if (args[i] === "undefined") return void message.channel.send("Don't even try it.");
	}

	let command = commands[args[0].toLowerCase()];

	let counterfeitMessage = {
		channel: {
		},
		author: {
		},
		guild: {
			id: message.serverId,
		},
		content: message.content,
	}

	if (!command) {
		let similarities = [];
		for (const i in commands) {
			let similarityPercent = similarity(args[0].toLowerCase(), i)
			similarityPercent = similarityPercent.toFixed(2)

			if (similarityPercent >= 0.85) {
				args.shift();
				return commands[i].call(message, args);
			}

			if (similarityPercent >= 0.6) similarities.push({command: i, similarity: similarityPercent})
		}
		//order based on highest to lowest similarity and then leave only the top 5
		similarities.sort((a, b) => b.similarity - a.similarity)
		similarities = similarities.slice(0, 3)

		if (similarities.length > 0) return similarityButtonCollector(message, similarities, args, true)
		else return
	} else {
		args.shift();
		command.call(message, args, true);
	}
})

gclient.login();