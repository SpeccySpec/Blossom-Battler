getCharFromTurn = (btl) => {
	let id = btl.turnorder[btl.curturn];
	return getCharFromId(id, btl);
}

getTurnOrder = (btl) => {
	let turnorder = [];

	for (const i in btl.teams) {
		for (const k in btl.teams[i].members) {
			let f = btl.teams[i].members[k];

			turnorder.push(objClone(f));
			if (f.type && (f.type.includes('boss') || f.type.includes('deity'))) turnorder.push(objClone(f));
		}
	}

	if (btl.terrain.type === 'psychic') {
		turnorder.sort(function(a, b) {
			let agl1 = statWithBuff(a.stats.agl, a.buffs.agl);
			let agl2 = statWithBuff(b.stats.agl, b.buffs.agl);
			return agl1 - agl2;
		});
	} else {
		turnorder.sort(function(a, b) {
			let agl1 = statWithBuff(a.stats.agl, a.buffs.agl);
			let agl2 = statWithBuff(b.stats.agl, b.buffs.agl);
			return agl2 - agl1;
		});
	}
	
	let order = [];
	for (let i in turnorder) order[i] = turnorder[i].id;
	
	console.log(order);
	return order;
}

leaderSkillsAtBattleStart = (party) => {
	if (!party.leaderskill)
		return false;

	if (party.leaderskill.type.toLowerCase() == 'buff') {
		for (const ally of party.members) buffStat(ally, party.leaderskill.var1.toLowerCase(), parseInt(party.leaderskill.var2));
		return true;
	}
}

const btnType = {
	blue: 'PRIMARY',
	grey: 'SECONDARY',
	green: 'SUCCESS',
	red: 'DANGER'
}

// Send an Interactable Turn Embed, buttons and all
makeButton = (name, emoji, color, lowercase, forceid) => {
	return new Discord.MessageButton({
		label: name,
		customId: forceid ?? (lowercase ? name : name.toLowerCase()),
		style: btnType[color.toLowerCase()] ?? 'SECONDARY',
		emoji: emoji
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

// Extra States (Misc. Shit like PVP)
MENU_ENEMYINFO = 8;
MENU_FORFEIT = 9;

function CalcCompins(comps, i) {
	const compins = Math.min(Math.floor(Math.max(i - 0.1, 0) / 4), 3)
	if (!comps[compins])
		comps[compins] = [];
	return compins
}

const menuStates = {
	[MENU_ACT]: ({char, btl, comps}) => {
		if (btl.action && btl.action.ally) delete btl.action.ally;

		comps[0] = [
			makeButton('Melee', elementEmoji.strike, 'red'),
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
	},
	[MENU_SKILL]: ({char, comps}) => {
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
			else if (skillinfo?.atktype === 'physical') 
				btncolor = 'red'
			comps[compins].push(makeButton(
				skillinfo?.name ?? skillname,
				skillinfo
					? elementEmoji[skillinfo.type]
					: elementEmoji.strike,
				btncolor, true, skillname)
			)
		}
	},
	[MENU_ITEM]: ({char, btl, comps}) => {
		let itemFile = setUpFile(`${dataPath}/json/${btl.guild.id}/items.json`);

		let k = 0;
		for (let i in btl.teams[char.team].items) {
			if (!itemFile[i]) continue;

			let item = itemFile[i];
			if (btl.teams[char.team].items[i] <= 0) continue;

			const compins = CalcCompins(comps, k)
			let btncolor = 'green';
			if (item?.type === 'skill') 
				btncolor = 'red';
			else if (item?.type === 'pacify') 
				btncolor = 'blue';

			comps[compins].push(makeButton(`${item?.name ?? i}: ${btl.teams[char.team].items[i]}`, itemTypeEmoji[item.type], btncolor, false, i))
			k++;
		}
	},
	[MENU_TACTICS]: ({btl, comps}) => {
		comps[0] = [];

		if (btl.pvp) {
			comps[0] = [
				makeButton('Forfeit', elementEmoji.wind, 'grey', true, 'run'),
				makeButton('Backup', '<:mental:973077052053921792>', 'blue')
			]
		} else {
			comps[0] = [
				makeButton('Run!', elementEmoji.wind, 'grey', true, 'run'),
				makeButton('Backup', '<:mental:973077052053921792>', 'blue'),
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
	[MENU_TEAMSEL]: ({char, btl, comps}) => {
		for (const i in btl.teams) {
			if (char.team == i) continue;
			comps[CalcCompins(comps, i)].push(makeButton(`Team ${btl.teams[i].name}`, '#️⃣', 'blue', true, i.toString()))
		}
	},
	[MENU_TARGET]: ({char, btl, comps}) => {
		let members = btl.teams[btl.action.target[0]].members ?? btl.teams[char.team].members;

		switch(btl.action.move) {
			case 'melee':
			case 'pacify':
			case 'enemyinfo':
			case 'lb':
				for (const i in members) {
					if (members[i].hp <= 0 || members[i].pacified) continue;
					comps[CalcCompins(comps, i)].push(
						makeButton(`${members[i].name}`, `${i}️⃣`, (btl.action.target[0] == char.team) ? 'green' : 'red', true, i.toString())
					)
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

				for (const i in members) {
					if (members[i].hp <= 0 || members[i].pacified) continue;

					if (members[i].team == char.team) {
						if (!hasTeamCombo(char, members[i])) continue;
					}

					comps[CalcCompins(comps, i)].push(
						makeButton(`${members[i].name}`, `${i}️⃣`, (btl.action.target[0] == char.team) ? 'green' : 'red', true, i.toString())
					)
				}

			default:
				let skill = skillFile[btl.action.index];
				for (const i in members) {
					if (!skill) continue;
					if (members[i].pacified) continue;

					if (skill.type === 'heal' && skill.heal.revive) {
						if (members[i].hp > 0) continue;
					} else {
						if (members[i].hp <= 0) continue;
					}

					comps[CalcCompins(comps, i)].push(
						makeButton(`${members[i].name}`, `${i}️⃣`, (btl.action.target[0] == char.team) ? 'green' : 'red', true, i.toString())
					)
				}
		}
	},
	
	[MENU_FORFEIT]: ({comps}) => {
		comps[0] = [makeButton('Yes!', elementEmoji.wind, 'red', true, 'forfeit')]
	},
	[MENU_ENEMYINFO]: ({char, btl, comps}) => {
		comps[0] = [makeButton('Finished Looking', '◀️', 'blue', true, 'back')]
	},
}

setUpComponents = (char, btl, menustate) => {
	let comps = []
	menuStates[parseInt(menustate)]({char, btl, comps})

	if (menustate != MENU_ACT && menustate != MENU_ENEMYINFO) {
		if (!comps[0] || !comps[0][0]) {
			comps[0] = [makeButton('Nothing Here :/', '◀️', 'grey', true, 'back')];
		} else {
			for (let i in comps) {
				if (comps[i].length < 5) {
					comps[i].push(makeButton('Back', '◀️', 'grey'));
					break;
				}
			}
		}
	}

	for (let i in comps)
		comps[i] = new Discord.MessageActionRow({components: comps[i]});

	return comps;
}

sendCurTurnEmbed = (char, btl) => {
	let settings = setUpSettings(btl.guild.id);

	let menustate = MENU_ACT;
	let statDesc = `${getBar('hp', char.hp, char.maxhp)}\t${getBar('mp', char.mp, char.maxmp)}\n${char.hp}/${char.maxhp}HP, ${char.mp}/${char.maxmp}MP`;
	
	if (settings.mechanics.limitbreaks) statDesc += `, ${char.lbp}LB%`;

	let weatherTxt = '';
	if (btl.weather) weatherTxt += `\nCurrently, the weather is ${btl.weather.type}.`;
	if (btl.terrain) weatherTxt += `\nCurrently, the terrain is ${btl.terrain.type}.`;
	statDesc += weatherTxt;

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
				let s = c.pacified ? itemTypeEmoji.pacify : (c.status ? `${statusEmojis[c.status]}` : '');
				teamDesc += `${l}: ${s}${c.name} _(${c.hp}/${c.maxhp}HP, ${c.mp}/${c.maxmp}MP)_\n`;
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
			let s = c.pacified ? itemTypeEmoji.pacify : (c.status ? `${statusEmojis[c.status]}` : '');
			myTeamDesc += `${l}: ${s}${c.name} _(${c.hp}/${c.maxhp}HP, ${c.mp}/${c.maxmp}MP)_\n`;
		}
	}

	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(elementColors[char.mainElement] ?? elementColors.strike)
		.setTitle(`Turn #${btl.turn} - ${char.name}'s turn`)
		.setDescription(statDesc)
		.addFields({name: 'Opponents', value: teamDesc, inline: true}, {name: 'Allies', value: myTeamDesc, inline: true})

	let message = {
		content: `<@${char.owner}>`,
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

	let collector = btl.channel.createMessageComponentCollector({
		filter: ({user}) => user.id == char.owner
	})

	let itemFile = setUpFile(`${dataPath}/json/${btl.guild.id}/items.json`, true);

	collector.on('collect', async i => {
		btl.action.laststate = menustate;
		let alreadyResponded = false;

		let testbtl = setUpFile(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, true);
		if (testbtl.forcemessage && i.message.id != testbtl.forcemessage) {
			collector.stop();
			alreadyResponded = true;

			await i.update({
				content: `<@${char.owner}>`,
				embeds: [DiscordEmbed],
				components: setUpComponents(char, testbtl, menustate)
			});

			return;
		}

		DiscordEmbed = new Discord.MessageEmbed()
			.setColor(elementColors[char.mainElement] ?? elementColors.strike)
			.setTitle(`Turn #${btl.turn} - ${char.name}'s turn`)
			.setDescription(statDesc)
			.addFields({name: 'Opponents', value: teamDesc, inline: true}, {name: 'Allies', value: myTeamDesc, inline: true})

		switch(i.customId) {
			case 'melee':
				btl.action.move = 'melee';
				menustate = MENU_TEAMSEL;
				break;

			case 'skills':
				btl.action.move = 'skills';
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

				return i.update({
					content: `<@${char.owner}>`,
					embeds: [DiscordEmbed]
				});

			case 'run':
				btl.action.move = 'run';
				btl.action.index = 'run';
				btl.action.target = [char.team, char.id];

				if (btl.bossbattle)
					DiscordEmbed.title = "You cannot run away from boss battles!";
				else if (btl.pvp) {
					if (char.leader) {
						menustate = MENU_FORFEIT;
						DiscordEmbed.title = "Would you like to forfeit? This will make your team the loser.";
					} else {
						DiscordEmbed.title = "Only the leader can forfeit!";
					}
				} else if (!char.leader) {
					DiscordEmbed.title = "Only the leader can flee from battles!";
				} else {
					doAction(char, btl, btl.action);
					collector.stop();
				}
				alreadyResponded = true;

				return i.update({
					content: `<@${char.owner}>`,
					embeds: [DiscordEmbed],
					components: setUpComponents(char, btl, menustate)
				});

			case 'pacify':
				btl.action.move = 'pacify';
				menustate = MENU_TEAMSEL;
				break;

			case 'backup':
				if (!char.leader) {
					DiscordEmbed.title = "Only the leader can change party members!";
					alreadyResponded = true;

					await i.update({
						content: `<@${char.owner}>`,
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
						if (lbDefs.target === 'allopposing' || lbDefs.target === 'allallies' || lbDefs.target === 'everyone' || lbDefs.target.includes('random')) {
							btl.action.target = [undefined, undefined];
							alreadyResponded = true;
							doAction(char, btl, btl.action);
							collector.stop();

							await i.update({
								content: `<@${char.owner}>`,
								embeds: [DiscordEmbed],
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

			case 'back':
				menustate = MENU_ACT;
				break;

			default:
				if (menustate == MENU_SKILL && skillFile[i.customId] && char.skills.includes(i.customId)) {
					btl.action.index = i.customId;
					let skill = skillFile[i.customId];

					if (skill.extras) {
						for (let k in skill.extras) {
							if (!extrasList[k]) continue;
							if (!extrasList[k].canuse) continue;

							if (extrasList[k].multiple) {
								for (let k in skill.extras[i]) {
									let txt = extrasList[k].canuse(char, skill, btl, skill.extras[k][k]);
									if (txt != true) {
										DiscordEmbed.title = txt;
										alreadyResponded = true;

										return i.update({
											content: `<@${char.owner}>`,
											embeds: [DiscordEmbed],
										});
									}
								}
							} else {
								let txt = extrasList[k].canuse(char, skill, btl, skill.extras[i]);
								if (txt != true) {
									DiscordEmbed.title = txt;
									alreadyResponded = true;

									return i.update({
										content: `<@${char.owner}>`,
										embeds: [DiscordEmbed],
										components: setUpComponents(char, btl, menustate)
									});
								}
							}
						}

						if (btl.terrain && btl.terrain.type === "blindingradiance" && ((typeof(skill.type) === "string" && skill.type === "curse") || (typeof(skill.type) === "object" && skill.type.includes("curse")))) {
							DiscordEmbed.title = "The cursed energy dissapears as soon as it appears...";
							alreadyResponded = true;

							return i.update({
								content: `<@${char.owner}>`,
								embeds: [DiscordEmbed],
								components: setUpComponents(char, btl, menustate)
							});
						} else if (btl.terrain && btl.terrain.type === "eternaldarkness" && ((typeof(skill.type) === "string" && skill.type === "bless") || (typeof(skill.type) === "object" && skill.type.includes("bless")))) {
							DiscordEmbed.title = "The blessed energy dissapears as soon as it appears...";
							alreadyResponded = true;

							return i.update({
								content: `<@${char.owner}>`,
								embeds: [DiscordEmbed],
								components: setUpComponents(char, btl, menustate)
							});
						}

						if (char.status && statusEffectFuncs[char.status.toLowerCase()] && statusEffectFuncs[char.status.toLowerCase()].canuse) {
							let canUse = statusEffectFuncs[char.status.toLowerCase()].canuse(char, skill, btl)

							if (canUse && canUse[1] != true) {
								DiscordEmbed.title = canUse[0];
								alreadyResponded = true;

								await i.update({
									content: `<@${char.owner}>`,
									embeds: [DiscordEmbed],
									components: setUpComponents(char, btl, menustate)
								});
							}
						}
					}

					if (skill.target === "one" || skill.target === "spreadopposing") {
						menustate = MENU_TEAMSEL;
					} else if (skill.target === "ally" || skill.target === "spreadallies") {
						btl.action.target[0] = char.team;
						menustate = MENU_TARGET;
					} else if (skill.target === "caster") {
						btl.action.target = [char.team, char.id];
						alreadyResponded = true;
						doAction(char, btl, btl.action);
						collector.stop();

						await i.update({
							content: `<@${char.owner}>`,
							embeds: [DiscordEmbed],
						});
					} else {
						btl.action.target = [undefined, undefined];
						doAction(char, btl, btl.action);
						collector.stop();
						alreadyResponded = true;

						await i.update({
							content: `<@${char.owner}>`,
							embeds: [DiscordEmbed],
						});
					}
				} else if (menustate == MENU_ITEM && itemFile[i.customId]) {
					btl.action.index = i.customId;
					let item = itemFile[i.customId];
					let itemdta = itemData[item.type];

					if (!itemdta.target || itemdta.target === "one" || itemdta.target === "spreadopposing") {
						menustate = MENU_TEAMSEL;
					} else if (itemdta.target === "ally" || itemdta.target === "spreadallies") {
						btl.action.target[0] = char.team;
						menustate = MENU_TARGET;
					} else if (itemdta.target === "caster") {
						btl.action.target = [char.team, char.id];
						alreadyResponded = true;
						doAction(char, btl, btl.action);
						collector.stop();

						await i.update({
							content: `<@${char.owner}>`,
							embeds: [DiscordEmbed],
						});
					} else {
						btl.action.target = [undefined, undefined];
						alreadyResponded = true;
						doAction(char, btl, btl.action);
						collector.stop();

						await i.update({
							content: `<@${char.owner}>`,
							embeds: [DiscordEmbed],
						});
					}
				} else if (menustate == MENU_TEAMSEL && btl.teams[i.customId]) {
					btl.action.target[0] = parseInt(i.customId);
					menustate = MENU_TARGET;

					teamDesc = '';
					for (let i in btl.teams[btl.action.target[0]].members) {
						let c = btl.teams[btl.action.target[0]].members[i];
						let l = c.leader ? leaderEmoji : i;

						if (c.hp <= 0) {
							teamDesc += `~~${l}: ${c.name} _(DOWN)_~~\n`;
						} else {
							let s = c.pacified ? itemTypeEmoji.pacify : (c.status ? `${statusEmojis[c.status]}` : '');
							teamDesc += `${l}: ${s}${c.name} _(${c.hp}/${c.maxhp}HP, ${c.mp}/${c.maxmp}MP)_\n`;
						}
					}

					DiscordEmbed.fields = [{name: 'Opponents', value: teamDesc, inline: true}, {name: 'Allies', value: myTeamDesc, inline: true}];
				} else if (menustate == MENU_TARGET && btl.teams[btl.action.target[0]] && btl.teams[btl.action.target[0]].members[i.customId]) {
					btl.action.target[1] = parseInt(i.customId);
					let targ;

					switch(btl.action.move) {
						case 'pacify':
							targ = btl.teams[btl.action.target[0]].members[i.customId];

							if (targ.negotiate == [] || targ.negotiate.length <= 0) {
								DiscordEmbed.title = `${targ.name} seems adamant on attacking and will not listen to reason.`;
								alreadyResponded = true;

								await i.update({
									content: `<@${char.owner}>`,
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
									DiscordEmbed.fields.push({name: `**[${k}]** __${targ.negotiate[k].name}__`, value: targ.negotiate[k].desc, inline: true});

								menustate = MENU_PACIFY;
								alreadyResponded = true;

								await i.update({
									content: `<@${char.owner}>`,
									embeds: [DiscordEmbed],
									components: setUpComponents(char, btl, menustate)
								})
							}
							break;
						
						case 'backup':
							targ = btl.teams[char.team].members[i.customId];
							btl.action.target[1] = parseInt(i.customId);

							DiscordEmbed = new Discord.MessageEmbed()
								.setColor('#fcba03')
								.setTitle(`__${char.name}__ => __${targ.name}__`)
								.setDescription(`Select one of your allies to replace ${targ.name} with.`)
								.addFields()

							for (let k in btl.teams[char.team].backup) {
								let f = btl.teams[char.team].backup[k];
								DiscordEmbed.fields.push({name: `**[${k}]** __${f.name}__`, value: `${f.hp}/${f.maxhp}HP\n${f.mp}/${f.maxmp}MP`, inline: true});
							}
							menustate = MENU_BACKUP;
							alreadyResponded = true;

							await i.update({
								content: `<@${char.owner}>`,
								embeds: [DiscordEmbed],
								components: setUpComponents(char, btl, menustate)
							});
						
						case 'enemyinfo':
							targ = btl.teams[btl.action.target[0]].members[i.customId];

							if (!targ.enemy) {
								DiscordEmbed.title = `${targ.name} isn't an enemy!`;
								alreadyResponded = true;

								await i.update({
									content: `<@${char.owner}>`,
									embeds: [DiscordEmbed],
									components: setUpComponents(char, btl, menustate)
								});
							} else if (!foundEnemy(targ.truename, btl.guild.id)) {
								DiscordEmbed.title = `We've yet to learn about ${targ.name}.`;
								alreadyResponded = true;

								await i.update({
									content: `<@${char.owner}>`,
									embeds: [DiscordEmbed],
									components: setUpComponents(char, btl, menustate)
								})
							} else {
								let enemyFile = setUpFile(`${dataPath}/json/${btl.guild.id}/enemies.json`);
								alreadyResponded = true;
								menustate = MENU_ENEMYINFO;

								await i.update({
									content: `<@${char.owner}>`,
									embeds: [longDescription(enemyFile[targ.truename], enemyFile[targ.truename].level, btl.guild.id, i)],
									components: setUpComponents(char, btl, menustate)
								})
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

								await i.update({
									content: `<@${char.owner}>`,
									embeds: [DiscordEmbed],
									components: setUpComponents(char, btl, menustate)
								});
							} else {
								btl.action.target[1] = parseInt(i.customId);
								alreadyResponded = true;

								doAction(char, btl, btl.action);
								collector.stop();

								await i.update({
									content: `<@${char.owner}>`,
									embeds: [DiscordEmbed],
								});
							}
							break;
					
						default:
							doAction(char, btl, btl.action);
							alreadyResponded = true;
							collector.stop();

							await i.update({
								content: `<@${char.owner}>`,
								embeds: [DiscordEmbed],
							});
					}
				} else if (menustate == MENU_FORFEIT) {
					if (i.customId === 'forfeit') {
						btl.action.move = 'forfeit';
						alreadyResponded = true;

						for (let i in btl.teams[char.team].members)
							btl.teams[char.team].members[i].hp = 0;

						doAction(char, btl, btl.action);
						collector.stop();

						await i.update({
							content: `<@${char.owner}>`,
							embeds: [DiscordEmbed],
						});
					}
				} else if (menustate == MENU_PACIFY) {
					btl.action.index = parseInt(i.customId);
					alreadyResponded = true;
					doAction(char, btl, btl.action);
					collector.stop();

					await i.update({
						content: `<@${char.owner}>`,
						embeds: [DiscordEmbed],
					});
				} else if (menustate == MENU_BACKUP) {
					btl.action.index = parseInt(i.customId);
					alreadyResponded = true;
					doAction(char, btl, btl.action);
					collector.stop();

					await i.update({
						content: `<@${char.owner}>`,
						embeds: [DiscordEmbed],
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

		await i.update({
			content: `<@${char.owner}>`,
			embeds: [DiscordEmbed],
			components: setUpComponents(char, btl, menustate)
		})
	})
}

doAction = (char, btl, action) => {
	let party = btl.teams[char.team];
	var DiscordEmbed;

	delete btl.canteamcombo;

	switch(action.move) {
		case 'melee':
			let atkType = 'physical'
			let targType = 'one'
			for (let skillName of char.skills) {
				let psv = skillFile[skillName];
				if (psv.type != 'passive' || !psv.passive) continue;

				if (psv.passive.magicmelee) atkType = 'magic';
				if (psv.passive.attackall) targType = 'allopposing';
			}

			let meleeAtk = {
				name: char.melee.name,
				type: char.melee.type,
				pow: char.melee.pow,
				acc: Math.min(100, char.melee.acc),
				crit: char.melee.crit,
				atktype: atkType,
				target: 'one'
			}

			useSkill(char, btl, action, meleeAtk);
			break;

		case 'skill':
		case 'skills':
			useSkill(char, btl, action);
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
				.setColor(elementColors[char.mainElement] ?? elementColors.strike)
				.setTitle('Using Item...')
				.setDescription(itemTxt)
			btl.channel.send({embeds: [DiscordEmbed]});
			break;

		case 'guard':
			char.guard = 0.45;

			let mpget = randNum(1, Math.round(char.level/10));
			char.mp = Math.min(char.maxmp, char.mp+mpget)

			DiscordEmbed = new Discord.MessageEmbed()
				.setColor(elementColors[char.mainElement] ?? elementColors.strike)
				.setTitle(`${char.name} => Self`)
				.setDescription(`${char.name} guards! This reduces damage, and restores ${mpget}MP!`)
			btl.channel.send({embeds: [DiscordEmbed]});
			break;
		
		case 'run':
			let runTxt = '';

			let avgSpd = 0;
			let totalFoes = 0;
			for (let i in btl.teams) {
				if (i == char.team) continue;

				for (let k in btl.teams[i].members) {
					if (btl.teams[i].members[k].hp > 0) {
						avgSpd += statWithBuff(btl.teams[i].members[k].stats.agl, btl.teams[i].members[k].buffs.agl);
						totalFoes++;
					}
				}
			}
			avgSpd /= totalFoes;

			let runCheck = (90 + ((statWithBuff(char.stats.agl, char.buffs.agl) - avgSpd)/2));
			if (randNum(100) <= runCheck) {
				DiscordEmbed = new Discord.MessageEmbed()
					.setColor(elementColors[char.mainElement] ?? elementColors.strike)
					.setTitle('Running Away!')
					.setDescription("You escaped from the enemies!")
				btl.channel.send({embeds: [DiscordEmbed]});

				runFromBattle(char, btl)
				return;
			} else {
				DiscordEmbed = new Discord.MessageEmbed()
					.setColor(elementColors[char.mainElement] ?? elementColors.strike)
					.setTitle('Running Away!')
					.setDescription("You couldn't get away!")
				btl.channel.send({embeds: [DiscordEmbed]});
				break;
			}

		case 'forfeit':
			DiscordEmbed = new Discord.MessageEmbed()
				.setColor(elementColors[char.mainElement] ?? elementColors.strike)
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
				.setColor(elementColors[char.mainElement] ?? elementColors.strike)
				.setTitle(`__${char.name}__ => __${char1.name}__, __${char2.name}__`)
				.setDescription(`__${char.name}__ decided to swap __${char1.name}__ for __${char2.name}__.\n___${char2.name}__ will fight in __${char1.name}'s__ place._`)
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

			useSkill(char, btl, action, lbDefs);
			break;

		case 'tc':
			// lets get the mean of all 2 participants' stats.
			let ally = btl.teams[char.team].members[action.ally];
			let avgchar = objClone(char);
			for (let i in avgchar.stats) avgchar.stats[i] = (char.stats[i]+ally.stats[i])/2;

			if (!hasTeamCombo(char, ally)) {
				DiscordEmbed = new Discord.MessageEmbed()
					.setColor(elementColors[char.mainElement] ?? elementColors.strike)
					.setTitle(`__${char.name}__ => __${ally.name}__`)
					.setDescription(`__${char.name}__ tried to attack with __${ally.name}__... but it failed...?`)
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
					useCost(char, skillFile[skills[0][0]].cost, skillFile[skills[0][0]].costtype);
				}
				if (skillFile[skills[1][0]].cost && skillFile[skills[1][0]].costtype) {
					useCost(ally, skillFile[skills[1][0]].cost, skillFile[skills[1][0]].costtype);
				}

				char.donetc = true;
			}
	}

	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, JSON.stringify(btl, '	', 4));

	setTimeout(function() {
		advanceTurn(btl);
	}, 2000)
}

doTurn = async(btl, noTurnEmbed) => {
	let char = getCharFromTurn(btl);
	let settings = setUpSettings(btl.guild.id);
	
	// Skip this turn if we're dead or pacified.
	if (char.hp <= 0 || char.pacified) return advanceTurn(btl);

	// a
	let statusTxt = '';

	// Start Of Turn passives.
	for (let skill of char.skills) {
		if (skill.type == 'passive') {
			for (let i in skill.passive) {
				if (passiveList[i] && passiveList[i].onturn) {
					if (passiveList[i].multiple) {
						for (let k in skill.passive[i]) statusTxt += (passiveList[i].onturn(btl, char, skill.passive[i][k]) ?? '');;
					} else
						statusTxt += (passiveList[i].onturn(btl, char, skill.passive[i]) ?? '');

					if (statusTxt != '') statusTxt += '\n';
				}
			}
		}
	}

	// Status Effects.
	let canMove = true;

	if (char.status && statusEffectFuncs[char.status.toLowerCase()]) {
		let statusEff = (statusEffectFuncs[char.status.toLowerCase()].onturn(btl, char) ?? '');

		if (typeof(statusEff) === 'string')
			statusTxt += statusEff
		else if (typeof(statusEff) === 'object') {
			if (!statusEff[1]) canMove = false;
			statusTxt += statusEff[0]
		}
		
		if (char.hp <= 0) {
			canMove = false;
			if (statusEffectFuncs[char.status].onremove) statusEffectFuncs[char.status].onremove(char);
			delete char.status;
			delete char.statusturns;
		} else {
			char.statusturns--;
			if (char.statusturns == 0) {
				if (statusEffectFuncs[char.status].onremove) statusEffectFuncs[char.status].onremove(char);
				delete char.status;
				delete char.statusturns;
			}
		}

		if (statusTxt != '') statusTxt += '\n';
	}

	let stackable = ['confusion', 'infatuation'];

	for (let i in stackable) {
		if (char[stackable[i]] && statusEffectFuncs[stackable[i]]) {
			let statusEff = (statusEffectFuncs[stackable[i]].onturn(btl, char) ?? '');

			if (typeof statusEff === 'string')
				statusTxt += statusEff
			else if (typeof statusEff === 'object') {
				if (!statusEff[1]) canMove = false;
				statusTxt += statusEff[0]
			}

			if (char.hp <= 0) {
				canMove = false;
				delete char[stackable[i]];
			} else {
				char[stackable[i]]--;
				if (char[stackable[i]] == 0) delete char[stackable[i]];
			}

			if (statusTxt != '') statusTxt += '\n';
		}
	}

	// Custom Variables.
	if (char.hp > 0 && char.custom) {
		for (let i in char.custom) {
			if (customVariables[i] && customVariables[i].onturn) {
				statusTxt += (customVariables[i].onturn(btl, char, char.custom[i]) ?? '');
				if (statusTxt != '') statusTxt += '\n';
			}
		}
	}

	// Lastly, weather and terrain.
	if (btl.weather && weatherFuncs && weatherFuncs[btl.weather.type] && weatherFuncs[btl.weather.type].onturn) {
		let txt = weatherFuncs[btl.weather.type].onturn(char, btl);
		if (txt != null) statusTxt += `\n${txt}`;

		btl.weather.turns--;
		if (btl.weather.turns == 0) {
			statusTxt += `\nThe ${btl.weather.type} is clearing up.`;

			if (btl.weather.force) {
				btl.weather.type = btl.weather.force
				btl.weather.turns = -1;
			} else {
				delete btl.weather;
			}
		}
	}
	
	if (btl.terrain && terrainFuncs && terrainFuncs[btl.terrain.type] && terrainFuncs[btl.terrain.type].onturn) {
		let txt = terrainFuncs[btl.terrain.type].onturn(char, btl);
		if (txt != null) statusTxt += `\n${txt}`;

		btl.terrain.turns--;
		if (btl.terrain.turns == 0) {
			statusTxt += `\nThe ${btl.weather.type} is clearing up.`;
	
			if (btl.terrain.force) {
				btl.terrain.type = btl.terrain.force
				btl.terrain.turns = -1;
			} else {
				delete btl.terrain;
			}
		}
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

	// Now send the embed
	if (statusTxt != '') {
		let DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#ff1fa9')
			.setTitle(`${char.name}'s turn!`)
			.setDescription(statusTxt)

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

advanceTurn = (btl) => {
	// End the battle in a test battle.
	if (btl.testing) {
		btl.testing--;
		if (btl.testing <= 0) {
			btl.channel.send("The test battle is now over!");
			fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
			return;
		}
	}

	// We should check for death first. While we're here, let's reset some things.
	let teamsleft = [];

	for (let i in btl.teams) {
		let pLeft = btl.teams[i].members.length;

		for (let k in btl.teams[i].members) {
			let char = btl.teams[i].members[k];

			// This character is dead or pacified.
			if (char.hp <= 0 || char.pacified) {
				pLeft--;
				resetEffects(char);
				continue;
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

	// Now, go to the next turn.
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

	// Write Data.
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, JSON.stringify(btl, null, '    '));

	// Let's do this character's turn.
	doTurn(btl);
}