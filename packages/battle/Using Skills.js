canUseLb = (char, btl) => {
	let settings = setUpSettings(btl.guild.id);
	if (!settings.mechanics.limitbreaks) return false;

	// We'll sort this out later.
	let possible = [];
	for (let i in char.lb) {
		if (char.lbp >= char.lb[i].cost) possible.push(i);
	}
	if (possible.length <= 0) return false;
	if (possible.length == 1) return possible[0]

	possible.sort(function(a, b) {return char.lb[a].cost - char.lb[b].cost});
	return char.lb[possible[0]];
}

// Is this a tech
function isTech(char, element) {
	if (!char.status) return false;
	if (char.status === 'sleep' || char.status === 'blind') return true;

	if (typeof element == 'string') {
		return elementTechs[char.status].includes(element.toLowerCase());
	} else {
		for (let k in element) {
			if (elementTechs[char.status].includes(element[k].toLowerCase())) return true;
		}
	}

	return false;
}


// Is the status effect physical?
isPhysicalStatus = (status) => {
	if (!status) return false;
	let statusName = status.toLowerCase();

	return (statusName === 'burn' || statusName === 'bleed' || statusName === 'freeze' || statusName === 'paralyze' || statusName === 'poison' || statusName === 'hunger' || statusName === 'dazed' || statusName === 'irradiated' || statusName === 'mirror' || statusName === 'blind');
}

// im lazy
dodgeTxt = (char, targ) => {
	if (targ) {
		return `${targ.name} dodged it!\n${selectQuote(targ, 'dodge')}\n${selectQuote(char, 'miss')}`;
	} else {
		return `${char.name} dodged it!\n${selectQuote(char, 'dodge')}`;
	}
}

useCost = (char, cost, costtype) => {
	if (!costtype) costtype === 'mp';

	switch(costtype.toLowerCase()) {
		case 'hppercent':
			if (!isBoss(char)) char.hp = Math.max(1, char.hp - Math.round((char.maxhp/100) * cost));
			break;

		case 'mppercent':
			if (!isBoss(char)) char.mp = Math.max(0, char.mp - Math.round((char.maxmp/100) * cost));
			break;

		case 'mp':
			char.mp = Math.max(0, char.mp - cost);
			break;
		
		case 'lb':
			char.lbp = Math.max(0, char.lbp - cost);
			break;

		default:
			char.hp = Math.max(1, char.hp - cost);
	}
}

// Placeholder
genDmg = (char, targ, btl, skill) => {
	let settings = setUpSettings(btl.guild.id);

	let charStats = (char.status && statusEffectFuncs[char.status] && statusEffectFuncs[char.status].statmod) ? statusEffectFuncs[char.status].statmod(char, char.stats) : objClone(char.stats);
	let targStats = (targ.status && statusEffectFuncs[targ.status] && statusEffectFuncs[targ.status].statmod) ? statusEffectFuncs[targ.status].statmod(targ, targ.stats) : objClone(targ.stats);

	let atkStat = (skill.atktype === 'phys') ? statWithBuff(charStats.atk, char.buffs.atk) : statWithBuff(charStats.mag, char.buffs.mag);
	let endStat = statWithBuff(targStats.end, targ.buffs.end);
	let def = atkStat/endStat;
	
	let formulas = ['persona', 'pokemon', 'lamonka'];
	let damageformula = settings.formulas.damageFormula ?? 'persona';
	if (skill.extras && skill.extras.forceformula && formulas.includes(skill.extras.forceformula.toLowerCase())) {
		damageformula = skill.extras.forceformula.toLowerCase();
	}

	if (skill.limitbreak) {
		return Math.round((((skill.pow+(atkStat*2)-targDefs.end)*2) + Math.round(Math.random() * 30))/2);
	} else {
		switch(damageformula) {
			case 'persona':
				return Math.round(5 * Math.sqrt(def * skill.pow))+randNum(-7, 7);
			case 'pokemon':
				return Math.round((((2*char.level)/5+2)*skill.pow*def)/50+2)+randNum(-7, 7);
			case 'lamonka':
				return Math.ceil(((skill.pow+char.level)*(def/4)))*(0.95+(Math.random()/20));
			default:
				return randNum(char.level+35)+randNum(skill.pow/1.75)+randNum(-7, 7);
		}
	}
}

// Also Placeholder
getAffinity = (char, skillType) => {
	let affinity = 'normal'

	if (typeof skillType === 'object') {
		skillType = skillType.filter((_, index) => _ != "almighty");
		console.log(skillType)
		
		if (skillType.length < 2) skillType = skillType[0]
	}

	if (skillType && skillType != "almighty") {
		const affinities = ["superweak", "weak", "resist", "block", "repel", "drain"]

		if (typeof skillType === 'string') {
			for (const i in affinities) {
				for (const k in char.affinities[affinities[i]]) {
					if (char.affinities[affinities[i]][k] == skillType)
						affinity = affinities[i];
				}
			}
		} else {
			let results = [-2, -1, 1, 2, 2, 2] //results that would appear
			let points = 0

			let affinityToConsider = ''

			for (let j = 0; j < skillType.length; j++) {
				for (const i in affinities) {
					for (const k in char.affinities[affinities[i]]) {
						if (char.affinities[affinities[i]][k] == skillType[j]) {
							points = results[affinities.indexOf(affinities[i])]

							if (affinities[i] === "repel") affinityToConsider = "repel"
							if (affinities[i] === "block") affinityToConsider = "block"
							if (affinities[i] === "drain") affinityToConsider = "drain"
						}
					}
				}
			}

			points = Math.min(points, 2)
			points = Math.max(points, -4)

			if (points == 0)
				affinity = "normal"
			else if (points < 2 && points != 0 && points > -3)
				affinity = affinities[results.indexOf(points)]
			else if (points == 2)
				affinity = affinityToConsider != '' ? affinityToConsider : 'block'
			else if (points == -4)
				affinity = "deathly"
			else if (points == -3)
				affinity = "superweak"
		}
	}
	
	return affinity
}

attackWithSkill = (char, targ, skill, btl, noRepel) => {
	let settings = setUpSettings(btl.guild.id);

	const result = {
		txt: ``,
		oneMore: false,
		teamCombo: false
	}

	// Healing Skills
	if (skill.type === 'heal') {
		if (skill.heal) {
			for (let i in skill.heal) {
 				if (!healList[i]) continue;
				if (!healList[i].onuse) continue;

				if (healList[i].multiple) {
					for (let k in skill.heal[i]) {
						result.txt += `\n${healList[i].onuse(char, targ, skill, btl, skill.heal[i][k])}`;
					}
				} else {
					result.txt += `\n${healList[i].onuse(char, targ, skill, btl, skill.heal[i])}`;
				}
			}
		}
	// Status Skills
	} else if (skill.type === 'status') {
		if (skill.statusses) {
			for (let i in skill.statusses) {
				if (!statusList[i]) continue;
				if (!statusList[i].onuse) continue;

				if (statusList[i].multiple) {
					for (let k in skill.statusses[i]) {
						result.txt += `\n${statusList[i].onuse(char, targ, skill, btl, skill.statusses[i][k])}`;
					}
				} else {
					result.txt += `\n${statusList[i].onuse(char, targ, skill, btl, skill.statusses[i])}`;
				}
			}
		}
	// Attacking Skills
	} else {
		// Override
		if (skill.extras) {
			let returnThis = false;

			for (let i in skill.extras) {
				if (!extrasList[i]) continue;
				if (!extrasList[i].onuseoverride) continue;

				if (extrasList[i].multiple) {
					for (let k in skill.extras[i]) {
						result.txt += `\n${extrasList[i].onuseoverride(char, targ, skill, btl, skill.extras[i][k])}`;
						returnThis = true;
					}
				} else {
					result.txt += `\n${extrasList[i].onuseoverride(char, targ, skill, btl, skill.extras[i])}`;
					returnThis = true;
				}
			}

			if (returnThis) return result;
		}
		
		let affinity = getAffinity(targ, skill.type);
		if (affinity == 'block' || (affinity == 'repel' && noRepel)) {
			result.txt += `${targ.name} blocked it!\n${selectQuote(char, 'badatk')}\n${selectQuote(targ, 'block')}`;
			return result;
		} else if (affinity == 'repel' && !noRepel) {
			skill.acc = 999; // Never miss a repel - just to be flashy :D

			let newResults = attackWithSkill(char, char, skill, btl, true);
			result.oneMore = newResults.oneMore;
			result.teamCombo = newResults.teamCombo;

			result.txt += `${selectQuote(targ, 'repel')}\n${targ.name} repelled it!\n${newResults.txt}`;
			return result;
		}

		// Placeholder damage formula
		let damages = [];
		let total = 0;
		
		// How many total hits
		let totalHits = 0;
		for (let i = 0; i < skill.hits; i++) {
			let c = randNum(100);

			if (skill.nomod && skill.nomod.acc) {
				if (c <= skill.acc) {
					totalHits++;
					continue;
				}
			} else {
				if (c <= skill.acc+((char.stats.prc-targ.stats.agl)/2)) {
					totalHits++;
					continue;
				}
			}

			break;
		}

		if (totalHits <= 0) {
			result.txt += dodgeTxt(targ);
			return result;
		} else {
			let crits = [];
			let affinities = [];
			let techs = [];

			for (let i = 0; i < totalHits; i++) {
				let dmg = genDmg(char, targ, btl, skill);

				// Handle Final Affinities
				let curAffinity = affinity
				if (!char.guard){
					if (char.status && statusEffectFuncs[char.status] && statusEffectFuncs[char.status].affinitymod) {
						curAffinity = statusEffectFuncs[char.status].affinitymod(char, targ, skill, btl, affinity);
					}

					for (let i in char.skills) {
						if (!skillFile[char.skills[i]]) continue;
						if (skillFile[char.skills[i]].type != 'passive') continue;

						for (let k in skillFile[char.skills[i]].passive) {
							if (passiveList[k] && passiveList[k].affinitymod) {
								let a = passiveList[k].affinitymod(targ, char, skill, btl, skillFile[char.skills[i]].passive[k])

								if (a && a != null && a != false) {
									if (typeof(a) === 'string') {
										curAffinity = a;
									} else {
										curAffinity = a[0];
										results.txt += a[1];
									}
								}
							}
						}
					}

					for (let i in targ.skills) {
						if (!skillFile[targ.skills[i]]) continue;
						if (skillFile[targ.skills[i]].type != 'passive') continue;

						for (let k in skillFile[targ.skills[i]].passive) {
							if (passiveList[k] && passiveList[k].affinitymodoninf) {
								let a = passiveList[k].affinitymodoninf(targ, char, skill, skillFile[char.skills[i]], btl, skillFile[char.skills[i]].passive[k])
								
								if (a && a != null && a != false) {
									if (typeof(a) === 'string') {
										curAffinity = a;
									} else {
										curAffinity = a[0];
										results.txt += a[1];
									}
								}
							}
						}
					}
				}

				affinities.push(curAffinity);

				if (affinity == 'resist') dmg *= settings.rates.affinities.resist ?? 0.5;
				if (affinity == 'drain') dmg *= settings.rates.affinities.drain ?? 1;
				if (affinity == 'weak' && !targ.guard) dmg *= settings.rates.affinities.weak ?? 1.5;
				if (affinity == 'superweak' && !targ.guard) dmg *= settings.rates.affinities.superweak ?? 2.1;
				if (affinity == 'deadly' && !targ.guard) dmg *= settings.rates.affinities.deadly ?? 4.2;

				// Critical Hits
				if (skill.crit) {
					let c = randNum(100);
					if (c <= skill.crit+((char.stats.luk-targ.stats.luk)/2)) {
						crits[i] = true;
						dmg *= settings.rates.crit ?? 1.5;
					}
				}

				// Techs
				if (targ.status && isTech(targ, skill.type)) {
					dmg *= settings.rates.tech ?? 1.2;
					techs[i] = true;
				}

				// DmgMod
				if (skill.extras) {
					for (let i in skill.extras) {
						if (!extrasList[i]) continue;
						if (!extrasList[i].dmgmod) continue;

						if (extrasList[i].multiple) {
							for (let k in skill.extras[i]) {
								extrasList[i].dmgmod(char, targ, dmg, skill, btl, skill.extras[i][k]);
							}
						} else {
							extrasList[i].dmgmod(char, targ, dmg, skill, btl, skill.extras[i]);
						}
					}
				}

				// Guarding
				if (char.guard && affinity != 'drain') {
					dmg *= char.guard;
					delete char.guard;
				}

				// This damage is done!
				damages.push(Math.max(1, Math.round(dmg)));
			}

			let dmgTxt = '';
			if (affinity == 'drain') {
				result.txt += `__${targ.name}__'s HP was restored by _`

				for (let i in damages) {
					dmgTxt += `**${damages[i]}**${affinityEmoji.drain}`;
					if (crits[i]) dmgTxt += critEmoji;

					total += damages[i];
					if (i < damages.length-1) dmgTxt += ' + ';
				}

				if (dmgTxt.length > 1000) {
					let avg = 0;
					for (let i in damages) avg += damages[i];
					avg /= damages.length;

					dmgTxt = `**${Math.round(avg)}${affinityEmoji.drain} average**`;
				}

				result.txt += `${dmgTxt}!_`;

				if (damages.length > 1) result.txt += ` **(${totalHits} hits, ${total} Total)**`;
				targ.hp = Math.min(targ.maxhp, targ.hp+total);

				result.txt += `\n${selectQuote(char, 'badatk')}\n${selectQuote(targ, 'drain')}`;
			} else {
				result.txt += `__${targ.name}__ took _`
				for (let i in damages) {
					dmgTxt += `**${damages[i]}**`;
					if (affinityEmoji[affinities[i]]) dmgTxt += affinityEmoji[affinities[i]];
					if (techs[i]) dmgTxt += statusEmojis[targ.status.toLowerCase()] ?? statusEmojis.burn;
					if (crits[i]) dmgTxt += critEmoji;

					total += damages[i];
					if (i < damages.length-1) dmgTxt += ' + ';
				}

				if (dmgTxt.length > 1000) {
					let avg = 0;
					for (let i in damages) avg += damages[i];
					avg /= damages.length;

					dmgTxt = `**${Math.round(avg)} average**`;
				}

				targ.hp = Math.max(0, targ.hp-total);
				if (targ.hp <= 0) {
					result.txt += `${dmgTxt} damage and was defeated!_`;
				} else {
					result.txt += `${dmgTxt} damage!_`;
				}

				// Limit Breaks
				if (settings.mechanics.limitbreaks) {
					if (!char.lbp) char.lbp = 0;
					char.lbp += total/(skill.hits*((skill.target === 'one' || skill.target === 'ally') ? 2 : 8))
				}

				// Full Combo!
				if (damages.length > 1) result.txt += ` **(${(totalHits >= skill.hits) ? '__Full Combo!__ ' : (totalHits + ' hits, ')}${total} Total)**`;

				// OnUse
				if (skill.extras) {
					for (let i in skill.extras) {
						if (!extrasList[i]) continue;
						if (!extrasList[i].onuse) continue;

						if (extrasList[i].multiple) {
							for (let k in skill.extras[i]) {
								result.txt += `\n${(extrasList[i].onuse(char, targ, skill, btl, skill.extras[i][k] ) ?? '')}`;
							}
						} else {
							result.txt += `\n${(extrasList[i].onuse(char, targ, skill, btl, skill.extras[i]) ?? '')}`;
						}
					}
				}

				// On hit
				if (targ.hp > 0 && targ.custom) {
					for (let i in targ.custom) {
						if (customVariables[i] && customVariables[i].onhit) {
							result.txt += '\n' + (customVariables[i].onhit(btl, targ, char, total, targ.custom[i]) ?? '');
						}
					}
				}

				// Quotes
				let quotetype = affinity;
				if (affinity === 'normal') quotetype = 'hurt';
				if (affinity === 'resist') result.txt += `\n${selectQuote(char, 'badatk')}`;

				if (targ.hp <= 0) {
					quotetype = 'dead';
					result.txt += `\n${selectQuote(char, 'kill')}`;
				} else
					result.txt += `\n${selectQuote(char, 'landed')}`;

				result.txt += `\n${selectQuote(targ, quotetype)}`;

				// Lastly, Status Effects
				if (skill.status && !targ.status) {
					var status;
					if (typeof(skill.status) === 'object') {
						status = skill.status[randNum(skill.status.length-1)];
					} else {
						status = skill.status;
					}

					let chance = (skill.statuschance ?? 5) + ((char.stats.chr-targ.stats.chr)/2);
					if (isPhysicalStatus(status.toLowerCase())) chance = (skill.statuschance ?? 5) + ((char.stats.luk-targ.stats.luk)/2);

					if (randNum(1, 100) <= chance) {
						result.txt += `${inflictStatus(targ, status.toLowerCase())}\n${selectQuote(char, 'landed')}\n${selectQuote(targ, 'hurt')}`;
					}
				}
			}
		}
	}

	return result;
}

useSkill = (char, btl, act, forceskill) => {
	let skill = objClone(forceskill) ?? objClone(skillFile[act.index]);

	// First, we modify stats via passives n shit. This isn't the actual character anyway so we don't care.

	// Failsafe
	if (!skill.hits) skill.hits = 1;

	// Passives
	for (let skillName of char.skills) {
		let psv = skillFile[skillName];

		if (psv.type != 'passive' || !psv.passive) continue;

		for (let i in psv.passive) {
			if (passiveList[i] && passiveList[i].statmod) {
				if (passiveList[i].multiple) {
					for (let k in psv.passive[i]) passiveList[i].statmod(btl, char, skill, psv.passive[i][k]);
				} else
					passiveList[i].statmod(btl, char, skill, psv.passive[i]);
			}
		}
	}

	// Attack Extras
	if (skill.extras) {
		for (let i in skill.extras) {
			if (extrasList[i] && extrasList[i].statmod) {
				if (extrasList[i].multiple) {
					for (let k in skill.extras) extrasList[i].statmod(char, skill, skill.extras[i][k], btl)
				} else
					extrasList[i].statmod(char, skill, skill.extras[i], btl)
			}
		}
	}

	// Status Effects
	if (char.status && statusEffectFuncs[char.status] && statusEffectFuncs[char.status].skillmod) {
		statusEffectFuncs[char.status].skillmod(char, skill, btl);
	}

	// more shit
	let skillCost = skill.cost ?? null;

	// (easy access)
	let party = btl.teams[char.team];

	if (skill.cost && party.leaderskill && party.leaderskill.type === 'discount') {
	}

	// Who will this skill target? Each index of "targets" is [ID, Power Multiplier].
	let targets = [];
	let possible = [];

	if (!skill.target) {
		if (skill.type === 'heal')
			skill.target = 'ally';
		else
			skill.target = 'one';
	}

	// Insert IDs into the target.
	switch(skill.target.toLowerCase()) {
		case 'one':
		case 'ally':
			let targ = (btl.teams[act.target[0]] && btl.teams[act.target[0]].members[act.target[1]]) ? btl.teams[act.target[0]].members[act.target[1]] : btl.teams[0].members[0];
			targets.push([targ.id, 1]);
			break;

		case 'caster':
			targets.push([char.id, 1]);
			break;

		case 'allopposing':
			for (let i in btl.teams) {
				if (char.team == i) continue;
				
				for (let k in btl.teams[i].members)
					if (btl.teams[i].members[k].hp > 0) targets.push([btl.teams[i].members[k].id, 1]);
			}
			break;

		case 'allallies':
			for (let i in party.members)
				if (party.members[i].hp > 0) targets.push([party.members[i].id, 1]);
			break;

		case 'randomopposing':
			for (let i in btl.teams) {
				if (char.team == i) continue;
				
				for (let k in btl.teams[i].members)
					if (btl.teams[i].members[k].hp > 0) possible.push(btl.teams[i].members[k].id);
			}

			for (let i = 0; i < skill.hits; i++)
				targets.push([possible[randNum(possible.length-1)] ?? possible[0], 1]);

			skill.hits = 1; // make the skill one hit now.
			break;

		case 'randomallies':
			while (targets.length < skill.hits) {
				let charDefs = party.members[randNum(party.members.length-1)];
				if (charDefs && charDefs.hp > 0) targets.push([charDefs.id, 1]);
			}

			skill.hits = 1; // make the skill one hit now.
			break;

		case 'random':
			for (let i in btl.teams) {
				for (let k in btl.teams[i].members)
					if (btl.teams[i].members[k].hp > 0 && btl.teams[i].members[k].id != char.id) possible.push(btl.teams[i].members[k].id);
			}

			for (let i = 0; i < skill.hits; i++)
				targets.push([possible[randNum(possible.length-1)] ?? possible[0], 1]);

			skill.hits = 1; // make the skill one hit now.
			break;

		case 'everyone':
			for (let i in btl.teams) {
				for (let k in btl.teams[i].members)
					if (btl.teams[i].members[k].hp > 0 && btl.teams[i].members[k].id != char.id) targets.push([btl.teams[i].members[k].id, 1]);
			}
			break;

		case 'spreadallies':
		case 'spreadopposing':
			targets.push([btl.teams[act.target[0]].members[act.target[1]].id, 1]);
			if (btl.teams[act.target[0]].members[act.target[1]-1] && btl.teams[act.target[0]].members[act.target[1]-1].hp > 0) targets.push([btl.teams[act.target[0]].members[act.target[1]-1].id, 0.6666666666666666]);
			if (btl.teams[act.target[0]].members[act.target[1]+1] && btl.teams[act.target[0]].members[act.target[1]+1].hp > 0) targets.push([btl.teams[act.target[0]].members[act.target[1]+1].id, 0.6666666666666666]);
			break;
	}

	let targTxt = `__${char.name}__ => `;
	
	let quotetype = 'phys';
	if (skill.atktype === 'magic') quotetype = 'mag';
	if (skill.type === 'heal') quotetype = 'heal';

	let finalText = `${selectQuote(char, quotetype)}\n__${char.name}__ used __${skill.name}__!\n\n`;

	if (targets.length <= 1) 
		targTxt += `__${getCharFromId(targets[0][0], btl).name}__`;
	else {
		if (skill.target === 'allallies' || skill.target === 'spreadallies') {
			targTxt += '__Allies__'
		} else if (skill.target === 'everyone') {
			targTxt += '__Everyone__'
		} else if (skill.target === 'random' || skill.target === 'randomopposing') {
			targTxt += '__???__'
		} else {
			targTxt += '__Foes__'
		}
	}

	if (skill.heal) {
		for (let i in skill.heal) {
			if (healList[i].override) {
				if (healList[i].multiple) {
					for (let k in skill.heal[i]) {
						finalText += healList[i].override(char, skill, btl, skill.heal[i][k]);
					}
				} else {
					finalText += healList[i].override(char, skill, btl, skill.heal[i]);
				}

				// Take away the cost
				useCost(char, skillCost, skill.costtype);

				// Now, send the embed!
				let DiscordEmbed = new Discord.MessageEmbed()
					.setColor(elementColors[char.mainElement] ?? elementColors.strike)
					.setTitle(targTxt)
					.setDescription(finalText)
				return btl.channel.send({embeds: [DiscordEmbed]});
			}
		}
	}

	for (let i in targets) {
		let targ = getCharFromId(targets[i][0], btl);
		let skillDefs = objClone(skill);
		skillDefs.pow *= targets[i][1];

		let result = attackWithSkill(char, targ, skillDefs, btl);
		finalText += `${result.txt}\n`;

		if (result.oneMore) btl.doonemore = true;
		if (result.teamCombo) btl.canteamcombo = true;
	}

	// OnSelect
	if (skill.extras) {
		for (let i in skill.extras) {
			if (!extrasList[i]) continue;
			if (!extrasList[i].onselect) continue;

			if (extrasList[i].multiple) {
				for (let k in skill.extras[i]) finalText += `\n${(extrasList[i].onselect(char, skill, btl, skill.extras[i][k]) ?? '')}`;
			} else {
				finalText += `\n${(extrasList[i].onselect(char, skill, btl, skill.extras[i]) ?? '')}`;
			}
		}
	}

	// Take away the cost
	if (skillCost) useCost(char, skillCost, skill.costtype);

	// Now, send the embed!
	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(elementColors[char.mainElement] ?? elementColors.strike)
		.setTitle(targTxt)
		.setDescription(finalText)
	btl.channel.send({embeds: [DiscordEmbed]});

	// return true or something
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, JSON.stringify(btl, null, '    '));
}