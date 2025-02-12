let damageFormulas = {
	'persona': '5 * (Skill Power / |Skill Power|) * √(Attack/Endurance * |Skill Power|) + (-10 to 10)',
	'pokemon': '(((2 * level) / 5 + 2) * Power * Attack/Endurance) / 50 + 2 + (-10 to 10)',
	'lamonka': '((Power+Level) * ((Attack/Endurance) / 4)) * (0.95 to 1.05)',
	'beta': '(0 to Level+35) + (0 to Power/1.75) + (-20 to 20)',
	'limitbreak': '(Power / 2 + Level + Attack) - (Endurance * 2)',
	'custom': 'uhhhh Spectra you handle this'
}

commands.settings = new Command({
	desc: 'View this server\'s settings here.',
	section: 'moderation',
	aliases: ['serversettings', 'viewsettings', 'getsettings'],
	args: [],
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		let mechanicText = ''
		for (const i in settings['mechanics']) {
			switch (i) {
				case 'limitbreaks':
					mechanicText += `**Limit Breaks**: ${settings['mechanics'][i] == true ? 'Enabled' : 'Disabled'}\n`
					break
				case 'teamcombos':
					mechanicText += `**Team Combos**: ${settings['mechanics'][i] == true ? 'Enabled' : 'Disabled'}\n`
					break
				case 'onemores':
					mechanicText += `**One Mores**: ${settings['mechanics'][i] == true ? 'Enabled' : 'Disabled'}\n`
					break
				case 'stataffinities':
					mechanicText += `**Status Affinities**: ${settings['mechanics'][i] == true ? 'Enabled' : 'Disabled'}\n`
					break
				case 'leaderskills':
					mechanicText += `**Leader Skills**: ${settings['mechanics'][i] == true ? 'Enabled' : 'Disabled'}\n`
					break
				case 'technicaldamage':
					mechanicText += `**Technical Damage**: ${settings['mechanics'][i] == true ? 'Enabled' : 'Disabled'}\n`
					break
				case 'charms':
				case 'transformations':
				case 'trust':
				case 'pets':
					mechanicText += `**${i.charAt(0).toUpperCase() + i.slice(1)}**: ${settings['mechanics'][i] == true ? 'Enabled' : 'Disabled'}\n`
					break
			}
		}
		
		let capText = ''
		for (const i in settings['caps']) {
			switch (i) {
				case 'levelcap':
					capText += `**Level Cap**: ${settings['caps'][i]}\n`
					break
				case 'hpmpcap':
					capText += `**HP+MP Stat Cap**: ${settings['caps'][i]}\n`
					break
				case 'statcap':
					capText += `**Stat Cap**: ${settings['caps'][i]}\n`
					break
				case 'basestatcap':
					capText += `**Base Stat Cap**: ${settings['caps'][i]}\n`
					break
				case 'bstcap':
					capText += `**Base Stat Total Cap**: ${settings['caps'][i]}\n`
					break
				case 'skillamount':
					capText += `**Character Skill Cap**: ${settings['caps'][i]}\n`
					break
				case 'teamsize':
					capText += `**Team Size**: ${settings['caps'][i]}\n`
					break
			}
		}

		let affinityRateText = ''
		for (const i in settings['rates']['affinities']) {
			affinityRateText += `**${affinityEmoji[i]} ${i.charAt(0).toUpperCase() + i.slice(1)} Affinity Rate**: ${settings['rates']['affinities'][i]}x\n`
		}

		let formulaText = '';
		formulaText += `**Damage Formula:**\n${settings['formulas']['damageFormula'].charAt(0).toUpperCase() + settings['formulas']['damageFormula'].slice(1)}\n\`${damageFormulas[settings['formulas']['damageFormula']]}\``

		let levelUpFormulas = {
			'original': 'No Specific Formula',
			'assist': '(BaseStat+3) * (1 + ((Level-1) * 0.06751))',
			'percent': 'BaseStat * (1 + ((Level-1) * 0.091))',
			'lamonka': 'A system',
			'custom': 'bruh'
		}

		formulaText += `\n**Level Up Formula**\n${settings['formulas']['levelUpFormula'].charAt(0).toUpperCase() + settings['formulas']['levelUpFormula'].slice(1)}\n\`${levelUpFormulas[settings['formulas']['levelUpFormula']]}\``

		let xpCalcFormulas = {
			'original': 'No Specific Formula',
			'custom': 'uhhhh Spectra you handle this'
		}

		formulaText += `\n**XP Requirement Formula**\n${settings['formulas']['xpCalcFormula'].charAt(0).toUpperCase() + settings['formulas']['xpCalcFormula'].slice(1)}\n\`${xpCalcFormulas[settings['formulas']['xpCalcFormula']]}\``

		let rateText = ''
		for (const i in settings['rates']) {
			switch (i) {
				case 'mainelement':
					rateText += `**Main Element Damage Rate**: ${settings['rates'][i]}x\n`
					break
				case 'dualmainelement':
					rateText += `**Dual Main Element Damage Rate**: ${settings['rates'][i]}x\n`
					break
				case 'crit':
					rateText += `**Critical Damage Rate**: ${settings['rates'][i]}x\n`
					break
				case 'xprate':
					rateText += `**XP Rate**: ${settings['rates'][i]}x\n`
					break
				case 'trustrate':
					rateText += `**Trust Rate**: ${settings['rates'][i]}x\n`
					break
				case 'goldchance':
					rateText += `**Golden Enemy Chance**: ${settings['rates'][i]}%\n`
					break
				case 'moneyrate':
					rateText += `**Money Rate**: ${settings['rates'][i]}x\n`
					break
				case 'tech':
					if (settings['mechanics']['technicaldamage'] == true) {
						rateText += `**Technical Damage Rate**: ${settings['rates'][i]}x\n`
					}
					break
				case 'limitbreak':
					rateText += `**Limit Break Gain Rate**: ${settings['rates'][i]}x\n`
					break
			}
		}

		let miscText = ''
		miscText += `**Prefix**: ${settings['prefix']}\n`
		miscText += `**Currency**: ${getCurrency(message.guild.id)}, ${settings['currency']}s\n`

		let DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('Server Settings for ' + message.guild.name)
			.addField('Mechanics', `${mechanicText}`, true)
			.addField('Caps', `${capText}`, true)
			.addField('Affinity Rates', `${affinityRateText}`, true)
			.addField('Formulas', `${formulaText}`, true)
			.addField('Rates', `${rateText}`, true)
			.addField('Misc', `${miscText}`, true)

			if (settings['mechanics']['transformations'] == true) {
				let transformationText = ''
				for (const i in settings['caps']['transformations']) {
					switch (i) {
						case 'hpcap':
							transformationText += `**HP Stat Buff Cap**: ${settings['caps']['transformations'][i]}\n`
							break
						case 'statcap':
							transformationText += `**Stat Buff Cap**: ${settings['caps']['transformations'][i]}\n`
							break
						case 'basestatmincap':
							transformationText += `**Minimum Base Stat Buff Cap**: ${settings['caps']['transformations'][i]}\n`
							break
						case 'basestatmaxcap':
							transformationText += `**Maximum Base Stat Buff Cap**: ${settings['caps']['transformations'][i]}\n`
							break
						case 'bstcap':
							transformationText += `**Base Stat Total Cap**: ${settings['caps']['transformations'][i]}\n`
							break
						case 'level':
							transformationText += `**Transformation Level**: ${settings['caps']['transformations'][i]}\n`
							break
						case 'transformationlimit':
							transformationText += `**Transformation Limit**: ${settings['caps']['transformations'][i]}\n`
							break
					}
				}
				DiscordEmbed.addField('Transformation Caps', `${transformationText}`, false)
			}
			if (settings['desc'] == true) {
				DiscordEmbed.addField('Description', `${settings['desc']}`, false)
			}

		message.channel.send({embeds: [DiscordEmbed] })
	}
})

commands.prefix = new Command({
	desc: 'Change the prefix for the server',
	section: 'moderation',
	aliases: ['serverprefix', 'setprefix'],
	args: [
		{
			name: 'New Prefix',
			type: 'Word',
			forced: true
		}
	],
	admin: "You do not have permission to change the prefix!",
	func(message, args, guilded) {
		const prefix = args[0].toLowerCase()
		let settings = setUpSettings(message.guild.id)
		settings['prefix'] = prefix
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Prefix set to ' + prefix)
	}
})

commands.ban = new Command({
	desc: 'Ban a user from using rpg-related commands in the server.',
	section: 'moderation',
	aliases: ['banuser', 'banmember'],
	args: [
		{
			name: 'User',
			type: 'Ping',
			forced: true
		},
		{
			name: 'Reason',
			type: 'Word',
			forced: false
		}
	],
	admin: "You do not have permission to ban users!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		let bannedUser = args[0]
		let reason = args[1]
		if (reason == undefined) {
			reason = 'No reason given'
		}

		if (bannedUser.id == message.author.id) {
			return message.channel.send('You cannot ban yourself!')
		}
		if (utilityFuncs.RPGBotAdmin(bannedUser.id) || bannedUser.flags.serialize().ADMINISTRATOR) {
			return message.channel.send('You cannot ban an admin!')
		}
		if (bannedUser.id == client.user.id) {
			return message.channel.send('You cannot ban me! Why would you do that?')
		}

		if (settings['banned'].includes(bannedUser.id)) {
			return message.channel.send('This user is already banned!')
		}

		settings['banned'].push(bannedUser.id)
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))

		message.channel.send(`<@${bannedUser.id}> You have been banned from using rpg-related commands in the server ` + message.guild.name + ' for the following reason: ' + reason)
	}
})

commands.unban = new Command({
	desc: 'Unban a user from using rpg-related commands in the server.',
	section: 'moderation',
	aliases: ['unbanuser', 'unbanmember'],
	args: [
		{
			name: 'User',
			type: 'Ping',
			forced: true
		}
	],
	admin: "You do not have permission to unban users!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		let bannedUser = args[0]

		if (!settings['banned'].includes(bannedUser.id)) {
			return message.channel.send('This user is not banned!')
		}

		settings['banned'].splice(settings['banned'].indexOf(bannedUser.id), 1)
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))

		message.channel.send(`<@${bannedUser.id}> You have been unbanned from using rpg-related commands in the server ` + message.guild.name)
	}
})

commands.currency = new Command({
	desc: 'Change the currency for the server.',
	section: 'moderation',
	aliases: ['setcurrency', 'setmoney', 'setmoneytype'],
	args: [
		{
			name: 'Currency',
			type: 'Word',
			forced: true
		}
	],
	admin: "You do not have permission to change the currency!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)


		if (message.mentions.users.first())
			return message.channel.send("Don't ping others with this, that's just mean.");
		else if (args[0].toLowerCase() == 'dick')
			return message.channel.send("Not funny enough to let you do this, you clown.");
		else if (args[0].toLowerCase() == 'balls')
			return message.channel.send("You're either ballin', playing with balls, or being stopped by Blossom Battler... you sick human being.");
		else if (args[0].toLowerCase() == 'vagina')
			return message.channel.send("Yeah okay... No.");
		else if (args[0].toLowerCase() == 'women' || args[0].toLowerCase() == 'woman')
			return message.channel.send("This is no harem.");
		else if (args[0].toLowerCase() == 'sex' || args[0].toLowerCase() == 'ass' || args[0].toLowerCase() == 'doggy-style' || args[0].toLowerCase() == 'doggystyle')
			return message.channel.send("No you can't have sex with a robot, even if they had the capability to.");
		else {
			let currencyText = args[0].toLowerCase()
			const inapropriateWords = ['dick', 'balls', 'penis', 'vagina', 'pussy', 'fuck', 'shit', 'nigga', 'n-word', 'nigger', 'rape', 'porn', 'hentai', 'ass', 'tit', 'breast']

			for (const i in inapropriateWords) {
				if (currencyText === inapropriateWords[i]) {
					message.channel.send("This word is too inapropriate. Sorry.");
					return
				}
			}
		}

		settings['currency'] = args[0]
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Currency set to ' + args[0])
	}
})

commands.currencyemoji = new Command({
	desc: 'Change the currency emoji for the server. _Please note that if you say "yes" to "Ignore Checks", you must use the FULL ID of an emoji, else it will likely not function._',
	section: 'moderation',
	aliases: ['setcurrencyemoji', 'setmoneyemoji', 'setmoneyemoji'],
	args: [
		{
			name: 'Emoji',
			type: 'Word',
			forced: true
		},
		{
			name: 'Ignore Checks',
			type: 'YesNo'
		}
	],
	admin: "You do not have permission to change the currency emoji!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		let emotes = args[0].match(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu);
		let emoj = emotes?.[0]

		if (args[1]) {
			emoj = args[0]
		} else {
			if (emoj == undefined) return message.channel.send('You must provide an existing emoji! This means it must not be from another server, or not an emoji.');
			if (emoj.length > 3 && !message.guild.emojis.cache.find(emoji => emoj == emoji.toString())) return message.channel.send('The emoji you provided is not valid in this server! The emoji **must be present** in this server, sorry Nitro users!');
		}

		settings['currency_emoji'] = emoj
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))

		message.channel.send('Currency emoji set to ' + emoj)
	}
})

commands.description = new Command({
	desc: 'Change the description for the server.',
	section: 'moderation',
	aliases: ['setdescription', 'setdesc'],
	args: [
		{
			name: 'Description',
			type: 'Word',
			forced: true
		}
	],
	admin: "You do not have permission to change the description!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		if (args[0].length > 1024) {
			return message.channel.send('Description is too long!')
		}
		if (args[0] == '' || args[0] == ' ' || args[0] == 'none') {
			settings['desc'] = ''
		} else {
			settings['desc'] = args[0]
		}
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Description set to ' + args[0])
	}
})

commands.damageformula = new Command({
	desc: 'Change the damage formula for the server.',
	section: 'moderation',
	aliases: ['setdamageformula', 'setdamageform', 'setdamage'],
	args: [
		{
			name: 'Damage Formula',
			type: 'Word',
			forced: true
		},
		{
			name: 'Formula',
			type: 'Word',
		}
	],
	admin: "You do not have permission to change the damage formula!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		if (args[0].toLowerCase() != 'persona' && args[0].toLowerCase() != 'pokemon' && args[0].toLowerCase() != 'lamonka' && args[0].toLowerCase() != 'beta' && args[0].toLowerCase() != 'custom') {
			return message.channel.send('Invalid damage formula! Valid formulas are: persona, pokemon, lamonka, beta')
		}

		if (args[0].toLowerCase() == 'custom') {
			return message.channel.send('Custom damage formulas are not yet supported!')
		}

		settings['formulas']['damageFormula'] = args[0].toLowerCase();
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Damage formula set to ' + args[0].charAt(0).toUpperCase() + args[0].slice(1) + '\n\`' + damageFormulas[args[0].toLowerCase()] + '\`')
	}
})

commands.levelupformula = new Command({
	desc: 'Change the level up formula for the server.',
	section: 'moderation',
	aliases: ['setlevelupformula', 'setlevelupform', 'setlevelup'],
	args: [
		{
			name: 'Level Up Formula',
			type: 'Word',
			forced: true
		},
		{
			name: 'Formula',
			type: 'Word',
		}
	],
	admin: "You do not have permission to change the level up formula!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		let levelUpFormulas = {
			'original': 'No Specific Formula',
			'assist': '(BaseStat+3) * (1 + ((Level-1) * 0.06751))',
			'percent': 'BaseStat * (1 + ((Level-1) * 0.091))',
			'lamonka': 'A system',
			'custom': 'uhhhh Spectra you handle this'
		}

		if (args[0].toLowerCase() != 'original' && args[0].toLowerCase() != 'assist' && args[0].toLowerCase() != 'percent' && args[0].toLowerCase() != 'custom' && args[0].toLowerCase() != 'lamonka') {
			return message.channel.send('Invalid level up formula! Valid formulas are: original, assist, percent, custom')
		}

		if (args[0].toLowerCase() == 'custom') {
			return message.channel.send('Custom level up formulas are not yet supported!')
		}

		settings['formulas']['levelUpFormula'] = args[0].toLowerCase()
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Level up formula set to ' + args[0].charAt(0).toUpperCase() + args[0].slice(1) + '\n\`' + levelUpFormulas[args[0].toLowerCase()] + '\`')
	}
})

commands.xprequirementformula = new Command({
	desc: 'Change the xp requirement formula for the server.',
	section: 'moderation',
	aliases: ['setxprequirementformula', 'setxprequirementform', 'setxprequirement'],
	args: [
		{
			name: 'XP Requirement Formula',
			type: 'Word',
			forced: true
		},
		{   
			name: 'Formula',
			type: 'Word',
		}
	],
	admin: "You do not have permission to change the xp requirement formula!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		let xpCalcFormulas = {
			'original': 'No Specific Formula',
			'custom': 'uhhhh Spectra you handle this'
		}

		if (args[0].toLowerCase() != 'original' && args[0].toLowerCase() != 'custom') {
			return message.channel.send('Invalid xp requirement formula! Valid formulas are: original, custom')
		}

		if (args[0].toLowerCase() == 'custom') {
			return message.channel.send('Custom xp requirement formulas are not yet supported!')
		}

		settings['formulas']['xpCalcFormula'] = xpCalcFormulas[args[0].toLowerCase()]
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('XP requirement formula set to ' + args[0].charAt(0).toUpperCase() + args[0].slice(1) + '\n\`' + xpCalcFormulas[args[0].toLowerCase()] + '\`')
	}
})

commands.xprate = new Command({
	desc: 'Change the xp rate for the server.',
	section: 'moderation',
	aliases: ['setxprate', 'setxp'],
	args: [
		{
			name: 'XP Rate',
			type: 'Decimal',
			forced: true
		}
	],
	admin: "You do not have permission to change the xp rate!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		if (args[0] < 0) {
			return message.channel.send('XP rate cannot be less than 0!')
		}

		settings['rates']['xprate'] = args[0]
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('XP rate set to ' + args[0] + 'x')
	}
})

commands.trustrate = new Command({
	desc: 'Change the trust rate for the server.',
	section: 'moderation',
	aliases: ['settrustrate', 'settrust'],
	args: [
		{
			name: 'Trust Rate',
			type: 'Decimal',
			forced: true
		}
	],
	admin: "You do not have permission to change the trust rate!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		if (!settings?.mechanics?.trust) return message.channel.send('Trust is not enabled for this server!')

		if (args[0] < 0) {
			return message.channel.send('Trust rate cannot be less than 0!')
		}

		settings['rates']['trustrate'] = args[0]
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Trust rate set to ' + args[0] + 'x')
	}
})

commands.moneyrate = new Command({
	desc: 'Change the money rate for the server.',
	section: 'moderation',
	aliases: ['setmoneyrate', 'setmoney'],
	args: [
		{
			name: 'Money Rate',
			type: 'Decimal',
			forced: true
		}
	],
	admin: "You do not have permission to change the money rate!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		if (args[0] < 0) {
			return message.channel.send('Money rate cannot be less than 0!')
		}

		settings['rates']['moneyrate'] = args[0]
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Money rate set to ' + args[0] + 'x')
	}
})

commands.goldenchance = new Command({
	desc: 'Change the chance of golden enemies appearing in battles for the server.',
	section: 'moderation',
	aliases: ['setgoldenchance', 'setgolden', 'goldchance', 'setgoldchance', 'setgold'],
	args: [
		{
			name: 'Golden Enemy Chance',
			type: 'Decimal',
			forced: true
		}
	],
	admin: "You do not have permission to change the golden enemy chance!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		if (args[0] < 0 || args[0] > 100) {
			return message.channel.send('Golden enemy chance must be between 0 and 100!')
		}

		settings['rates']['goldchance'] = args[0]
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Golden enemy chance set to ' + args[0] + '%')
	}
})

commands.mainelementrate = new Command({
	desc: 'Change the character main element damage rate in battles for the server.',
	section: 'moderation',
	aliases: ['setmainelementrate', 'setmainelement', 'setmain', 'setmainrate', 'setmainelementrate', 'setmainelement'],
	args: [
		{
			name: 'Main Element Damage Rate',
			type: 'Decimal',
			forced: true
		}
	],
	admin: "You do not have permission to change the main element damage rate!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		if (args[0] < 1) {
			return message.channel.send('Main element damage rate cannot be less than 1!')
		}

		settings['rates']['mainelement'] = args[0]
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Main element damage rate set to ' + args[0] + '%')
	}
})

commands.dualmainelementrate = new Command({
	desc: 'Change the character main element damage rate in battles for the server.',
	section: 'moderation',
	aliases: ['setdualmainelementrate', 'setdualmainelement', 'setdualmain', 'setdualmainrate', 'setdualmainelementrate', 'setdualmainelement'],
	args: [
		{
			name: 'Main Element Damage Rate',
			type: 'Decimal',
			forced: true
		}
	],
	admin: "You do not have permission to change the main element damage rate!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		if (args[0] < 1) {
			return message.channel.send('Main element damage rate cannot be less than 1!')
		}

		settings['rates']['dualmainelement'] = args[0]
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Dual main element damage rate set to ' + args[0] + '%')
	}
})

commands.critrate = new Command({
	desc: 'Change the critical hit damage rate in battles for the server.',
	section: 'moderation',
	aliases: ['setcritrate', 'setcrit', 'setcritical', 'setcriticalrate', 'setcriticalhit', 'setcriticalhitrate'],
	args: [
		{
			name: 'Critical Hit Damage Rate',
			type: 'Decimal',
			forced: true
		}
	],
	admin: "You do not have permission to change the critical hit damage rate!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		if (args[0] <= 1) {
			return message.channel.send('Critical hit damage rate needs to be more than 1!')
		}

		settings['rates']['crit'] = args[0]
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Critical hit damage rate set to ' + args[0] + 'x')
	}
})

commands.techrate = new Command({
	desc: 'Change the technical damage rate in battles for the server.',
	section: 'moderation',
	aliases: ['settechrate', 'settech', 'settechnical', 'settechnicalrate', 'settechnicaldamage', 'settechnicaldamagerate'],
	args: [
		{
			name: 'Technical Damage Rate',
			type: 'Decimal',
			forced: true
		}
	],
	admin: "You do not have permission to change the technical damage rate!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)
		if (settings.mechanics.technicaldamage == false) return message.channel.send('Technical damage is not enabled for this server!')

		if (args[0] <= 0) {
			return message.channel.send('Technical damage rate needs to be more than 0!')
		}

		settings['rates']['tech'] = args[0]
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Technical damage rate set to ' + args[0] + 'x')
	}
})

commands.limitbreakrate = new Command({
	desc: 'Change the technical damage rate in battles for the server.',
	section: 'moderation',
	aliases: ['setlimitbreakrate', 'setlbrate', 'lbrate'],
	args: [
		{
			name: 'Limit Break Gain Rate',
			type: 'Decimal',
			forced: true
		}
	],
	admin: "You do not have permission to change the limit break gain rate!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)
		if (settings?.mechanics?.limitbreaks == false) return message.channel.send('Limit Breaks are not enabled for this server!')

		if (args[0] <= 0) {
			return message.channel.send('Limit Break gain rate needs to be more than 0!')
		}

		settings['rates']['limitbreak'] = args[0]
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Limit break gain rate set to ' + args[0] + 'x')
	}
})

commands.mechanics = new Command({
	desc: 'Change the mechanics for the server.',
	section: 'moderation',
	aliases: ['setmechanics', 'setmechanic', 'setmech'],
	args: [
		{
			name: 'Mechanic',
			type: 'Word',
			forced: true
		}
	],
	admin: "You do not have permission to change the mechanics!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		const fullNames = {
			'limitbreaks': 'Limit Breaks',
			'teamcombos': 'Team Combos',
			'onemores': 'One Mores',
			'stataffinities': 'Status Affinities',
			'charms': 'Charms',
			'leaderskills': 'Leader Skills',
			'transformations': 'Transformations',
			'technicaldamage': 'Technical Damage',
			'fusionskills': 'Fusion Skills',
			'powerlevels': 'Power Levels',
			'trust': 'Trust',
			'pets': 'Pets'
		}

		switch (args[0].toLowerCase()) {
			case 'limitbreaks':
			case 'teamcombos':
			case 'onemores':
			case 'stataffinities':
			case 'charms':
			case 'leaderskills':
			case 'transformations':
			case 'technicaldamage':
			case 'fusionskills':
			case 'powerlevels':
			case 'trust':
			case 'pets':
				settings['mechanics'][args[0].toLowerCase()] = !settings['mechanics'][args[0].toLowerCase()]
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
				message.channel.send(fullNames[args[0].toLowerCase()] + ' are now ' + (settings['mechanics'][args[0].toLowerCase()] ? 'enabled' : 'disabled'))
				break
			default:
				message.channel.send('Invalid mechanic! Valid mechanics are: limitbreaks, teamcombos, onemores, stataffinities, charms, leaderskills, transformations, technicaldamage, fusionskills, powerlevels, trust & pets.')
				break
		}
	}
})

commands.caps = new Command({
	desc: 'Change the caps for the server.',
	section: 'moderation',
	aliases: ['setcaps', 'setcap', 'setcapamount', 'setcapamounts', 'setcapamounts'],
	args: [
		{
			name: 'Cap',
			type: 'Word',
			forced: true
		},
		{
			name: 'Amount',
			type: 'Num',
			forced: true
		}
	],
	admin: "You do not have permission to change the caps!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		const fullNames = {
			'levelcap': 'Level Cap',
			'hpmpcap': 'HP+MP Cap',
			'statcap': 'Stat Cap',
			'basestatcap': 'Base Stat Cap',
			'bstcap': 'Base Stat Total Cap',
			'skillamount': 'Skill Amount',
			'teamsize': 'Team Size',
		}

		switch (args[0].toLowerCase()) {
			case 'levelcap':
				if (args[1] > 999) return message.channel.send("That's too high of a level cap! Max level cap is 999.")
				if (args[1] < 1) return message.channel.send("That's too low of a level cap!");
				settings['caps'][args[0].toLowerCase()] = args[1]
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
				message.channel.send(fullNames[args[0].toLowerCase()] + ' set to ' + args[1])
				break;
			case 'hpmpcap':
			case 'statcap':
			case 'basestatcap':
			case 'bstcap':
			case 'skillamount':
			case 'teamsize':
				if (args[1] < 1) return message.channel.send("That's too low of a cap!");
				if (args[0].toLowerCase() == 'teamsize' || args[0].toLowerCase() == 'skillamount') {
					if (args[1] > 16) return message.channel.send("That's too high of a cap! It must be less than or equal to 16.");
				}
				settings['caps'][args[0].toLowerCase()] = args[1]
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
				message.channel.send(fullNames[args[0].toLowerCase()] + ' set to ' + args[1])
				break
			default:
				message.channel.send('Invalid cap! Valid caps are: levelcap, hpmpcap, statcap, basestatcap, bstcap, skillamount, teamsize')
				break
		}
	}
})

commands.transformationcaps = new Command({
	desc: 'Change the transformation caps for the server.',
	section: 'moderation',
	aliases: ['settransformationcaps', 'settransformationcap', 'settransformationcapamount', 'settransformationcapamounts', 'settransformationcapamounts'],
	args: [
		{
			name: 'Cap',
			type: 'Word',
			forced: true
		},
		{
			name: 'Amount',
			type: 'Num',
			forced: true
		}
	],
	admin: "You do not have permission to change the caps!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)
		if (settings.mechanics.transformations == false) return message.channel.send('Transformations are not enabled!')

		const fullNames = {
			'hpcap': 'HP Buff Cap',
			'statcap': 'Stat Buff Cap',
			'basestatmincap': 'Minimum Base Stat Buff Cap',
			'basestatmaxcap': 'Maximum Base Stat Buff Cap',
			'bstcap': 'Base Stat Total Cap',
			'level': 'Transformation Level',
			'transformationlimit': 'Transformation Limit',
		}

		switch (args[0].toLowerCase()) {
			case 'hpcap':
			case 'statcap':
			case 'basestatmincap':
			case 'basestatmaxcap':
			case 'bstcap':
			case 'level':
			case 'transformationlimit':
				if (args[1] < 1) return message.channel.send("That's too low of a cap!");
				settings['caps']['transformations'][args[0].toLowerCase()] = args[1]
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
				message.channel.send(fullNames[args[0].toLowerCase()] + ' set to ' + args[1])
				break
			default:
				message.channel.send('Invalid cap! Valid caps are: hpcap, statcap, basestatmincap, basestatmaxcap, bstcap, level, transformationlimit')
				break
		}
	}
})

commands.affinityrates = new Command({
	desc: 'Change the affinity damage rates for the server.',
	section: 'moderation',
	aliases: ['setaffinityrates', 'setaffinityrate', 'setaffinityrateamount', 'setaffinityrateamounts', 'setaffinityrateamounts'],
	args: [
		{
			name: 'Affinity',
			type: 'Word',
			forced: true
		},
		{
			name: 'Rate',
			type: 'Decimal',
			forced: true
		}
	],
	admin: "You do not have permission to change the affinity rates!",
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		const fullNames = {
			'deadly': 'Deadly',
			'superweak': 'Super Weak',
			'weak': 'Weak',
			'resist': 'Resist',
			'repel': 'Repel',
			'drain': 'Drain'
		}

		switch (args[0].toLowerCase()) {
			case 'deadly':
			case 'superweak':
			case 'weak':
			case 'resist':
			case 'repel':
			case 'drain':
				if (args[1] <= 0) return message.channel.send("That's too low of a rate!");
				settings['rates']['affinities'][args[0].toLowerCase()] = args[1]
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
				message.channel.send(fullNames[args[0].toLowerCase()] + 'damage rate set to ' + args[1])
				break
			default:
				message.channel.send('Invalid affinity! Valid affinities are: deadly, superweak, weak, resist, repel, drain')
				break
		}
	}
})

commands.reloadfile = new Command({
	desc: '**Blossom Battler Administrator Only!**\nReloads a file for the server.',
	section: 'moderation',
	aliases: ['reload', 'reloadfile'],
	args: [
		{
			name: 'File',
			type: 'Word',
			forced: true
		},
		{
			name: 'User',
			type: 'Word',
		}
	],
	func(message, args, guilded) {
		if (!utilityFuncs.RPGBotAdmin(message.author.id)) return message.channel.send('You do not have permission to reload files!')

		let validFiles = ['armors', 'characters', 'chests', 'enemies', 'items', 'loot', 'parties', 'settings', 'shops', 'weapons', 'trials']
		let validGlobalFiles = ['pmdquestions', 'ships', 'skills']
		let validUserDataFiles = ['userdata']

		if (!validFiles.includes(args[0].toLowerCase()) && !validGlobalFiles.includes(args[0].toLowerCase()) && !validUserDataFiles.includes(args[0].toLowerCase())) return message.channel.send(`Invalid file!`)

		if (validFiles.includes(args[0].toLowerCase())) {
			setUpFile(`${dataPath}/json/${message.guild.id}/${args[0].toLowerCase()}.json`, true)
		} else if (validGlobalFiles.includes(args[0].toLowerCase())) {
			switch (args[0].toLowerCase()) {
				case 'pmdquestions':
					pmdFile = setUpFile(`${dataPath}/json/pmdquestions.json`, true)
					break
				case 'ships':
					shipFile = setUpFile(`${dataPath}/json/ships.json`, true)
					break
				case 'skills':
					skillFile = setUpFile(`${dataPath}/json/skills.json`, true)
					break
			}
		} else if (validUserDataFiles.includes(args[0].toLowerCase())) {
			if (!args[1]) return message.channel.send(`You must specify a user!`)

			if (args[1].startsWith('<@') && args[1].endsWith('>')) {
				args[1] = args[1].slice(2, -1)
			} else if (args[1].startsWith('<@!') && args[1].endsWith('>')) {
				args[1] = args[1].slice(3, -1)
			}
			
			let user = message.guild.members.cache.find(member => {
				if (member.user.id === args[1]) return true
				if (member.user.tag === args[1]) return true
				if (member.user.username === args[1]) return true
			})
			if (!user) return message.channel.send(`Could not find user!`)

			setUpFile(`${dataPath}/json/userdata/${user.id}.json`, true)
		}
		message.react('👍').then(() => {
			message.delete(5000)
		})
	}
})

// Export a file.
commands.exportfile = new Command({
	desc: "Exports a file.",
	aliases: ['exportafile', 'realexportfile', 'exportdata'],
	section: "moderation",
	args: [
		{
			name: 'File Name',
			type: 'Word',
			forced: true
		},
	],
	checkban: true,
	func: async(message, args) => {
		// Firstly, make sure if this file should be legal.
		let files = ["weapons.json", "armors.json", "characters.json", "chests.json", "enemies.json", "items.json", "shops.json", "skills.json", "trials.json"];
		if (!files.includes(args[0].toLowerCase())) return void message.channel.send("That file either does not exist or is illegal.");

		// Upload content.
		if (args[0].toLowerCase() === "skills.json") {
			message.channel.send({content: `Here is the data you requested!`, files: [`${dataPath}/json/skills.json`]});
		} else {
			message.channel.send({content: `Here is the data you requested!`, files: [`${dataPath}/json/${message.guild.id}/${args[0]}`]});
		}
	}
})

const downloadFile = (async(url, destfolder, filename) => {
	const res = await fetch(url);
	if (!fs.existsSync(destfolder)) await fs.mkdir(destfolder);

	const destination = paths.resolve(destfolder, filename);
	const fileStream = fs.createWriteStream(destination, { flags: 'w' });
	await streamP.finished(stream.Readable.fromWeb(res.body).pipe(fileStream));
});

commands.importfile = new Command({
	desc: "[SUPERADMIN ONLY]",
	aliases: ['importenemyfile', 'realimportenemy'],
	section: "moderation",
	args: [
		{
			name: 'File Name',
			type: 'Word',
			forced: true
		},
	],
	checkban: true,
	func: async(message, args) => {
		if (!utilityFuncs.RPGBotAdmin(message.author.id)) return void message.channel.send("Only a super admin can use this.");

		// Firstly, make sure if this file should be legal.
		let files = ["weapons.json", "armors.json", "characters.json", "chests.json", "enemies.json", "items.json", "shops.json", "skills.json", "trials.json"];
		if (!files.includes(args[0].toLowerCase())) return void message.channel.send("That file either does not exist or is illegal.");

		// get the file's URL
		const file = message.attachments.first()?.url;
		if (!file) return message.channel.send('There is no file here!');

		// Download the file.
		if (args[0].toLowerCase() === "skills.json") {
			await downloadFile(message.attachments.first().url, `./data/json/`, "skills.json");
		} else {
			await downloadFile(message.attachments.first().url, `./data/json/${message.guild.id}/`, args[0].toLowerCase());
		}

		// Send a confirmation message.
		message.channel.send({content: `Uploaded this file to the server data as ${args[0]}.`});
	}
})