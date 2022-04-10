// Ping
commands.ping = new Command({
	desc: "Check for my Latency and API Latency.",
	section: "fun",
	func: (message, args) => {
		let pingVal = Date.now() - message.createdTimestamp
		let latencyVal = Math.round(client.ws.ping)

		let hit = "There! I hit it!";
		if (pingVal > 50 || pingVal < -50 || latencyVal < 20) hit = "Darn, guess I missed.";

        message.channel.send(`🏓 Allow me to swing! \nLatency is ${pingVal}ms. API Latency is ${latencyVal}ms\n${hit}`);
	}
})

// Diceroll
commands.diceroll = new Command({
	desc: "Rolls the specified amount of dice with the specified amount of sides.",
	section: "fun",
	args: [
		{
			name: "Sides",
			type: "Num",
			forced: true
		},
		{
			name: "Dice Count",
			type: "Num"
		}
	],
	func: (message, args) => {
		const num1 = args[0]
		const num2 = args[1] ?? 1

		if (num1 < 1) return message.channel.send(`Your 1st number (${num1}) has got to be a number above 1.`);
		else if (num2 < 1)  return message.channel.send(`Your 2nd number (${num2}) has got to be a number above 1.`);
		else if (num1 > 300) return message.channel.send(`Your 1st number (${num1}) has got to be a number below 300.`);
		else if (num2 > 300) return message.channel.send(`Your 2nd number (${num2}) has got to be a number below 300.`);

		let totalNum = 0;
		let resultsNums = [];
		for (let i = 0; i < num2; i++) {
			const resultNum = Math.ceil(Math.random() * num1)
			resultsNums.push(resultNum)
			totalNum += resultNum;
		};

		resultsNums.sort(function(a, b) {return a + b})

		let resultsTxt = `(${resultsNums})`

		let endTxt = `Your result ${num2 == 1 ? `` : `from multiple rolls`} is ${totalNum} ${num2 != 1 ? resultsTxt : ''} after rolling a ${num2}d${num1}.`
		if (totalNum == 69)
			endTxt += ' Therefore, I have a [prize](https://www.youtube.com/watch?v=ub82Xb1C8os) for you :)';

		const DiscordEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`${getPrefix(message.guild.id)}diceroll`)
			.setDescription(endTxt)
		message.channel.send({embeds: [DiscordEmbed]})
	}
})

// Scenario
let tradePkmn = [
	"Bulbasaur",
	"Charmander",
	"Squirtle",
	"Vulpix",
	"Cyndaquil",
	"Chikorita",
	"Arcanine",
	"Dragonite",
	"Dreepy",
	"Mimikyu",
	"Dracovish",
	"Pikachu",
	"Pichu",
	"Eevee"
]

let soloScenarios = [
	`is lonely. They need some friends, so they go out for a search. They're unlucky.`,
	`is getting beat up by some strong anime character.`,
	`"Omae wa mou, shinderu."\nBloom Battler "Nani!?"`,
	`explores the dark web. They found a fedora.`,
	`: Stand Master「Edge」\n*The ability to summon a Fedora.*`,
	`dies.`,
	`is being mean to me :(`,
	`shines as bright as the sky itself ;)`,
	`is scary.`,
	`is being bullied.`,
	`is edgy.`,
	`has a cute pet by their side!`,
	`is short! Hehe! Short!\nPFFFHAHAHAHAHAHAHAAHHAH!`,
	`is a tad too tall...`,
	`has discovered Super Saiyan Blue!`,
	`is ugly.`,
	`is bored, and so, plays with their ${tradePkmn[Math.round(Math.random() * tradePkmn.length)]}.`
]

let duoScenarios = [
	`decide it's finally time to marry eachother. The wedding hall is filled to the brim with your friends.`,
	`are fighting a strong monster! Together, you prevail!`,
	`are rivals, playing chess to figure out who's strongest.`,
	`secretly have a crush on eachother, but you don't have the courage.`,
	`are in the middle of a Pokemon battle! Who prevails is up to you.`,
	`trades a ${tradePkmn[Math.round(Math.random() * tradePkmn.length)]} for a ${tradePkmn[Math.round(Math.random() * tradePkmn.length)]}.`,
	`play a competitive video game together: Super Smash Bros!`,
	`play a competitive video game together: Mario Kart 8!`,
	`play a competitive video game together: Kirby's Dream Course!`,
	`play a cooperative video game together: New Super Mario Bros U!`,
	`play a cooperative video game together: Miitopia!`,
	`play a cooperative video game together: Pokemon: Let's Go!`,
	`sing together in a concert!\nSo good!`,
	`sleep together. Awiie!\nSo cute!`,
	`go on a world-wide adventure!\nSo endeavouring!`,
	`are scared of eachother.`,
	`go trick or treating during halloween!`,
	`are in love with eachother during college. They don't get to get together however, because they never get to see eachother.\n💔 *So sad*... 💔`,
	`are in love with eachother during college. They get together during college, and marry eachother after!\n💖 So kawaii! 💖`,
	`cheer eachother up in a hard spot. So nice!`,
	`travel through space to get to Mars! As they land, they discover many locations, single celled organisms and overall, just have fun!\nSo endearing!`,
	`are sister and brother.`,
	`are brother and sister.`,
	`are aggressive towards eachother, as one is a bully, bullying the other.\nAfter 4 years of constant conflict, a friend talks them to their senses, and now, the two are best of friends! 🤔 So unexpected! 🤔`,
	`lean in for a kiss, and kiss! Hehe!\n💏 So Kawaii 💏`,
	`'s pets get along very well together!`,
	`stick together during college. Everyone else seems so scary, as if they were from a foreign world.`,
	`teach eachother sign language.`,
	`are very cute together! 💖`,
	`are very ugly together! \n:(`,
]

commands.scenario = new Command({
	desc: "Generates a funny scenario that could probably easily be taken out of context.",
	args: [
		{
			name: "Another Person",
			type: "Ping"
		}
	],
	section: "fun",
	func: (message, args) => {
		const taggedUser = args[0]
		const embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setFooter('rpg!scenario')
		if (taggedUser) {
			const users = `${message.author.username} & ${taggedUser.username}`
			message.channel.send({embeds: [embed
				.setTitle(users)
				.setDescription(`${users} ${duoScenarios[Math.round(Math.random() * (duoScenarios.length - 1))]}`)
			]})
		} else {
			const username = message.author.username
			message.channel.send({embeds: [embed
				.setTitle(username)
				.setDescription(`${username} ${soloScenarios[Math.round(Math.random() * (soloScenarios.length - 1))]}`)
			]})
		}
	}
})

// Quote
let quotes = [
	"*The world isn't perfect. But it's there for us, doing the best it can....that's what makes it so damn beautiful.*\n-Roy Mustang, Full Metal Alchemist",
	"*To know sorrow is not terrifying. What is terrifying is to know you can't go back to happiness you could have.*\n-Matsumoto Rangiku, Bleach",
	"*We are all like fireworks: we climb, we shine and always go our separate ways and become further apart. But even when that time comes, let's not disappear like a firework and continue to shine.. forever.*\n-Hitsugaya Toshiro, Bleach",
	"*Those who stand at the top determine what's wrong and what's right! This very place is neutral ground! Justice will prevail, you say? But of course it will! Whoever wins this war becomes justice!*\n-Don Quixote Doflamingo, One Piece",
	"*Fear is not evil. It tells you what weakness is. And once you know your weakness, you can become stronger as well as kinder.*\n-Gildarts Clive, Fairy Tail",
	"*Whatever you lose, you'll find it again. But what you throw away you'll never get back.*\n-Kenshin Himura, Rurouni Kenshin: Meiji Kenkaku Romantan",
	"*You’ll laugh at your fears when you find out who you are.*\n-Piccolo, Dragon Ball",
	"*Before creation… must come destruction!*\n-Beerus, Dragon Ball",
	"*We do have a lot in common. The same earth, the same air, the same sky. Maybe if we started looking at what’s the same, instead of looking at what’s different, well, who knows?*\n-Meowth, Pokemon",
	"*If she leaves you for another, there’s always her mother.*\n-𝓟𝓸𝓲𝓷𝓽𝔂 𝓑𝓸𝓲, One of the various servers used to test me",
	"*The important thing is not how long you live. It’s what you accomplish with your life.*\n-Grovyle, Pokemon Mystery Dungeon: Explorers of Time/Darkness/Sky",
	"*Bwa Bo brop*\n-Cowardly Maya, Persona 3",
	"*When you don't try your best, it would seem like any normal time, but when you do try your best, It could be life changing*\n-Harcvuk, One of the various servers used to test me.",
	"*You may think what you are doing, isn't enough. But don't let that get you down. You already made way more than you had before. Be proud of your progress in life.*\n-Verwex, One of the various servers used to test me."
]

commands.quote = new Command({
	desc: "Randomly select an inspirational quote from an Anime or Video Game.",
	section: "fun",
	func: (message, args) => {
        let quoteText = quotes[Math.round(Math.random() * (quotes.length - 1))]
        let DiscordEmbed = new Discord.MessageEmbed()
            .setColor('#ffffff')
            .setDescription(`${quoteText}`)
            .setFooter(`${prefix}${command}`);
        message.channel.send({embeds: [DiscordEmbed]})
	}
})

// Ship
commands.ship = new Command({
	desc: "*<Word: Person #1> {Word: Person #2} {...}*\nShip yourself with someone... or ship two separate people, or more! It's funny, trust me.",
	section: "fun",
	func: (message, args) => {
		if (!args[0]) return message.channel.send(`Please specify at least one person who you want to ship yourself with, or two if you want to ship two different people.`);

		// Undefined
		let allUndefined = true;
		for (const i in args) {
			if (args[i].toLowerCase() != 'undefined') { allUndefined = false; break; }
		}

		if (allUndefined) {
			let resulttext = "**Candidates:** \n"
			for (const i in args) resulttext += `:small_orange_diamond: ${args[i]} \n`;

			const DiscordEmbed = new Discord.MessageEmbed()
				.setColor('#ff06aa')
				.setTitle('undefined')
				.setDescription(`${resulttext}\n**NaN%** ${':black_medium_square:'.repeat(10)}`)
				.setFooter('undefined')
			message.channel.send({embeds: [DiscordEmbed]})
			return false
		}

		if (!args[1]) {
			args[1] = args[0]
			args[0] = message.author.username
		}

		let shipFile = setUpFile(`${dataPath}/json/ships.json`);
		let shipCandidates = args;

		let resulttext = "**Candidates:** \n"
		let splicedName = ""

		for (i in shipCandidates) {
			// Converting Mentions
			console.log(shipCandidates[i])
			if (shipCandidates[i].startsWith('<@!') && shipCandidates[i].endsWith('>')) {
				let mention = shipCandidates[i].slice(3, -1);
				console.log(mention)
				try {mention = client.users.cache.get(mention);} catch (e) {mention = undefined;}
				shipCandidates[i] = mention != undefined ? mention.username : '[UNKNOWN]';
			}

			if (!shipFile[shipCandidates[i]]) {
				shipFile[shipCandidates[i]] = {
					loveParameter: Math.round(Math.random() * 100),
				}

				fs.writeFileSync(`${dataPath}/json/ships.json`, JSON.stringify(shipFile, null, '    '));
			}

			// Getting Candidates
			resulttext += `:small_orange_diamond: ${shipCandidates[i]} \n`

			//Splicing Name
			let nameToCut = shipCandidates[i].slice(Math.round(shipCandidates[i].length / shipCandidates.length * i), Math.round((shipCandidates[i].length / shipCandidates.length * i + shipCandidates[i].length / shipCandidates.length)))
			splicedName += nameToCut
		}

		// Filtering Duplicates
		let filtered = new Set(shipCandidates);
		shipCandidates = [...filtered]

		let loveParameters = []
		let loveResults = []
		let loveCloseness = 0
		let finalLoveCloseness = 0

		for (i in shipCandidates) {
			let candidate = shipFile[shipCandidates[i]]
			loveParameters.push(candidate.loveParameter)
		}

		for (i in loveParameters) {
			let secondID = parseInt(i) + 1

			if (loveParameters.length > 1) {
				if (loveParameters[secondID] != undefined) {
					loveResults = [loveParameters[i], loveParameters[secondID]].sort((a,b) => a - b)

					loveCloseness = loveResults[1] - loveResults[0]
					finalLoveCloseness += 100 - loveCloseness
				}
			} else
				finalLoveCloseness += loveParameters[i]
		}

		if (loveParameters.length > 1)
			finalLoveCloseness /= (shipCandidates.length - 1)

		const love = Math.round(finalLoveCloseness);
        const loveIndex = Math.floor(love / 10);
        const loveLevel = ":white_medium_square:".repeat(loveIndex) + ":black_medium_square:".repeat(10 - loveIndex);

		//footer reactions
		let footerConditions = [
			`${(love <= 0) ? true : false}`,
			`${(love <= 10 && love > 0) ? true : false}`,
			`${(love <= 20 && love > 10) ? true : false}`,
			`${(love <= 30 && love > 20) ? true : false}`,
			`${(love <= 40 && love > 30) ? true : false}`,
			`${(love <= 50 && love > 40) ? true : false}`,
			`${(love <= 60 && love > 50) ? true : false}`,
			`${(love <= 70 && love > 60) ? true : false}`,
			`${(love <= 80 && love > 70) ? true : false}`,
			`${(love <= 90 && love > 80) ? true : false}`,
			`${(love <= 99 && love > 90) ? true : false}`
		]
		let footerText = ""
		
		const footerTexts = [
			[
				"This one, for sure, isn't happening.",
				"Forget about even trying with this.",
				"lol suck!"
			],
			
			[
				"This one won't work out at all.",
				"bruh.",
				"This is sad"
			],
			
			[
				"There's no chance this one's happening.",
				'Here is a cookie for your troubles: "🍪"',
				"Sad."
			],
			
			[
				"Possible, but don't get your hopes up.",
				"try harder lol",
				"Well this is... unfortunate."
			],
			
			[
				"Maybe if you try hard enough...",
				"In another timeline, this would work!",
				"Perhaps they'll be together if you hope"
			],
			
			[
				"Interesting outcome.",
				"I see, I see.",
				"Almost."
			],
			
			[
				"This ship's not tooooo bad.",
				"nice NICE",
				"Very cool"
			],
			
			[
				"I like where this is going.",
				"This could go places!",
				"Avoid the fanfic sites."
			],
			
			[
				"This one could turn into something...",
				"They have a high chance of being together!!",
				"Fanfic time."
			],
			
			[
				"Awww, they fit so well together!",
				"They're so nice together.",
				"Cute couple.",
			],
			
			[
				"Almost, almost!",
				"Just barely!",
				"So close."
			]
		]

		for (i in footerConditions) {
			if (footerConditions[i].endsWith('true')) {
				footerText = footerTexts[i][Math.round(Math.random() * footerTexts[i].length-1)]
			}
		}

		if (love === 69)
			footerText = 'Nice. ( ͡° ͜ʖ ͡°)'

		if (love === 100)
			footerText = 'OTP!'

		// Send Embed
		const DiscordEmbed = new Discord.MessageEmbed()
            .setColor('#ff06aa')
            .setTitle(`${splicedName}`)
			.setDescription(`${resulttext}\n**${love}%** ${loveLevel}`)
			.setFooter(`${footerText}`)
		message.channel.send({embeds: [DiscordEmbed]})
	}
})