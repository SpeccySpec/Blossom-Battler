buffText = (buffArray) => {
	let finaltext = ""
	let i = 0
	for (const buff of buffArray) {
		i++
		const target = buff[0]
		const stat = buff[1]
		const stages = buff[2]
		const chance = buff[3]
		const turns = buff[4]
		const start = chance < 100 ? `Has a **${chance}%** chance to` : "Will"
		const type = stages < 0 ? "debuff" : "buff"
		const stats = typeof stat == "object"
			? stat.map(stat => stat.toUpperCase()).join(" and ")
			: stat.toUpperCase()
		const stagestext = Math.abs(stages) == 1 ? "" : ` by **${Math.abs(stages)}** stages`
		const turnstext = turns ? ` for **${turns}** turns` : ""
		const end = i < buffArray.length ? ".\n" : ""

		if (target == 'foes') {
			finaltext += `${start} ${type} the **${target}' ${stats}**${stagestext}${turnstext}${end}`
		} else {
			finaltext += `${start} ${type} the **${target}'s ${stats}**${stagestext}${turnstext}${end}`
		}
	}

	return finaltext
}

require("./skills/Extras")
require("./skills/Heal")
require("./skills/Passive")
require("./skills/Status")

extraTypes = {
	status: ["statusses", statusList],
	passive: ["passive", passiveList],
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
		.setTitle(`${type}${skillDefs.name ? skillDefs.name : skillName} [${tierEmojis[(skillTier(skillDefs) ?? 6)-1]}] *(${userTxt})*`)

	let settings = setUpSettings(message.guild.id);

	// Handle fusion skills first.
	if (skillDefs.fusionskill) {
		let fusionText = `May increase trust up to ${skillDefs.trustgain ?? 0}${statusEmojis.lovable}.\n_Requires:_\n`;
		if (!skillDefs.trustgain || skillDefs.trustgain === 0)
			fusionText = `_Requires:_\n`;

		for (let i in skillDefs.fusionskill) {
			if (skillDefs.fusionskill[i][0] == true) {
				fusionText += `- **A ${elementEmoji[skillDefs.fusionskill[i][1].toLowerCase()]}${skillDefs.fusionskill[i][1].toLowerCase()} skill**\n`;
			} else {
				if (skillFile[skillDefs.fusionskill[i][1]])
					fusionText += `- **${getFullName(skillFile[skillDefs.fusionskill[i][1]])}**\n`;
			}
		}

		DiscordEmbed.fields.push({name: 'Fusion Skill', value: fusionText, inline: false})
	}

	// Basic Damage
	var finalText = '';
	if (skillDefs.type != "status" && skillDefs.type != "passive") {
		if (hasExtra(skillDefs, 'ohko')) {
			for (i in skillDefs.extras.ohko) {
				let curOHKO = skillDefs.extras.ohko[i];

				let OHKOchance = curOHKO[0];
				let OHKOstat = curOHKO[1];
				let OHKOfailDamage = curOHKO[2];
				let OHKOpassAll = curOHKO[3];
				let OHKOconditions = curOHKO[4];

				if (OHKOchance < 100) {
					if (i == 0) finalText += 'Has';

					finalText += ` a **${OHKOstat != 'none' ? `${OHKOstat.toUpperCase()} stat modifiable` : ''} ${OHKOchance}%** chance to defeat the target`;
				} else {
					if (i == 0) finalText += '**Defeats the target**';
					else finalText += '**defeats the target**'
				}

				if (OHKOconditions.length > 0) {
					let statusOHKO = OHKOconditions.filter(x => statusEffects.includes(x));
					let elementOHKO = OHKOconditions.filter(x => Elements.includes(x));
					let affinityOHKO = OHKOconditions.filter(x => affinityEmoji[x]);

					if (statusOHKO.length > 0) {
						finalText += ` inflicted with ${statusOHKO.length > 1 ? 'either' : ''} **`
						for (a in statusOHKO) {
							finalText += `${statusEmojis[statusOHKO[a]]}${statusOHKO[a]}`

							if (a < statusOHKO.length - 2) finalText += ', ';
							else if (a == statusOHKO.length - 2) finalText += ' or ';
						}
						finalText += '**';
					}

					if (elementOHKO.length > 0) {
						if (statusOHKO.length > 0) finalText += ','
						if (elementOHKO.length <= 0) finalText += ` ${OHKOpassAll ? 'and' : 'or'}`;

						finalText += ` with main elements of ${elementOHKO.length > 1 ? 'either' : ''} **`
						for (a in elementOHKO) {
							finalText += `${elementEmoji[elementOHKO[a]]}${elementOHKO[a]}`

							if (a < elementOHKO.length - 2) finalText += ', ';
							else if (a == elementOHKO.length - 2) finalText += ' or ';
						}
						finalText += '**';
					}

					if (affinityOHKO.length > 0) {
						if (statusOHKO.length > 0 || elementOHKO.length > 0) finalText += `, ${OHKOpassAll ? 'and' : 'or'}`;

						finalText += ` that have ${affinityOHKO.length > 1 ? 'either' : 'a'} **`
						for (a in affinityOHKO) {
							finalText += `${affinityEmoji[affinityOHKO[a]]}${affinityOHKO[a]}`

							if (a < affinityOHKO.length - 2) finalText += ', ';
							else if (a == affinityOHKO.length - 2) finalText += ' or ';
						}
						finalText += ` affinit${affinityOHKO.length > 1 ? 'ies' : 'y'} to the skill**`
					}
				}

				finalText += (OHKOfailDamage && ((OHKOchance < 100 && OHKOconditions.length == 0) || OHKOconditions.length > 0)) ? `, that **attacks on failure with ${skillDefs.pow} power**${i > skillDefs.extras.ohko.length - 2 ? ',' : ''}` : ''

				if (i < skillDefs.extras.ohko.length - 2) finalText += ', ';
				else if (i == skillDefs.extras.ohko.length - 2) finalText += ', and ';
			}
			finalText += ` in **one shot**!`;
		} else {
			if (skillDefs.type != "heal")
				finalText += `Has **${skillDefs.pow}** Power${skillDefs?.hits == 1 ? '.' : ''}`;
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
				finalText += "Targets a **random foe** in-battle.\n";
				break;
			case "randomallies":
				finalText += "Targets a **random ally** in-battle.\n";
				break;
			case "spreadopposing":
				finalText += "Targets **one foe and spreads to two surrounding**.\n";
				break;
			case "spreadallies":
				finalText += "Targets **an ally and spreads to two surrounding**.\n";
				break;
			case "randomspread":
				finalText += "Targets **a random fighter in-battle and spreads to two surrounding**.\n";
				break;
			case "randomspreadopposing":
				finalText += "Targets **a random foe in-battle and spreads to two surrounding**.\n";
				break;
			case "randomspreadallies":
				finalText += "Targets **a random ally in-battle and spreads to two surrounding**.\n";
				break;
			case "randomwidespread":
				finalText += "Targets **a random fighter in-battle and spreads to everyone on its side based on distance**.\n";
				break;
			case "widespreadopposing":
				finalText += "Targets **one foe and spreads to all foes based on distance**.\n";
				break;
			case "widespreadallies":
				finalText += "Targets **an ally and spreads to all allies based on distance**.\n";
				break;
			case "randomwidespreadopposing":
				finalText += "Targets **a random foe in-battle and spreads to all foes based on distance**.\n";
				break;
			case "randomwidespreadallies":
				finalText += "Targets **a random ally in-battle and spreads to all allies based on distance**.\n";
				break;
			case "casterandfoe":
				finalText += "Targets **the user** and **a foe**.\n";
				break;
			case "casterandally":
				finalText += "Targets **the user** and **an ally**.\n";
				break;
			case "casterandrandom":
				finalText += "Targets **the user** and **a random fighter in-battle**.\n";
				break;
			case "casterandrandomfoe":
				finalText += "Targets **the user** and **a random foe**.\n";
				break;
			case "casterandrandomally":
				finalText += "Targets **the user** and **a random ally**.\n";
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
			case "hpandmp":
				finalText += `Costs **${skillDefs.cost}HP** and **${skillDefs.cost}MP**.\n`;
				break;
			case "hppercent":
				finalText += `Costs **${skillDefs.cost}% of the user's Max HP**.\n`;
				break;
			case "mppercent":
				finalText += `Costs **${skillDefs.cost}% of the user's Max MP**.\n`;
				break;
			case "hpandmppercent":
				finalText += `Costs **${skillDefs.cost}% of the user's Max MP** and **${skillDefs.cost}% of the user's Max HP**.\n`;
				break;
			case "money":
				finalText += `Costs **${skillDefs.cost} of the team's ${getCurrency(message.guild.id)}s**.\n`;
				break;
			case "moneypercent":
				finalText += `Costs **${skillDefs.cost}% of the team's ${getCurrency(message.guild.id)}s**.\n`;
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
		finalText += `**${skillDefs.crit}%**<:crit:973077052083286056>\n`;

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
			finalText += getinfo([...extras[extra]], skillDefs) + ".\n"
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

	if (skillDefs.desc && skillDefs.desc.trim() != '') DiscordEmbed.fields.push({name: 'Description:', value: skillDefs.desc, inline: false})

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

	DiscordEmbed.setDescription(finalText ?? 'Invalid Description :(');

	let footerText = ``;
	if (skillDefs.creationtime)
		footerText += `Skill created at ${new Date(skillDefs.creationtime).toLocaleString()}`;
	else
		footerText += `Skill created before ${new Date(Date.UTC(2024, 4, 3, 18, 3, 31)).toLocaleString()}`

	if (skillDefs.edittime) footerText += `\nSkill last edited at ${new Date(skillDefs.edittime).toLocaleString()}`;

	if (footerText != ``) DiscordEmbed.setFooter(footerText);

	if (additionalMessage)
		message.channel.send({content: additionalMessage, embeds: [DiscordEmbed]})
	else
		message.channel.send({embeds: [DiscordEmbed]})
}

module.exports = {skillDesc}