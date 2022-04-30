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
	aliases: ['dice'],
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
	aliases: ['randquote', 'randomquote'],
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

commands.ship = new Command({
	desc: "Ship yourself with someone... or ship two separate people, or more! It's funny, trust me.",
	args: [
		{
			name: "Person #1",
			type: "Any",
			forced: true
		},
		{
			name: "Person #2",
			type: "Any",
			multiple: true
		}
	],
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
		let shipCandidates = args;

		let resulttext = "**Candidates:** \n"
		let splicedName = ""

		for (i in shipCandidates) {
			// Converting Mentions
			if (shipCandidates[i].startsWith('<@!') && shipCandidates[i].endsWith('>')) {
				let mention = shipCandidates[i].slice(3, -1);
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
		let footerText
		switch (love) {
			case 69: {footerText = "Nice. ( ͡° ͜ʖ ͡°)"; break}
			case 100: {footerText = "OTP!"; break}
			default: {footerText = footerTexts[Math.floor(love / 10)][Math.round(Math.random() * 2)]}
		}

		// Send Embed
		message.channel.send({embeds: [new Discord.MessageEmbed()
            .setColor('#ff06aa')
            .setTitle(splicedName)
			.setDescription(`${resulttext}\n**${love}%** ${loveLevel}`)
			.setFooter(footerText)
		]})
	}
})

commands.pmdquiz = new Command({
	desc: "Play a PMD quiz!",
	section: "fun",
	aliases: ["pmd", "pokemonquiz", "pokemonmysterydungeon", "pokemonmysterydungeonquiz"],
	args: [
		{
			name: "Category (Red/Blue, Time/Darkness, Sky, All)",
			type: "Word",
			forced: true,
		},
		{
			name: "Question Amount",
			type: "Num",
		}
	],
	func: (message, args) => {
		//check for invalid category
		const acceptedCategories = ["red", "blue", "time", "darkness", "sky", "all"]
		if (!acceptedCategories.includes(args[0].toLowerCase())) return message.channel.send(`This category is invalid! Please use one of the following: ${acceptedCategories.join(", ")}`)

		let questionArray = []
		if (args[0].toLowerCase() == "red" || args[0].toLowerCase() == "blue" || args[0].toLowerCase() == "all") {
			for (const i in pmdFile["Red and Blue Rescue Team"]) {
				questionArray.push({[i]: pmdFile["Red and Blue Rescue Team"][i]})
			}
		}
		else if (args[0].toLowerCase() == "time" || args[0].toLowerCase() == "darkness" || args[0].toLowerCase() == "all") {
			for (const i in pmdFile["Explorers Of Time And Darkness"]) {
				questionArray.push({[i]: pmdFile["Explorers Of Time And Darkness"][i]})
			}
		}
		else if (args[0].toLowerCase() == "sky" || args[0].toLowerCase() == "all") {
			for (const i in pmdFile["Explorers Of Sky"]) {
				questionArray.push({[i]: pmdFile["Explorers Of Sky"][i]})
			}
		}

		if (!args[1]) args[1] = 8
		args[1] = Math.min(Math.max(args[1], 1), questionArray.length + 1)

		let pickedQuestion = questionArray[Math.floor(Math.random() * questionArray.length)]
		questionArray.splice(questionArray.indexOf(pickedQuestion), 1)

		let questionNumber = 1
		let availableAnswerNums = Object.keys(Object.values(pickedQuestion)[0]).length - 1

		message.channel.send(processQuestion(message, pickedQuestion, questionNumber))

		let personalities = {}

		let collector = message.channel.createMessageCollector({ time: 1000000000 });
		collector.on('collect', m => {
			if (m.author.id == message.author.id) {
				if (parseInt(m.content.toLowerCase()) || m.content.toLowerCase() == 0) {
					let answerNum = parseInt(m.content.toLowerCase())

					if (answerNum > availableAnswerNums || answerNum < 0) {
						m.channel.send(`That's not a valid answer! Please enter a number between 0 and ${availableAnswerNums}`)
					} else {
						let answers = Object.values(Object.values(pickedQuestion)[0])[answerNum]
						for (i in answers) {
							if (personalities[i] == undefined) personalities[i] = 0
							personalities[i] += answers[i]
						}
						
						questionNumber++
						if (questionNumber <= args[1]) {
							pickedQuestion = questionArray[Math.floor(Math.random() * questionArray.length)]
							questionArray.splice(questionArray.indexOf(pickedQuestion), 1)
							availableAnswerNums = Object.keys(Object.values(pickedQuestion)[0]).length - 1
							message.channel.send(processQuestion(message, pickedQuestion, questionNumber))
						} else if (questionNumber == args[1] + 1) {
							availableAnswerNums = 1
							pickedQuestion = {"Are you male or female?": {
								"Male.": {
									"Male": 0.1
								},
								"Female.": {
									"Female": 0.1
								}
							}}
							message.channel.send(processQuestion(message, pickedQuestion, questionNumber))
						} else {
							collector.stop()

							const dominantTrait = Object.keys(personalities).reduce((a, b) => personalities[a] > personalities[b] ? a : b)
							
							const resultPokemon = {
								"Male": {"Lonely": "Bulbasaur", 
										"Docile": "Charmander", "Quirky": "Squirtle",
										"Brave": "Pikachu", "Calm": "Chikorita", 
										"Timid": "Cyndaquil", "Jolly": "Totodile",
										"Relaxed": "Phanty", "Quiet": "Treecko",
										"Hardy": "Torchic", "Rash": "Mudkip",
										"Bold": "Turtwig", "Naive": "Chimchar",
										"Impish": "Piplup", "Hasty": "Shinx",
										"Sassy": "Riolu"},
								"Female": { "Docile": "Bulbasaur",
										"Brave": "Charmander", "Bold": "Squirtle",
										"Hasty": "Pikachu", "Relaxed": "Vulpix",
										"Jolly": "Eevee", "Quiet": "Chikorita",
										"Calm": "Cyndaquil", "Sassy": "Totodile",
										"Hardy": "Treecko", "Rash": "Torchic",
										"Lonely": "Mudkip", "Naive": "Skitty",
										"Timid": "Turtwig", "Impish": "Chimchar",
										"Quirky": "Piplup"}
								}

							let pickedPokemon

							if (personalities["Male"]) {
								pickedPokemon = resultPokemon["Male"][dominantTrait]
							} else if (personalities["Female"]) {
								pickedPokemon = resultPokemon["Female"][dominantTrait]
							}

							const personalityDescriptions = {
								"Bold": `You're so brave, and you never back down from anything! And you're also gutsy and brash in a way that others aren't! You're not shy about asking to take home all the leftovers at restaurants, right? If someone's treating you to dinner, you have no problem with ordering lots of good stuff! And you aren't fazed by doing things that most others would think twice about doing. Perhaps you don't even notice when others are upset with you! You know, you have the potential to become a truly great person...because you'll be the last one standing!`,
								"Brave": `You don't know the meaning of fear! You're not afraid to keep moving forward in the face of danger. You also have a strong sense of justice and can't turn a blind eye to someone in trouble. But you sometimes push your own personal sense of justice a little too hard. Be careful that you don't get too pushy!`,
								"Calm": `You're very compassionate and considerate, and you put friends ahead of yourself. You're so generous and kindhearted that you can laugh, forgive, and forget when your friends make mistakes. But be aware that your compassion can sometimes get the best of you, putting you too far behind everyone else!`,
								"Docile": `You're quite sensitive to others! You listen attentively and respectfully, and you're quick to pick up on things. Because you're so good at listening, do you find that your friends tell you their problems and concerns often? Perhaps people laugh at you sometimes for being so earnest and not recognizing jokes for what they are.But you're honestly surprised and bashful about this aspect of yourself...And then honestly laugh about it!`,
								"Hardy": `You're so determined! You don't whine or feel sorry for yourself, and you never need help with anything. You also have a strong sense of responsibility. You work toward your goals steadily and never require attention along the way. Your resilient spirit is the only thing you need to guide you toward your goals. But be careful! You risk wearing yourself out if you work too long all on your own! You should recognize that sometimes you need help from friends.`,
								"Hasty": `You talk quickly! You eat quickly! You walk quickly! People often see you as a hard worker because you're always moving around so fast! But be careful! If you always rush so fast, you may make mistakes more often than others do. And what a waste that would be! Relax every now and then with a nice, deep breath!`,
								"Impish": `You really like to play a lot! And you enjoy eating a lot! You love competition, but you hate losing. Your personality seems crystal clear to others. With you, what you see is what you get! You cheer others with your dazzling smile. But you may be afraid of showing what's in your heart and revealing your true self. You may not want to keep your worries to yourself. You're only human, so ask your friends for advice when you need it.`,
								"Jolly": `You have a good sense of humor, and you're compassionate. You're always making others around you laugh. You have a sunny, positive outlook, and you have a vitality that raises the lowest spirits to giddy heights! Yet, for all your great cheer, you're also open to tears...But you bounce between laughter and tears so easily! What an adventure life must be like for you, bouncing around like that all day!`,
								"Lonely": `At least a little bit! You might find that surprising, but do you think it might be a little true? You know what they say, though...We're all a bit lonely every now and then! You probably keep this fact of life to yourself, though. But if there's one thing that brings us all together...it's our need to go it solo!`,
								"Naive": `You're so open and innocent! What a strong sense of curiosity you have! And you state your opinions purely, sharing exactly what you think. You also have an artistic spirit that isn't restrained by social conventions! You startle people with your spontaneity and vision. But when you overdo it, other people can have a hard time keeping up with you...Have you noticed people looking at you oddly? As if for no apparent reason?`,
								"Quiet": `And very calm! You're great with numbers, and you analyze information before making decisions. You rarely make mistakes, because you make decisions so calmly and rationally. You also may find it hard to guess what others are thinking, and they may find you a touch cold at times. You may not want to keep your feelings to yourself so much of the time.`,
								"Quirky": `You want to be on the cutting edge of fashion! You want to own all the latest stuff, right? But you grow bored of your old things and only like new things! You're true to your emotions, and you follow your desires. People have a hard time keeping up with you because you change so quickly. You may want to reflect upon how your words and actions affect others.`,
								"Rash": `You seem to be even a bit hasty at times! You may run out of your house an forget to lock the door once in a while. And you may leave things like umbrellas behind when you leave places. Maybe you even dash outside in your slippers every now and then! Perhaps you even wear your shirts inside out all the time! Oh, is that even rasher than you really are? So sorry! But know that your friends think your funny little flubs are adorable! Oh, wait! One more thing! You also sometimes reveal your friends' secrets by accidents, don't you! Sorry. Had to be said!`,
								"Relaxed": `You're so casual, leisurely, and carefree.You don't rush or stress yourself out, and you don't worry about anything. You like to take a seat and kick up your feet! You definitely have an easygoing personality, and you don't sweat the details. People naturally flock to you because they find you to be a free spirit, which is so refreshing!`,
								"Sassy": `Or at least somewhat sassy! You don't like taking orders. You're a little rebellious and like to disagree. You're a lone wolf! You like to keep your distance from groups and go off to do things on your own. Older folks may be ones who find you the most disagreeable, even selfish. But people younger than you tend to really admire you!`,
								"Timid": `You're quite gentle! You're sometimes a little shy about new things, aren't you? Do you miss out on some experiences because you get worried about the newness of the challenge? Of course, there's also a great benefit in being cautious, isn't there? After all, it keeps you nice and safe! You live life at your own speed, with no hurries and no worries!`,
							}

							const file = new Discord.MessageAttachment(`${dataPath}/images/pokemon/${pickedPokemon}_Portrait.webp`);
							return message.channel.send({embeds: [new Discord.MessageEmbed()
								.setColor('#ff06aa')
								.setTitle(`You are a ${pickedPokemon}`)
								.setDescription(`_You seem to be the **${dominantTrait}**_ type.\n\n${personalityDescriptions[dominantTrait]}`)
								.setThumbnail(`attachment://${pickedPokemon}_Portrait.webp`)
							], files: [file]})
						}
					}
				} else if (m.content.toLowerCase() == "stop" || m.content.toLowerCase() == "end" || m.content.toLowerCase() == "cancel") {
					message.channel.send("Cancelling the quiz for you.")
					return collector.stop()
				} else {
					message.channel.send("That's not the correct answer! Please try again.")
				}
			}
		})
	}
})

function processQuestion(message, question, number) {
	let questionName = Object.keys(question)[0]
	let questionText = Object.values(question)[0]

	let answers = []
	let answerNum = 0

	for (const i in questionText) {
		answers.push(`**${answerNum}**: ${i}`)
		answerNum++
	}

	return {embeds: [new Discord.MessageEmbed()
		.setColor('#ff06aa')
		.setTitle(`${number}${number == 1 ? "st" : number == 2 ? "nd" : number == 3 ? "rd" : "th"} Question:`)
		.setDescription(questionName)
		.addField("Answers", answers.join("\n"))
		.setFooter("Type the number of the answer you want to pick.")
	]}
}