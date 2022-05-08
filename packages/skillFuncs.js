function statusDesc(skillDefs) {
	var finalText = '';
	
	if (hasStatus(skillDefs, 'buff')) {
		let buffs = {
			buffs: {},
			debuffs: {},
		}

		for (let i = 0; i < skillDefs.statusses.buff.length; i++) {
			if (skillDefs.statusses.buff[i][1] > 0) {
				if (!buffs.buffs[skillDefs.statusses.buff[i][2]]) buffs.buffs[skillDefs.statusses.buff[i][2]] = {};
				if (!buffs.buffs[skillDefs.statusses.buff[i][2]][skillDefs.statusses.buff[i][0]]) buffs.buffs[skillDefs.statusses.buff[i][2]][skillDefs.statusses.buff[i][0]] = 0;
				buffs.buffs[skillDefs.statusses.buff[i][2]][skillDefs.statusses.buff[i][0]] += Math.abs(skillDefs.statusses.buff[i][1]);
			} else {
				if (!buffs.debuffs[skillDefs.statusses.buff[i][2]]) buffs.debuffs[skillDefs.statusses.buff[i][2]] = {};
				if (!buffs.debuffs[skillDefs.statusses.buff[i][2]][skillDefs.statusses.buff[i][0]]) buffs.debuffs[skillDefs.statusses.buff[i][2]][skillDefs.statusses.buff[i][0]] = 0;
				buffs.debuffs[skillDefs.statusses.buff[i][2]][skillDefs.statusses.buff[i][0]] += Math.abs(skillDefs.statusses.buff[i][1]);
			}
		}

		let buffArray = []
		let fullBuffArray = []
		if (Object.keys(buffs.buffs).length > 0) {
			for (let i in buffs.buffs) {
				for (let j in buffs.buffs[i]) {
					buffArray = []
					for (let k in buffs.buffs[i]) {
						buffArray.push([k, buffs.buffs[i][k]])
					}
				}
				buffArray.sort(function(a, b) {
					return b[1] - a[1];
				})

				fullBuffArray.push([i, buffArray])
				fullBuffArray.sort(function(a, b) {
					return b[0] - a[0];
				})
			}
		}

		for (i in fullBuffArray) {
			if (fullBuffArray[i][0] == 100) finalText += `Buffs `
			else finalText += `Has a **${fullBuffArray[i][0]}%** chance to buff `

			for (let j in fullBuffArray[i][1]) {
				finalText += ` **${fullBuffArray[i][1][j][0].charAt(0).toUpperCase() + fullBuffArray[i][1][j][0].slice(1)}**`;

				let sameValue = 0;
				for (let k in fullBuffArray[i][1]) {
					if (k <= j) continue
					if (fullBuffArray[i][1][j][1] == fullBuffArray[i][1][k][1]) sameValue++;
				}
				if (sameValue == 0) finalText += ` by ${fullBuffArray[i][1][j][1]} stage${fullBuffArray[i][1][j][1] > 1 ? 's' : ''}`;

				if (sameValue != 0) {
					if (sameValue == 1) finalText += ` and `;
					else finalText += `, `;
				} else {
					if (j < fullBuffArray[i][1].length - 2) finalText += `, `;
					else if (j == fullBuffArray[i][1].length - 2) finalText += ` and `;
					else finalText += `.`;
				}
			}
			finalText += `\n`;
		}

		buffArray = []
		fullBuffArray = []
		if (Object.keys(buffs.debuffs).length > 0) {
			for (let i in buffs.debuffs) {
				for (let j in buffs.debuffs[i]) {
					buffArray = []
					for (let k in buffs.debuffs[i]) {
						buffArray.push([k, buffs.debuffs[i][k]])
					}
				}
				buffArray.sort(function(a, b) {
					return b[1] - a[1];
				})

				fullBuffArray.push([i, buffArray])
				fullBuffArray.sort(function(a, b) {
					return b[0] - a[0];
				})
			}
		}

		for (i in fullBuffArray) {
			if (fullBuffArray[i][0] == 100) finalText += `Debuffs `
			else finalText += `Has a **${fullBuffArray[i][0]}%** chance to debuff `

			for (let j in fullBuffArray[i][1]) {
				finalText += ` **${fullBuffArray[i][1][j][0].charAt(0).toUpperCase() + fullBuffArray[i][1][j][0].slice(1)}**`;

				let sameValue = 0;
				for (let k in fullBuffArray[i][1]) {
					if (k <= j) continue
					if (fullBuffArray[i][1][j][1] == fullBuffArray[i][1][k][1]) sameValue++;
				}
				if (sameValue == 0) finalText += ` by ${fullBuffArray[i][1][j][1]} stage${fullBuffArray[i][1][j][1] > 1 ? 's' : ''}`;

				if (sameValue != 0) {
					if (sameValue == 1) finalText += ` and `;
					else finalText += `, `;
				} else {
					if (j < fullBuffArray[i][1].length - 2) finalText += `, `;
					else if (j == fullBuffArray[i][1].length - 2) finalText += ` and `;
					else finalText += `.`;
				}
			}
			finalText += `\n`;
		}
	}

	return finalText;
}

function passiveDesc(skillDefs) {
	var finalText = `Passive Type: **${Object.keys(skillDefs.passive).join(', ')}**\n`;
	return finalText;
}

function atkDesc(skillDefs) {
	var finalText = '';

	if (hasExtra(skillDefs, 'metronome')) {
		finalText += 'Uses a **randomly defined skill**.\n';
	} else if (hasExtra(skillDefs, 'copyskill')) {
		finalText += `Copies a **random skill of caster's team**.\n`;
	} else {
		if (hasExtra(skillDefs, 'affinitypow'))
			finalText += `Affected by **<:passive:906874477210648576>SpiritCharge** or **<:passive:906874477210648576>Teamwork**, by **${skillDefs.extras.affinitypow[0]} power**.\n`;

		if (hasExtra(skillDefs, 'buff')) {
			let buffs = {
				buffs: {},
				debuffs: {},
			}

			for (let i = 0; i < skillDefs.extras.buff.length; i++) {
				if (skillDefs.extras.buff[i][1] > 0) {
					if (!buffs.buffs[skillDefs.extras.buff[i][2]]) buffs.buffs[skillDefs.extras.buff[i][2]] = {};
					if (!buffs.buffs[skillDefs.extras.buff[i][2]][skillDefs.extras.buff[i][0]]) buffs.buffs[skillDefs.extras.buff[i][2]][skillDefs.extras.buff[i][0]] = 0;
					buffs.buffs[skillDefs.extras.buff[i][2]][skillDefs.extras.buff[i][0]] += Math.abs(skillDefs.extras.buff[i][1]);
				} else {
					if (!buffs.debuffs[skillDefs.extras.buff[i][2]]) buffs.debuffs[skillDefs.extras.buff[i][2]] = {};
					if (!buffs.debuffs[skillDefs.extras.buff[i][2]][skillDefs.extras.buff[i][0]]) buffs.debuffs[skillDefs.extras.buff[i][2]][skillDefs.extras.buff[i][0]] = 0;
					buffs.debuffs[skillDefs.extras.buff[i][2]][skillDefs.extras.buff[i][0]] += Math.abs(skillDefs.extras.buff[i][1]);
				}
			}

			let buffArray = []
			let fullBuffArray = []
			if (Object.keys(buffs.buffs).length > 0) {
				for (let i in buffs.buffs) {
					for (let j in buffs.buffs[i]) {
						buffArray = []
						for (let k in buffs.buffs[i]) {
							buffArray.push([k, buffs.buffs[i][k]])
						}
					}
					buffArray.sort(function(a, b) {
						return b[1] - a[1];
					})

					fullBuffArray.push([i, buffArray])
					fullBuffArray.sort(function(a, b) {
						return b[0] - a[0];
					})
				}
			}

			for (i in fullBuffArray) {
				if (fullBuffArray[i][0] == 100) finalText += `Buffs `
				else finalText += `Has a **${fullBuffArray[i][0]}%** chance to buff `

				for (let j in fullBuffArray[i][1]) {
					finalText += ` **${fullBuffArray[i][1][j][0].charAt(0).toUpperCase() + fullBuffArray[i][1][j][0].slice(1)}**`;

					let sameValue = 0;
					for (let k in fullBuffArray[i][1]) {
						if (k <= j) continue
						if (fullBuffArray[i][1][j][1] == fullBuffArray[i][1][k][1]) sameValue++;
					}
					if (sameValue == 0) finalText += ` by ${fullBuffArray[i][1][j][1]} stage${fullBuffArray[i][1][j][1] > 1 ? 's' : ''}`;

					if (sameValue != 0) {
						if (sameValue == 1) finalText += ` and `;
						else finalText += `, `;
					} else {
						if (j < fullBuffArray[i][1].length - 2) finalText += `, `;
						else if (j == fullBuffArray[i][1].length - 2) finalText += ` and `;
						else finalText += `.`;
					}
				}
				finalText += `\n`;
			}

			buffArray = []
			fullBuffArray = []
			if (Object.keys(buffs.debuffs).length > 0) {
				for (let i in buffs.debuffs) {
					for (let j in buffs.debuffs[i]) {
						buffArray = []
						for (let k in buffs.debuffs[i]) {
							buffArray.push([k, buffs.debuffs[i][k]])
						}
					}
					buffArray.sort(function(a, b) {
						return b[1] - a[1];
					})

					fullBuffArray.push([i, buffArray])
					fullBuffArray.sort(function(a, b) {
						return b[0] - a[0];
					})
				}
			}

			for (i in fullBuffArray) {
				if (fullBuffArray[i][0] == 100) finalText += `Debuffs `
				else finalText += `Has a **${fullBuffArray[i][0]}%** chance to debuff `

				for (let j in fullBuffArray[i][1]) {
					finalText += ` **${fullBuffArray[i][1][j][0].charAt(0).toUpperCase() + fullBuffArray[i][1][j][0].slice(1)}**`;

					let sameValue = 0;
					for (let k in fullBuffArray[i][1]) {
						if (k <= j) continue
						if (fullBuffArray[i][1][j][1] == fullBuffArray[i][1][k][1]) sameValue++;
					}
					if (sameValue == 0) finalText += ` by ${fullBuffArray[i][1][j][1]} stage${fullBuffArray[i][1][j][1] > 1 ? 's' : ''}`;

					if (sameValue != 0) {
						if (sameValue == 1) finalText += ` and `;
						else finalText += `, `;
					} else {
						if (j < fullBuffArray[i][1].length - 2) finalText += `, `;
						else if (j == fullBuffArray[i][1].length - 2) finalText += ` and `;
						else finalText += `.`;
					}
				}
				finalText += `\n`;
			}
		}

		if (hasExtra(skillDefs, 'lonewolf'))
			finalText += `Power is multiplied by ${skillDefs.extras.lonewolf[0]}x if **the user is alone or the last one standing**\n`;
	}
	
	return finalText;
}

skillDesc = (skillDefs, skillName, server) => {
	let settings = setUpSettings(server);
	var finalText = ``;
	if (skillDefs.type != "status" && skillDefs.type != "passive") {
		if (hasExtra(skillDefs, 'ohko') && skillDefs.type != "heal")
			finalText += 'Defeats the foe in **one shot**!';
		else {
			if (skillDefs.type === 'heal') {
				for (const i in skillDefs.heal) {
					switch (i) {
						case 'fullheal':
							finalText += '**Fully heals**';
							break;
						case 'statusheal':
							finalText += `Cures **${skillDefs.heal[i][0]} ailments**`;
							break;
						case 'healmp':
							finalText += `Heals **around ${skillDefs.heal[i][0]} MP**`;
							break;
						case 'default':
							finalText += `Heals **around ${skillDefs.heal[i][0]} HP**`;
							break;
						case 'regenerate':
							finalText += `Regenerates **around ${skillDefs.heal[i][0][0]} HP** for **${skillDefs.heal[i][0][1]} turns**`;
							break;
						case 'invigorate':
							finalText += `Regenerates **around ${skillDefs.heal[i][0][0]} MP** for **${skillDefs.heal[i][0][1]} turns**`;
							break;
						case 'sacrifice':
							finalText += `${skillDefs.heal[i][0] > 0 ? `**Leaves the caster's health at ${skillDefs.heal[i][0]}**` : '**Sacrifices the caster**'}`;
							break;
						case 'revive':
							finalText += `**Revives** the target to 1/${skillDefs.heal[i][0]} of their max HP`;
							break;
						case 'wish':
							finalText += `Heals after **${skillDefs.heal[i][0]} turns**`;
							break;
					}
					if (i < Object.keys(skillDefs.heal).length-1) finalText += '\n';
				}
			} else
				finalText += `Has **${skillDefs.pow}** Power`;
		}

		if (skillDefs.hits && skillDefs.hits > 1 && skillDefs.type != "heal" && !hasExtra(skillDefs, 'ohko')) 
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
		case "spreadopposing":
			finalText += "Targets **one opponent and spreads to two surrounding**.\n";
			break;
		case "spreadallies":
			finalText += "Targets **an ally and spreads to two surrounding**.\n";
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

	if (hasExtra(skillDefs, 'drain') && skillDefs.type != "heal") {
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
		if (skillDefs.preskills) finalText = finalText.slice(0, -1)
		finalText += '\nEvo Skills:```diff\n'
		for (const i in skillDefs.evoskills) {
			finalText += `- ${skillDefs.evoskills[i][0]}, Lv${skillDefs.evoskills[i][1]}\n`
		}
		finalText += '```\n'
	}

	if (skillDefs.levellock) finalText += skillDefs.levellock != 'unobtainable' ? `🔒 *Skill Locked until level **${skillDefs.levellock}***\n` : '🔒 *Skill Unobtainable*\n';

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