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

commands.diceroll = new Command({
	desc: "*Args: <Num: Sides> {Num: Dice Count}*\nRolls the specified amount of dice with the specified amount of sides.",
	section: "fun",
	func: (message, args) => {
		if (!args[0] || args[0] === ' ' || args[0] === 'null') {
            const DiscordEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`${getPrefix(message.guild.id)}diceroll`)
				.setDescription(commands.diceroll.desc)
            message.channel.send({embeds: [DiscordEmbed]})
            return false
        }

		const num1 = parseInt(args[0]);

		const num2 = args[1] ? parseInt(args[1]) : 1

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
	desc: "*Args: {Ping: Another Person}*\nGenerates a funny scenario that could probably easily be taken out of context.",
	section: "fun",
	func: (message, arg) => {
        if (arg[1]) {
            if (message.mentions.users.first()) {
                const taggedUser = message.mentions.users.first();
                let sceneText = `${message.author.username} & ${taggedUser.username} `

				let scenario = duoScenarios[Math.round(Math.random() * (duoScenarios.length - 1))]
				sceneText = sceneText + scenario
				const DiscordEmbed = new Discord.MessageEmbed()
					.setColor('#0099ff')
					.setTitle(`${message.author.username} & ${taggedUser.username}`)
					.setDescription(`${sceneText}`)
					.setFooter('rpg!scenario');
				message.channel.send({embeds: [DiscordEmbed]})
            } else {
                const DiscordEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(`${message.author.username} & ${arg[1]}`)
					.setDescription(`${message.author.username} & ${arg[1]} are not related in any way.`)
                message.channel.send({embeds: [DiscordEmbed]})
            }
        } else {
            let sceneText = `${message.author.username} `
            let scenario = soloScenarios[Math.round(Math.random() * (soloScenarios.length - 1))]
            sceneText = sceneText + scenario
            const DiscordEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`${message.author.username}`)
				.setDescription(`${sceneText}`)
            message.channel.send({embeds: [DiscordEmbed]})
            return true
        };
	}
})