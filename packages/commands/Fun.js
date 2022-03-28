commands.ping = new Command({
	desc: "Pong.",
	section: "fun",
	func: (message, args) => {
		let pingVal = Date.now() - message.createdTimestamp
		let latencyVal = Math.round(client.ws.ping)
		
		let hit = "There! I hit it!"
		if (pingVal > 50 || pingVal < -50 || latencyVal < 20) {
			hit = "Darn, guess I missed."
		}

        message.channel.send(`🏓 Allow me to swing! \nLatency is ${pingVal}ms. API Latency is ${latencyVal}ms\n${hit}`);
	}
})

commands.diceroll = new Command({
	desc: "*Args: <Sides> <?Dice Count>*\nRolls the specified amount of dice with the specified amount of sides.",
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

		const num1 = parseInt(arg[0]);

		if (arg[1]) {
            const num2 = parseInt(arg[1]);

			if (num1 < 1)
                return message.channel.send(`Your 1st number (${num1}) has got to be a number above 1.`);
			else if (num2 < 1)
                return message.channel.send(`Your 2nd number (${num2}) has got to be a number above 1.`);
			else if (num1 > 300)
                return message.channel.send(`Your 1st number (${num1}) has got to be a number below 300.`);
			else if (num2 > 300)
                return message.channel.send(`Your 2nd number (${num2}) has got to be a number below 300.`);

			let totalNum = 0;
			let resultsNums = [];
			for (let i = 0; i < num2; i++) {
				const resultNum = Math.ceil(Math.random() * num1)
				resultsNums.push(resultNum)
				totalNum += resultNum;
			};

			resultsNums.sort(function(a, b) {return a + b})

			let resultsTxt = `(${resultsNums})`

			let endTxt = `Your result after multiple rolls is ${totalNum} ${resultsTxt} after rolling a ${num2}d${num1}.`
			if (totalNum == 69)
				endTxt += ' Therefore, I have a [prize](https://www.youtube.com/watch?v=ub82Xb1C8os) for you :)';

			const DiscordEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`${getPrefix(message.guild.id)}diceroll`)
				.setDescription(endTxt)
			message.channel.send({embeds: [DiscordEmbed]})
        } else {
			if (num1 < 1)
                return message.channel.send(`Your number (${num1}) has got to be a number above 1.`);

            let resultNum = Math.ceil(Math.random() * num1)
			const DiscordEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`${getPrefix(message.guild.id)}diceroll`)
				.setDescription(`Your result is ${resultNum} after rolling a d${num1}.`)
			message.channel.send({embeds: [DiscordEmbed]})
        };
	}
})