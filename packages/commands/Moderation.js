commands.settings = new Command({
	desc: 'View this server\'s settings here.',
	section: 'moderation',
	aliases: ['serversettings', 'viewsettings', 'getsettings'],
	args: [],
	func: (message, args) => {
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

		let formulaText = ''
		let damageFormulas = {
			'persona': '5*√(Attack/Endurance * Skill Power)',
			'pokemon': '(((2*level)/5+2)*Power*Attack/Endurance)/50+2',
			'custom': 'uhhhh Spectra you handle this'
		}

		formulaText += `**Damage Formula:**\n${settings['formulas']['damageFormula'].charAt(0).toUpperCase() + settings['formulas']['damageFormula'].slice(1)}\n\`${damageFormulas[settings['formulas']['damageFormula']]}\``

		let levelUpFormulas = {
			'original': 'No Specific Formula',
			'assist': '(BaseStat+3) * (1 + ((Level-1) * 0.06751))',
			'percent': 'BaseStat * (1 + ((Level-1) * 0.091))',
			'custom': 'uhhhh Spectra you handle this'
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
				case 'tech':
					if (settings['mechanics']['technicaldamage'] == true) {
						rateText += `**Technical Damage Rate**: ${settings['rates'][i]}x\n`
					}
					break
			}
		}

		let miscText = ''
		miscText += `**Prefix**: ${settings['prefix']}\n`
		miscText += `**Currency**: ${settings['currency']}, ${settings['currency']}s\n`

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
						case 'basestatcap':
							transformationText += `**Base Stat Cap**: ${settings['caps']['transformations'][i]}\n`
							break
						case 'bstcap':
							transformationText += `**Base Stat Total Cap**: ${settings['caps']['transformations'][i]}\n`
							break
						case 'level':
							transformationText += `**Transformation Level**: ${settings['caps']['transformations'][i]}\n`
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
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)
		settings['prefix'] = args[0]
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Prefix set to ' + args[0])
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
	func: (message, args) => {
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
	func: (message, args) => {
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
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)


		if (message.mentions.users.first())
			return message.channel.send("Don't ping others with this, that's just mean.");
		else if (args[0].toLowerCase() == 'dick')
			return message.channel.send("Not funny enough to let you do this, you clown.");
		else if (args[0].toLowerCase() == 'balls')
			return message.channel.send("You're either ballin', playing with balls, or being stopped by Bloom Battler... you sick human being.");
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
	func: (message, args) => {
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
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)

		let damageFormulas = {
			'persona': '5*√(Attack/Endurance * Skill Power)',
			'pokemon': '(((2*level)/5+2)*Power*Attack/Endurance)/50+2',
			'custom': 'uhhhh Spectra you handle this'
		}

		if (args[0].toLowerCase() != 'persona' && args[0].toLowerCase() != 'pokemon' && args[0].toLowerCase() != 'custom') {
			return message.channel.send('Invalid damage formula! Valid formulas are: persona, pokemon, custom')
		}

		if (args[0].toLowerCase() == 'custom') {
			return message.channel.send('Custom damage formulas are not yet supported!')
		}

		settings['formulas']['damageFormula'] = damageFormulas[args[0].toLowerCase()]
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
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)

		let levelUpFormulas = {
			'original': 'No Specific Formula',
			'assist': '(BaseStat+3) * (1 + ((Level-1) * 0.06751))',
			'percent': 'BaseStat * (1 + ((Level-1) * 0.091))',
			'custom': 'uhhhh Spectra you handle this'
		}

		if (args[0].toLowerCase() != 'original' && args[0].toLowerCase() != 'assist' && args[0].toLowerCase() != 'percent' && args[0].toLowerCase() != 'custom') {
			return message.channel.send('Invalid level up formula! Valid formulas are: original, assist, percent, custom')
		}

		if (args[0].toLowerCase() == 'custom') {
			return message.channel.send('Custom level up formulas are not yet supported!')
		}

		settings['formulas']['levelUpFormula'] = levelUpFormulas[args[0].toLowerCase()]
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
	func: (message, args) => {
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
	func: (message, args) => {
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
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)

		if (args[0] < 0) {
			return message.channel.send('Trust rate cannot be less than 0!')
		}

		settings['rates']['trustrate'] = args[0]
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Trust rate set to ' + args[0] + 'x')
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
	func: (message, args) => {
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
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)

		if (args[0] < 1) {
			return message.channel.send('Main element damage rate cannot be less than 1!')
		}

		settings['rates']['mainelement'] = args[0]
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Main element damage rate set to ' + args[0] + '%')
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
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)

		if (args[0] < 1.1) {
			return message.channel.send('Critical hit damage rate cannot be less than 1!')
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
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)
		if (settings.mechanics.technicaldamage == false) return message.channel.send('Technical damage is not enabled for this server!')

		if (args[0] < 1) {
			return message.channel.send('Technical damage rate cannot be less than 1!')
		}

		settings['rates']['tech'] = args[0]
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
		message.channel.send('Technical damage rate set to ' + args[0] + 'x')
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
	func: (message, args) => {
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
				settings['mechanics'][args[0].toLowerCase()] = !settings['mechanics'][args[0].toLowerCase()]
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
				message.channel.send(fullNames[args[0].toLowerCase()] + ' are now ' + (settings['mechanics'][args[0].toLowerCase()] ? 'enabled' : 'disabled'))
				break
			default:
				message.channel.send('Invalid mechanic! Valid mechanics are: limitbreaks, teamcombos, onemores, stataffinities, charms, leaderskills, transformations')
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
	func: (message, args) => {
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
			case 'hpmpcap':
			case 'statcap':
			case 'basestatcap':
			case 'bstcap':
			case 'skillamount':
			case 'teamsize':
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
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)
		if (settings.mechanics.transformations == false) return message.channel.send('Transformations are not enabled!')

		const fullNames = {
			'hpcap': 'HP Buff Cap',
			'statcap': 'Stat Buff Cap',
			'basestatcap': 'Base Stat Cap',
			'bstcap': 'Base Stat Total Cap',
			'level': 'Transformation Level'
		}

		switch (args[0].toLowerCase()) {
			case 'hpcap':
			case 'statcap':
			case 'basestatcap':
			case 'bstcap':
			case 'level':
				settings['caps']['transformations'][args[0].toLowerCase()] = args[1]
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
				message.channel.send(fullNames[args[0].toLowerCase()] + ' set to ' + args[1])
				break
			default:
				message.channel.send('Invalid cap! Valid caps are: hpcap, statcap, basestatcap, bstcap, level')
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
	func: (message, args) => {
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
	desc: '**RPG Bot Administrator Only!** Reloads a file for the server.',
	section: 'moderation',
	aliases: ['reload', 'reloadfile'],
	args: [
		{
			name: 'File',
			type: 'Word',
			forced: true
		}
	],
	func: (message, args) => {
		if (!utilityFuncs.RPGBotAdmin(message.author.id)) return message.channel.send('You do not have permission to reload files!')

		let validFiles = ['armors', 'characters', 'chests', 'enemies', 'items', 'loot', 'parties', 'settings', 'shops', 'weapons']
		if (!validFiles.includes(args[0].toLowerCase())) return message.channel.send('Invalid file! Valid files are: armors, characters, chests, enemies, items, loot, parties, settings, shops, weapons')

		setUpFile(`${dataPath}/json/${message.guild.id}/${args[0].toLowerCase()}.json`, true)
		message.react('👍').then(() => {
			message.delete(5000)
		})
	}
})
