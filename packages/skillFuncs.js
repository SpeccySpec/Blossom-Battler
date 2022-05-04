function statusDesc(skillDefs) {
	var finalText = '';
	return finalText;
}

function passiveDesc(skillDefs) {
	var finalText = `Passive Type: **${skillDefs.passive}**\n`
	return finalText;
}

function atkDesc(skillDefs) {
	var finalText = '';

	if (skillDefs.metronome) {
		finalText += 'Uses a **randomly defined skill**.\n';
	} else {
		if (skillDefs.affinitypow)
			finalText += `Affected by **<:passive:906874477210648576>SpiritCharge** or **<:passive:906874477210648576>Teamwork**, by **${skillDefs.affinitypow} power**.\n`;

		if (skillDefs.buff) {
			if (skillDefs.buffchance) {
				finalText += `**${skillDefs.buffchance}%** chance to buff **${skillDefs.buff.toUpperCase()}**.\n`
			} else {
				finalText += `Buffs **${skillDefs.buff.toUpperCase()}**.\n`
			}
		}

		if (skillDefs.debuff) {
			if (skillDefs.buffchance) {
				finalText += `**${skillDefs.buffchance}%** chance to debuff target's **${skillDefs.debuff.toUpperCase()}**.\n`
			} else {
				finalText += `Debuffs target's **${skillDefs.debuff.toUpperCase()}**.\n`
			}
		}

		if (skillDefs.debuffuser)
			finalText += `Debuffs the caster's **${skillDefs.debuffuser.toUpperCase()}**.\n`;

		if (skillDefs.dualbuff) {
			var stats = '';
			for (const i in skillDefs.dualbuff) {
				stats += `**${skillDefs.dualbuff[i].toUpperCase()}**`;
				if (i < skillDefs.dualbuff.length-1) stats += ', ';
			}

			if (skillDefs.buffchance) {
				finalText += `**${skillDefs.buffchance}%** chance to buff caster's ${stats}.\n`
			} else {
				finalText += `Will buff the caster's ${stats}.\n`
			}
		}

		if (skillDefs.dualdebuff) {
			var stats = '';
			for (const i in skillDefs.dualdebuff) {
				stats += `**${skillDefs.dualdebuff[i].toUpperCase()}**`;
				if (i < skillDefs.dualdebuff.length-1) stats += ', ';
			}

			if (skillDefs.buffchance) {
				finalText += `**${skillDefs.buffchance}%** chance to debuff foe's ${stats}.\n`
			} else {
				finalText += `WIll debuff the foe's ${stats}.\n`
			}
		}

		if (skillDefs.lonewolf)
			finalText += `Power is multiplied by 1.5x if **the user is alone or the last one standing**\n`;
	}
	
	return finalText;
}

skillDesc = (skillDefs, skillName, server) => {
	var finalText = ``;
	if (skillDefs.pow && skillDefs.type != "status" && skillDefs.type != "passive") {
		if (skillDefs.ohko && skillDefs.type != "heal")
			finalText += 'Defeats the foe in **one shot**!';
		else {
			if (skillDefs.type === 'heal') {
				if (skillDefs.fullheal)
					finalText += '**Fully heals**';
				else if (skillDefs.statusheal)
					finalText += '**Cures status ailments**';
				else
					finalText += `Heals **around ${skillDefs.pow}HP**`;
			} else
				finalText += `Has **${skillDefs.pow}** Power`;
		}

		if (skillDefs.hits && skillDefs.hits > 1 && skillDefs.type != "heal" && !skillDefs.ohko) 
			finalText += ` and hits **${skillDefs.hits}** times.`;

		finalText += "\n";
	}

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
		default:
			finalText += "Targets **one foe**.\n";
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
			default:
				finalText += `Costs **${skillDefs.cost}MP**.\n`;
		}
	}
	
	if (skillDefs.acc && skillDefs.type != "heal" && skillDefs.type != "passive")
		finalText += `Has **${skillDefs.acc}%** Accuracy.\n`;

	if (skillDefs.drain && skillDefs.type != "heal") {
		if (skillDefs.drain > 1) {
			finalText += `Drains 1/${skillDefs.drain} of damage dealt.\n`;
		} else {
			finalText += `Drains all damage dealt.\n`;
		}
	}

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
				finalText += `**${skillDefs.status[i]}**`
				if (i == skillDefs.status.length-2)
					finalText += ' or '
				else if (i >= skillDefs.status.length-1)
					finalText += '.\n'
				else
					finalText += ', '
			}
		} else if (skillDefs.status !== "none" && skillDefs.type != "heal") {
			if (skillDefs.statuschance) {
				finalText += `Has a **${skillDefs.statuschance}%** chance of inflicting **${skillDefs.status}**.\n`;
			} else if (!skillDefs.statuschance || skillDefs.statuschance >= 100) {
				finalText += `Guaranteed to inflict **${skillDefs.status}**.\n`;
			}
		}
	}

	if (skillDefs.type === 'status') {
		finalText += statusDesc(skillDefs)
	} else if (skillDefs.type === 'passive') {
		finalText += passiveDesc(skillDefs)
	} else if (skillDefs.type != 'passive') {
		finalText += atkDesc(skillDefs)
	}

	if (skillDefs.atktype) {
		var attackArray = skillDefs.atktype.split('');
		attackArray[0] = attackArray[0].toUpperCase()
		
		var attackString = attackArray.join('');
		finalText += `**${attackString}** attack.\n`;
	}

	if (skillDefs.preskills) {
		finalText += '\nPre Skills:```diff\n'
		for (const i in skillDefs.preskills) {
			finalText += `- ${skillDefs.preskills[i][0]}, Lv${skillDefs.preskills[i][1]}\n`
		}
		finalText += '```\n'
	}

	if (skillDefs.evoskills) {
		finalText += '\nEvo Skills:```diff\n'
		for (const i in skillDefs.evoskills) {
			finalText += `- ${skillDefs.evoskills[i][0]}, Lv${skillDefs.evoskills[i][1]}\n`
		}
		finalText += '```\n'
	}

	if (skillDefs.levellock) finalText += skillDefs.levellock != 'unobtainable' ? `🔒 *Skill Locked until level **${skillDefs.levellock}***` : '🔒 *Skill Unobtainable*\n';

	if (skillDefs.desc) finalText += `\n*${skillDefs.desc}*`;
	
	finalText += '\n\n**Known By**:'

	var charFile = setUpFile(`${dataPath}/json/${server}/characters.json`)
	var enmFile = setUpFile(`${dataPath}/json/${server}/enemies.json`)
	
	var knownBy = ""

	for (const i in charFile) {
		for (const k in charFile[i].skills) {
			if (!charFile[i].hidden && charFile[i].skills[k] == skillName) {
				if (knownBy != "") knownBy += ", ";
				knownBy += `${i}`
			}
		}
	}

	for (const i in enmFile[server]) {
		if (enemyFuncs.encounteredEnemy(i, server)) {
			for (const k in enmFile[server][i].skills) {
				if (enmFile[server][i].skills[k] == skillName) {
					if (knownBy != "") knownBy += ", ";
					knownBy += `${i}`
				}
			}
		}
	}

	finalText += `\n${knownBy}`
	
	let userTxt = ''
	if (skillDefs.originalAuthor) {
		if (skillDefs.originalAuthor === 'Default')
			userTxt = 'Default/Official';
		else {
			let user = client.users.fetch(skillDefs.originalAuthor)
			userTxt = user.username
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
		.setDescription(finalText ?? 'Invalid Description :(')
	return DiscordEmbed;
}

module.exports = {skillDesc}