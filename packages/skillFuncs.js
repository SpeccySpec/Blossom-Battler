function buffText(buffArray) {
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
				if (i == 0) finalText += `Buffs `
				else finalText += ` buffs `
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
			finalText += ` by **${curBuff[2]}** stage${Math.abs(curBuff[2]) <= 1 ? '' : 's'}`

			if (i < buffArray.filter(x => x[3] == curBuff[3]).length - 2) {
				finalText += `, `
			} else if (i == buffArray.filter(x => x[3] == curBuff[3]).length - 2) {
				finalText += ` and `
			} else {
				finalText += `.\n`
			}
		}

		oldBuff = curBuff
	}

	return finalText
}





function statusDesc(skillDefs) {
	var finalText = '';
	
	if (hasStatus(skillDefs, 'buff')) {
		finalText += buffText(skillDefs.statusses.buff)
	}
	
	if (hasStatus(skillDefs, 'weather') || hasStatus(skillDefs, 'terrain')) {
		finalText += `Changes`;

		if (hasStatus(skillDefs, 'weather')) {
			finalText += ` **Weather** to ${skillDefs.statusses.weather[0]}`;
		}

		if (hasStatus(skillDefs, 'terrain')) {
			if (hasStatus(skillDefs, 'weather')) finalText += ` and`;
			
			finalText += ` **Terrain** to ${skillDefs.statusses.terrain[0]}`;
		}
		finalText += `.\n`;
	}

	if (hasStatus(skillDefs, 'reincarnate')) {
		finalText += `Summons **an undead ally**.\n` 
	}

	if (hasStatus(skillDefs, 'mimic')) {
		finalText += `Mimics **an ally or foe** for **${skillDefs.statusses.mimic[0]}** turns.\n`
	}

	if (hasStatus(skillDefs, 'clone')) {
		finalText += `Clones **the user**.\n`
	}

	if (hasStatus(skillDefs, 'karn') || hasStatus(skillDefs, 'shield')) {
		finalText += `Surrounds the target with`;

		if (hasStatus(skillDefs, 'karn')) {
			for (let i in skillDefs.statusses.karn) {
				finalText += ` **${skillDefs.statusses.karn[i] == 'phys' ? 'Tetra' : 'Makara'}karn**`;

				if (i < skillDefs.statusses.karn.length - 2) finalText += `, `;

				if (i == skillDefs.statusses.karn.length - 2 && !hasStatus(skillDefs, 'shield')) finalText += ` and `;
			}
		}
		if (hasStatus(skillDefs, 'shield')) {
			if (hasStatus(skillDefs, 'karn')) finalText += ` and `;
			finalText += ` a **shield named ${elementEmoji[skillDefs.statusses.shield[1]]}${skillDefs.statusses.shield[0]}**`;
		}
		finalText += `.\n`;
	}

	if (hasStatus(skillDefs, 'trap')) {
		finalText += `Sets up a **trap**.\n`
	}

	if (hasStatus(skillDefs, 'changeaffinity')) {
		let targetAffinities = skillDefs.statusses.changeaffinity.filter(x => x.includes('target'))
		let userAffinities = skillDefs.statusses.changeaffinity.filter(x => x.includes('user'))

		let affinityScore = {
			superweak: 0, 
			weak: 1, 
			normal: 2, 
			resist: 3, 
			block: 4, 
			repel: 5, 
			drain: 6
		}

		let sideScore = {
			weak: 0, 
			both: 1, 
			resist: 2
		}

		finalText += `Changes affinities of`

		let affinity = ''

		let oldAffinitySide = ''
		let affinitySide = ''

		if (targetAffinities.length > 0) {
			finalText += ` **the target** to:\n`

			targetAffinities.sort(function(a, b) {
				return (affinityScore[a[2]]*10 + sideScore[a[3]]) - (affinityScore[b[2]]*10 + sideScore[b[3]]);
			})

			for (let i in targetAffinities) {
				if (affinity != targetAffinities[i][2]) {
					if (affinity != '' && affinity != targetAffinities[i][2]) finalText += `\n`
					affinity = targetAffinities[i][2]
					finalText += `${affinityEmoji[targetAffinities[i][2]]}: `
				}
				affinitySide = targetAffinities[i][3]
				if (oldAffinitySide == '') {
					oldAffinitySide = affinitySide
				}
				
				finalText += `${elementEmoji[targetAffinities[i][1]]}`

				if (oldAffinitySide != affinitySide || i == targetAffinities.length - 1) {
					finalText += ` ${affinityEmoji[oldAffinitySide] ? `from ${affinityEmoji[oldAffinitySide]} side` : 'in general'}`

					if (i < targetAffinities.length - 1) {
						finalText += `, `
					}
				}

				oldAffinitySide = affinitySide
			}
		}

		affinity = ''
		oldAffinitySide = ''
		affinitySide = ''

		if (userAffinities.length > 0) {
			if (targetAffinities.length > 0) {
				finalText += `\nand affinities of **the user** to:\n`
			} else {
				finalText += ` **the user** to:\n`
			}

			userAffinities.sort(function(a, b) {
				return (affinityScore[a[2]]*10 + sideScore[a[3]]) - (affinityScore[b[2]]*10 + sideScore[b[3]]);
			})

			for (let i in userAffinities) {
				if (affinity != userAffinities[i][2]) {
					if (affinity != '' && affinity != userAffinities[i][2]) finalText += `\n`
					affinity = userAffinities[i][2]
					finalText += `${affinityEmoji[userAffinities[i][2]]}: `
				}

				affinitySide = userAffinities[i][3]
				if (oldAffinitySide == '') {
					oldAffinitySide = affinitySide
				}
				
				finalText += `${elementEmoji[userAffinities[i][1]]}`

				if (oldAffinitySide != affinitySide || i == userAffinities.length - 1) {
					finalText += ` ${affinityEmoji[oldAffinitySide] ? `from ${affinityEmoji[oldAffinitySide]} side` : 'in general'}`

					if (i < userAffinities.length - 1) {
						finalText += `, `
					}
				}

				oldAffinitySide = affinitySide
			}
		}

		finalText += `\n`
	}

	if (hasStatus(skillDefs, 'futuresight')) {
		finalText += `Strieks with a **${skillDefs.statusses.futuresight[0].type}** attack in **${skillDefs.statusses.futuresight[0].turns}** turns.\n`
	}

	if (hasStatus(skillDefs, 'analyze') || hasStatus(skillDefs, 'fullanalyse')) {
		if (hasStatus(skillDefs, 'fullanalyze')) finalText += `Fully Analyzes`
		else finalText += `Analyzes`
		finalText += ` the target.\n`
	}

	if (hasStatus(skillDefs, 'shieldbreak')) {
		finalText += `Breaks the target's **${skillDefs.statusses.shieldbreak[0].charAt(0).toUpperCase() + skillDefs.statusses.shieldbreak[0].slice(1)}${skillDefs.statusses.shieldbreak[0].includes('ra') ? 'karn' : ''}**.\n`
	}

	if (hasStatus(skillDefs, 'dekunda')) {
		finalText += `Removes buffs of the target.\n`
	}

	if (hasStatus(skillDefs, 'heartswap')) {
		finalText += `Swaps user's **stat chances** with the target's.\n`
	}

	if (hasStatus(skillDefs, 'pacifystatus')) {
		finalText += `Pacifies the target with `

		for (let i in skillDefs.statusses.pacifystatus) {
			finalText += `${statusEmojis[skillDefs.statusses.pacifystatus[0]]}**${skillDefs.statusses.pacifystatus[0]}**${skillDefs.statusses.pacifystatus[1] >= 100 ? '' : ` by ${skillDefs.statusses.pacifystatus[1]}%`}`

			if (i < skillDefs.statusses.pacifystatus.length - 2) {
				finalText += `, `
			} else if (i == skillDefs.statusses.pacifystatus.length - 2) {
				finalText += ` and `
			} else {
				finalText += `.\n`
			}
		}
	}

	if (hasStatus(skillDefs, 'batonpass')) {
		finalText += `Switch out user **with someone in backup**.\n`
	}

	if (hasStatus(skillDefs, 'charge')) {
		finalText += 'Boosts'
		
		for (let i in skillDefs.statusses.charge) {
			finalText += ` **${skillDefs.statusses.charge[i][0]}** damage by ${skillDefs.statusses.charge[i][1]}x`

			if (i < skillDefs.statusses.charge.length - 1) {
				finalText += ` and `
			} else {
				finalText += ` for one turn.\n`
			}
		}
	}

	if (hasStatus(skillDefs, 'orgiamode')) {
		finalText += `Modifies user's ATK and MAG by **${skillDefs.statusses.orgiamode[0]}**x and END by **${skillDefs.statusses.orgiamode[1]}**x for **${skillDefs.statusses.orgiamode[2]}** turns. Falls asleep afterwards.\n`
	}

	if (hasStatus(skillDefs, 'chaosstir')) {
		finalText += `Attack back when hit, with a **${skillDefs.statusses.chaosstir[1]}%** accuracy attack with **${skillDefs.statusses.chaosstir[0]}x** power.\n`
	}
	return finalText;
}

function passiveDesc(skillDefs) {
	var finalText = `Passive Type: **${Object.keys(skillDefs.passive).join(', ')}**\n`;
	return finalText;
}

function atkDesc(skillDefs, settings) {
	var finalText = '';

	if (hasExtra(skillDefs, 'metronome')) {
		finalText += 'Uses a **randomly defined skill**.\n';
	} else if (hasExtra(skillDefs, 'copyskill')) {
		finalText += `Copies a **random skill of user's team**.\n`;
	} else {
		if (hasExtra(skillDefs, 'affinitypow'))
			finalText += `Affected by **<:passive:906874477210648576>SpiritCharge** or **<:passive:906874477210648576>Teamwork**, by **${skillDefs.extras.affinitypow[0]} power**.\n`;

		if (hasExtra(skillDefs, 'need')) {
			let extraSom = ''
			finalText += `Needs`

			let needThing = skillDefs.extras.need.sort((a, b) => {
				return ((a[0] == 'less' ? 10 : 20) + (a[1] == true ? 2 : 1)) - ((b[0] == 'less' ? 10 : 20) + (b[1] == true ? 2 : 1))
			})

			let curTxt = ''
			let oldTxt = ''
			let lastIndex = 0

			for (i in needThing) {
				curTxt = ` **${needThing[i][0]} ${needThing[i][1] ? 'or equal to' : 'than'}** `

				if (curTxt != oldTxt) {
					finalText += curTxt
					lastIndex = i
				}

				switch (needThing[i][3]) {
					case 'mp':
						extraSom = ' MP';
						break;
					case 'lb':
						if (settings.mechanics.limitbreaks) extraSom = '% LB';
						else extraSom = '% of the user\'s Max MP';
						break;
					case 'money':
						extraSom = ` of Team's Money`;
						break;
					case 'hppercent':
						extraSom = '% of the user\'s Max HP';
						break;
					case 'mppercent':
						extraSom = '% of the user\'s Max MP';
						break;
					case 'moneypercent':
						extraSom = '% of the user Team\'s Money';
						break;
					default:
						extraSom = ' HP';
						break;
				}

				finalText += `**${needThing[i][2]}${extraSom}**`;

				oldTxt = curTxt

				if (needThing.length > 1) {
					if ((i - lastIndex) < needThing.filter(x => x[0] == needThing[i][0]).length - 2) {
						finalText += `, `
					} else if ((i - lastIndex) == needThing.filter(x => x[0] == needThing[i][0]).length - 2) {
						finalText += ` and `
					} else {
						if (i < needThing.length - 2) {
							finalText += `, `
						} else if (i == needThing.length - 2) {
							finalText += ` and `
						}
					}
				}
			}
			
			finalText += ` to use.\n`;
		}

		if (hasExtra(skillDefs, 'sacrifice'))
			finalText += `${skillDefs.extras.sacrifice[0] <= 0 ? `**Sacrifices the user**` : `Leaves the user's health at **${skillDefs.extras.sacrifice[0]}**`}.\n`;

		if (hasExtra(skillDefs, 'stealmp'))
			finalText += `Steals MP from the target instead of dealing damage.\n`;

		if (hasExtra(skillDefs, 'takemp'))
			finalText += `Takes **${skillDefs.extras.takemp[0]} MP** from the target.\n`;

		if (hasExtra(skillDefs, 'drain'))
			finalText += `Drains **1/${skillDefs.extras.drain[0]} of damage dealt**.\n`;

		if (hasExtra(skillDefs, 'steal'))
			finalText += `Has a **${skillDefs.extras.steal[0]}%** chance of stealing **${skillDefs.extras.steal[1]}** of the target team's items.\n`;

		if (hasExtra(skillDefs, 'buff')) {
			finalText += buffText(skillDefs.extras.buff)
		}

		if (hasExtra(skillDefs, 'powerbuff')) {
			let powerbuffs = {}
			for (let i in skillDefs.extras.powerbuff) {
				for (let j in skillDefs.extras.powerbuff[i]) {
					if (j % 2 == 0) {
						if (!powerbuffs[skillDefs.extras.powerbuff[i][j]]) powerbuffs[skillDefs.extras.powerbuff[i][j]] = 0;
					} else {
						powerbuffs[skillDefs.extras.powerbuff[i][j-1]] += skillDefs.extras.powerbuff[i][j];
					}
				}
			}
			finalText += `Increases in power with`
			for (let i in powerbuffs) {
				finalText += ` **${i.toUpperCase()}** buffs`;

				let sameValue = 0;
				for (let j in powerbuffs) {
					if (i == j) continue
					if (powerbuffs[i] == powerbuffs[j]) sameValue++;
				}
				if (sameValue == 0) finalText += ` up to **${powerbuffs[i]}%**`;

				if (sameValue != 0) {
					if (sameValue == 1) finalText += ` and`;
					else finalText += `,`;
				} else {
					if (i < Object.keys(powerbuffs).length - 2) finalText += `,`;
					else if (i == Object.keys(powerbuffs).length - 2) finalText += ` and`;
					else finalText += `.`;
				}
			}
			finalText += `\n`;
		}

		if (hasExtra(skillDefs, 'healverse') || hasExtra(skillDefs, 'powerverse') || hasExtra(skillDefs, 'spreadverse')) {
			finalText += `Surrounds the target with a `;
			if (hasExtra(skillDefs, 'healverse')) {
				finalText += `**healing aura** for **${skillDefs.extras.healverse[1]}** turns`;
			}
			if (hasExtra(skillDefs, 'powerverse')) {
				if (hasExtra(skillDefs, 'healverse') && !hasExtra(skillDefs, 'powerverse')) finalText += ` and a`;
				else if (hasExtra(skillDefs, 'healverse') && hasExtra(skillDefs, 'powerverse')) finalText += `, a`;

				finalText += ` **power aura** for **${skillDefs.extras.powerverse[1]}** turns`;
			}
			if (hasExtra(skillDefs, 'spreadverse')) {
				if (hasExtra(skillDefs, 'healverse') || hasExtra(skillDefs, 'powerverse')) finalText += ` and a`;

				finalText += ` **spread aura** for **${skillDefs.extras.spreadverse[1]}** turns`;
			}
			finalText += `.\n`;
		}

		if (hasExtra(skillDefs, 'lonewolf'))
			finalText += `Power is multiplied by ${skillDefs.extras.lonewolf[0]}x if **the user is alone or the last one standing**.\n`;

		if (hasExtra(skillDefs, 'heavenwrath'))
			finalText += `Power is multiplied by ${skillDefs.extras.heavenwrath[0]}x if **not alone, and all allies are not down**.\n`;

		if (hasExtra(skillDefs, 'rest'))
			finalText += `User **must recharge for a turn**.\n`;

		if (hasExtra(skillDefs, 'feint'))
			finalText += `**Bypasses shielding skills**.\n`;

		if (hasExtra(skillDefs, 'statcalc'))
			finalText += `Uses user's **${skillDefs.extras.statcalc[0].toString().toUpperCase()}** for measuring damage.\n`;

		if (hasExtra(skillDefs, 'hpcalc') || hasExtra(skillDefs, 'mpcalc')) {
			finalText += `Damage boosted or nerfed with`

			if (hasExtra(skillDefs, 'hpcalc')) {
				finalText += ` user's **current HP** up to **${skillDefs.extras.hpcalc[0]}%**`
			}

			if (hasExtra(skillDefs, 'mpcalc')) {
				if (hasExtra(skillDefs, 'hpcalc')) finalText += ` and from`

				finalText += ` user's **current MP** up to **${skillDefs.extras.mpcalc[0]}%**`
			}
			finalText += `.\n`;
		}

		if (hasExtra(skillDefs, 'forcetech')) {
			let techs = []
			for (let i in skillDefs.extras.forcetech) {
				techs.push(skillDefs.extras.forcetech[i])
			}

			techs.sort(function(a, b) {
				return b - a;
			})
			techset = new Set(techs)
			techs = Array.from(techset)
			techs.filter((value) => value != null)

			finalText += `Forces techs from **${techs.join(', ')}**.\n`;
		}

		if (hasExtra(skillDefs, 'forceformula')) {
			finalText += `Forces to use the **${skillDefs.extras.forceformula[0].charAt(0).toUpperCase() + skillDefs.extras.forceformula[0].slice(1)}**${skillDefs.extras.forceformula[0] == 'custom' ? `\`${skillDefs.extras.forceformula[1]}\`` : ''} formula.\n`;
		}

		if (hasExtra(skillDefs, 'multihit')) {
			finalText += `Has a **${skillDefs.extras.multihit[0]}%** chance to add **${skillDefs.extras.multihit[1]}** extra hit(s) to the skill.\n`;
		}

		if (hasExtra(skillDefs, 'rollout')) {
			finalText += `Forced to repeat, boosting power by **${skillDefs.extras.rollout[0]}%** until **${skillDefs.extras.rollout[1]}x** pow is reached or for **${skillDefs.extras.rollout[2]}** turns.\n`;
		}

		if (hasExtra(skillDefs, 'changeaffinity')) {
			let targetAffinities = skillDefs.extras.changeaffinity.filter(x => x.includes('target'))
			let userAffinities = skillDefs.extras.changeaffinity.filter(x => x.includes('user'))

			let affinityScore = {
				superweak: 0, 
				weak: 1, 
				normal: 2, 
				resist: 3, 
				block: 4, 
				repel: 5, 
				drain: 6
			}

			let sideScore = {
				weak: 0, 
				both: 1, 
				resist: 2
			}

			finalText += `Changes affinities of`

			let affinity = ''

			let oldAffinitySide = ''
			let affinitySide = ''

			if (targetAffinities.length > 0) {
				finalText += ` **the target** to:\n`

				targetAffinities.sort(function(a, b) {
					return (affinityScore[a[2]]*10 + sideScore[a[3]]) - (affinityScore[b[2]]*10 + sideScore[b[3]]);
				})

				for (let i in targetAffinities) {
					if (affinity != targetAffinities[i][2]) {
						if (affinity != '' && affinity != targetAffinities[i][2]) finalText += `\n`
						affinity = targetAffinities[i][2]
						finalText += `${affinityEmoji[targetAffinities[i][2]]}: `
					}
					affinitySide = targetAffinities[i][3]
					if (oldAffinitySide == '') {
						oldAffinitySide = affinitySide
					}
					
					finalText += `${elementEmoji[targetAffinities[i][1]]}`

					if (oldAffinitySide != affinitySide || i == targetAffinities.length - 1) {
						finalText += ` ${affinityEmoji[oldAffinitySide] ? `from ${affinityEmoji[oldAffinitySide]} side` : 'in general'}`

						if (i < targetAffinities.length - 1) {
							finalText += `, `
						}
					}

					oldAffinitySide = affinitySide
				}
			}

			affinity = ''
			oldAffinitySide = ''
			affinitySide = ''

			if (userAffinities.length > 0) {
				if (targetAffinities.length > 0) {
					finalText += `\nand affinities of **the user** to:\n`
				} else {
					finalText += ` **the user** to:\n`
				}

				userAffinities.sort(function(a, b) {
					return (affinityScore[a[2]]*10 + sideScore[a[3]]) - (affinityScore[b[2]]*10 + sideScore[b[3]]);
				})

				for (let i in userAffinities) {
					if (affinity != userAffinities[i][2]) {
						if (affinity != '' && affinity != userAffinities[i][2]) finalText += `\n`
						affinity = userAffinities[i][2]
						finalText += `${affinityEmoji[userAffinities[i][2]]}: `
					}

					affinitySide = userAffinities[i][3]
					if (oldAffinitySide == '') {
						oldAffinitySide = affinitySide
					}
					
					finalText += `${elementEmoji[userAffinities[i][1]]}`

					if (oldAffinitySide != affinitySide || i == userAffinities.length - 1) {
						finalText += ` ${affinityEmoji[oldAffinitySide] ? `from ${affinityEmoji[oldAffinitySide]} side` : 'in general'}`

						if (i < userAffinities.length - 1) {
							finalText += `, `
						}
					}

					oldAffinitySide = affinitySide
				}
			}

			finalText += `\n`
		}

		if (hasExtra(skillDefs, 'sustain') || hasExtra(skillDefs, 'reverse') || hasExtra(skillDefs, 'powhit') ) {
			finalText += `\n**Multi-hit Properties:**\n`;

			if (hasExtra(skillDefs, 'sustain')) {
				finalText += `- Does not decrease in power with hits.\n`;
			}
			if (hasExtra(skillDefs, 'reverse')) {
				finalText += `- Gains in power with hits.\n`;
			}
			if (hasExtra(skillDefs, 'powhit')) {
				let powhits = []
				for (let i in skillDefs.extras.powhit) {
					for (let j in skillDefs.extras.powhit[i]) {
						powhits.push(skillDefs.extras.powhit[i][j])
					}
				}
				powSet = new Set(powhits)
				powhits = Array.from(powSet)
				powhits.sort(function(a, b) {
					return b[0] - a[0];
				})
				for (let i in powhits) {
					if (typeof powhits[i] == 'object' || powhits[i] == null) powhits[i] = ''
				}
				powhits = powhits.filter((x) => x != '')

				finalText += `- ${powhits.length > 1 ? 'Hits' : 'Hit'} **${powhits.join(', ')}** increase${powhits.length > 1 ? '' : 's'} in power.\n`;
			}
		}
	}
	
	return finalText;
}

skillDesc = (skillDefs, skillName, server) => {
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
	
	
	let settings = setUpSettings(server);
	var finalText = ``;
	if (skillDefs.type != "status" && skillDefs.type != "passive") {
		if (hasExtra(skillDefs, 'ohko') && skillDefs.type != "heal")
			finalText += `Defeats the target ${skillDefs.extras.ohko[1] && skillDefs.extras.ohko[1] != null ? `inflicted with ${statusEmojis[skillDefs.extras.ohko[1]]}${skillDefs.extras.ohko[1]}` : ''} in **one shot**!`;
		else {
			if (skillDefs.type === 'heal') {
				if (hasHealType(skillDefs, 'fullheal')) finalText += '**Fully heals**\n';

				if (hasHealType(skillDefs, 'default')) finalText += `Heals **around ${skillDefs.heal.default[0]} HP**\n`;
				if (hasHealType(skillDefs, 'healmp')) finalText += `Heals **around ${skillDefs.heal.healmp[0]} MP**\n`;

				if (hasHealType(skillDefs, 'regenerate')) finalText += `Regenerates **around ${skillDefs.heal.regenerate[0]} HP** for **${skillDefs.heal.regenerate[1]} turns**\n`;
				if (hasHealType(skillDefs, 'invigorate')) finalText += `Regenerates **around ${skillDefs.heal.invigorate[0]} MP** for **${skillDefs.heal.invigorate[1]} turns**\n`;

				if (hasHealType(skillDefs, 'revive')) finalText += `**Revives** the target to 1/${skillDefs.heal.revive[0]} of their max HP\n`;

				if (hasHealType(skillDefs, 'statusheal')) {
					finalText += `Cures **`

					for (let i in skillDefs.heal.statusheal) {
						finalText += `${statusEmojis[skillDefs.heal.statusheal[i]] ?? ''}${skillDefs.heal.statusheal[i]}`

						if (i < skillDefs.heal.statusheal.length - 1)
							finalText += `, `
					}

					finalText += ` ailments**.\n`;
				}
				
				if (hasHealType(skillDefs, 'sacrifice')) finalText += `${skillDefs.heal.sacrifice[0] > 0 ? `**Leaves the user's health at ${skillDefs.heal.sacrifice[0]}**` : '**Sacrifices the user**'}\n`;
				
				if (hasHealType(skillDefs, 'wish')) finalText += `Heals after **${skillDefs.heal.wish[0]} turns**\n`;

				finalText = finalText.slice(0, -1);
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

	if (skillDefs.type === 'status') {
		finalText += statusDesc(skillDefs)
	} else if (skillDefs.type === 'passive') {
		finalText += passiveDesc(skillDefs)
	} else if (skillDefs.type != 'passive') {
		finalText += atkDesc(skillDefs, settings)
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
		if (foundEnemy(i, server)) {
			for (const k in enmFile[server][i].skills) {
				if (enmFile[server][i].skills[k] == skillName) {
					if (knownBy != "") knownBy += ", ";
					knownBy += `${i}`
				}
			}
		}
	}

	if (knownBy != "") DiscordEmbed.fields.push({name: 'Known By:', value: knownBy, inline: false})

	DiscordEmbed.setDescription(finalText ?? 'Invalid Description :(')
	return DiscordEmbed;
}

module.exports = {skillDesc}