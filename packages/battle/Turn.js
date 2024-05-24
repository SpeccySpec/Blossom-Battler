forceEndBattles = {};

getCharFromTurn = (btl) => {
	let id = btl.turnorder[btl.curturn];
	return getCharFromId(id, btl);
}

getTurnOrder = (btl) => {
	let turnorder = [];

	for (const i in btl.teams) {
		for (const k in btl.teams[i].members) {
			let f = btl.teams[i].members[k];

			if (!(f.reincarnate || f.clone) || ((f.reincarnate || f.clone) && f.hp > 0)) {
				turnorder.push(objClone(f));
				if (isBoss(f)) turnorder.push(objClone(f));
			}
		}

		for (const k in btl.teams[i].backup) {
			let f = btl.teams[i].backup[k];

			if (!(f.reincarnate || f.clone) || ((f.reincarnate || f.clone) && f.hp > 0)) {
				turnorder.push(objClone(f));
				if (isBoss(f)) turnorder.push(objClone(f));
			}
		}
	}

	if (btl?.terrain?.type === 'psychic') {
		turnorder.sort(function(a, b) {
			// Status Effects
			if (a.status && statusEffectFuncs[a.status] && statusEffectFuncs[a.status].skillmod) statusEffectFuncs[a.status].skillmod(a, a.stats, btl);
			if (b.status && statusEffectFuncs[b.status] && statusEffectFuncs[b.status].skillmod) statusEffectFuncs[b.status].skillmod(b, b.stats, btl);

			// Buffs
			let agl1 = statWithBuff(a.stats.agl, a.buffs.agl, a);
			let agl2 = statWithBuff(b.stats.agl, b.buffs.agl, b);

			// Leisure
			if (a.status == "leisure") agl1 = 999999;
			if (b.status == "leisure") agl2 = 999999;

			// Haste
			if (a.status == "haste") agl1 = -50;
			if (b.status == "haste") agl2 = -50;

			// Some stuff
			return agl1 - agl2;
		});
	} else {
		turnorder.sort(function(a, b) {
			// Status Effects
			if (a.status && statusEffectFuncs[a.status] && statusEffectFuncs[a.status].skillmod) statusEffectFuncs[a.status].skillmod(a, a.stats, btl);
			if (b.status && statusEffectFuncs[b.status] && statusEffectFuncs[b.status].skillmod) statusEffectFuncs[b.status].skillmod(b, b.stats, btl);

			// Buffs
			let agl1 = statWithBuff(a.stats.agl, a.buffs.agl, a);
			let agl2 = statWithBuff(b.stats.agl, b.buffs.agl, b);

			// Leisure
			if (a.status == "leisure") agl1 = -50;
			if (b.status == "leisure") agl2 = -50;

			// Haste
			if (a.status == "haste") agl1 = 999999;
			if (b.status == "haste") agl2 = 999999;

			// Some stuff
			return agl2 - agl1;
		});
	}
	
	let order = [];
	for (let i in turnorder) order[i] = turnorder[i].id;
	
	console.log(order);
	return order;
}

leaderSkillsAtBattleStart = (btl) => {
	for (party of btl.teams) {
		if (!party.leaderskill)
			continue;

		if (party.leaderskill.type.toLowerCase() == 'buff') {
			for (const ally of party.members) buffStat(ally, party.leaderskill.var1.toLowerCase(), parseInt(party.leaderskill.var2));
		}

		if (party.leaderskill.type.toLowerCase() == 'debuff') {
			let oppositeParty = (party == btl.teams[0] ? btl.teams[1] : btl.teams[0]);
			for (const enemy of oppositeParty.members) buffStat(enemy, party.leaderskill.var1.toLowerCase(), parseInt(party.leaderskill.var2)*-1);
		}

		if (party.leaderskill.type.toLowerCase() == 'pacify') {
			let oppositePartyIndex = (party == btl.teams[0] ? 1 : 0);
			for (const enemy of btl.teams[oppositePartyIndex].members) {
				if (enemy?.negotiate?.length > 0) {
					enemy.pacify = parseInt(party.leaderskill.var2);
				}
			}
		}

		if (party.leaderskill.type.toLowerCase() == 'items') {
			let oppositePartyIndex = (party == btl.teams[0] ? 1 : 0);
			for (const enemy of btl.teams[oppositePartyIndex].members) {
				if (enemy?.loot?.length > 0) {
					for (const item of enemy.loot) {
						item.chance += parseInt(party.leaderskill.var2);
					}
				}
			}
		}
	}
	return btl;
}

const btnType = {
	blue: 'PRIMARY',
	grey: 'SECONDARY',
	green: 'SUCCESS',
	red: 'DANGER'
}

// Send an Interactable Turn Embed, buttons and all
makeButton = (name, emoji, color, lowercase, forceid, disabled) => {
	return new Discord.MessageButton({
		label: name,
		customId: forceid ?? (lowercase ? name : name.toLowerCase()),
		style: btnType[color.toLowerCase()] ?? 'SECONDARY',
		emoji: emoji,
		disabled: disabled ?? false
	})
}

// ALL BATTLE OPTIONS ARE FINISHED! LETS GOOOO!

// Menu States
MENU_ACT = 0;
MENU_SKILL = 1;
MENU_ITEM = 2;
MENU_TACTICS = 3;
MENU_TEAMSEL = 4;
MENU_TARGET = 5;
MENU_PACIFY = 6;
MENU_BACKUP = 7;
MENU_EQUIPMENT = 8;
MENU_WEAPONS = 9;
MENU_ARMORS = 10;

// Extra States (Misc. Shit like PVP)
MENU_TRANSFORMATIONS = 11;
MENU_ENEMYINFO = 12;
MENU_FORFEIT = 13;
MENU_ANYSEL = 14;

// States that require ne embeds
MENU_QUESTION = 15;

function CalcCompins(comps, i) {
	const compins = Math.min(Math.floor(Math.max(i - 0.1, 0) / 4), 3)
	if (!comps[compins])
		comps[compins] = [];
	return compins
}

const menuEmbeds = {
	[MENU_QUESTION]: ({char, btl, DiscordEmbed}) => {
		DiscordEmbed.title = btl.action.question.title;
		DiscordEmbed.description = btl.action.question.desc;
		DiscordEmbed.color = `#d613cc`;

		return DiscordEmbed
	}
}

const menuStates = {
	[MENU_ACT]: ({char, btl, comps}) => {
		if (char.pet) {
			const skillinfo = skillFile[char.pet.skill];

			comps[0] = [
				makeButton('Melee', elementEmoji[char.melee.type] ?? elementEmoji.strike, 'red'),
				makeButton(skillinfo ? skillinfo.name : '...?', elementEmoji[skillinfo.type] ?? itemTypeEmoji.skill, 'blue', true, 'skills', !skillinfo),
				makeButton('Pacify', itemTypeEmoji.pacify, 'green'),
				makeButton('Enemy Info', statusEmojis.silence, 'red', true, 'enemyinfo')
			]
		} else {
			if (btl.action && btl.action.ally) delete btl.action.ally;

			comps[0] = [
				makeButton('Melee', elementEmoji[char.melee.type] ?? elementEmoji.strike, 'red'),
				makeButton('Skills', elementEmoji.bless, 'blue'),
				makeButton('Items', itemTypeEmoji.healhpmp, 'green'),
				makeButton('Tactics', critEmoji, 'grey'),
				makeButton('Guard', affinityEmoji.block, 'grey')
			]

			// Team Combo checks
			if (btl.canteamcombo && !char.donetc) {
				for (let i in btl.teams[char.team].members) {
					if (hasTeamCombo(char, btl.teams[char.team].members[i])) {
						if (!comps[1]) comps[1] = [];
						comps[1].push(makeButton('Team Combo', elementEmoji.slash, 'blue', true, 'tc'));
						break;
					}
				}
			}

			// Limit Breaks
			if (canUseLb(char, btl)) {
				if (!comps[1]) comps[1] = [];
				comps[1].push(makeButton('Limit Break', elementEmoji.almighty, 'blue', true, 'lb'));
			}

			// Transformations
			if (canTransform(char, btl)) {
				let transformations = [];
				for (let i in char.transformations) {
					if (canTransform(char, btl, i)) transformations.push(i);
				}

				if (!comps[1]) comps[1] = [];
				comps[1].push(makeButton(transformations.length > 1 ? `Transform! (${transformations.length})` : transformations[0], elementEmoji.spirit, 'blue', true, 'transform'));
			}
		}
	},
	[MENU_SKILL]: ({char, btl, comps}) => {
		switch(btl.action.move) {
			case 'bb-fusionskill':
				let data = canFusionSkill(char, btl, skillFile[btl.action.index], true);

				let c = 0;
				if (btl.teams[char.team].members[btl.action.ally] && data[btl.action.ally]) {
					let char2 = btl.teams[char.team].members[btl.action.ally];
					let data2 = [];
					let skillname;
					let skillinfo;

					let skillnamesdata = [];
					for (let i in data[btl.action.ally]) {
						skillname = data[btl.action.ally][i]

						if (typeof skillname === "object") {
							data2 = objClone(skillname);

							for (let k in data2) {
								skillname = data2[k];
								skillinfo = skillFile[skillname];

								if (!skillinfo) continue;

								// Just incase, to avoid dupes.
								if (skillnamesdata.includes(skillname)) {
									console.log(`Duped occurance. (${skillname})`);
									continue; // just in case.
								} else {
									console.log(`First occurance. (${skillname})`);
									skillnamesdata.push(skillname);
								}
	
								let compins = CalcCompins(comps, c)
								let btncolor = 'blue'
								if (skillinfo?.type === 'heal') 
									btncolor = 'green'
								else if (skillinfo?.type === 'status' || skillinfo?.type === 'passive') 
									btncolor = 'grey'
								else if (skillinfo?.atktype === 'physical' || skillinfo?.atktype === 'sorcery') 
									btncolor = 'red'
					
								let emoji1 = skillinfo ? elementEmoji[skillinfo.type] : elementEmoji.strike;
								if (typeof(skillinfo?.type) === 'object') emoji1 = skillinfo ? elementEmoji[skillinfo.type[0]] : elementEmoji.strike;

								let canselect = true;
					
								// Afford/Status Effects
								if (!canAfford(char2, skillinfo, btl)) {
									canselect = false;
								} else if (char2.status) {
									switch(char.status.toLowerCase()) {
										case 'ego':
											if (skillinfo?.type === 'heal') canselect = false;
											break;
					
										case 'silence':
											if (skillinfo?.atktype === 'magic' || skillinfo?.atktype === 'sorcery') canselect = false;
											break;
					
										case 'dazed':
											if (skillinfo?.atktype === 'physical' || skillinfo?.atktype === 'ranged') canselect = false;
											break;
					
										case 'disabled':
											canselect = false;
											break;
									}
								}
					
								// Disable.
								if (char2.custom?.disable) {
									if (char2.custom.disable[0] == skillname) canselect = false;
								}

								comps[compins].push(makeButton(skillinfo?.name ?? skillname, emoji1, btncolor, true, skillname, !canselect))
								c++;
							}
						} else {
							skillinfo = skillFile[skillname]
							if (!skillinfo) continue;

							// Just incase, to avoid dupes.
							if (skillnamesdata.includes(skillname)) {
								console.log(`Duped occurance. (${skillname})`);
								continue; // just in case.
							} else {
								console.log(`First occurance. (${skillname})`);
								skillnamesdata.push(skillname);
							}

							let compins = CalcCompins(comps, c)
							let btncolor = 'blue'
							if (skillinfo?.type === 'heal') 
								btncolor = 'green'
							else if (skillinfo?.type === 'status' || skillinfo?.type === 'passive') 
								btncolor = 'grey'
							else if (skillinfo?.atktype === 'physical' || skillinfo?.atktype === 'sorcery') 
								btncolor = 'red'
				
							let emoji1 = skillinfo ? elementEmoji[skillinfo.type] : elementEmoji.strike;
							if (typeof(skillinfo?.type) === 'object') emoji1 = skillinfo ? elementEmoji[skillinfo.type[0]] : elementEmoji.strike;
				
							let canselect = true;
				
							// Afford/Status Effects
							if (!canAfford(char2, skillinfo, btl)) {
								canselect = false;
							} else if (char2.status) {
								switch(char.status.toLowerCase()) {
									case 'ego':
										if (skillinfo?.type === 'heal') canselect = false;
										break;
				
									case 'silence':
										if (skillinfo?.atktype === 'magic' || skillinfo?.atktype === 'sorcery') canselect = false;
										break;
				
									case 'dazed':
										if (skillinfo?.atktype === 'physical' || skillinfo?.atktype === 'ranged') canselect = false;
										break;
				
									case 'disabled':
										canselect = false;
										break;
								}
							}
				
							// Disable.
							if (char2.custom?.disable) {
								if (char2.custom.disable[0] == skillname) canselect = false;
							}
				
							comps[compins].push(makeButton(skillinfo?.name ?? skillname, emoji1, btncolor, true, skillname, !canselect))
							c++;
						}
					}
				}
				break;

			default:
				delete btl.action.fusionskill;

				for (const i in char.skills) {
					const skillname = char.skills[i]
					const skillinfo = skillFile[skillname]
					if (!skillinfo) continue;
					if (skillinfo?.type === 'passive') continue;
		
					const compins = CalcCompins(comps, i)
					let btncolor = 'blue'
					if (skillinfo?.type === 'heal') 
						btncolor = 'green'
					else if (skillinfo?.type === 'status') 
						btncolor = 'grey'
					else if (skillinfo?.atktype === 'physical' || skillinfo?.atktype === 'sorcery') 
						btncolor = 'red'
		
					let emoji1 = skillinfo ? elementEmoji[skillinfo.type] : elementEmoji.strike;
					if (typeof(skillinfo?.type) === 'object') emoji1 = skillinfo ? elementEmoji[skillinfo.type[0]] : elementEmoji.strike;
		
					let canselect = true;
		
					// Afford/Status Effects
					if (!canAfford(char, skillinfo, btl)) {
						canselect = false;
					} else if (char.status) {
						switch(char.status.toLowerCase()) {
							case 'ego':
								if (skillinfo?.type === 'heal') canselect = false;
								break;
		
							case 'silence':
								if (skillinfo?.atktype === 'magic' || skillinfo?.atktype === 'sorcery') canselect = false;
								break;
		
							case 'dazed':
								if (skillinfo?.atktype === 'physical' || skillinfo?.atktype === 'ranged') canselect = false;
								break;
		
							case 'disabled':
								canselect = false;
								break;
						}
					}

					// Lovable
					if (skillinfo.target && skillinfo.target === "one" && !(skillinfo.extras?.soulless && skillinfo.extras.soulless.includes("lovable"))) {
						let alivecount = 0;
						let alivechar = {};
						for (let k in btl.teams) {
							if (k == char.team) continue;
		
							for (let j in btl.teams[k].members) {
								if (btl.teams[k].members[j].hp > 0) {
									alivechar = btl.teams[k].members[j];
									alivecount++;
								}
							}
						}
		
						if (alivecount == 1) {
							if (alivechar.lovable) canselect = false;
						}
					}
		
					// Disable.
					if (char.custom?.disable) {
						if (char.custom.disable[0] == skillname) canselect = false;
					}

					// Fusion Skill limitations.
					if (char.fusionskill) {
						let noelement = (typeof skillFile[char.fusionskill].type === "object") ? skillFile[char.fusionskill].type : [skillFile[char.fusionskill].type];
						if (noelement.includes(skillinfo?.type)) canselect = false;
					}

					// Don't allow selections of fusion skills at all.
					if (skillinfo?.fusionskill)
						canselect = false;

					// Lmao.
					comps[compins].push(makeButton(skillinfo?.name ?? skillname, emoji1, btncolor, true, skillname, !canselect))
				}
		}
	},
	[MENU_ITEM]: ({char, btl, comps}) => {
		let itemFile = setUpFile(`${dataPath}/json/${btl.guild.id}/items.json`);

		let k = 0;
		for (let i in btl.teams[char.team].items) {
			if (!itemFile[i]) continue;

			let item = itemFile[i];
			if (btl.teams[char.team].items[i] <= 0) continue;
			if (['material', 'key'].includes(item.type)) continue;

			const compins = CalcCompins(comps, k)
			let btncolor = 'green';
			if (item?.type === 'skill') 
				btncolor = 'red';
			else if (item?.type === 'pacify') 
				btncolor = 'blue';

			let canSelect = true;

			if (char.status && char.status.toLowerCase() == "stuffed" && consumableItems.includes(itemFile[i].type)) canSelect = false;

			comps[compins].push(makeButton(`${item?.name ?? i}: ${btl.teams[char.team].items[i]}`, itemTypeEmoji[item.type], btncolor, false, i, !canSelect))
			k++;
		}
	},
	[MENU_TACTICS]: ({btl, comps}) => {
		comps[0] = [];

		if (btl.pvp) {
			comps[0] = [
				makeButton('Forfeit', '<:boot:995268449154629699>', 'grey', true, 'run'),
				makeButton('Equipment', '<:longbladed:1008794360676110457>', 'blue', true, 'equipment'),
				makeButton('Backup', '<:mental:1004855144745291887>', 'blue')
			]
		} else if (btl.trial) {
			comps[0] = [
				makeButton('Save Trial', '📖', 'green', true, 'run'),
				makeButton('Equipment', '<:longbladed:1008794360676110457>', 'blue', true, 'equipment'),
				makeButton('Backup', '<:mental:1004855144745291887>', 'blue'),
				makeButton('Pacify', itemTypeEmoji.pacify, 'green', null, null, true), // No Pacifying
				makeButton('Enemy Info', statusEmojis.silence, 'red', true, 'enemyinfo', true) // No Enemy Info
			]
		} else {
			comps[0] = [
				makeButton('Run!', '<:boot:995268449154629699>', 'grey', true, 'run'),
				makeButton('Equipment', '<:longbladed:1008794360676110457>', 'blue', true, 'equipment'),
				makeButton('Backup', '<:mental:1004855144745291887>', 'blue'),
				makeButton('Pacify', itemTypeEmoji.pacify, 'green'),
				makeButton('Enemy Info', statusEmojis.silence, 'red', true, 'enemyinfo')
			]
		}
	},
	[MENU_PACIFY]: ({char, btl, comps}) => {
		let targ = btl.teams[btl.action.target[0]].members[btl.action.target[1]];

		for (let i in targ.negotiate) {
			let n = targ.negotiate[i];

			if (!comps[CalcCompins(comps, i)]) comps[CalcCompins(comps, i)] = [];
			comps[CalcCompins(comps, i)].push(makeButton(`${n.name}`, `${i}️⃣`, 'blue', true, i.toString()))
		}
	},
	[MENU_BACKUP]: ({char, btl, comps}) => {
		let members = btl.teams[char.team].backup;

		for (let i in members) {
			if (!comps[CalcCompins(comps, i)]) comps[CalcCompins(comps, i)] = [];
			comps[CalcCompins(comps, i)].push(makeButton(`${members[i].name}`, `${i}️⃣`, 'blue', true, i.toString()))
		}
	},
	[MENU_EQUIPMENT]: ({char, btl, comps}) => {
		comps[0] = [];

		if (!char.weapons || char.weapons == {}) {
			comps[0].push(makeButton('Weapons', '<:bladed:1008794351591239842>', 'red', true, 'weapon', true))
		} else {
			comps[0].push(makeButton('Weapons', '<:bladed:1008794351591239842>', 'red', true, 'weapon'))
		}

		if (!char.armors || char.armors == {}) {
			comps[0].push(makeButton('Armors', '<:light:1008794358637662338>', 'blue', true, 'armor', true))
		} else {
			comps[0].push(makeButton('Armors', '<:light:1008794358637662338>', 'blue', true, 'armor'))
		}
	},
	[MENU_WEAPONS]: ({char, comps}) => {
		let j = 0;
		let classTxt = '';
		for (let i in char.weapons) {
			classTxt = classEmoji.weapon[char.weapons[i].class] ?? '<:bladed:1008794351591239842>';

			if (!char.weaponclass || char.weaponclass == "none" || (typeof char.weaponclass == "object" && char.weaponclass.includes(char.weapons[i].class)) || char.weaponclass == char.weapons[i].class)
				comps[CalcCompins(comps, j)].push(makeButton(char.weapons[i].name, classTxt, 'red', true, i));
			else
				comps[CalcCompins(comps, j)].push(makeButton(char.weapons[i].name, classTxt, 'red', true, i, true));

			j++;
		}

		comps[CalcCompins(comps, j)].push(makeButton("Unequip", '<:atkdown:990629394236211230>', 'grey', true, 'unequip', !char.curweapon));
	},
	[MENU_ARMORS]: ({char, comps}) => {
		let j = 0;
		let classTxt = '';
		for (let i in char.armors) {
			classTxt = classEmoji.armor[char.armors[i].class] ?? '<:light:1008794358637662338>';
			comps[CalcCompins(comps, i)].push(makeButton(`${char.armors[i].name}`, classTxt, 'red', true, i))
			j++;
		}

		comps[CalcCompins(comps, j)].push(makeButton("Unequip", '<:enddown:990629399902695445>', 'grey', true, 'unequip', !char.curarmor));
	},
	[MENU_TEAMSEL]: ({char, btl, comps}) => {
		for (const i in btl.teams) {
			if (char.team == i) continue;
			comps[CalcCompins(comps, i)].push(makeButton(`Team ${btl.teams[i].name}`, '#️⃣', 'blue', true, i.toString()))
		}

		if (btl.action.move === 'skills' && canFusionSkill(char, btl, skillFile[btl.action.index])) {
			comps[CalcCompins(comps, i)].push(makeButton("Fusion Spell", '<:books:1008794354959269938>', 'blue', true, 'bb-fusionskill'))
		}
	},
	[MENU_TARGET]: ({char, btl, comps}) => {
		let members = btl.teams[btl.action.target[0]].members ?? btl.teams[char.team].members;
		let checkForTarget = (members.filter(x => x.target).length != 0);

		switch(btl.action.move) {
			case 'melee':
			case 'pacify':
			case 'enemyinfo':
			case 'lb':
				for (const i in members) {
					if (members[i].hp <= 0 || members[i].pacified) continue;

					if (members[i].lovable && !['pacify', 'enemyinfo'].includes(btl.action.move)) {
						comps[CalcCompins(comps, i)].push(makeButton(`${members[i].name}`, `${i}️⃣`, (btl.action.target[0] == char.team) ? 'green' : 'red', true, i.toString(), true))
					} else {
						if (!checkForTarget || (checkForTarget && ['pacify', 'enemyinfo'].includes(btl.action.move)))
							comps[CalcCompins(comps, i)].push(makeButton(`${members[i].name}`, `${i}️⃣`, (btl.action.target[0] == char.team) ? 'green' : 'red', true, i.toString()))
						else
							comps[CalcCompins(comps, i)].push(makeButton(`${members[i].name}`, `${i}️⃣`, (btl.action.target[0] == char.team) ? 'green' : 'red', true, i.toString(), (!members[i].target)))
					}
				}
				break;

			case 'backup':
				for (const i in members) {
					if (char.id === members[i].id) continue;
					if (members[i].hp <= 0 || members[i].pacified) continue;

					comps[CalcCompins(comps, i)].push(
						makeButton(`${members[i].name}`, `${i}️⃣`, (btl.action.target[0] == char.team) ? 'green' : 'red', true, i.toString())
					)
				}
				break;
		
			case 'item':
			case 'items':
				let itemFile = setUpFile(`${dataPath}/json/${btl.guild.id}/items.json`, true);
				let item = itemFile[btl.action.index];

				for (const i in members) {
					if (members[i].pacified) continue;
					if (item.type === 'revive') {
						if (members[i].hp > 0) continue;
					} else {
						if (members[i].hp <= 0) continue;
					}

					comps[CalcCompins(comps, i)].push(
						makeButton(`${members[i].name}`, `${i}️⃣`, (btl.action.target[0] == char.team) ? 'green' : 'red', true, i.toString())
					)
				}
				break;
			
			case 'tc':
				members = btl.teams[btl.action.target[0]].members;

				checkForTarget = (members.filter(x => x?.target).length != 0);
				for (const i in members) {
					if (members[i].hp <= 0 || members[i].pacified) continue;

					if (members[i].team == char.team) {
						if (!hasTeamCombo(char, members[i])) continue;
					}

					let canSelect = true;

					if (members[i].lovable) canSelect = false;
					if (checkForTarget && !members[i].target) canSelect = false;

					comps[CalcCompins(comps, i)].push(
						makeButton(`${members[i].name}`, `${i}️⃣`, (btl.action.target[0] == char.team) ? 'green' : 'red', true, i.toString(), !canSelect)
					)
				}
				break;

			case 'bb-fusionskill':
			case 'bb-fusionspell': // i mistype alot
				if (btl.action.fusionskill) {
					let skill = skillFile[btl.action.fusionskill];
					let canSelect = true;
					let j = 0;
	
					if (!canChooseTarget(skill.target)) {
						comps[CalcCompins(comps, j)].push(makeButton("Use Skill", '<:physical:973077052129423411>', 'red', true, '1'));
						j++;
					} else {
						for (const i in members) {
							if (!skill) continue;
							if (members[i].pacified) continue;

							canSelect = true;
							if (skill.type === 'heal') {
								if (skill.heal.revive) {
									if (members[i].hp > 0) canSelect = false;
								}
								if (members[i]?.status === 'ego') canSelect = false;
							} else if (skill.type === 'status' && skill.statusses?.mimic) {
								if (members[i].hp <= 0) canSelect = false;
								if (members[i].id === char.id) canSelect = false;
								if (isBoss(members[i])) canSelect = false;
							} else {
								if (members[i].hp <= 0) canSelect = false;
								if (members[i].lovable) canSelect = false;
								if (checkForTarget && !members[i].target) canSelect = false;
							}
	
							comps[CalcCompins(comps, j)].push(makeButton(`${members[i].name}`, `${i}️⃣`, (btl.action.target[0] == char.team) ? 'green' : 'red', true, i.toString(), !canSelect))
							j++;
						}
					}
				} else {
					members = btl.teams[char.team].members;
					let data = canFusionSkill(char, btl, skillFile[btl.action.index], true);

					let l = 0;
					for (let i in data) {
						if (!members[i]) continue;
						if (members[i].hp <= 0 || members[i].pacified) continue;
						comps[CalcCompins(comps, l)].push(makeButton(`${members[i].name}`, elementEmoji[(typeof skillFile[data[i][0]].type == "object") ? skillFile[data[i][0]].type[0] : skillFile[data[i][0]].type], 'blue', true, i.toString()))
						l++;
					}
				}
				break;

			default:
				if (btl.action.fusionskill) delete btl.action.fusionskill;

				let skill = skillFile[btl.action.index];
				let canSelect = true;
				let j = 0;

				if (!canChooseTarget(skill.target)) {
					comps[CalcCompins(comps, j)].push(makeButton("Use Skill", '<:physical:973077052129423411>', 'red', true, '1'));
					j++;
				} else {
					for (const i in members) {
						if (!skill) continue;
						if (members[i].pacified) continue;

						canSelect = true;
						if (skill.type === 'heal') {
							if (skill.heal.revive) {
								if (members[i].hp > 0) canSelect = false;
							}
							if (members[i]?.status === 'ego') canSelect = false;
						} else if (skill.type === 'status' && skill.statusses?.mimic) {
							if (members[i].hp <= 0) canSelect = false;
							if (members[i].id === char.id) canSelect = false;
							if (isBoss(members[i])) canSelect = false;
						} else {
							if (members[i].hp <= 0) canSelect = false;
							if (members[i].lovable) canSelect = false;
							if (checkForTarget && !members[i].target) canSelect = false;
						}

						comps[CalcCompins(comps, j)].push(makeButton(`${members[i].name}`, `${i}️⃣`, (btl.action.target[0] == char.team) ? 'green' : 'red', true, i.toString(), !canSelect))
						j++;
					}
				}

				if (canFusionSkill(char, btl, skill)) {
					comps[CalcCompins(comps, j)].push(makeButton("Fusion Skill", '<:books:1008794354959269938>', 'blue', true, 'bb-fusionskill'))
					j++;
				}
		}
	},

	[MENU_TRANSFORMATIONS]: ({char, btl, comps}) => {
		if (canTransform(char, btl)) {
			for (let i in char.transformations) {
				let k = Object.keys(char.transformations).indexOf(i);
				if (canTransform(char, btl, i)) comps[CalcCompins(comps, k)].push(makeButton(i, elementEmoji.spirit, 'blue', true, i));
			}
		}
	},
	[MENU_FORFEIT]: ({comps}) => {
		comps[0] = [makeButton('Yes!', elementEmoji.wind, 'red', true, 'forfeit')]
	},
	[MENU_ENEMYINFO]: ({char, btl, comps}) => {
		comps[0] = [makeButton('Finished Looking', '◀️', 'blue', true, 'back')]
	},
	[MENU_ANYSEL]: ({char, btl, comps}) => {
		for (const i in btl.teams) {
			comps[CalcCompins(comps, i)].push(makeButton(`Team ${btl.teams[i].name}`, '#️⃣', (char.team == i) ? 'green' : 'red', true, i.toString()))
		}
	},
	[MENU_QUESTION]: ({char, btl, comps}) => {
		for (const i in btl.action.question.answers) {
			comps[CalcCompins(comps, i)].push(makeButton(btl.action.question.answers[i], '#️⃣', 'blue', true, i.toString()))
		}
	},
}

setUpComponents = (char, btl, menustate, nobackbutton) => {
	let comps = [];
	menuStates[parseInt(menustate)]({char, btl, comps});

	if (!nobackbutton) {
		if (menustate != MENU_ACT && menustate != MENU_ENEMYINFO) {
			if (!comps[0] || !comps[0][0]) {
				comps[0] = [makeButton('Nothing Here :/', '◀️', 'grey', true, 'back')];
			} else {
				let didadd = false;

				for (let i in comps) {
					if (comps[i].length < 5) {
						comps[i].push(makeButton('Back', '◀️', 'grey'));
						didadd = true;
						break;
					}
				}

				if (!didadd) {
					comps[comps.length] = [makeButton('Back', '◀️', 'grey')];
				}
			}
		}
	}

	for (let i in comps)
		comps[i] = new Discord.MessageActionRow({components: comps[i]});

	return comps;
}

function GetCharStatus(char) {
	let str = ""
	if (char.golden) str += goldenEmoji;
	if (char.pacified)
		return str + itemTypeEmoji.pacify
	for (const buff in char.buffs) {
		let amount = char.buffs[buff]
		if (amount == 0)
			continue
		str += statusEmojis[buff + (amount > 0 ? "up" : "down")]

		if (char.status && char.status == 'trisagion') {
			if (hasStatusAffinity(char, 'trisagion', 'weak') || isBoss(char)) {
				if (amount > 0) amount *= 2;
			} else if (hasStatusAffinity(char, 'trisagion', 'resist') ) {
				if (amount < 0) amount *= 2;
			} else {
				amount *= 2;
			}
		}

		amount = Math.abs(amount);
		str += (amount >= 2 ? superscriptDictionary[amount] : '')
	}
	const custom = char.custom
	if (custom)
		for (let val in custom) {
			const toembed = customVariables[val]?.toembed
			if (toembed) {
				str += typeof toembed == "string" ? toembed : toembed(custom[val])
			}
		}

	if (char.status) str += statusEmojis[char.status];

	let stackable = [];
	for (let i in statusEffectFuncs) {
		if (statusEffectFuncs[i].stackable) stackable.push(i);
	}
	for (let i in stackable) {
		if (char[stackable[i]] && statusEmojis[stackable[i]]) str += statusEmojis[stackable[i]];
	}

	return str
}

function GetCharName(char, btl) {
	let str = char.name;
	if (isBlessed(char, btl))
		str = `_${char.name}_`;

	if (char.transformed) {
		let element = char.transformations[char.transformed].mainElement;

		if (typeof element === "object") {
			str = "";
			for (let k in element) {
				str += elementEmoji[char.transformations[char.transformed].mainElement[k] ?? "spirit"];
			}
			str += `**__${char.name}__**`;
		} else {
			str = `${elementEmoji[char.transformations[char.transformed].mainElement ?? "spirit"]}**__${char.name}__**`;
		}
	}

	return str;
}

let updateMsg = async(i, data) => {
	i.update(data)
		.then(console.log)
		.catch(() => {
			i.message.edit(data);
			console.log(console.error);
		});

	return i;
}

sendStateEmbed = (char, btl) => {
	let settings = setUpSettings(btl.guild.id);

	let menustate = btl.intendedstate;

	let color = elementColors[char.mainElement] ?? elementColors.strike;
	if (typeof char.mainElement === "object")
		color = elementColors[char.mainElement[0]] ?? elementColors.strike;

	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(color)
		.setTitle(`PLACEHOLDER`)
		.setDescription('PLACEHOLDER')

	DiscordEmbed = menuEmbeds[parseInt(menustate)]({char, btl, DiscordEmbed});
		
	let message = {
		content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
		embeds: [DiscordEmbed],
		components: setUpComponents(char, btl, menustate, [MENU_QUESTION].includes(menustate))
	};

	btl.channel.send(message).then(msg => {
		btl.forcemessage = msg.id;
		fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, JSON.stringify(btl, '	', 4));
	});

	let collector = makeCollector(btl.channel, {
		filter: (({user}) => (user.id == char.owner || utilityFuncs.RPGBotAdmin(user.id) || user.id == btl?.initiator)),
		time: btl?.action?.timer
	})

	collector.on('collect', async i => {
		btl.action.laststate = menustate;
		let alreadyResponded = false;

		let testbtl = setUpFile(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, true);
		if (testbtl.forcemessage && i.message.id != testbtl.forcemessage) {
			collector.stop();
			alreadyResponded = true;

			await updateMsg(i, {
				content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
				embeds: [DiscordEmbed],
				components: setUpComponents(char, btl, menustate, [MENU_QUESTION].includes(menustate))
			});

			return;
		}

		switch (menustate) {
			case MENU_QUESTION:
				alreadyResponded = true;

				btl.action.question.chosenAnswer = i.customId;
				doAction(char, btl, btl.action);
				break;
		}

		if (alreadyResponded) {
			collector.stop();

			await updateMsg(i, {
				content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
				embeds: [DiscordEmbed],
				components: []
			}); 
			return;
		}

		await updateMsg(i, {
			content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
			embeds: [DiscordEmbed],
			components: setUpComponents(char, btl, menustate, [MENU_QUESTION].includes(menustate))
		})
	});

	collector.on('end', async i => {
		if (i.size < 1) {
			switch (menustate) {
				case MENU_QUESTION:
					doAction(char, btl, btl.action);
					break;
			}

			collector.stop();
		}
	});
}

sendCurTurnEmbed = async(char, btl) => {
	if (btl.intendedstate) return sendStateEmbed(char, btl);

	let settings = setUpSettings(btl.guild.id);

	let menustate = MENU_ACT;

	let statDesc = '';
	if (char.shrouded) {
		statDesc += `${getBar('hp', 0, char.maxhp)}???/???HP\n${getBar('mp', 0, char.maxmp)} ???/???${char.mpMeter ? char.mpMeter[1] : "MP"}`;
	} else {
		statDesc += `${getBar('hp', char.hp, char.maxhp)}${char.hp}/${char.maxhp}HP\n${getBar('mp', char.mp, char.maxmp)} ${char.mp}/${char.maxmp}${char.mpMeter ? char.mpMeter[1] : "MP"}`;
	}

	if (settings.mechanics.limitbreaks) statDesc += `, ${Math.round(char.lbp)}LB%`;
	if (char.pet) statDesc = `${char.name} wants to assist the team in battle! Tell it to do something!\n`;

	if (btl.teams[char.team].currency) statDesc += `\n${btl.teams[char.team].currency} ${getCurrency(btl.guild.id)}s`

	let weatherTxt = '';
	if (btl.weather) weatherTxt += `\n${weatherDescs[btl.weather.type].emoji}*${weatherDescs[btl.weather.type].name}* Weather.`;
	if (btl.terrain) weatherTxt += `\n${terrainDescs[btl.terrain.type].emoji}*${terrainDescs[btl.terrain.type].name}* Terrain.`;
	statDesc += weatherTxt;
	
	// No Passives
	if (btl.nopassives) {
		if (getCharFromId(btl.nopassives[1], btl).hp > 0) {
			statDesc += `\n<:warning:878094052208296007> Passives disabled by ${getCharFromId(btl.nopassives[1], btl).name}'s ${btl.nopassives[0]}!`;
		}
	}

	let teamDesc = '';
	let op = (char.team <= 0) ? 1 : 0;
	let multipleTeams = false;
	if (btl.teams.length > 2) {
		multipleTeams = true;

		for (let i in btl.teams) {
			if (i != char.team) {
				let m = 0;
				for (let k in btl.teams[i].members) {
					if (btl.teams[i].members[k].hp > 0) m++;
				}

				teamDesc += `Team __${btl.teams[i].name}__ _(${m}/${btl.teams[i].members.length} Left)_\n`;
			}
		}
	} else {
		for (let i in btl.teams[op].members) {
			let c = btl.teams[op].members[i];
			let l = c.leader ? leaderEmoji : i;

			if (c.hp <= 0) {
				teamDesc += `~~${l}: ${c.name} _(DOWN)_~~\n`;
			} else {
				let s = GetCharStatus(c);
				let n = GetCharName(c, btl);

				if (c.shrouded) {
					teamDesc += `${l}: ${n} _(???/???HP, ???/???${c.mpMeter ? c.mpMeter[1] : "MP"})_\n`;
				} else {
					teamDesc += `${l}: ${s}${n} _(${c.hp}/${c.maxhp}HP, ${c.mp}/${c.maxmp}${c.mpMeter ? c.mpMeter[1] : "MP"})_\n`;
				}
			}
		}
	}

	let myTeamDesc = '';
	for (let i in btl.teams[char.team].members) {
		let c = btl.teams[char.team].members[i];
		let l = c.leader ? leaderEmoji : i;

		if (c.hp <= 0) {
			myTeamDesc += `~~${l}: ${c.name} _(DOWN)_~~\n`;
		} else {
			let s = GetCharStatus(c)
			let n = GetCharName(c, btl);

			if (c.shrouded) {
				myTeamDesc += `${l}: **?**${n} _(???/???HP, ???/???${c.mpMeter ? c.mpMeter[1] : "MP"})_\n`;
			} else {
				myTeamDesc += `${l}: ${s}${n} _(${c.hp}/${c.maxhp}HP, ${c.mp}/${c.maxmp}${c.mpMeter ? c.mpMeter[1] : "MP"})_\n`;
			}
		}
	}
	
	let testtxt = '';
	if (btl.testing) testtxt = ` (__${btl.testing} test turns left__)`;

	if (teamDesc == '') teamDesc = "No opponents.";
	if (myTeamDesc == '') myTeamDesc = "No allies.";

	let color = elementColors[char.mainElement] ?? elementColors.strike;
	if (typeof char.mainElement === "object")
		color = elementColors[char.mainElement[0]] ?? elementColors.strike;

	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(color)
		.setTitle(`Turn #${btl.turn} - ${char.name}'s turn${testtxt}`)
		.setDescription(statDesc)
		.addFields({name: 'Opponents', value: teamDesc, inline: true}, {name: 'Allies', value: myTeamDesc, inline: true})

	let message = {
		content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
		embeds: [DiscordEmbed],
		components: setUpComponents(char, btl, menustate)
	};

	// Now...
	btl.action = {
		move: 'melee',
		index: 0,
		target: [0, 0],
	}

	btl.channel.send(message).then(msg => {
		btl.forcemessage = msg.id;
		fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, JSON.stringify(btl, '	', 4));
	});

	let collector = makeCollector(btl.channel, {
		filter: ({user}) => (user.id == char.owner || utilityFuncs.RPGBotAdmin(user.id) || user.id == btl?.initiator)
	})

	let itemFile = setUpFile(`${dataPath}/json/${btl.guild.id}/items.json`, true);

	collector.on('collect', async i => {
		btl.action.laststate = menustate;
		let alreadyResponded = false;

		let testbtl = setUpFile(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, true);
		if (testbtl.forcemessage && i.message.id != testbtl.forcemessage) {
			collector.stop();
			alreadyResponded = true;

			await updateMsg(i, {
				content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
				embeds: [DiscordEmbed],
				components: setUpComponents(char, testbtl, menustate)
			});

			return;
		}

		let color = elementColors[char.mainElement] ?? elementColors.strike;
		if (typeof char.mainElement === "object")
			color = elementColors[char.mainElement[0]] ?? elementColors.strike;

		DiscordEmbed = new Discord.MessageEmbed()
			.setColor(color)
			.setTitle(`Turn #${btl.turn} - ${char.name}'s turn`)
			.setDescription(statDesc)
			.addFields({name: 'Opponents', value: teamDesc, inline: true}, {name: 'Allies', value: myTeamDesc, inline: true})

		switch(i.customId) {
			case 'melee':
				btl.action.move = 'melee';
				btl.action.melee = makeMelee(char);

				if ((btl.action.melee.target === "one" || btl.action.melee.target === "spreadopposing" || btl.action.melee.target === "widespreadopposing" || btl.action.melee.target === "casterandfoe")) {
					let alivecount = 0;
					let alivenum = [0, 0];

					for (let k in btl.teams) {
						if (k == char.team) continue;

						for (let j in btl.teams[k].members) {
							if (btl.teams[k].members[j].hp > 0) {
								alivenum = [k, j];
								alivecount++;
							}
						}
					}

					if (alivecount == 1) {
						btl.action.target = alivenum;
						alreadyResponded = true;

						doAction(char, btl, btl.action);
						collector.stop();

						return updateMsg(i, {
							content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
							embeds: [DiscordEmbed],
							components: []
						});
					} else {
						menustate = MENU_TEAMSEL;
					}
				} else if (btl.action.melee.target === "ally" || btl.action.melee.target === "spreadallies" || btl.action.melee.target === "widespreadallies" || btl.action.melee.target === "casterandally") {
					btl.action.target[0] = char.team;
					if (btl.teams[char.team].members.length == 1) {
						alreadyResponded = true;

						doAction(char, btl, btl.action);
						collector.stop();

						return updateMsg(i, {
							content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
							embeds: [DiscordEmbed],
							components: []
						});
					} else
						menustate = MENU_TARGET;
				} else if (btl.action.melee.target === "caster") {
					btl.action.target = [char.team, char.pos];
					alreadyResponded = true;
					doAction(char, btl, btl.action);
					collector.stop();

					await updateMsg(i, {
						content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
						embeds: [DiscordEmbed],
						components: []
					});
				} else {
					btl.action.target = [undefined, undefined];
					doAction(char, btl, btl.action);
					collector.stop();
					alreadyResponded = true;

					await updateMsg(i, {
						content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
						embeds: [DiscordEmbed],
						components: []
					});
				}
				break;

			case 'skills':
			case 'skill':
				btl.action.move = 'skills';

				if (char.pet) {
					btl.action.index = char.pet.skill;
					menustate = MENU_TEAMSEL;
				} else
					menustate = MENU_SKILL;

				break;

			case 'items':
				btl.action.move = 'item';
				menustate = MENU_ITEM;
				break;

			case 'tactics':
				btl.action.move = 'tactic';
				menustate = MENU_TACTICS;
				break;

			case 'guard':
				btl.action.move = 'guard';
				btl.action.index = 'guard';
				btl.action.target = [char.team, char.id];
				alreadyResponded = true;

				doAction(char, btl, btl.action);
				collector.stop();

				return updateMsg(i, {
					content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
					embeds: [DiscordEmbed],
					components: []
				});

			case 'run':
				btl.action.move = 'run';
				btl.action.index = 'run';
				btl.action.target = [char.team, char.id];

				if (btl.trial) {
					btl.action.move = 'save';
					btl.action.index = btl.trial.name;
					doAction(char, btl, btl.action);
					collector.stop();
				} else if (btl.bossbattle)
					DiscordEmbed.title = "You cannot run away from boss battles!";
				else if (btl.pvp) {
					if (char.leader) {
						menustate = MENU_FORFEIT;
						DiscordEmbed.title = "Would you like to forfeit? This will make your team the loser.";
					} else {
						DiscordEmbed.title = "Only the leader can forfeit!";
					}
				} else {
					doAction(char, btl, btl.action);
					collector.stop();
				}

				alreadyResponded = true;
				return updateMsg(i, {
					content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
					embeds: [DiscordEmbed],
					components: setUpComponents(char, btl, menustate)
				});

			case 'pacify':
				btl.action.move = 'pacify';
				menustate = MENU_TEAMSEL;
				break;

			case 'equipment':
				menustate = MENU_EQUIPMENT;
				break;

			case 'weapon':
				btl.action.move = 'weapon';
				menustate = MENU_WEAPONS;
				break;

			case 'armor':
				btl.action.move = 'armor';
				menustate = MENU_ARMORS;
				break;

			case 'backup':
				if (!char.leader) {
					DiscordEmbed.title = "Only the leader can change party members!";
					alreadyResponded = true;

					await updateMsg(i, {
						content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
						embeds: [DiscordEmbed],
						components: setUpComponents(char, btl, menustate)
					});
				}

				btl.action.move = 'backup';
				btl.action.target = [char.team, undefined];
				menustate = MENU_TARGET;
				break;

			case 'enemyinfo':
				btl.action.move = 'enemyinfo';
				menustate = MENU_TEAMSEL;
				break;

			case 'lb':
				btl.action.move = 'lb';

				if (canUseLb(char, btl)) {
					let lbDefs = objClone(canUseLb(char, btl));

					if (lbDefs.target) {
						if (lbDefs.target === 'allopposing' || lbDefs.target === 'allallies' || lbDefs.target === 'everyone' || lbDefs.target == 'caster' || lbDefs.target.includes('random')) {
							btl.action.target = [undefined, undefined];
							alreadyResponded = true;
							doAction(char, btl, btl.action);
							collector.stop();

							await updateMsg(i, {
								content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
								embeds: [DiscordEmbed],
								components: []
							});
						}
					}

					menustate = MENU_TEAMSEL;
					break;
				}

			case 'tc':
				btl.action.move = 'tc';
				btl.action.target[0] = char.team;
				menustate = MENU_TARGET;
				break;

			case 'transform':
				btl.action.move = 'transform';
				btl.action.target = [char.team, char.pos];

				let transformations = [];
				for (let i in char.transformations) {
					if (canTransform(char, btl, i)) transformations.push(i);
				}

				if (transformations.length > 1)
					menustate = MENU_TRANSFORMATIONS;
				else {
					btl.action.index = transformations[0];
					alreadyResponded = true;

					doAction(char, btl, btl.action);
					collector.stop();

					return updateMsg(i, {
						content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
						embeds: [DiscordEmbed],
						components: []
					});
				}

				break;

			case 'back':
				menustate = MENU_ACT;
				break;

			default:
				if (menustate == MENU_SKILL && skillFile[i.customId] && (btl.action.move === 'bb-fusionskill' || char.skills.includes(i.customId))) {
					let skill = skillFile[i.customId];

					if (btl.action.move === 'bb-fusionskill' && !btl.action.fusionskill) {
						btl.action.skills = [btl.action.index, i.customId];
						btl.action.fusionskill = targFusionSkill(btl.action.index, i.customId, btl);
						skill = skillFile[btl.action.fusionskill];

						if (skill.statusses && hasStatus(skill, 'mimic')) {
							menustate = MENU_ANYSEL;
						} else if ((skill.target === "one" || skill.target === "spreadopposing" || skill.target === "widespreadopposing" || skill.target === "casterandfoe")) {
							let alivecount = 0;
							let alivenum = [0, 0];

							for (let k in btl.teams) {
								if (k == char.team) continue;

								for (let j in btl.teams[k].members) {
									if (btl.teams[k].members[j].hp > 0) {
										alivenum = [k, j];
										alivecount++;
									}
								}
							}

							if (alivecount == 1) {
								btl.action.target = alivenum;
								alreadyResponded = true;
								doAction(char, btl, btl.action);

								collector.stop();
								return updateMsg(i, {
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: []
								});
							} else {
								menustate = MENU_TEAMSEL;
							}
						} else if (skill.target === "ally" || skill.target === "spreadallies" || skill.target === "widespreadallies" || skill.target === "casterandally") {
							btl.action.target[0] = char.team;
							if (btl.teams[char.team].members.length == 1) {
								alreadyResponded = true;

								doAction(char, btl, btl.action);
								collector.stop();

								return updateMsg(i, {
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: []
								});
							} else
								menustate = MENU_TARGET;
						} else if (skill.target === "caster") {
							btl.action.target = [char.team, char.pos];
							alreadyResponded = true;
							doAction(char, btl, btl.action);
							collector.stop();

							await updateMsg(i, {
								content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
								embeds: [DiscordEmbed],
								components: []
							});
						} else {
							btl.action.target = [undefined, undefined];
							doAction(char, btl, btl.action);
							collector.stop();
							alreadyResponded = true;

							await updateMsg(i, {
								content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
								embeds: [DiscordEmbed],
								components: []
							});
						}
					} else {
						if (btl.action.fusionskill) delete btl.action.fusionskill;

						btl.action.index = i.customId;

						if (skill.extras) {
							for (let k in skill.extras) {
								if (!extrasList[k]) continue;
								if (!extrasList[k].canuse) continue;

								if (extrasList[k].multiple) {
									for (let l in skill.extras[k]) {
										let txt = extrasList[k].canuse(char, skill, btl, skill.extras[k][l]);
										if (txt !== true) {
											DiscordEmbed.title = txt;
											alreadyResponded = true;

											return updateMsg(i, {
												content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
												embeds: [DiscordEmbed],
												components: []
											});
										}
									}
								} else {
									let txt = extrasList[k].canuse(char, skill, btl, skill.extras[k]);
									if (txt !== true) {
										DiscordEmbed.title = txt;
										alreadyResponded = true;

										return updateMsg(i, {
											content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
											embeds: [DiscordEmbed],
											components: setUpComponents(char, btl, menustate)
										});
									}
								}
							}
						} else if (skill.heal) {
							for (let k in skill.heal) {
								if (!healList[k]) continue;
								if (!healList[k].canuse) continue;

								if (healList[k].multiple) {
									for (let l in skill.heal[k]) {
										let txt = healList[k].canuse(char, skill, btl, skill.heal[k][l]);
										if (txt !== true) {
											DiscordEmbed.title = txt;
											alreadyResponded = true;

											return updateMsg(i, {
												content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
												embeds: [DiscordEmbed],
											});
										}
									}
								} else {
									let txt = healList[k].canuse(char, skill, btl, skill.heal[k]);
									if (txt !== true) {
										DiscordEmbed.title = txt;
										alreadyResponded = true;

										return updateMsg(i, {
											content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
											embeds: [DiscordEmbed],
											components: setUpComponents(char, btl, menustate)
										});
									}
								}
							}
						}

						// CanUseSkill passives
						if (doPassives(btl)) {
							for (let s of char.skills) {
								let pskill = skillFile[s];

								if (pskill && pskill.type == 'passive') {
									for (let k in pskill.passive) {
										if (!passiveList[k]) continue;
										if (!passiveList[k].canuseskill) continue;

										if (passiveList[k].multiple && pskill.passive[k]) {
											for (let l in pskill.passive[k]) {
												let txt = passiveList[k].canuseskill(char, skill, pskill, btl, pskill.passive[k][l]);

												if (txt !== true) {
													DiscordEmbed.title = txt;
													alreadyResponded = true;

													return updateMsg(i, {
														content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
														embeds: [DiscordEmbed],
													});
												}
											}
										} else {
											let txt = passiveList[k].canuseskill(char, skill, pskill, btl, pskill.passive[k]);

											if (txt !== true) {
												DiscordEmbed.title = txt;
												alreadyResponded = true;

												return updateMsg(i, {
													content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
													embeds: [DiscordEmbed],
													components: setUpComponents(char, btl, menustate)
												});
											}
										}
									}
								}
							}
						}

						if (btl.terrain && btl.terrain.type === "blindingradiance" && ((typeof(skill.type) === "string" && skill.type === "curse") || (typeof(skill.type) === "object" && skill.type.includes("curse")))) {
							DiscordEmbed.title = "The cursed energy dissapears as soon as it appears...";
							alreadyResponded = true;

							return updateMsg(i, {
								content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
								embeds: [DiscordEmbed],
								components: setUpComponents(char, btl, menustate)
							});
						} else if (btl.terrain && btl.terrain.type === "eternaldarkness" && ((typeof(skill.type) === "string" && skill.type === "bless") || (typeof(skill.type) === "object" && skill.type.includes("bless")))) {
							DiscordEmbed.title = "The blessed energy dissapears as soon as it appears...";
							alreadyResponded = true;

							return updateMsg(i, {
								content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
								embeds: [DiscordEmbed],
								components: setUpComponents(char, btl, menustate)
							});
						}

						if (char.status && statusEffectFuncs[char.status.toLowerCase()] && statusEffectFuncs[char.status.toLowerCase()].canuse) {
							let canUse = statusEffectFuncs[char.status.toLowerCase()].canuse(char, skill, btl)

							if (canUse && canUse[1] != true) {
								DiscordEmbed.title = canUse[0];
								alreadyResponded = true;

								await updateMsg(i, {
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: setUpComponents(char, btl, menustate)
								});
							}
						}

						if (skill.statusses) {
							for (let k in skill.statusses) {
								if (!statusList[k]) continue;
								if (!statusList[k].canuse) continue;

								if (statusList[k].multiple) {
									for (let l in skill.statusses[k]) {
										let txt = statusList[k].canuse(char, skill, btl, skill.statusses[k][l]);
										if (txt !== true) {
											DiscordEmbed.title = txt;
											alreadyResponded = true;

											return updateMsg(i, {
												content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
												embeds: [DiscordEmbed],
												components: []
											});
										}
									}
								} else {
									let txt = statusList[k].canuse(char, skill, btl, skill.statusses[k]);
									if (txt !== true) {
										DiscordEmbed.title = txt;
										alreadyResponded = true;

										return updateMsg(i, {
											content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
											embeds: [DiscordEmbed],
											components: setUpComponents(char, btl, menustate)
										});
									}
								}
							}

							if (char.status && statusEffectFuncs[char.status.toLowerCase()] && statusEffectFuncs[char.status.toLowerCase()].canuse) {
								let canUse = statusEffectFuncs[char.status.toLowerCase()].canuse(char, skill, btl)

								if (canUse && canUse[1] != true) {
									DiscordEmbed.title = canUse[0];
									alreadyResponded = true;

									await updateMsg(i, {
										content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
										embeds: [DiscordEmbed],
										components: setUpComponents(char, btl, menustate)
									});
								}
							}
						}

						if (hasStatus(skill, 'mimic')) {
							menustate = MENU_ANYSEL;
						} else if ((skill.target === "one" || skill.target === "spreadopposing" || skill.target === "widespreadopposing" || skill.target === "casterandfoe")) {
							let alivecount = 0;
							let alivenum = [0, 0];

							for (let k in btl.teams) {
								if (k == char.team) continue;

								for (let j in btl.teams[k].members) {
									if (btl.teams[k].members[j].hp > 0) {
										alivenum = [k, j];
										alivecount++;
									}
								}
							}

							if (alivecount == 1 && !canFusionSkill(char, btl, skill)) {
								btl.action.target = alivenum;
								alreadyResponded = true;
								doAction(char, btl, btl.action);

								collector.stop();
								return updateMsg(i, {
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: []
								});
							} else {
								menustate = MENU_TEAMSEL;
							}
						} else if (skill.target === "ally" || skill.target === "spreadallies" || skill.target === "widespreadallies" || skill.target === "casterandally") {
							btl.action.target[0] = char.team;
							if (btl.teams[char.team].members.length == 1 && !canFusionSkill(char, btl, skill)) {
								alreadyResponded = true;

								doAction(char, btl, btl.action);
								collector.stop();

								return updateMsg(i, {
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: []
								});
							} else
								menustate = MENU_TARGET;
						} else if (skill.target === "caster") {
							if (!canFusionSkill(char, btl, skill)) {
								btl.action.target = [char.team, char.pos];
								alreadyResponded = true;
								doAction(char, btl, btl.action);
								collector.stop();

								await updateMsg(i, {
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: []
								});
							} else
								menustate = MENU_TARGET;
						} else {
							if (!canFusionSkill(char, btl, skill)) {
								btl.action.target = [undefined, undefined];
								doAction(char, btl, btl.action);
								collector.stop();
								alreadyResponded = true;

								await updateMsg(i, {
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: []
								});
							} else
								menustate = MENU_TARGET;
						}
					}
				} else if (menustate == MENU_ITEM && itemFile[i.customId]) {
					btl.action.index = i.customId;
					let item = itemFile[i.customId];
					let itemdta = itemData[item.type];

					if (!itemdta) {
						DiscordEmbed.title = "Something went wrong... Please try something else!";

						return updateMsg(i, {
							content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
							embeds: [DiscordEmbed],
							components: []
						});
					}

					if (!itemdta.target || itemdta.target === "one" || itemdta.target === "spreadopposing" || itemdta.target === "casterandfoe") {
						menustate = MENU_TEAMSEL;
					} else if (itemdta.target === "ally" || itemdta.target === "spreadallies" || itemdta.target === "casterandally") {
						btl.action.target[0] = char.team;
						menustate = MENU_TARGET;
					} else if (itemdta.target === "caster") {
						btl.action.target = [char.team, char.id];
						alreadyResponded = true;
						doAction(char, btl, btl.action);
						collector.stop();

						await updateMsg(i, {
							content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
							embeds: [DiscordEmbed],
							components: []
						});
					} else {
						btl.action.target = [undefined, undefined];
						alreadyResponded = true;
						doAction(char, btl, btl.action);
						collector.stop();

						await updateMsg(i, {
							content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
							embeds: [DiscordEmbed],
							components: []
						});
					}
				} else if ((menustate == MENU_TEAMSEL || menustate == MENU_ANYSEL) && btl.teams[i.customId]) {
					btl.action.target[0] = parseInt(i.customId);
					menustate = MENU_TARGET;

					if (parseInt(i.customId) != char.team) {
						teamDesc = '';
						for (let i in btl.teams[btl.action.target[0]].members) {
							let c = btl.teams[btl.action.target[0]].members[i];
							let l = c.leader ? leaderEmoji : i;

							if (c.hp <= 0) {
								teamDesc += `~~${l}: ${c.name} _(DOWN)_~~\n`;
							} else {
								let s = c.pacified ? itemTypeEmoji.pacify : (c.status ? `${statusEmojis[c.status]}` : '');
								teamDesc += `${l}: ${s}${c.name} _(${c.hp}/${c.maxhp}HP, ${c.mp}/${c.maxmp}${c.mpMeter ? c.mpMeter[1] : "MP"})_\n`;
							}
						}

						DiscordEmbed.fields = [{name: 'Opponents', value: teamDesc, inline: true}, {name: 'Allies', value: myTeamDesc, inline: true}];
					}
				} else if (menustate == MENU_TARGET && btl.teams[btl.action.target[0]]) {
					btl.action.target[1] = parseInt(i.customId);
					let targ;

					switch(btl.action.move) {
						case 'pacify':
							if (btl.teams[btl.action.target[0]].members[i.customId]) {
								targ = btl.teams[btl.action.target[0]].members[i.customId];

								if (!targ.negotiate || targ?.negotiate == [] || targ?.negotiate?.length <= 0) {
									DiscordEmbed.title = `${targ.name} seems adamant on attacking and will not listen to reason.`;
									alreadyResponded = true;

									await updateMsg(i, {
										content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
										embeds: [DiscordEmbed],
										components: setUpComponents(char, btl, menustate)
									})
								} else {
									DiscordEmbed = new Discord.MessageEmbed()
										.setColor('#fcba03')
										.setTitle(`__${char.name}__ => __${targ.name}__`)
										.setDescription(`Try pacifying __${targ.name}__ to calm it down! _So far, __${targ.name}__ is **${targ.pacify}% pacified**_!`)
										.addFields()

									for (let k in targ.negotiate)
										DiscordEmbed.fields.push({name: `**[${k}]** __${targ.negotiate[k].name}__`, value: targ.negotiate[k].desc ?? 'No description.', inline: true});

									menustate = MENU_PACIFY;
									alreadyResponded = true;

									await updateMsg(i, {
										content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
										embeds: [DiscordEmbed],
										components: setUpComponents(char, btl, menustate)
									})
								}
							}

							break;
						
						case 'backup':
							if (btl.teams[char.team].members[i.customId]) {
								targ = btl.teams[char.team].members[i.customId];
								btl.action.target[1] = parseInt(i.customId);

								DiscordEmbed = new Discord.MessageEmbed()
									.setColor('#fcba03')
									.setTitle(`__${char.name}__ => __${targ.name}__`)
									.setDescription(`Select one of your allies to replace ${targ.name} with.`)
									.addFields()

								for (let k in btl.teams[char.team].backup) {
									let f = btl.teams[char.team].backup[k];
									DiscordEmbed.fields.push({name: `**[${k}]** __${f.name}__`, value: `${f.hp}/${f.maxhp}HP\n${f.mp}/${f.maxmp}${f.mpMeter ? f.mpMeter[1] : "MP"}`, inline: true});
								}
								menustate = MENU_BACKUP;
								alreadyResponded = true;

								await updateMsg(i, {
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: setUpComponents(char, btl, menustate)
								});
							}

							break;
						
						case 'enemyinfo':
							if (btl.teams[btl.action.target[0]].members[i.customId]) {
								targ = btl.teams[btl.action.target[0]].members[i.customId];

								if (!targ.enemy) {
									DiscordEmbed.title = `${targ.name} isn't an enemy!`;
									alreadyResponded = true;

									await updateMsg(i, {
										content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
										embeds: [DiscordEmbed],
										components: setUpComponents(char, btl, menustate)
									});
								} else if (!foundEnemy(targ.truename, btl.guild.id)) {
									DiscordEmbed.title = `We've yet to learn about ${targ.name}.`;
									alreadyResponded = true;

									await updateMsg(i, {
										content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
										embeds: [DiscordEmbed],
										components: setUpComponents(char, btl, menustate)
									})
								} else {
									let enemyFile = setUpFile(`${dataPath}/json/${btl.guild.id}/enemies.json`);
									alreadyResponded = true;
									menustate = MENU_ENEMYINFO;

									await updateMsg(i, {
										content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
										embeds: [longDescription(enemyFile[targ.truename], enemyFile[targ.truename].level, btl.guild.id, i)],
										components: setUpComponents(char, btl, menustate)
									})
								}
							}

							break;
						
						case 'tc':
							if (btl.action.target[0] == char.team) {
								btl.action.ally = parseInt(i.customId);
							
								if (multipleTeams) {
									menustate = MENU_TEAMSEL;
									btl.action.target[0] = undefined;
								} else {
									menustate = MENU_TARGET;
									btl.action.target[0] = op;
								}

								await updateMsg(i, {
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: setUpComponents(char, btl, menustate)
								});
							} else {
								btl.action.target[1] = parseInt(i.customId);
								alreadyResponded = true;

								doAction(char, btl, btl.action);
								collector.stop();

								await updateMsg(i, {
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: []
								});
							}
							break;

						case 'bb-fusionskill':
						case 'bb-fusionspell':
							if (btl.action.fusionskill) {
								doAction(char, btl, btl.action);
								alreadyResponded = true;
								collector.stop();

								await updateMsg(i, {
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: []
								});
							} else if (btl.teams[char.team].members[i.customId]) {
								btl.action.ally = parseInt(i.customId);
								menustate = MENU_SKILL;
							}
							break;

						default:
							if (i.customId == 'bb-fusionskill') {
								btl.action.move = 'bb-fusionskill';
								menustate = MENU_TARGET;
							} else {
								doAction(char, btl, btl.action);
								alreadyResponded = true;
								collector.stop();

								await updateMsg(i, {
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: []
								});
							}
					}
				} else if (menustate == MENU_FORFEIT) {
					if (i.customId === 'forfeit') {
						btl.action.move = 'forfeit';
						alreadyResponded = true;

						for (let i in btl.teams[char.team].members)
							btl.teams[char.team].members[i].hp = 0;

						doAction(char, btl, btl.action);
						collector.stop();

						await updateMsg(i, {
							content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
							embeds: [DiscordEmbed],
							components: []
						});
					}
				} else if (menustate == MENU_PACIFY) {
					btl.action.index = parseInt(i.customId);
					alreadyResponded = true;

					let targ = btl.teams[btl.action.target[0]].members[btl.action.target[1]];
					let negotiation = targ.negotiate[btl.action.index];

					if (!negotiation.specials?.math) { 
						doAction(char, btl, btl.action);
					} else {
						btl.action.negotiation = negotiation.specials.math;
						let special = btl.action.negotiation;

						let essentials = special[0];
						let optionals = special[1];
						
						let bracketals = [];
						let expressionAmount = special[2];
						
						let possibleOperators = operators.filter(x => essentials[Object.keys(essentials)[operators.indexOf(x)]] == true);
						if (optionals.remainders) possibleOperators.push('%');
						
						if (optionals.parenthesis) bracketals.push('parenthesis');
						if (optionals.roots) bracketals.push('roots');
						
						let equation;
						let result;
						
						function makeEquation() {
							let curFloats = possibleMathFloats.filter(f => f.length - 2 <= optionals.decimals)
							equation = [utilityFuncs.randBetweenNums(optionals.negativeNumbers ? -10 : 0, 10)];
							if (optionals.decimals >= 1 && Math.random()*100 <= 30) equation[0] += Math.min(Math.max(parseFloat(curFloats[Math.floor(Math.random() * curFloats.length)]), optionals.negativeNumbers ? -10 : 0), 10);
							equation[0] = equation[0].toString();
							if (equation[0] < 0) equation[0] = `(${equation[0]})`;
						
							let currentOperator;
							let currentNumber;
						
							for (let i = 0; i < expressionAmount; i++) {
								currentOperator = possibleOperators[utilityFuncs.randNum(possibleOperators.length - 1)];
						
								currentNumber = [utilityFuncs.randBetweenNums(optionals.negativeNumbers ? -10 : 0, 10)];
								if (optionals.decimals >= 1 && Math.random()*100 <= 40) currentNumber += Math.min(Math.max(parseFloat(curFloats[Math.floor(Math.random() * curFloats.length)]), optionals.negativeNumbers ? -10 : 0), 10);
								
								if (currentOperator == '/' || currentOperator == '%') {
									currentNumber = Math.trunc(currentNumber);
									while (currentNumber == 0 || currentNumber == NaN) currentNumber = [utilityFuncs.randBetweenNums(optionals.negativeNumbers ? -10 : 0, 10)];
								}
								if (currentNumber < 0) currentNumber = `(${currentNumber})`
						
								if (Math.random() * 100 <= 80 - (30 / expressionAmount)) {
									currentNumber = Math.trunc(parseFloat(currentNumber));
						
									if (currentNumber < 0) currentNumber = `(${currentNumber})`
						
									let expoNum = utilityFuncs.randBetweenNums(optionals.negativeNumbers ? -5 : 0, 5)
						
									if (expoNum < 0) expoNum = `(${expoNum})`
						
									currentNumber += '**' + expoNum;
								}
						
								equation.push(currentOperator, currentNumber.toString())
							}
						
							let randomChance = 90;
							if (optionals.roots || optionals.parenthesis) {
								while (Math.random() * 100 <= randomChance) {
									currentOptional = bracketals[utilityFuncs.randNum(bracketals.length - 1)]
									if (currentOptional == 'parenthesis' && equation.length <= 3) { 
										currentOptional.slice(0);
										continue;
									}
						
									let i = utilityFuncs.randNum(equation.length - 1);
									if (i % 2 != 0) i--;
									while (currentOptional == 'parenthesis' && i > equation.length - 1) { 
										i = utilityFuncs.randNum(equation.length - 1);
										if (i % 2 != 0) i--;
									}
						
									let i2 = utilityFuncs.randBetweenNums(i + (currentOptional == 'parenthesis' ? 2 : 0), equation.length - 1);
									if (i2 % 2 != 0) i2 += currentOptional == 'parenthesis' ? 1 : (Math.random() <= 0.5) ? -1 : 1;
									while (currentOptional == 'parenthesis' && (i == 0 && i2 == equation.length - 1 && equation.length > 3)) {
										i2 = utilityFuncs.randBetweenNums(i + 2, equation.length - 1);
										if (i2 % 2 != 0) i2 += 1;
									}
						
									let specifiedList = []
									let backupEquation = equation;
									for (let index = i; index <= i2; index++) specifiedList.push(equation[index]);
									equation.splice(i, i2, [...specifiedList].flat(Infinity));
						
									equation[i].push((currentOptional == 'roots' ? (specifiedList.length == 1 ? '' : ')')+` )` : ')') + ((optionals.exponents && Math.random()*100 <= 30) ? '**'+utilityFuncs.randBetweenNums(optionals.negativeNumbers ? -10 : 0, 10) : ''));
									equation[i].unshift((currentOptional == 'roots' ? ('nthroot('+utilityFuncs.randBetweenNums(2, 3)+','+(specifiedList.length == 1 ? '' : ' (')) : '('));
						
									try { //sometimes this errors out
										if (currentOptional == 'roots' && (isNaN(eval(equation[i].flat(Infinity).join(' '))) || Math.abs(eval(equation[i].flat(Infinity).join(' '))) === Infinity || Math.abs(eval(equation[i].flat(Infinity).join(' '))) <= 0)) { 
											equation = backupEquation;
											continue;
										}
									} catch (e) {
										equation = backupEquation;
										continue;
									}
									if (currentOptional == 'parenthesis' && equation.length <= 3) currentOptional.slice(0);
									if (equation.length <= 1) break;
						
									randomChance -= 45 / (currentOptional == 'parenthesis' ? 1.3 : 1) / (expressionAmount / 1.6);
								}
							}
						
							equation = equation.flat(Infinity).join(' ');
							try { //sometimes this errors out
								result = Math.trunc(eval(equation)*100)/100;
							} catch (e) {
								result = NaN
							}
						
							if (result == -0) result = 0;
						}
						
						while (Math.abs(result) == Infinity || isNaN(result) || Math.abs(result) > 2000) makeEquation();
						
						equation = equation.replace(/\*+\(?\-?\d+\)?/g, function(x) {
							return x.replace(/[^\d\-?]/g, '').replace(/[\d|\-]/g, function(x2) {return superscriptDictionary[x2]});
						}).replace(/nthroot\(\d+,+[' '|\(\)\+-\/\*%|a-z|A-Z|0-9|⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+\)/g, function(x) {
							return x.replace(/nthroot\(\d+,/g, function(x2) {
								x2 = x2.replace(',', '');
								let x3 = x2.replace(/nthroot\(2?/, '');
								let exponi = ''
								for (a of x3) exponi += superscriptDictionary[a];
						
								return exponi+'√(';
							}).replace(/\(\([' '|\(\)\+-\/\*%|a-z|A-Z|0-9|⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+\)/g, function(x) {
								return x.slice(1, -1);
							});
						}).replace(/ {2,}/g, ' ')
						console.log(equation, '=', result);
						if (result % 1 != 0) console.log('It rounded to the nearest intenger is:',Math.round(result));
						
						let roundedResult = Math.round(result);

						let answers = [0]
						while (answers.length < 5) {
							let range = 2 * roundedResult + 5 + (roundedResult * (100 / (answers.length * 0.7)) / 100);
							let num = Math.round(utilityFuncs.randBetweenNums(range * -1, range));

							if (answers.some(x => x == num) || isNaN(num) || num == roundedResult) continue;

							answers.push(num.toString());
						}
						answers.shift();
						answers.splice(utilityFuncs.randNum(answers.length), 0, roundedResult.toString());

						btl.action.question = {
							title: `${char.name} => ${targ.name}`,
							desc: (negotiation.action ?? `%PLAYER% tries to pacify ${targ.name}\nbut they are presented with a math equation.`) + `\n\n_Solve: **${equation}**. What is the answer${result % 1 != 0 ? ', rounded to the nearest intenger' :''}?_`,
							answers: answers,
							correctAnswer: answers.indexOf(roundedResult.toString())
						}
						btl.action.timer = special[3]*1000;

						menustate = MENU_QUESTION;
						btl.intendedstate = menustate;
						sendStateEmbed(char, btl);
					}

					alreadyResponded = true;
					collector.stop();
					await updateMsg(i, {
						content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
						embeds: [DiscordEmbed],
						components: []
					});
				} else if (menustate == MENU_BACKUP) {
					btl.action.index = parseInt(i.customId);
					alreadyResponded = true;
					doAction(char, btl, btl.action);
					collector.stop();

					await updateMsg(i, {
						content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
						embeds: [DiscordEmbed],
						components: []
					});
				} else if (menustate == MENU_TRANSFORMATIONS && char.transformations[i.customId]) {
					if (canTransform(char, btl, i.customId)) {
						btl.action.index = i.customId;
						alreadyResponded = true;
						doAction(char, btl, btl.action);
						collector.stop();

						await updateMsg(i, {
							content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
							embeds: [DiscordEmbed],
							components: []
						});
					}
				} else if (menustate == MENU_WEAPONS) {
					if (char.weapons[i.customId]) {
						btl.action.index = i.customId;
					} else {
						btl.action.index = 'unequip';
						btl.action.unequip = true;
					}

					alreadyResponded = true;
					doAction(char, btl, btl.action);
					collector.stop();

					await updateMsg(i, {
						content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
						embeds: [DiscordEmbed],
						components: []
					});
				} else if (menustate == MENU_ARMORS) {
					if (char.armors[i.customId]) {
						btl.action.index = i.customId;
					} else {
						btl.action.index = 'unequip';
						btl.action.unequip = true;
					}

					alreadyResponded = true;
					doAction(char, btl, btl.action);
					collector.stop();

					await updateMsg(i, {
						content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
						embeds: [DiscordEmbed],
						components: []
					});
				}
		}

		switch(menustate) {
			case MENU_TEAMSEL:
				if (!multipleTeams) {
					menustate = MENU_TARGET;
					btl.action.target[0] = op;
					DiscordEmbed.title = '**Choose a target!**';
				} else {
					DiscordEmbed.title = '**Choose a team to target.**';
				}

				break;

			case MENU_TARGET:
				DiscordEmbed.title = '**Choose a target!**';
				break;
		}

		if (alreadyResponded) return;

		await updateMsg(i, {
			content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
			embeds: [DiscordEmbed],
			components: setUpComponents(char, btl, menustate)
		})
	})
}

doAction = (char, btl, action) => {
	let party = btl.teams[char.team];
	var DiscordEmbed;

	let color = elementColors[char.mainElement] ?? elementColors.strike;
	if (typeof char.mainElement === "object")
		color = elementColors[char.mainElement[0]] ?? elementColors.strike;

	delete btl.canteamcombo;
	if (char.fusionskill) delete char.fusionskill;

	// Okay, let's run this code.
	if (!action) {
		char.guard = 0.45;

		let mpget = Math.max(1, Math.round((char.maxmp/100*5)-5+randNum(1,10)));
		char.mp = Math.min(char.maxmp, Math.round(char.mp+mpget));

		DiscordEmbed = new Discord.MessageEmbed()
			.setColor(color)
			.setTitle(`${char.name} => Self`)
			.setDescription(`${char.name} guards! This reduces damage, and restores **${mpget}${char.mpMeter ? char.mpMeter[1] : "MP"}**!`)
		btl.channel.send({embeds: [DiscordEmbed]});
	} else {
		switch(action.move) {
			case 'melee':
				useSkill(char, btl, action, action.melee);
				break;

			case 'skill':
			case 'skills':
				if (char.pet) {
					useSkill(char, btl, action, skillFile[char.pet.skill] ?? skillFile.Agi);
				} else {
					useSkill(char, btl, action);
					char.lastskill = action.index;
				}

				break;

			case 'bb-fusionskill':
			case 'bb-fusionspell':
				action.index = action.fusionskill;

				// Buffed up character. Average of both stats*1.5.
				let char3 = btl.teams[char.team].members[action.ally];
				let charf = objClone(char);
				for (let i in charf.stats) charf.stats[i] = (char.stats[i]+char3.stats[i])/2;

				// Set up the fusion skill.
				let fusionSkill = objClone(skillFile[action.fusionskill]);

				// Fusion Skills with generic power.
				if (fusionSkill.generic) {
					fusionSkill.pow = 0;

					let skilldata;
					for (let i in action.skills) {
						if (skillFile[action.skills[i]]) {
							skilldata = skillFile[action.skills[i]];
							fusionSkill.pow += (skilldata.pow ? parseInt(skilldata.pow*(skilldata.hits ?? 1)) : (100*skillTier(skilldata)));
						}
					}

//					if (char.trust && char.trust[char3.truename] && char.trust[char3.truename].level) fusionSkill.pow *= Math.min(1.5, 1 + (char.trust[char3.truename].level/30));
				}

				// Use the skill.
				useSkill(charf, btl, action, fusionSkill, char3);

				if (skillFile[action.skills[0]].cost && skillFile[action.skills[0]].costtype)
					useCost(char, skillFile[action.skills[0]].cost, skillFile[action.skills[0]].costtype, btl);
				if (skillFile[action.skills[1]].cost && skillFile[action.skills[1]].costtype)
					useCost(char3, skillFile[action.skills[1]].cost, skillFile[action.skills[1]].costtype, btl);

				char.fusionskill = action.skills[0];
				char3.fusionskill = action.skills[1];

				let settings = setUpSettings(btl.guild.id);
				changeTrust(char3, char, Math.round((skillFile[action.fusionskill].trustgain ?? 30)*(settings.rates.trustrate ?? 1)));
				break;

			case 'item':
				let itemFile = setUpFile(`${dataPath}/json/${btl.guild.id}/items.json`, true);
				let itemTxt = '';

				if (party.items[action.index] && itemFile[action.index] && party.items[action.index] > 0) {
					party.items[action.index]--;
					itemTxt = itemData[itemFile[action.index].type].func(char, btl.teams[action.target[0]].members[action.target[1]], objClone(itemFile[action.index]), btl);

					if (party.items[action.index] <= 0) delete party.items[action.index];
				} else {
					itemTxt = "...But the party doesn't have any of that item left...?";
				}

				// Now, send the embed!
				DiscordEmbed = new Discord.MessageEmbed()
					.setColor(color)
					.setTitle('Using Item...')
					.setDescription(itemTxt.replace(/\n{3,}/, () => "\n\n"))
				btl.channel.send({embeds: [DiscordEmbed]});
				break;

			case 'guard':
				char.guard = 0.45;

				let mpget = Math.max(1, Math.round((char.maxmp/100*5)-5+randNum(1,10)));
				char.mp = Math.min(char.maxmp, Math.round(char.mp+mpget));

				DiscordEmbed = new Discord.MessageEmbed()
					.setColor(color)
					.setTitle(`${char.name} => Self`)
					.setDescription(`${char.name} guards! This reduces damage, and restores **${mpget}${char.mpMeter ? char.mpMeter[1] : "MP"}**!`)
				btl.channel.send({embeds: [DiscordEmbed]});
				break;

			case 'weapon':
				if (action.unequip) {
					DiscordEmbed = new Discord.MessageEmbed()
						.setColor(color)
						.setTitle(`${char.name} => Self`)
						.setDescription(`__${char.name}__ unequipped their ${classEmoji.weapon[char.curweapon.class] ?? '<:bladed:1008794351591239842>'}**${char.curweapon.name}**.`)
					btl.channel.send({embeds: [DiscordEmbed]});

					unequipWeapon(char, btl);
				} else {
					if (char.curweapon) {
						DiscordEmbed = new Discord.MessageEmbed()
							.setColor(color)
							.setTitle(`${char.name} => Self`)
							.setDescription(`__${char.name}__ unequipped their ${classEmoji.weapon[char.curweapon.class] ?? '<:bladed:1008794351591239842>'}**${char.curweapon.name}**, and equipped the ${classEmoji.weapon[char.weapons[action.index].class] ?? '<:bladed:1008794351591239842>'}**${char.weapons[action.index].name}**!`)
						btl.channel.send({embeds: [DiscordEmbed]});
					} else {
						DiscordEmbed = new Discord.MessageEmbed()
							.setColor(color)
							.setTitle(`${char.name} => Self`)
							.setDescription(`__${char.name}__ equipped the ${classEmoji.weapon[char.weapons[action.index].class] ?? '<:bladed:1008794351591239842>'}**${char.weapons[action.index].name}**!`)
						btl.channel.send({embeds: [DiscordEmbed]});
					}

					equipWeapon(char, action.index, btl);
				}

				break;

			case 'armor':
				if (action.unequip) {
					DiscordEmbed = new Discord.MessageEmbed()
						.setColor(color)
						.setTitle(`${char.name} => Self`)
						.setDescription(`__${char.name}__ unequipped their ${classEmoji.armor[char.curarmor.class] ?? '<:bladed:1008794351591239842>'}**${char.curarmor.name}**.`)
					btl.channel.send({embeds: [DiscordEmbed]});

					unequipArmor(char, btl);
				} else {
					if (char.curweapon) {
						DiscordEmbed = new Discord.MessageEmbed()
							.setColor(color)
							.setTitle(`${char.name} => Self`)
							.setDescription(`__${char.name}__ unequipped their ${classEmoji.armor[char.curarmor.class] ?? '<:bladed:1008794351591239842>'}**${char.curarmor.name}**, and equipped the ${classEmoji.armor[char.armors[action.index].class] ?? '<:bladed:1008794351591239842>'}**${char.armors[action.index].name}**!`)
						btl.channel.send({embeds: [DiscordEmbed]});
					} else {
						DiscordEmbed = new Discord.MessageEmbed()
							.setColor(color)
							.setTitle(`${char.name} => Self`)
							.setDescription(`__${char.name}__ equipped the ${classEmoji.armor[char.armors[action.index].class] ?? '<:bladed:1008794351591239842>'}**${char.armors[action.index].name}**!`)
						btl.channel.send({embeds: [DiscordEmbed]});
					}

					equipArmor(char, action.index, btl);
				}

				break;
			
			case 'run':
				let avgSpd = 0;
				let totalFoes = 0;
				for (let i in btl.teams) {
					if (i == char.team) continue;

					for (let k in btl.teams[i].members) {
						if (btl.teams[i].members[k].hp > 0) {
							avgSpd += statWithBuff(btl.teams[i].members[k].stats.agl, btl.teams[i].members[k].buffs.agl, btl.teams[i].members[k]);
							totalFoes++;
						}
					}
				}
				avgSpd /= totalFoes;

				let runCheck = (90 + ((statWithBuff(char.stats.agl, char.buffs.agl, char) - avgSpd)/2));
				if (randNum(100) <= runCheck) {
					// You know what... for fun...
					let runTexts = [
						// the most common one
						"You escaped from the enemies!",
						"You escaped from the enemies!",
						"You escaped from the enemies!",
						"You escaped from the enemies!",
						"You escaped from the enemies!",
						"You escaped from the enemies!",

						// Now, here's where the fun starts!
						"Get out, GET OUT!!",
						"It's pizza time!",
						"Like zoinks, we gotta get outta here!",
						"If we Naruto Run, we can move faster than their attacks",
						"YOU CAN ESCAPE",
						"THY END IS LATER",
						"sorry guys my mom called she said i have to go do the dishes",
						"NIGERUNDAYOOOOOOOOOOOOOO",
						"i realize now i have walked into the wrong room.",
						"Aight i'mma head out",
						"that really was a Blossom Battle",
						"sonic: i gotta get out of here bro The newest spice runners dlc dropped and i gotta pla",
						"blossom BLAST",

						"Nah, I'd escape.",
						"Let me out, let mE OUUUUUUU",
						"OH MY GOD THEY'RE BALLING WE GOTTA GET OUTTA HE",
						"Not today inconspicuously-shaped IRS agents!",
						"No food or movies? I'm outta here!",
						"Have a nice fall you stupid bi-",
						"Don't stop me now.",
						"WARRRRRP STARRRRRRRR",
						"BeGONE!",
						"You can escape!",

						"You flee from the enemies, letting them kill again.",
						"Youre sparing them. They beat you up, and youre sparing them.",
						"You decide to flee from the innocent creatures you so rudely decided to kill.",

						"Well, we'll be back!",
						"Sorry, but this is the wrong number.",
						"Hold on, we left the oven on...",
						"Wait, I forgot I wasn't supposed to be here...",
						"Bro, you smell awful and i'm leaving",
						"I got places to be!",
						"Gonna schmoove my way outta here!",

						"I've got places to beeeeeeeeeee. I'm outta here!",
					];

					DiscordEmbed = new Discord.MessageEmbed()
						.setColor(color)
						.setTitle('Running Away!')
						.setDescription(runTexts[randNum(runTexts.length-1)])
					btl.channel.send({embeds: [DiscordEmbed]});

					runFromBattle(char, btl, 0)
					return;
				} else {
					DiscordEmbed = new Discord.MessageEmbed()
						.setColor(color)
						.setTitle('Running Away!')
						.setDescription("You couldn't get away!")
					btl.channel.send({embeds: [DiscordEmbed]});
					break;
				}

			case 'forfeit':
				DiscordEmbed = new Discord.MessageEmbed()
					.setColor(color)
					.setTitle('Forfeiting!')
					.setDescription(`Team ${btl.teams[char.team].name} is forfeiting the match!`)
				btl.channel.send({embeds: [DiscordEmbed]});
				break;

			case 'pacify':
				doPacify(char, btl, btl.action);
				break;

			case 'backup':
				let char1 = objClone(btl.teams[char.team].members[action.target[1]]);
				let char2 = objClone(btl.teams[char.team].backup[action.index]);
				btl.teams[char.team].backup[action.index] = objClone(char1);
				btl.teams[char.team].members[action.target[1]] = objClone(char2);

				DiscordEmbed = new Discord.MessageEmbed()
					.setColor(color)
					.setTitle(`__${char.name}__ => __${char1.name}__, __${char2.name}__`)
					.setDescription(`__${char.name}__ decided to swap __${char1.name}__ for __${char2.name}__.\n___${char2.name}__ will fight in __${char1.name}'s__ place._`.replace(/\n{3,}/, () => "\n\n"))
				btl.channel.send({embeds: [DiscordEmbed]});
				break;

			case 'lb':
				let aType = (char.stats.atk > char.stats.mag) ? 'physical' : 'magic';
				let lbDefs = objClone(canUseLb(char, btl));
				lbDefs.acc = 100;
				lbDefs.crit = 0;
				lbDefs.costtype = 'lb';
				lbDefs.limitbreak = true;
				lbDefs.atktype = aType;
				lbDefs.cost = char.lbp;

				if (lbDefs.class == 'heal') lbDefs.target = 'allallies';

				useSkill(char, btl, action, lbDefs);
				break;

			case 'tc':
				// lets get the mean of all 2 participants' stats.
				let ally = btl.teams[char.team].members[action.ally];
				let avgchar = objClone(char);
				for (let i in avgchar.stats) avgchar.stats[i] = (char.stats[i]+ally.stats[i])/2;

				if (!hasTeamCombo(char, ally)) {
					DiscordEmbed = new Discord.MessageEmbed()
						.setColor(color)
						.setTitle(`__${char.name}__ => __${ally.name}__`)
						.setDescription(`__${char.name}__ tried to attack with __${ally.name}__... but it failed...?`.replace(/\n{3,}/, () => "\n\n"))
					btl.channel.send({embeds: [DiscordEmbed]});
				} else {
					// Now...
					let tc = objClone(hasTeamCombo(char, ally));
					tc.forcefree = true;
					tc.teamcombo = true;

					tc.acc = 100;
					tc.crit = 0;
					tc.pow = 0;
					let skills = [objClone(char.skills), objClone(ally.skills)];
					let skillFile = setUpFile(`${dataPath}/json/skills.json`, true);

					for (let i in skills) {
						skills[i].filter(s => !skillFile[s]);
						skills[i].sort(function(a, b) {return skillFile[b].pow - skillFile[a].pow});
						tc.pow += skillFile[skills[i][0]].pow;
					}

					tc.pow /= tc.hits ?? 1;
					useSkill(avgchar, btl, action, tc, ally);

					if (skillFile[skills[0][0]].cost && skillFile[skills[0][0]].costtype) {
						useCost(char, skillFile[skills[0][0]].cost, skillFile[skills[0][0]].costtype, btl);
					}
					if (skillFile[skills[1][0]].cost && skillFile[skills[1][0]].costtype) {
						useCost(ally, skillFile[skills[1][0]].cost, skillFile[skills[1][0]].costtype, btl);
					}

					char.donetc = true;

					let settings = setUpSettings(btl.guild.id);
					changeTrust(ally, char, Math.round(30*(settings.rates.trustrate ?? 1)), true, btl.channel);
				}
				break;

			case 'transform':
				doTransformation(char, btl.action.index, btl);

				DiscordEmbed = new Discord.MessageEmbed()
					.setColor(color)
					.setTitle(`${char.name} => Self`)
					.setDescription(`${char.name} undergoes a transformation, taking their ${btl.action.index} form!`)
				btl.channel.send({embeds: [DiscordEmbed]});
				break;

			case 'save':
				DiscordEmbed = new Discord.MessageEmbed()
					.setColor(color)
					.setTitle('Saving trial...')
					.setDescription('You can resume this trial by using the "resumetrial" command.')
				btl.channel.send({embeds: [DiscordEmbed]});

				saveTrial(btl);
				return;
		}
	}

	// Status Effects.
	let onturntxt = '';
	if (char.status && statusEffectFuncs[char.status.toLowerCase()] && statusEffectFuncs[char.status.toLowerCase()].endturn) {
		onturntxt += statusEffectFuncs[char.status.toLowerCase()].endturn(btl, char) ?? '';
		if (onturntxt != '') onturntxt += '\n';

		if (char.hp <= 0) {
			if (statusEffectFuncs[char.status.toLowerCase()].onremove) statusEffectFuncs[char.status.toLowerCase()].onremove(btl, char);
			delete char.status;
			delete char.statusturns;
		} else {
			if (!statusEffectFuncs[char.status.toLowerCase()].onturn) {
				char.statusturns--;
				if (char.statusturns <= 0) {
					if (statusEffectFuncs[char.status.toLowerCase()]?.onremove) statusEffectFuncs[char.status.toLowerCase()].onremove(btl, char);
					delete char.status;
					delete char.statusturns;
				}
			}
		}
	}

	// Stackable statusses
	let stackable = [];
	for (let i in statusEffectFuncs) {
		if (statusEffectFuncs[i].stackable) stackable.push(i);
	}

	for (let i in stackable) {
		if (char[stackable[i]] && statusEffectFuncs[stackable[i]] && statusEffectFuncs[stackable[i]].endturn) {
			onturntxt += statusEffectFuncs[stackable[i]].endturn(btl, char) ?? '';
			if (onturntxt != '') onturntxt += '\n';

			if (char.hp <= 0) {
				if (statusEffectFuncs[stackable[i]].onremove) statusEffectFuncs[stackable[i]].onremove(btl, char);
				delete char[stackable[i]];
			} else {
				if (!statusEffectFuncs[stackable[i]].onturn) {
					char[stackable[i]]--;
					if (char[stackable[i]] <= 0) {
						if (statusEffectFuncs[stackable[i]]?.onremove) statusEffectFuncs[stackable[i]].onremove(btl, char);
						delete char[stackable[i]];
					}
				}
			}
		}
	}

	// Custom Variable EndTurn
	if (char.custom) {
		for (let i in char.custom) {
			if (customVariables[i] && customVariables[i].endturn) charStats = customVariables[i].endturn(btl, char, char.custom[i]);
		}
	}

	// Passive endturn.
	if (doPassives(btl) && char.hp > 0) {
		for (let s of char.skills) {
			let skill = skillFile[s];

			if (skill && skill.type == 'passive') {
				for (let i in skill.passive) {
					if (passiveList[i] && passiveList[i].endturn) {
						if (passiveList[i].multiple) {
							for (let k in skill.passive[i]) onturntxt += (passiveList[i].endturn(btl, char, action, skill.passive[i][k]) ?? '');;
						} else {
							onturntxt += (passiveList[i].endturn(btl, char, action, skill.passive[i]) ?? '');
						}
					}
				}
			}
		}
	}

	// Lastly, weather and terrain.
	if (btl.weather && weatherFuncs && weatherFuncs[btl.weather.type] && weatherFuncs[btl.weather.type].onturn) {
		let txt = (!char.status || (char.status && char.status != 'cloud9')) ? weatherFuncs[btl.weather.type].onturn(char, btl) : null;
		if (txt != null) onturntxt += `\n${txt}`;

		btl.weather.turns--;
		if (btl.weather.turns == 0) {
			onturntxt += `\nThe ${btl.weather.type} is clearing up.`;

			if (btl.weather.force) {
				btl.weather.type = btl.weather.force
				btl.weather.turns = -1;
			} else {
				delete btl.weather;
			}
		}
	}

	if (btl.terrain && terrainFuncs && terrainFuncs[btl.terrain.type] && terrainFuncs[btl.terrain.type].onturn) {
		let txt = (!char.status || (char.status && char.status != 'airborne')) ? terrainFuncs[btl.terrain.type].onturn(char, btl) : null;
		if (txt != null) onturntxt += `\n${txt}`;

		btl.terrain.turns--;
		if (btl.terrain.turns == 0) {
			onturntxt += `\nThe ${btl.terrain.type} is clearing up.`;
	
			if (btl.terrain.force) {
				btl.terrain.type = btl.terrain.force
				btl.terrain.turns = -1;
			} else {
				delete btl.terrain;
			}
		}
	}

	if (onturntxt != '') {
		let DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#ff1fa9')
			.setTitle(`__${char.name}'s__ Turn!`)
			.setDescription(onturntxt.replace(/\n{3,}/, () => "\n\n"))

		btl.channel.send({embeds: [DiscordEmbed]});
	}

	// Save file data
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, JSON.stringify(btl, '	', 4));

	setTimeout(function() {
		let party = btl.teams[char.team];
		if (char.leader && party.curpet && party.pets && party.pets[party.curpet] && !btl.petturn) {
			btl.petturn = true;

			let petchar = objClone(char);
			delete petchar.leader;

			let pet = party.pets[party.curpet];
			petchar.pet = pet;

			petchar.stats = pet.stats;
			petchar.name = pet.nickname;
			petchar.melee = pet.melee ?? {name: "Strike Attack", type: "strike", pow: 30, acc: 95, crit: 15};
			petchar.quotes = {};
			fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, JSON.stringify(btl, '	', 4));

			sendCurTurnEmbed(petchar, btl);
		} else {
			delete btl.petturn;
			advanceTurn(btl);
		}
	}, 2000)
}

doTurn = async(btl, noTurnEmbed) => {
	let char = getCharFromTurn(btl);
	let settings = setUpSettings(btl.guild.id);
	
	// Skip this turn if we're dead or pacified or in backup
	if (char == "backup" || char.hp <= 0 || char.pacified) return advanceTurn(btl);

	if (char.forceskipturnorder) {
		delete char.forceskipturnorder;
		return advanceTurn(btl);
	}

	// IsNaN?
	let charFile = setUpFile(`${dataPath}/json/${btl.guild.id}/characters.json`, true);

	if (badVal(char.hp) && charFile[char.truename]) char.hp = charFile[char.truename].hp;
	if (badVal(char.mp) && charFile[char.truename]) char.mp = charFile[char.truename].mp;
	if (badVal(char.maxhp) && charFile[char.truename]) char.maxhp = charFile[char.truename].maxhp;
	if (badVal(char.maxmp) && charFile[char.truename]) char.maxmp = charFile[char.truename].maxmp;

	// a
	let statusTxt = '';

	// Heal Leader Skills
	let party = btl.teams[char.team];
	if (settings?.mechanics?.leaderskills && char.leader && party?.leaderskill && party.leaderskill.type === 'heal') {
		let lowest = 9999999; // lmao. I highly doubt you have over 9999999 HP.
		let lowestid = 0;
		for (let i in party.members) {
			if (party.members[i].hp > 0 && !party.members[i].custom?.pinch && party.members[i].hp <= lowest) {
				lowest = party.members[i].hp;
				lowestid = i;
			}
		}

		if (party.members[lowestid] && party.members[lowestid].hp < party.members[lowestid].maxhp) {
			let healhp = Math.round((party.members[lowestid].maxhp/100)*party.leaderskill.var2);
			party.members[lowestid].hp = Math.min(party.members[lowestid].maxhp, party.members[lowestid].hp + healhp);
			statusTxt += `__${party.members[lowestid].name}__'s HP was restored by **${healhp}** due to __${char.name}__'s _Leader Skill_: **${party.leaderskill.name}**.`;
		}
	}

	// Start Of Turn passives.
	if (doPassives(btl)) {
		for (let s of char.skills) {
			let skill = skillFile[s];

			if (skill && skill.type == 'passive') {
				for (let i in skill.passive) {
					if (passiveList[i] && passiveList[i].onturn) {
						if (passiveList[i].multiple) {
							for (let k in skill.passive[i]) statusTxt += (passiveList[i].onturn(btl, char, skill.passive[i][k], skill) ?? '');;
						} else
							statusTxt += (passiveList[i].onturn(btl, char, skill.passive[i], skill) ?? '');

						if (statusTxt != '') statusTxt += '\n';
					}
				}
			}
		}
	}

	// Status Effects.
	let canMove = true;

	if (char.status && statusEffectFuncs[char.status.toLowerCase()]) {
		if (statusEffectFuncs[char.status.toLowerCase()].onturn) {
			let statusEff = (statusEffectFuncs[char.status.toLowerCase()].onturn(btl, char) ?? '');

			if (typeof(statusEff) === 'string')
				statusTxt += statusEff
			else if (typeof(statusEff) === 'object') {
				if (!statusEff[1]) canMove = false;
				statusTxt += statusEff[0]
			}

			if (statusTxt != '') statusTxt += '\n';
		} else if (statusEffectFuncs[char.status.toLowerCase()].turnoverride) {
			if (!statusEffectFuncs[char.status.toLowerCase()].turnoverride(btl, char)) canMove = false;
		}

		if (char.hp <= 0) {
			canMove = false;
			if (statusEffectFuncs[char.status.toLowerCase()].onremove) statusEffectFuncs[char.status].onremove(btl, char);
			delete char.status;
			delete char.statusturns;
		} else {
			if (char.status && !statusEffectFuncs[char.status.toLowerCase()].endturn) {
				char.statusturns--;
				if (char.statusturns <= 0) {
					if (statusEffectFuncs[char.status]?.onremove) statusEffectFuncs[char.status].onremove(btl, char);
					delete char.status;
					delete char.statusturns;
				}
			}
		}
	}

	let stackable = [];
	for (let i in statusEffectFuncs) {
		if (statusEffectFuncs[i].stackable) stackable.push(i);
	}

	for (let i in stackable) {
		if (char[stackable[i]] && statusEffectFuncs[stackable[i]]) {
			if (statusEffectFuncs[stackable[i]].onturn) {
				let statusEff = (statusEffectFuncs[stackable[i]].onturn(btl, char) ?? '');
	
				if (typeof(statusEff) === 'string')
					statusTxt += statusEff
				else if (typeof(statusEff) === 'object') {
					if (!statusEff[1]) canMove = false;
					statusTxt += statusEff[0]
				}
	
				if (statusTxt != '') statusTxt += '\n';
			} else if (statusEffectFuncs[stackable[i]].turnoverride) {
				if (!statusEffectFuncs[stackable[i]].turnoverride(btl, char)) canMove = false;
			}

			if (char.hp <= 0) {
				canMove = false;
				if (statusEffectFuncs[stackable[i]]?.onremove) statusEffectFuncs[stackable[i]].onremove(btl, char);
				delete char[stackable[i]];
			} else {
				if (!statusEffectFuncs[stackable[i]].endturn) {
					char[stackable[i]]--;
					if (char[stackable[i]] <= 0) {
						if (statusEffectFuncs[stackable[i]]?.onremove) statusEffectFuncs[stackable[i]].onremove(btl, char);
						delete char[stackable[i]];
					} 
				}
			}
		}
	}

	if (char.ignorestatus)
		delete char.ignorestatus;
	else {
		// Custom Variables.
		if (char.hp > 0 && char.custom) {
			for (let i in char.custom) {
				if (customVariables[i] && customVariables[i].onturn) {
					statusTxt += (customVariables[i].onturn(btl, char, char.custom[i]) ?? '');
					if (statusTxt != '') statusTxt += '\n';

					// Some other things...
					if (char.status === 'sleep') canMove = false;
					if (char?.custom?.forcemove) canMove = false;
					if (char?.custom?.evasionstate && !char?.custom?.evasionstate.canact) canMove = false;
					if (char?.custom?.firespin?.immobilize) canMove = false;

					if (char?.custom?.flinch) {
						canMove = false;
						delete char.custom.flinch;
					}
				}
			}
		}

		if (char.type && (char.type.includes("boss") || char.type.includes('bigboss') || char.type === "deity")) char.ignorestatus = true;
	}

	// Rest
	if (char.rest) {
		canMove = false;
		statusTxt += `\n${char.name} must rest to regain their energy.`;
		delete char.rest;
	}

	// Check the status of our allies...
	for (let i in btl.teams[char.team].members) {
		let ally = btl.teams[char.team].members;

		if (ally.hp <= 0 && !char.donetc) {
			btl.canteamcombo = true;
		} else if (ally.hp <= ally.maxhp/2 && !char.donetc) {
			btl.canteamcombo = randNum(1, 100) <= 50;
		}
	}

	console.log(`Can we team combo? ${btl.canteamcombo ? "Yes." : "No."}`);

	// Now send the embed
	if (statusTxt != '') {
		let DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#ff1fa9')
			.setTitle(`${char.name}'s turn!`)
			.setDescription(statusTxt.replace(/\n{3,}/, () => "\n\n"))

		btl.channel.send({embeds: [DiscordEmbed]});
	}

	setTimeout(function() {
		if (!canMove || char.hp <= 0) return advanceTurn(btl);
		if (noTurnEmbed) return;

		// Now... send the turn embed!
		if (char.enemy || char.automove)
			doEnemyTurn(char, btl);
		else
			sendCurTurnEmbed(char, btl);
	}, 150)
}

advanceTurn = (btl, firstturn) => {
	// Force End Battle
	console.log(forceEndBattles);
	if (forceEndBattles[`${btl.guild.id}-${btl.channel.id}`]) {
		fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
		forceEndBattles[`${btl.guild.id}-${btl.channel.id}`] = false;
		return;
	}

	// End the battle in a test battle.
	if (btl.testing && !firstturn) {
		let turnCheck = btl.curturn+1;

		if (btl.turnorder[turnCheck] == null) {
			btl.testing--;
		}
		if (btl.testing <= 0) {
			btl.channel.send("The test battle is now over!");
			fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
			return;
		}
	}

	// We should check for death first. While we're here, let's reset some things.
	let teamsleft = [];
	let onturntxt = ''; // can you shove me in here pweeeaaase <3

	for (let i in btl.teams) {
		let pLeft = btl.teams[i].members.length;

		for (let k in btl.teams[i].members) {
			let char = btl.teams[i].members[k];

			// Always update for Futuresight
			char.team = i;
			char.pos = k;

			// Bugfix
			if (char.status && char.status === "none") {
				delete char.status;
				delete char.statusturns;
			}

			// Max & Min LB
			char.lbp = Math.min(Math.max(char.lbp, 0), 1000);

			// This character is dead or pacified.
			if (char.hp <= 0 || char.pacified) {
				pLeft--;
				resetEffects(char);

				// If this character is a clone or reincarnate, remove them from the members.
				if (char.clone || char.reincarnate) { 
					btl.teams[i].members.splice(k, 1);
					while (btl.turnorder.indexOf(char.id) != -1) {
						if (btl.turnorder.indexOf(char.id) <= btl.curturn) btl.curturn--;
						btl.turnorder.splice(btl.turnorder.indexOf(char.id), 1); 
					}
				}

				// moving on...
				continue;
			}

			// Enemy extras
			if (char.decieve) {
				char.decieveturns--;
				if (char.decieveturns <= 0) {
					char.name = char.oldname;
					delete char.decieveturns;
					delete char.decieve;
					delete char.oldname;
				}
			} else if (char.enemyextras?.decieve && randNum(1, 5) <= 1) {
				let charname = objClone(char.name);
				char.oldname = charname;

				let nameswap = randNum(0, charname.length-1);
				let character = char.name[nameswap];
				console.log(character);

				if (character.toUpperCase() == character) {
					let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
					char.name = char.name.replace(character, chars[randNum(chars.length-1)]);
				} else {
					let chars = "abcdefghijklmnopqrstuvwxyz";
					char.name = char.name.replace(character, chars[randNum(chars.length-1)]);
				}

				char.decieve = true;
				char.decieveturns = 2;
				console.log(char.name, char.oldname);
			}

			// Turnorder hardcode
			if (char.forceskipturnorder) {
				char.forceskipturnorder--;
				if (char.forceskipturnorder <= 0) {
					delete char.forceskipturnorder;
				}
			}

			// Custom Variables.
			onturntxt = '';
			if (char.hp > 0 && char.custom) {
				for (let i in char.custom) {
					if (customVariables[i] && customVariables[i].nextmove) {
						onturntxt += (customVariables[i].nextmove(btl, char, char.custom[i]) ?? '');
						if (onturntxt != '') onturntxt += '\n';
					}
				}
			}

			if (onturntxt != '') {
				let DiscordEmbed = new Discord.MessageEmbed()
					.setColor('#ff1fa9')
					.setTitle(`${char.name}'s status!`)
					.setDescription(onturntxt.replace(/\n{3,}/, () => "\n\n"))

				btl.channel.send({embeds: [DiscordEmbed]});
			}
		}

		teamsleft[i] = pLeft;
	}

	// Let's see how many of us are alive.
	let lastAlive = 0;
	let teamsAlive = 0;
	for (let i in teamsleft) {
		if (teamsAlive > 1) break;
		if (teamsleft[i] > 0) {
			lastAlive = i; 
			teamsAlive++;
		}
	}

	// If there's only one team alive...
	if (teamsAlive <= 1) {
		let party = btl.teams[lastAlive] ?? btl.teams[0];

		if (btl.testing) {
			btl.channel.send(`Team ${party.name} have won! Therefore, the test battle is now over.`);
			fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
			return;
		}

		//clear reincarnates and clones
		for (let i in btl.teams) {
			while (btl.teams[i].members.some(m => m.reincarnate||m.clone)) {
				let char = btl.teams[i].members.find(m => m.reincarnate||m.clone);
				btl.teams[i].members.splice(btl.teams[i].members.indexOf(char), 1);
			}
		}

		if (btl.pvp) {
			pvpWin(btl, lastAlive);
		} else {
			// If it's not a pvp battle... then we're probably team 0.
			// If we're not team 0, fuck me i guess LOL
			if (party.enemyteam) {
				loseBattle(btl, 0)
			} else {
				winBattle(btl, 0)
			}
		}

		return;
	}

	let settings = setUpSettings(btl.guild.id);

	// Now, go to the next turn.
	if (btl.doonemore && settings.mechanics.onemores) {
		btl.channel.send("**[ONE MORE]**");
		delete btl.doonemore;
	} else {
		let newTurn = false;

		if (btl.curturn == null) {
			btl.curturn = 0;
			btl.turn = 1;
		} else {
			let toTurn = btl.curturn+1;

			if (btl.turnorder[toTurn] == null) {
				btl.curturn = 0;

				newTurn = true;
				btl.turn++;
			} else
				btl.curturn++;
		}

		// Quick Attack extra - TO BE DONE HERE
	}

	// Write Data.
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, JSON.stringify(btl, null, '    '));

	// Let's do this character's turn.
	doTurn(btl);
}