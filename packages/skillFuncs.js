buffText = (buffArray) => {
	let finalText = '';

	buffArray.sort((a, b) => {
		return (((a[0] == 'target' ? 2000000 : 1000000) + (100000 * (stats.indexOf(a[1]) + 1)) + [100 - a[3]]) - ((b[0] == 'target' ? 2000000 : 1000000) + (100000 * (stats.indexOf(b[1]) + 1)) + [100 - b[3]]))
	})

	let uhh = 0

	while (uhh <= 3) {
		for (i in buffArray) {
			if (i > 0 && buffArray[i][0] == buffArray[i - 1][0] && buffArray[i][1] == buffArray[i - 1][1] && buffArray[i][3] == buffArray[i - 1][3]) {
				buffArray[i - 1][2] += buffArray[i][2]
				buffArray.splice(i, 1)
			}
		}
		uhh++
	}

	buffArray.sort((a, b) => {
		return (((a[0] == 'target' ? 2000000 : 1000000) + (100 * a[2] < 0 ? (a[2] * -0.2) : a[2]) + [10000 - a[3]]) - ((b[0] == 'target' ? 2000000 : 1000000) + (100 * b[2] < 0 ? (b[2] * -0.2) : b[2]) + [10000 - b[3]]))
	})

	for (i in buffArray) {
		buffArray[i][1] = [buffArray[i][1]]
	}

	uhh = 0
	while (uhh <= 3) {
		for (i in buffArray) {
			if (i > 0 && buffArray[i][0] == buffArray[i - 1][0] && buffArray[i][2] == buffArray[i - 1][2] && buffArray[i][3] == buffArray[i - 1][3]) {
				buffArray[i - 1][1].push(...buffArray[i][1])
				buffArray.splice(i, 1)
			}
		}

		uhh++
	}

	buffArray.sort((a, b) => {
		return (((a[0] == 'target' ? 2000000 : 1000000) + (100000 * (stats.indexOf(a[1]) + 1)) + [100 - a[3]]) - ((b[0] == 'target' ? 2000000 : 1000000) + (100000 * (stats.indexOf(b[1]) + 1)) + [100 - b[3]]))
	})

	let curBuff = []
	let oldBuff = []

	for (i in buffArray) {
		curBuff = buffArray[i]

		if (oldBuff == []) {
			if (curBuff[3] != 100) finalText += `Has`
		}

		if (oldBuff == [] || curBuff[3] != oldBuff[3]) {
			if (curBuff[3] != 100) finalText += `${i == 0 ? '' : 'Has'} a **${curBuff[3]}%** chance to buff `
			else {
				if (curBuff[2] > 0)
					if (i == 0) finalText += `Buffs `
					else finalText += ` buffs `
				else
					if (i == 0) finalText += `Debuffs `
					else finalText += ` debuffs `
			}
		}

		if (oldBuff == [] || curBuff[0] != oldBuff[0])
			finalText += ` ${curBuff[0] == 'target' ? "**the target's** " : "**the user's** "}`

		for (j in curBuff[1]) {
			finalText += `**${curBuff[1][j].toUpperCase()}**`

			if (j < curBuff[1].length - 2) {
				finalText += `, `
			} else if (j == curBuff[1].length - 2) {
				finalText += ` and `
			}
		}

		if (curBuff[2] != oldBuff[2] || oldBuff == []) {
			finalText += ` by **${Math.abs(curBuff[2])}** stage${Math.abs(curBuff[2]) <= 1 ? '' : 's'}`

			if (i < buffArray.filter(x => x[3] == curBuff[3]).length - 2) {
				finalText += `, `
			} else if (i == buffArray.filter(x => x[3] == curBuff[3]).length - 2) {
				finalText += ` and `
			}
		}

		oldBuff = curBuff
	}

	return finalText
}

require("./skills/Extras")
require("./skills/Heal")
require("./skills/Passive")
require("./skills/Status")

/* ADD ALL THE MISSING GETINFO HOOKS FOR THE EXTRAS USING THE BELOW COMMENT AS REFERENCE
function passiveDesc(skillDefs) {
	var finalText = `Passive Type: **${Object.keys(skillDefs.passive).join(', ')}**\n`;
	return finalText;
}*/

extraTypes = {
	status: ["statusses", statusList],
	passive: ["passives", passiveList],
	heal: ["heal", healList]
}

skillDesc = async (skillDefs, skillName, message, additionalMessage) => {
	let userTxt = ''
	if (skillDefs.originalAuthor) {
		if (skillDefs.originalAuthor === 'Default')
			userTxt = 'Default/Official';
		else {
			let user = await client.users.fetch(skillDefs.originalAuthor)
			userTxt = user?.username ?? `<@${skillDefs.originalAuthor}>`
		}
	} else
		userTxt = 'Default/Official';

	let type = ''
	if (typeof skillDefs.type === 'string')
		type = `${elementEmoji[skillDefs.type]}`;
	else if (typeof skillDefs.type === 'object') {
		for (const i in skillDefs.type) type += `${elementEmoji[skillDefs.type[i]]}`;
	}

	let color = elementColors[(typeof skillDefs.type === 'string') ? skillDefs.type : skillDefs.type[0]];

	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(color)
		.setTitle(`${type}${skillDefs.name ? skillDefs.name : skillName} *(${userTxt})*`)
	
	
	let settings = setUpSettings(message.guild.id);
	var finalText = ``;
	if (skillDefs.type != "status" && skillDefs.type != "passive") {
		if (hasExtra(skillDefs, 'ohko'))
			finalText += `Defeats the target ${skillDefs.extras.ohko[1] && skillDefs.extras.ohko[1] != null ? `inflicted with ${statusEmojis[skillDefs.extras.ohko[1]]}${skillDefs.extras.ohko[1]}` : ''} in **one shot**!`;
		else {
			finalText += `Has **${skillDefs.pow}** Power`;
		}

		if (skillDefs.hits && skillDefs.hits > 1 && skillDefs.type != "heal" && !hasExtra(skillDefs, 'ohko')) 
			finalText += ` and hits **${skillDefs.hits}** times.`;

		finalText += "\n";
	}

	if (skillDefs?.target) {
		switch(skillDefs.target) {
			case "allopposing":
				finalText += "Targets **all foes**.\n";
				break;
			case "allallies":
				finalText += "Targets **all allies**.\n";
				break;
			case "ally":
				finalText += "Targets **an ally**.\n";
				break;
			case "everyone":
				finalText += "Targets **all fighters** in-battle.\n";
				break;
			case "caster":
				finalText += "Targets **the user**.\n";
				break;
			case "random":
				finalText += "Targets a **random fighter** in-battle.\n";
				break;
			case "randomopposing":
				finalText += "Targets a **random opponent** in-battle.\n";
				break;
			case "spreadopposing":
				finalText += "Targets **one opponent and spreads to two surrounding**.\n";
				break;
			case "spreadallies":
				finalText += "Targets **an ally and spreads to two surrounding**.\n";
				break;
			default:
				finalText += "Targets **one foe**.\n";
		}
	}

	if (skillDefs.cost && skillDefs.costtype) {
		switch(skillDefs.costtype) {
			case "hp":
				finalText += `Costs **${skillDefs.cost}HP**.\n`;
				break;
			case "hppercent":
				finalText += `Costs **${skillDefs.cost}% of the user's Max HP**.\n`;
				break;
			case "mppercent":
				finalText += `Costs **${skillDefs.cost}% of the user's Max MP**.\n`;
				break;
			case "money":
				finalText += `Costs **${skillDefs.cost} of the team's money**.\n`;
				break;
			case "moneypercent":
				finalText += `Costs **${skillDefs.cost}% of the team's money**.\n`;
				break;
			case "lb":
				if (settings.mechanics.limitbreaks) finalText += `Costs **${skillDefs.cost}LB**.\n`;
				else finalText += `Costs **${skillDefs.cost}MP**.\n`;
				break;
			case "lbpercent":
				if (settings.mechanics.limitbreaks) finalText += `Costs **${skillDefs.cost}% of LB**.\n`;
				else finalText += `Costs **${skillDefs.cost}% of the user's Max MP**.\n`;
				break;
			default:
				finalText += `Costs **${skillDefs.cost}MP**.\n`;
		}
	}
	
	if (skillDefs.acc && skillDefs.type != "heal" && skillDefs.type != "passive")
		finalText += `Has **${skillDefs.acc}%** Accuracy.\n`;

	if (skillDefs.crit && skillDefs.type != "heal" && skillDefs.type != "status" && skillDefs.type != "passive")
		finalText += `**${skillDefs.crit}%**<:crit:876905905248145448>\n`;

	if (skillDefs.status) {
		if (typeof skillDefs.status === 'object') {
			if (skillDefs.statuschance) {
				finalText += `Has a **${skillDefs.statuschance}%** chance of inflicting either `;
			} else if (!skillDefs.statuschance || skillDefs.statuschance >= 100) {
				finalText += '**Guaranteed** to inflict either ';
			}

			for (const i in skillDefs.status) {
				finalText += `**${statusEmojis[skillDefs.status[i]]}${skillDefs.status[i]}**`
				if (i == skillDefs.status.length-2)
					finalText += ' or '
				else if (i >= skillDefs.status.length-1)
					finalText += '.\n'
				else
					finalText += ', '
			}
		} else if (skillDefs.status !== "none" && skillDefs.type != "heal") {
			if (skillDefs.statuschance) {
				finalText += `Has a **${skillDefs.statuschance}%** chance of inflicting **${statusEmojis[skillDefs.status]}${skillDefs.status}**.\n`;
			} else if (!skillDefs.statuschance || skillDefs.statuschance >= 100) {
				finalText += `Guaranteed to inflict **${statusEmojis[skillDefs.status]}${skillDefs.status}**.\n`;
			}
		}
	}

	const [extrastype, extraslist] = extraTypes[skillDefs.type] ?? ["extras", extrasList]
	const extras = skillDefs[extrastype]
	for (const extra in extras) {
		const getinfo = extraslist[extra]?.getinfo
		if (getinfo)
			finalText += getinfo(extras[extra]) + ".\n"
	}

	if (skillDefs.atktype) {
		var attackArray = skillDefs.atktype.split('');
		attackArray[0] = attackArray[0].toUpperCase()
		
		var attackString = attackArray.join('');
		finalText += `**${attackString}** attack.\n`;
	}

	if (skillDefs.preskills) {
		let preskillText = '```diff\n'
		for (const i in skillDefs.preskills) {
			preskillText += `- ${skillFile[skillDefs.preskills[i][0]] ? `${skillFile[skillDefs.preskills[i][0]].name} (${skillDefs.preskills[i][0]})` : `Remove`}, Lv${skillDefs.preskills[i][1]}\n`
		}
		preskillText += '```\n'

		DiscordEmbed.fields.push({name: 'Pre Skills:', value: preskillText, inline: false})
	}

	if (skillDefs.evoskills) {
		let evoskilltext = '```diff\n'
		for (const i in skillDefs.evoskills) {
			evoskilltext += `+ ${skillFile[skillDefs.evoskills[i][0]] ? `${skillFile[skillDefs.evoskills[i][0]].name} (${skillDefs.evoskills[i][0]})` : `Remove`}, Lv${skillDefs.evoskills[i][1]}\n`
		}
		evoskilltext += '```\n'

		DiscordEmbed.fields.push({name: 'Evo Skills:', value: evoskilltext, inline: false})
	}

	if (skillDefs.levellock) finalText += skillDefs.levellock != 'unobtainable' ? `🔒 *Skill Locked until level **${skillDefs.levellock}***\n` : '🔒 *Skill Unobtainable*\n';

	if (skillDefs.desc) DiscordEmbed.fields.push({name: 'Description:', value: skillDefs.desc, inline: false})

	var charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`)
	var enmFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`)
	
	var knownBy = ""

	for (const i in charFile) {
		for (const k in charFile[i].skills) {
			if (!charFile[i].hidden && charFile[i].skills[k] == skillName) {
				if (knownBy != "") knownBy += ", ";
				knownBy += `${i}`
			}
		}
	}

	for (const i in enmFile) {
		if (foundEnemy(i, message.guild.id)) {
			for (const k in enmFile[i].skills) {
				if (enmFile[i].skills[k] == skillName) {
					if (knownBy != "") knownBy += ", ";
					knownBy += `${i}`
				}
			}
		}
	}

	if (knownBy != "") DiscordEmbed.fields.push({name: 'Known By:', value: knownBy, inline: false})

	DiscordEmbed.setDescription(finalText ?? 'Invalid Description :(')
	if (additionalMessage)
		message.channel.send({content: additionalMessage, embeds: [DiscordEmbed]})
	else
		message.channel.send({embeds: [DiscordEmbed]})
}

module.exports = {skillDesc}