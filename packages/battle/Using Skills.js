// Can we use a LB
canUseLb = (char, btl) => {
	let settings = setUpSettings(btl.guild.id);
	if (!settings.mechanics.limitbreaks) return false;

	// We'll sort this out later.
	let possible = [];
	for (let i in char.lb) {
		if (char.lbp >= char.lb[i].cost) possible.push(i);
	}
	if (possible.length <= 0) return false;
	if (possible.length == 1) return char.lb[possible[0]];

	possible.sort(function(a, b) {return char.lb[b].cost - char.lb[a].cost});
	return char.lb[possible[0]];
}

// Add this message to the end of an array.
addAtkMsg = (btl, str) => {
	if (!btl.atkmsg) {
		btl.atkmsg = str;
	} else {
		btl.atkmsg = `\n${str}`;
	}

	return btl.atkmsg;
}

// Is this a tech
isTech = (char, element) => {
	if (!char.status) return false;
	if (char.status === 'sleep' || char.status === 'blind') return true;

	if (elementTechs[char.status]) {
		if (typeof element == 'string') {
			return elementTechs[char.status].includes(element.toLowerCase());
		} else {
			for (let k in element) {
				if (elementTechs[char.status].includes(element[k].toLowerCase())) return true;
			}
		}
	}

	return false;
}

// im lazy
dodgeTxt = (char, targ) => {
	if (targ) {
		return `${targ.name} dodged it!\n${selectQuote(targ, 'dodge', null, "%ENEMY%", char.name)}${selectQuote(char, 'miss', null, "%ENEMY%", char.name)}`;
	} else {
		return `${char.name} dodged it!\n${selectQuote(char, 'dodge', null, "%ENEMY%", "them")}`;
	}
}

// Generate Damage dealt to targ with skill using char's stats.
genDmg = (char, targ, btl, skill) => {
	let settings = setUpSettings(btl.guild.id);

	// Status Effect StatMod.
	let charStats = (char.status && statusEffectFuncs[char.status] && statusEffectFuncs[char.status].statmod) ? statusEffectFuncs[char.status].statmod(char, objClone(char.stats)) : objClone(char.stats);
	let targStats = (targ.status && statusEffectFuncs[targ.status] && statusEffectFuncs[targ.status].statmod) ? statusEffectFuncs[targ.status].statmod(targ, objClone(targ.stats)) : objClone(targ.stats);

	// Weather StatMod.
	if (btl.weather && weatherFuncs && weatherFuncs[btl.weather.type] && weatherFuncs[btl.weather.type].statmod) {
		charStats = weatherFuncs[btl.weather.type].statmod(char, charStats, btl) ?? charStats;
		targStats = weatherFuncs[btl.weather.type].statmod(targ, targStats, btl) ?? targStats;
	}

	// Terrain StatMod.
	if (btl.terrain && terrainFuncs && terrainFuncs[btl.terrain.type] && terrainFuncs[btl.terrain.type].statmod) {
		charStats = terrainFuncs[btl.terrain.type].statmod(char, charStats, btl) ?? charStats;
		targStats = terrainFuncs[btl.terrain.type].statmod(targ, targStats, btl) ?? targStats;
	}

	// Custom Variable StatMod.
	if (char.custom) {
		for (let i in char.custom) {
			if (customVariables[i] && customVariables[i].statmod) charStats = customVariables[i].statmod(btl, char, charStats, char.custom[i]);
		}
	}
	if (targ.custom) {
		for (let i in targ.custom) {
			if (customVariables[i] && customVariables[i].statmod) targStats = customVariables[i].statmod(btl, targ, targStats, targ.custom[i]);
		}
	}

	let atkStat = (skill.atktype === 'physical') ? statWithBuff(charStats.atk, char.buffs.atk ?? 0) : statWithBuff(charStats.mag, char.buffs.mag ?? 0);
	let endStat = statWithBuff(targStats.end, targ.buffs.end);
	console.log(`Atk Checkpoint: ${atkStat}`);

	if (skill.extras?.statcalc) {
		atkStat = statWithBuff(charStats[skill.extras.statcalc[0].toLowerCase()], char.buffs[skill.extras.statcalc[0].toLowerCase()] ?? 1);
	}
	if (skill.extras?.hitcalc) {
		endStat = statWithBuff(targStats[skill.extras.hitcalc[0].toLowerCase()], targ.buffs[skill.extras.hitcalc[0].toLowerCase()] ?? 1);
	}

	let def = atkStat/endStat;
	
	let formulas = ['persona', 'pokemon', 'lamonka', 'beta'];
	let damageformula = settings.formulas.damageFormula ?? 'persona';
	if (skill.extras && skill.extras.forceformula && formulas.includes(skill.extras.forceformula.toLowerCase())) {
		damageformula = skill.extras.forceformula.toLowerCase();
	}

	if (skill.limitbreak) {
		return Math.round((((skill.pow+(atkStat*2)-endStat)*2) + Math.round(Math.random() * 30))/2);
	} else {
		let dmg = 0;
		switch(damageformula) {
			case 'persona':
				dmg = Math.round(5 * Math.sqrt(def * skill.pow))+randNum(-7, 7);
				console.log(`Attack Stat: ${atkStat}, Endurance Stat: ${endStat}, Skill Pow: ${skill.pow}, Base Dmg: ${Math.round(5 * Math.sqrt(def * skill.pow))}, Real Dmg: ${dmg}`);
				break;
			case 'pokemon':
				dmg = Math.round((((2*char.level)/5+2)*skill.pow*def)/50+2)+randNum(-7, 7);
				break;
			case 'lamonka':
				dmg = Math.ceil(((skill.pow+char.level)*(def/4)))*(0.95+(Math.random()/20));
				break;
			case 'beta':
				dmg = randNum(char.level+35)+randNum(skill.pow/1.75)+randNum(-7, 7);
				break;
		}
		
		if (isNaN(dmg) || dmg <= 0) dmg = 1;
		return dmg;
	}
}

// Get the affinity of an attack based on skill or status.
getAffinity = (char, skillType) => {
	let affinity = 'normal';

	if (char.status === 'mirror') {
		if (skillType === 'strike' || skillType === 'slash' || skillType === 'pierce' || skillType === 'explode')
			return 'superweak';
		else
			return 'repel';
	}

	if (!char.affinities) return 'normal';

	if (typeof skillType === 'object') {
		skillType = skillType.filter((_, index) => _ != "almighty");
		console.log(skillType)
		
		if (skillType.length < 2) skillType = skillType[0]
	}

	if (skillType && skillType != "almighty") {
		const affinities = ["deadly", "superweak", "weak", "resist", "block", "repel", "drain"]

		if (typeof skillType === 'string') {
			for (const i in affinities) {
				if (!char.affinities[affinities[i]]) continue;

				for (const k in char.affinities[affinities[i]]) {
					if (char.affinities[affinities[i]][k] == skillType)
						affinity = affinities[i];
				}
			}
		} else {
			let results = [-4, -2, -1, 1, 2, 2, 2] //results that would appear
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
				affinity = "deadly"
			else if (points == -3)
				affinity = "superweak"
		}
	}
	
	return affinity
}

// Divide val by nominator/denominator times times.
function divideBy(val, nominator, denominator, times) {
	if (times <= 0) return val;

	let newval = val;
	for (let i = 0; i < times; i++) newval *= nominator/denominator;

	return newval;
}

// Attack targ with skill using char's stats. noRepel disables repel affinities. noExtraArray disables certain extras. noVarsArray disables certain vars.
attackWithSkill = (char, targ, skill, btl, noRepel, noExtraArray, noVarsArray) => {
	let settings = setUpSettings(btl.guild.id);

	const result = {
		txt: ``,
		oneMore: false,
		teamCombo: false
	}

	// Healing Skills
	if (skill.type === 'heal') {
		if (skill.heal) {
			if (trustLevel(char, targ) >= trustLvl.morehealbuff)
				skill.pow *= 1.2;
			else if (trustLevel(char, targ) >= trustLvl.healbuff)
				skill.pow *= 1.1;

			if (char.mimic || char.clone || char.reincarnate) skill.pow *= 1/3;

			for (let i in skill.heal) {
				if (!healList[i]) continue;
				if (!healList[i].onuse) continue;
				if (noExtraArray && noExtraArray.includes(i)) continue;

				if (healList[i].multiple) {
					for (let k in skill.heal[i]) {
						result.txt += `\n${healList[i].onuse(char, targ, skill, btl, skill.heal[i][k], skill.pow) ?? ''}`;
					}
				} else {
					result.txt += `\n${healList[i].onuse(char, targ, skill, btl, skill.heal[i], skill.pow) ?? ''}`;
				}
			}

			if (doPassives(btl)) {
				for (let i in targ.skills) {
					if (!skillFile[targ.skills[i]]) continue;
					if (skillFile[targ.skills[i]].type != 'passive') continue;

					for (let k in skillFile[targ.skills[i]].passive) {
						if (passiveList[k] && passiveList[k].onheal) {
							if (noExtraArray && noExtraArray.includes(k)) continue;
							result.txt += `\n${passiveList[k].onheal(targ, char, skill, skill.pow, btl, skillFile[targ.skills[i]].passive[k]) ?? ''}`;
						}
					}
				}
			}
		}
	// Status Skills
	} else if (skill.type === 'status') {
		if (skill.statusses) {
			for (let i in skill.statusses) {
				if (!statusList[i]) continue;
				if (!statusList[i].onuse) continue;
				if (noExtraArray && noExtraArray.includes(i)) continue;

				if (statusList[i].multiple) {
					for (let k in skill.statusses[i]) {
						result.txt += `\n${statusList[i].onuse(char, targ, skill, btl, skill.statusses[i][k], skill.pow)}`;
					}
				} else {
					result.txt += `\n${statusList[i].onuse(char, targ, skill, btl, skill.statusses[i], skill.pow)}`;
				}
			}
		}

		// Lastly, Status Effects
		if (skill.status && !targ.status) {
			var status;
			if (typeof(skill.status) === 'object') {
				status = skill.status[randNum(skill.status.length-1)];
			} else {
				status = skill.status;
			}

			result.txt += statusList.status.inflictStatus(char, targ, skill, status ?? 'burn', btl, skill.pow);
		}
	// Attacking Skills
	} else {
		// Override
		if (skill.extras) {
			let returnThis = false;

			for (let i in skill.extras) {
				if (!extrasList[i]) continue;
				if (!extrasList[i].onuseoverride) continue;
				if (noExtraArray && noExtraArray.includes(i)) continue;

				if (extrasList[i].multiple) {
					for (let k in skill.extras[i]) {
						result.txt += `\n${extrasList[i].onuseoverride(char, targ, skill, result, btl, skill.extras[i][k])}`;
						returnThis = true;
					}
				} else {
					result.txt += `\n${extrasList[i].onuseoverride(char, targ, skill, result, btl, skill.extras[i])}`;
					returnThis = true;
				}
			}

			if (returnThis) return result;

			// SkillFailOnUse
			for (let i in skill.extras) {
				if (extrasList[i] && extrasList[i].skillfailonuse) {
					if (noExtraArray && noExtraArray.includes(i)) continue;
					if (extrasList[i].multiple) {
						for (let k in skill.extras[i]) {
							if (extrasList[i].skillfailonuse(char, targ, skill, btl, skill.extras[i][k])) {
								result.txt = `...But it failed on ${targ.name}.`;
								return result;
							}
						}
					} else {
						if (extrasList[i].skillfailonuse(char, targ, skill, btl, skill.extras[i])) {
							result.txt = `...But it failed on ${targ.name}.`;
							return result;
						}
					}
				}
			}
		}

		let affinity = getAffinity(targ, skill.type);
		let shieldtype = targ.custom?.shield?.type ?? undefined;

		// ForceDodge and OnAffinityCheck passive funcs
		if (doPassives(btl)) {
			for (let i in targ.skills) {
				if (!skillFile[targ.skills[i]]) continue;
				if (skillFile[targ.skills[i]].type != 'passive') continue;

				for (let k in skillFile[targ.skills[i]].passive) {
					if (passiveList[k] && passiveList[k].forcedodge) {
						if (noExtraArray && noExtraArray.includes(k)) continue;
						const psv = passiveList[k];
						const passive = skillFile[targ.skills[i]];
						let dodge = false;
						
						if (psv.multiple) {
							for (let j in passive.passive[k]) {
								if (psv.forcedodge(targ, char, skill, passive, btl, passive.passive[k][j])) {
									dodge = true;
									break;
								}
							}
						} else {
							dodge = psv.forcedodge(targ, char, skill, passive, btl, passive.passive[k]);
						}

						if (dodge) {
							result.txt += `__${targ.name}__'s _${passive.name}_ allowed them to dodge __${char.name}__'s _${skill.name}_!`;
							return result
						}
					} else if (passiveList[k] && passiveList[k].onaffinitycheck && !noRepel) {
						if (noExtraArray && noExtraArray.includes(k)) continue;
						const psv = passiveList[k];
						const passive = skillFile[targ.skills[i]];
						let endfunc = false;

						if (psv.multiple) {
							for (let j in passive.passive[k]) {
								let str = psv.onaffinitycheck(targ, char, skill, passive, affinity, btl, passive.passive[k][j], result);

								if (str) {
									endfunc = true;
									result.txt += str;
									break;
								}
							}
						} else {
							let str = psv.onaffinitycheck(targ, char, skill, passive, affinity, btl, passive.passive[k], result);

							if (str) {
								endfunc = true;
								result.txt += str;
							}
						}

						if (endfunc) return result;
					}
				}
			}
		}

		// noRepel used here to change repelled attacks into a block.
		if (affinity == 'block' || (affinity == 'repel' && noRepel)) {
			result.txt += `${targ.name} blocked it!\n${selectQuote(char, 'badatk', null, "%ENEMY%", targ.name, "%SKILL%", skill.name)}${selectQuote(targ, 'block', null, "%ENEMY%", char.name, "%SKILL%", skill.name)}`;
			return result;
		} else if (affinity == 'repel' && !noRepel) {
			skill.acc = 999; // Never miss a repel - just to be flashy :D

			// Run this function again. Ban repelling to avoid infinite loops.
			let newResults = attackWithSkill(char, char, skill, btl, true, noExtraArray);
			result.oneMore = newResults.oneMore;
			result.teamCombo = newResults.teamCombo;

			result.txt += `${selectQuote(targ, 'repel', null, "%ENEMY%", char.name, "%SKILL%", skill.name)}${targ.name} repelled it!\n${newResults.txt}`;
			return result;
		// reminder that physical shields repel physical/ranged and magic ones repel magic.
		} else if (shieldtype && !noRepel) {
			let repel = shieldtype == "reduce";
			if (shieldtype === 'repelmag' && skill.atktype === 'magic')
				repel = true;
			else if (shieldtype === 'repelphys' && (skill.atktype === 'physical' || skill.atktype === 'ranged'))
				repel = true;

			if (repel) {
				if (skill.type === 'almighty') {
					addAtkMsg(btl, `${skill.name} broke through __${targ.name}__'s ${targ.custom.shield.name ?? 'Shield'}!`);
					delete targ.custom.shield;
				} else if (!skill.extras?.feint) {
					skill.acc = 999; // Never miss a repel - just to be flashy :D

					// Run this function again. Ban repelling to avoid infinite loops.
					let newResults = attackWithSkill(char, char, skill, btl, true, noExtraArray);
					result.oneMore = newResults.oneMore;
					result.teamCombo = newResults.teamCombo;

					// done.
					result.txt += `${selectQuote(targ, 'repel', null, "%ENEMY%", char.name, "%SKILL%", skill.name)}__${targ.name}__'s _${targ.custom.shield.name ?? 'Shield'}_ repelled the attack!\n${newResults.txt}`;

					// Let's get rid of this shield
					if (!targ.custom.shield.hp) {
						result.txt += `\n_${targ.custom.shield.name ?? 'Shield'}_ has broken.`;
						delete targ.custom.shield;
					} else delete targ.custom.shield.hp

					// Return this text.
					return result;
				}
			}
		}

		// Enemies should learn affinities.
		if (char.affinitycheck && affinity != 'normal') learnAffinity(char, targ, skill);

		// Placeholder damage formula
		let damages = [];
		let total = 0;
		
		// How many total hits
		let totalHits = 0;
		for (let i = 0; i < skill.hits; i++) {
			let c = randNum(1, 100);

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
			result.txt += dodgeTxt(char, targ);
			return result;
		} else {
			// SkillMod
			if (skill.extras) {
				for (let i in skill.extras) {
					if (extrasList[i] && extrasList[i].skillmod) {
						if (noExtraArray && noExtraArray.includes(i)) continue;
						if (extrasList[i].multiple) {
							for (let k in skill.extras[i]) extrasList[i].skillmod(char, targ, skill, btl, skill.extras[i][k]);
						} else
							extrasList[i].skillmod(char, targ, skill, btl, skill.extras[i]);
					}
				}
			}

			// Store which hits are crits, techs and what affinity each hit is.
			let crits = [];
			let affinities = [];
			let techs = [];

			// Here we go...
			for (let i = 0; i < totalHits; i++) {
				let dmg = genDmg(char, targ, btl, skill);
				
				// Sustain Extra
				if (totalHits > 1) {
					if (i > 0 && !skill.extras?.sustain) {
						if (skill.extras?.reverse) {
							let lowestpow = divideBy(dmg, 9, 10, totalHits-1);
							let diff = dmg-lowestpow;

							dmg -= (diff/i);
						} else {
							dmg = divideBy(dmg, 9, 10, i-1);
						}
					}
				}

				// Extrahit Passive
				if (skill?.custom?.multipower) {
					if (i >= skill.custom.multipower[0] && i <= skill.custom.multipower[1]) {
						dmg *= skill.custom.multipower[2]/100;
					}

					if (i == skill.custom.multipower[1]) {
						killVar(skill, 'multipower');
					}
				}

				// Handle Final Affinities
				let curAffinity = affinity
				if (!char.guard){
					if (char.status && statusEffectFuncs[char.status] && statusEffectFuncs[char.status].affinitymod) {
						curAffinity = statusEffectFuncs[char.status].affinitymod(char, targ, skill, btl, affinity);
					}

					if (doPassives(btl)) {
						for (let i in char.skills) {
							if (!skillFile[char.skills[i]]) continue;
							if (skillFile[char.skills[i]].type != 'passive') continue;

							for (let k in skillFile[char.skills[i]].passive) {
								if (passiveList[k] && passiveList[k].affinitymod) {
									if (noExtraArray && noExtraArray.includes(k)) continue;
									let a = passiveList[k].affinitymod(targ, char, skill, btl, skillFile[char.skills[i]].passive[k])

									if (a && a != null && a != false) {
										if (typeof(a) === 'string') {
											curAffinity = a;
										} else {
											curAffinity = a[0];
											result.txt += a[1];
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
									if (noExtraArray && noExtraArray.includes(k)) continue;
									let a = passiveList[k].affinitymodoninf(targ, char, skill, skillFile[targ.skills[i]], btl, skillFile[targ.skills[i]].passive[k])
									
									if (a && a != null && a != false) {
										if (typeof(a) === 'string') {
											curAffinity = a;
										} else {
											curAffinity = a[0];
											result.txt += a[1];
										}
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

				if (affinity == 'weak' || affinity == 'superweak' || affinity == 'deadly' && settings.mechanics.onemores) {
					result.oneMore = true;
					targ.down = true;
				}

				// Critical Hits
				if (skill.crit) {
					let c = randNum(100);
					if (c <= skill.crit+((char.stats.luk-targ.stats.luk)/2)) {
						if (settings.mechanics.onemores) {
							result.oneMore = true;
							targ.down = true;
						}

						crits[i] = true;
						let critRate = settings.rates.crit ?? 1.5;

						// Critical Rate Leader Skills
						let party = btl.teams[char.team];
						if (settings?.mechanics?.leaderskills && skill?.cost && party?.leaderskill && party.leaderskill.type === 'crit') {
							if (party.leaderskill.var1.toLowerCase() == 'all' || skill?.atktype == party.leaderskill.var1.toLowerCase() || (skill.type == party.leaderskill.var1.toLowerCase() || skill.type.includes(party.leaderskill.var1.toLowerCase()))) {
								critRate += critRate * (party.leaderskill.var2 / 100);
							}
						}

						// Critical rate extras
						if (skill.extras) {
							for (let i in skill.extras) {
								if (!extrasList[i]) continue;
								if (!extrasList[i].critmod) continue;
								if (noExtraArray && noExtraArray.includes(i)) continue;

								if (extrasList[i].multiple) {
									for (let k in skill.extras[i]) {
										extrasList[i].critmod(char, targ, dmg, critRate, skill, btl, skill.extras[i][k]);
									}
								} else {
									extrasList[i].critmod(char, targ, dmg, critRate, skill, btl, skill.extras[i]);
								}
							}
						}
						
						// Critical rate passives
						if (doPassives(btl)) {
							for (let skillName of char.skills) {
								if (!skillFile[skillName]) continue;
					
								let psv = skillFile[skillName];
								if (psv.type != 'passive' || !psv.passive) continue;
					
								for (let i in psv.passive) {
									if (passiveList[i] && passiveList[i].critmod) {
										if (noExtraArray && noExtraArray.includes(i)) continue;

										if (passiveList[i].multiple) {
											for (let k in psv.passive[i]) {
												passiveList[i].critmod(char, targ, dmg, critRate, skill, btl, psv.passive[i][k]);
											}
										} else {
											passiveList[i].critmod(char, targ, dmg, critRate, skill, btl, psv.passive[i][k]);
										}
									}
								}
							}
						}


						dmg *= critRate;
					}
				}

				// Techs
				if (targ.status) {
					if ((skill.extras?.forcetech && skill.extras.forcetech.includes(targ.status)) || isTech(targ, skill.type)) {
						dmg *= settings.rates.tech ?? 1.2;
						techs[i] = true;

						if (randNum(1, 100) <= 50 && settings.mechanics.onemores) {
							result.oneMore = true;
							targ.down = true;
						}
					}
				}

				// DmgMod
				if (skill.extras) {
					for (let i in skill.extras) {
						if (!extrasList[i]) continue;
						if (!extrasList[i].dmgmod) continue;
						if (noExtraArray && noExtraArray.includes(i)) continue;

						if (extrasList[i].multiple) {
							for (let k in skill.extras[i]) {
								dmg = extrasList[i].dmgmod(char, targ, dmg, skill, btl, skill.extras[i][k]) ?? dmg;
							}
						} else {
							dmg = extrasList[i].dmgmod(char, targ, dmg, skill, btl, skill.extras[i]) ?? dmg;
						}
					}
				}

				if (doPassives(btl)) {
					for (let skillName of char.skills) {
						if (!skillFile[skillName]) continue;
			
						let psv = skillFile[skillName];
						if (psv.type != 'passive' || !psv.passive) continue;
			
						for (let i in psv.passive) {
							if (passiveList[i] && passiveList[i].dmgmod) {
								if (noExtraArray && noExtraArray.includes(i)) continue;
								if (passiveList[i].multiple) {
									for (let k in psv.passive[i]) dmg = passiveList[i].dmgmod(char, targ, dmg, skill, btl, psv.passive[i][k]) ?? dmg;
								} else
								dmg = passiveList[i].dmgmod(char, targ, dmg, skill, btl, psv.passive[i][k]) ?? dmg;
							}
						}
					}
				}

				if (targ.hp > 0 && targ.custom) {
					for (let i in targ.custom) {
						if (noVarsArray && noVarsArray.includes(i)) continue;

						if (customVariables[i] && customVariables[i].dmgmod) {
							result.txt += '\n' + (customVariables[i].dmgmod(btl, targ, char, dmg, skill, targ.custom[i]) ?? '');
						}
					}
				}

				// Guarding
				if (targ.guard && affinity != 'drain') {
					dmg *= targ.guard;
					delete targ.guard;
				}

				// Shields
				if (targ.custom?.shield) {
					if (!targ.custom.shield.type || targ.custom.shield.type === 'reduce') {
						dmg = Math.round(dmg*1/3);

						if (targ.custom.shield.hp) {
							targ.custom.shield.hp--;
							if (targ.custom.shield.hp <= 0) {
								addAtkMsg(btl, `__${targ.name}__'s __${targ.custom.shield.name}__ has broken!`);
								delete targ.custom.shield;
							}
						} else {
							addAtkMsg(btl, `__${targ.name}__'s __${targ.custom.shield.name}__ has broken!`);
							delete targ.custom.shield;
						}
					}
				}

				// This damage is done!
				damages.push(Math.max(1, Math.round(dmg)));
			}
			
			console.log(crits);
			console.log(affinities);
			console.log(techs);

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

				result.txt += `\n${selectQuote(char, 'badatk', null, "%ENEMY%", targ.name, "%SKILL%", skill.name)}${selectQuote(targ, 'drain', null, "%ENEMY%", char.name, "%SKILL%", skill.name)}`;
			} else {
				result.txt += `__${targ.name}__ took _`
				for (let i in damages) {
					dmgTxt += `**${damages[i]}**`;
					if (affinityEmoji[affinities[i]] && affinities[i].toLowerCase() != 'normal') dmgTxt += affinityEmoji[affinities[i]];
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

				// Keep the last damage i took.
				if (!targ.lastdmg) targ.lastdmg = [];
				targ.lastdmg.unshift(total);

				// Death.
				if (targ.hp <= 0) {
					result.txt += `${dmgTxt} damage and was defeated!_\n${selectQuote(char, 'kill', null, "%ENEMY%", targ.name, "%SKILL%", skill.name)}${selectQuote(targ, 'death', null, "%ENEMY%", char.name, "%SKILL%", skill.name)}`;

					// Endure Leader Skills
					let party = btl.teams[targ.team];
					if (settings?.mechanics?.leaderskills && party?.leaderskill && party.leaderskill.type === 'endure' && !party.leaderskill.disabled) {
						if (party.leaderskill.var1.toLowerCase() == 'all' || skill?.atktype == party.leaderskill.var1.toLowerCase() || (skill.type == party.leaderskill.var1.toLowerCase() || skill.type.includes(party.leaderskill.var1.toLowerCase()))) {
							targ.hp = Math.round(targ.maxhp * party.leaderskill.var2/100)
							party.leaderskill.disabled = true;

							result.txt += `\n...But they endured the attack!_`;
						}
					}

					if (targ.hp <= 0 && doPassives(btl)) {
						for (let i in char.skills) {
							if (!skillFile[char.skills[i]]) continue;
							if (skillFile[char.skills[i]].type != 'passive') continue;

							for (let k in skillFile[char.skills[i]].passive) {
								if (passiveList[k] && passiveList[k].onkill) {
									if (noExtraArray && noExtraArray.includes(i)) continue;
									result.txt += `\n${passiveList[k].onkill(char, targ, skill, total, skillFile[char.skills[i]], btl, skillFile[char.skills[i]].passive[k])}`;
								}
							}
						}
					}
				} else {
					result.txt += `${dmgTxt} damage!_`;
				}

				// Limit Breaks
				if (settings.mechanics.limitbreaks && !skill.limitbreak && !skill.teamcombo) {
					if (!char.lbp) char.lbp = 0;
					char.lbp += truncNum(total/(skill.hits*((skill.target === 'one' || skill.target === 'ally') ? 2 : 8)), 2)
				}

				// Full Combo!
				if (skill.hits && skill.hits > 1) result.txt += ` **(${(totalHits >= skill.hits) ? '__Full Combo!__ ' : (totalHits + ' hits, ')}${total} Total)**`;

				// OnUse
				if (skill.extras) {
					for (let i in skill.extras) {
						if (!extrasList[i]) continue;
						if (!extrasList[i].onuse) continue;
						if (noExtraArray && noExtraArray.includes(i)) continue;

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
						if (noVarsArray && noVarsArray.includes(i)) continue;

						if (customVariables[i] && customVariables[i].onhit) {
							result.txt += '\n' + (customVariables[i].onhit(btl, targ, char, total, targ.custom[i], skill) ?? '');
						}
					}
				}

				if (skill.extras) {
					for (let i in skill.extras) {
						if (!extrasList[i]) continue;
						if (!extrasList[i].ondamage) continue;
						if (noExtraArray && noExtraArray.includes(i)) continue;

						if (extrasList[i].multiple) {
							for (let k in skill.extras[i]) {
								result.txt += '\n' + (extrasList[i].ondamage(char, targ, total, skill, btl, skill.extras[i][k]) ?? '');
							}
						} else {
							result.txt += '\n' + (extrasList[i].ondamage(char, targ, total, skill, btl, skill.extras[i]) ?? '');
						}
					}
				}

				if (doPassives(btl)) {
					for (let i in targ.skills) {
						if (!skillFile[targ.skills[i]]) continue;
						if (skillFile[targ.skills[i]].type != 'passive') continue;

						for (let k in skillFile[targ.skills[i]].passive) {
							if (passiveList[k] && passiveList[k].ondamage) {
								if (noExtraArray && noExtraArray.includes(k)) continue;
								if (passiveList[k].multiple) {
									for (let l in skillFile[targ.skills[i]].passive[k]) {
										result.txt += '\n' + (passiveList[k].ondamage(targ, char, skill, total, skillFile[targ.skills[i]], btl, skillFile[targ.skills[i]].passive[k][l]) ?? '');
									}
								} else {
									result.txt += '\n' + (passiveList[k].ondamage(targ, char, skill, total, skillFile[targ.skills[i]], btl, skillFile[targ.skills[i]].passive[k]) ?? '');
								}
							}
						}
					}
				}

				// Quotes
				let quotetype = affinity;
				if (affinity === 'normal') quotetype = 'hurt';
				if (affinity === 'resist') result.txt += `\n${selectQuote(char, 'badatk', null, "%ENEMY%", targ.name, "%SKILL%", skill.name, "%AFFINITY%", affinity)}`;

				if (targ.hp <= 0) {
					quotetype = 'dead';
					result.txt += `\n${selectQuote(char, 'kill', null, "%ENEMY%", targ.name, "%SKILL%", skill.name)}`;
				} else
					result.txt += `\n${selectQuote(char, 'landed', null, "%ENEMY%", targ.name, "%SKILL%", skill.name)}`;

				result.txt += `\n${selectQuote(targ, quotetype, null, "%ENEMY%", char.name, "%SKILL%", skill.name)}`;

				// Lastly, Status Effects
				if (skill.status && !targ.status) {
					var status;
					if (typeof(skill.status) === 'object') {
						status = skill.status[randNum(skill.status.length-1)];
					} else {
						status = skill.status;
					}

					result.txt += statusList.status.inflictStatus(char, targ, skill, status, btl, skill.pow);
				}

				// OnUseAtEndOfFunc
				if (skill.extras) {
					for (let i in skill.extras) {
						if (!extrasList[i]) continue;
						if (!extrasList[i].onuseatendoffunc) continue;
						if (noExtraArray && noExtraArray.includes(i)) continue;

						if (extrasList[i].multiple) {
							for (let k in skill.extras[i]) {
								result.txt += `\n${(extrasList[i].onuseatendoffunc(char, targ, skill, btl, skill.extras[i][k] ) ?? '')}`;
							}
						} else {
							result.txt += `\n${(extrasList[i].onuseatendoffunc(char, targ, skill, btl, skill.extras[i]) ?? '')}`;
						}
					}
				}
			}
		}
	}

	return result;
}

let trustQuotes = [
	"%PLAYER1%'s feels a rush of power at the sight of %PLAYER2%",
	"%PLAYER1% hopes to show off to %PLAYER2%.",
	"%PLAYER1%'s eyes connect with %PLAYER2%'s.",
];

useSkill = (char, btl, act, forceskill, ally, noExtraArray) => {
	let settings = setUpSettings(btl.guild.id);
	let skill = objClone(forceskill) ?? objClone(skillFile[act.index]);

	// Does this skill exist...?
	if (!skill) {
		let DiscordEmbed = new Discord.MessageEmbed()
			.setColor(elementColors[char.mainElement] ?? elementColors.strike)
			.setTitle(`__${char.name}__ => ???`)
			.setDescription(`${char.name} tried to use a skill ...but nothing happened...?\n_(Something went wrong with the skill. Does it exist?)_`)
		btl.channel.send({embeds: [DiscordEmbed]});

		// return true or something
		fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, JSON.stringify(btl, null, '    '));
		return;
	}

	// Enemies should learn the skills we use.
	for (let i in btl.teams) {
		for (let k in btl.teams[i].members) {
			if (char.id != btl.teams[i].members[k].id) recogniseSkill(btl.teams[i].members[k], char, skill);
		}
	}

	// Hardcode some metronome and copyskill bs
	if (skill.extras?.metronome) {
		let possible = [];
		if (skill.extras.metronome.length > 1)
			possible = skill.extras.metronome;
		else {
			for (let i in skillFile) {
				if (skillFile[i].type != 'passive') {
					possible.push(i)
				}
			}
		}

		// Get the skill in question.
		let skillname = possible[randNum(0, possible.length-1)];

		// Get Metronome's cost.
		let cost = [skill.cost, skill.costtype];
		skill = objClone(skillFile[skillname]);
		skill.cost = cost[0];
		skill.costtype = cost[1];
	}

	if (skill.extras?.copyskill) {
		let possible = [];

		// We can only use ally skills.
		let vars = ['members', 'backup'];
		for (let k of vars) {
			for (let char2 of btl.teams[char.team][k]) {
				for (let i of char2.skills) {
					if (skillFile[i].type != 'passive') {
						possible.push(i);
					}
				}
			}
		}

		// Get the skill in question.
		let skillname = possible[randNum(possible.length-1)];

		// Get CopySkill's cost.
		let cost = [skill.cost, skill.costtype];

		skill = objClone(skillFile[skillname]);
		skill.cost = cost[0];
		skill.costtype = cost[1];

		// Make sure CopySkill doesn't cuck us over
		if (skill.type === 'heal' && (skill.target === 'ally' || skill.target === 'one') && act.target[0] != char.team) skill.target = 'caster';
	}

	// First, we modify stats via passives n shit. This isn't the actual character anyway so we don't care.
	if (skill.type === 'heal' || skill.type === 'status') skill.pow = 1; //this is to make sure healing and status skills can be modified by passives

	// Failsafe
	if (!skill.hits) skill.hits = 1;

	// Main Elements
	let mainElementRate = settings?.rates?.mainelement ?? 1.2;
	if (char.transformed) mainElementRate+0.2;

	if (isMainElement(skill, char)) skill.pow *= mainElementRate;

	// Passives
	if (doPassives(btl)) {
		for (let skillName of char.skills) {
			if (!skillFile[skillName]) continue;

			let psv = skillFile[skillName];
			if (psv.type != 'passive' || !psv.passive) continue;

			for (let i in psv.passive) {
				if (passiveList[i] && passiveList[i].statmod) {
					if (noExtraArray && noExtraArray.includes(i)) continue;
					if (passiveList[i].multiple) {
						for (let k in psv.passive[i]) passiveList[i].statmod(btl, char, skill, psv.passive[i][k]);
					} else
						passiveList[i].statmod(btl, char, skill, psv.passive[i]);
				}
			}
		}
	}

	// Attack Extras
	if (skill.extras) {
		for (let i in skill.extras) {
			if (extrasList[i] && extrasList[i].statmod) {
				if (noExtraArray && noExtraArray.includes(i)) continue;
				if (extrasList[i].multiple) {
					for (let k in skill.extras[i]) extrasList[i].statmod(char, skill, skill.extras[i][k], btl)
				} else
					extrasList[i].statmod(char, skill, skill.extras[i], btl)
			}
		}
	}

	// Attack Extras
	if (char.custom) {
		for (let i in char.custom) {
			if (noExtraArray && noExtraArray.includes(i)) continue;

			if (customVariables[i] && customVariables[i].statmod) {
				customVariables[i].statmod(btl, char, skill, char.custom[i]);
			}
		}
	}

	// Status Effects
	if (char.status && statusEffectFuncs[char.status] && statusEffectFuncs[char.status].skillmod) {
		statusEffectFuncs[char.status].skillmod(char, char.stats, btl);
	}

	// Weather
	if (btl.weather && weatherFuncs && weatherFuncs[btl.weather.type] && weatherFuncs[btl.weather.type].onselect) {
		weatherFuncs[btl.weather.type].onselect(char, skill, btl)
	}

	// Terrain
	if (btl.terrain && terrainFuncs && terrainFuncs[btl.terrain.type] && terrainFuncs[btl.terrain.type].onselect) {
		terrainFuncs[btl.terrain.type].onselect(char, skill, btl)
	}

	// more shit
	let skillCost = skill.cost ?? 0;

	// (easy access)
	let party = btl.teams[char.team];
	if (skillCost > 0 && !skill.forcefree) {
		if (settings?.mechanics?.leaderskills && skill?.cost && party?.leaderskill && party.leaderskill.type === 'discount') {
			if (party.leaderskill.var1.toLowerCase() == 'all' || skill?.atktype == party.leaderskill.var1.toLowerCase() || (skill.type == party.leaderskill.var1.toLowerCase() || skill.type.includes(party.leaderskill.var1.toLowerCase()))) {
				skillCost -= Math.floor(skillCost * (party.leaderskill.var2 / 100));
			}
		}
	}

	// Charms
	if (char.charms) {
		if (char.charms.includes("ShamanStone") && skill.atktype === 'magic') {
			skill.pow *= 1.5;
			skillCost *= 1.5;
		}

		if (char.charms.includes("GrubberflysElegy") && skill.atktype != 'physical') skill.acc *= 1.5;

		if ((char.charms.includes("FragileStrength") || char.charms.includes("UnbreakableStrength")) && skill.atktype === 'physical') {
			skill.pow *= 1.65;
			skillCost *= 1.1;
		}

		if (char.charms.includes("DeepFocus") && typeof(skill.type) === 'string' && skill.type === 'heal') {
			skill.pow *= 1.25;
			skillCost *= 1.15;
		}

		if (char.charms.includes("QuickFocus") && typeof(skill.type) === 'string' && skill.type === 'heal') {
			skill.pow *= 1.25;
			skillCost *= 0.75;
		}
	}

	// Boost Rate Leader Skills
	if (settings?.mechanics?.leaderskills && party?.leaderskill && party.leaderskill.type === 'boost') {
		if (party.leaderskill.var1.toLowerCase() == 'all' || skill?.atktype == party.leaderskill.var1.toLowerCase() || (skill.type == party.leaderskill.var1.toLowerCase() || skill.type.includes(party.leaderskill.var1.toLowerCase()))) {
			skill.pow += skill.pow * (party.leaderskill.var2 / 100);
		}
	}
	
	// Double melee power when inflicted with rage.
	if (skill.melee && char.status && char.status === 'rage') skill.pow *= 2;

	// Final Text
	let quotetype = 'phys';
	if (skill.atktype === 'magic') quotetype = 'mag';
	if (skill.type === 'heal') quotetype = 'heal';
	if (skill.limitbreak) quotetype = 'lb';
	if (skill.teamcombo) quotetype = 'tc';
	let finalText = `${selectQuote(char, quotetype, null, "%SKILL%", skill.name, "%ATKTYPE%", skill.atktype, "%ELEMENT%", skill.type)}`;
	if (ally && ally.quotes) {
		finalText = `${selectQuote(char, quotetype, null, "%SKILL%", skill.name, "%ATKTYPE%", skill.atktype, "%ELEMENT%", skill.type)}${selectQuote(ally, quotetype, null, "%SKILL%", skill.name, "%ATKTYPE%", skill.atktype, "%ELEMENT%", skill.type)}`;
	}

	// Trust
	for (let i in party.members) {
		let friennn = party.members[i];
		if (char.id === friennn.id) continue;

		if (trustLevel(char, friennn) >= 6 && randNum(1, 100) <= 7) {
			let a = trustQuotes[randNum(trustQuotes.length-1)];
			a = replaceTxt(a, '%PLAYER1%', char.name, '%PLAYER2%', friennn.name);

			finalText += `\n_${a}_\n`;

			skill.pow *= 1.5+(trustLevel(char, friennn)/40)
		}
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
	switch(skill.target ? skill.target.toLowerCase() : 'one') {
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

		// Target ourselves as a failsafe.
		default:
			targets.push([char.id, 1]);
	}

	let targTxt = `__${char.name}__ => `;
	
	if (skill.limitbreak) {
		finalText += `__${char.name}__ struck with their **strongest skill**!\n_**__${skill.name}__**!_\n\n`;
	} else if (skill.teamcombo) {
		finalText += `__${char.name}__ ${ally ? ("and __" + ally.name + "__") : ""} struck with a powerful skill: **__${skill.name}__**!\n\n`;
	} else {
		finalText += `__${char.name}__ used __${skill.name}__!\n\n`;
	}

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
			if (healList[i] && healList[i].override) {
				if (noExtraArray && noExtraArray.includes(i)) continue;
				if (healList[i].multiple) {
					for (let k in skill.heal[i]) {
						finalText += healList[i].override(char, skill, btl, skill.heal[i][k]);
					}
				} else {
					finalText += healList[i].override(char, skill, btl, skill.heal[i]);
				}

				// Take away the cost
				useCost(char, Math.round(skillCost), skill.costtype);

				// Now, send the embed!
				let DiscordEmbed = new Discord.MessageEmbed()
					.setColor(elementColors[char.mainElement] ?? elementColors.strike)
					.setTitle(targTxt)
					.setDescription(finalText.replace(/\n{3,}/g, () => "\n\n"))
				return btl.channel.send({embeds: [DiscordEmbed]});
			}
		}
	}

	for (let i in targets) {
		let targ = getCharFromId(targets[i][0], btl);
		let skillDefs = objClone(skill);
		skillDefs.pow *= targets[i][1];

		let result = attackWithSkill(char, targ, skillDefs, btl, noExtraArray);
		finalText += `${result.txt}`;

		if (result.oneMore) btl.doonemore = true;
		if (result.teamCombo) btl.canteamcombo = true;
	}

	// OnSelect
	let selectcheck = {
		extras: extrasList,
		statusses: statusList,
		heal: healList
	}

	for (let j in selectcheck) {
		if (skill[j]) {
			for (let i in skill[j]) {
				if (!selectcheck[j][i]) continue;
				if (!selectcheck[j][i].onselect) continue;
				if (noExtraArray && noExtraArray.includes(i)) continue;

				if (selectcheck[j][i].multiple) {
					for (let k in skill[j][i]) finalText += `\n${(selectcheck[j][i].onselect(char, skill, btl, skill[j][i][k], skill.pow) ?? '')}`;
				} else {
					finalText += `\n${(selectcheck[j][i].onselect(char, skill, btl, skill[j][i], skill.pow) ?? '')}`;
				}
			}
		}
	}

	// Take away the cost
	if (skillCost && !skill.forcefree) useCost(char, Math.round(skillCost), skill.costtype);

	// Do we have any final messages
	if (btl.atkmsg) {
		finalText += `\n${btl.atkmsg}`;
		delete btl.atkmsg;
	}

	// Another thing... Trust shit.
	if (!skill.noassistance && (skill.target === 'one' || skill.target === 'allopposing') && targets.length <= 1 && !skill.limitbreak && !skill.teamcombo) {
		for (let i in party.members) {
			let char2 = party.members[i];
			if (char.id === char2.id) continue;

			if ((trustLevel(char, char2) > trustLvl.meleeatk) && (randNum(1, 100) <= 20*(trustLevel(char, char2)/5))) {
				let targ = getCharFromId(targets[0][0], btl);

				if (targ.hp > 0) {
					let atkType = 'physical'
					let targType = 'one'
					for (let skillName of char2.skills) {
						let psv = skillFile[skillName];
						if (psv.type != 'passive' || !psv.passive) continue;

						if (psv.passive.magicmelee) atkType = 'magic';
						if (psv.passive.meleetarget) targType = psv.passive.meleetarget[0][randNum(0, psv.passive.meleetarget[0].length - 1)];
					}

					let meleeAtk = {
						name: char2.melee.name,
						type: char2.melee.type,
						pow: char2.melee.pow*2.5,
						acc: 100,
						crit: char2.melee.crit,
						atktype: atkType,
						target: targType,
						melee: true,
						noassistance: true
					}

					if (char2.melee.status) {
						meleeAtk.status = char2.melee.status;
						meleeAtk.statuschance = char2.melee.statuschance;
					}

					finalText += `\n${char2.name} wants to assist in attacking!\n`;
					console.log(meleeAtk);
					let result = attackWithSkill(char2, targ, meleeAtk, btl, true, noExtraArray);
					finalText += `${result.txt}\n`;
					if (result.teamCombo) btl.canteamcombo = true;
				}
			}
		}
	}

	// Now, send the embed!
	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(elementColors[char.mainElement] ?? elementColors.strike)
		.setTitle(targTxt)
		.setDescription(finalText.replace(/\n{3,}/g, () => "\n\n"))
	btl.channel.send({embeds: [DiscordEmbed]});

	// return true or something
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, JSON.stringify(btl, null, '    '));
}