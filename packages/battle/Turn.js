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

			turnorder.push(objClone(f));
			if (f.type && (f.type.includes('boss') || f.type.includes('deity'))) turnorder.push(objClone(f));
		}

		for (const k in btl.teams[i].backup) {
			let f = btl.teams[i].backup[k];

			turnorder.push(objClone(f));
			if (f.type && (f.type.includes('boss') || f.type.includes('deity'))) turnorder.push(objClone(f));
		}
	}

	if (btl?.terrain?.type === 'psychic') {
		turnorder.sort(function(a, b) {
			// Status Effects
			if (a.status && statusEffectFuncs[a.status] && statusEffectFuncs[a.status].skillmod) statusEffectFuncs[a.status].skillmod(a, a.stats, btl);
			if (b.status && statusEffectFuncs[b.status] && statusEffectFuncs[b.status].skillmod) statusEffectFuncs[b.status].skillmod(b, b.stats, btl);

			// Buffs
			let agl1 = statWithBuff(a.stats.agl, a.buffs.agl);
			let agl2 = statWithBuff(b.stats.agl, b.buffs.agl);

			return agl1 - agl2;
		});
	} else {
		turnorder.sort(function(a, b) {
			// Status Effects
			if (a.status && statusEffectFuncs[a.status] && statusEffectFuncs[a.status].skillmod) statusEffectFuncs[a.status].skillmod(a, a.stats, btl);
			if (b.status && statusEffectFuncs[b.status] && statusEffectFuncs[b.status].skillmod) statusEffectFuncs[b.status].skillmod(b, b.stats, btl);

			// Buffs
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

// Extra States (Misc. Shit like PVP)
MENU_TRANSFORMATIONS = 8;
MENU_ENEMYINFO = 9;
MENU_FORFEIT = 10;
MENU_ANYSEL = 11;

// States that require ne embeds
MENU_QUESTION = 12;

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

			let emoji1 = skillinfo ? elementEmoji[skillinfo.type] : elementEmoji.strike;
			if (typeof(skillinfo?.type) === 'object') emoji1 = skillinfo ? elementEmoji[skillinfo.type[0]] : elementEmoji.strike;

			let canselect = true;

			if (!canAfford(char, skillinfo)) {
				canselect = false;
			} else if (char.status) {
				switch(char.status.toLowerCase()) {
					case 'ego':
						if (skillinfo?.type === 'heal') canselect = false;
						break;

					case 'silence':
						if (skillinfo?.atktype === 'magic') canselect = false;
						break;

					case 'dazed':
						if (skillinfo?.atktype === 'physical' || skillinfo?.atktype === 'ranged') canselect = false;
						break;
				}
			}

			comps[compins].push(makeButton(skillinfo?.name ?? skillname, emoji1, btncolor, true, skillname, !canselect))
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
				makeButton('Forfeit', '<:boot:995268449154629699>', 'grey', true, 'run'),
				makeButton('Backup', '<:mental:1004855144745291887>', 'blue')
			]
		} else if (btl.trial) {
			comps[0] = [
				makeButton('Save Trial', '📖', 'green', true, 'run'),
				makeButton('Backup', '<:mental:1004855144745291887>', 'blue'),
				makeButton('Pacify', itemTypeEmoji.pacify, 'green', null, null, true), // No Pacifying
				makeButton('Enemy Info', statusEmojis.silence, 'red', true, 'enemyinfo', true) // No Enemy Info
			]
		} else {
			comps[0] = [
				makeButton('Run!', '<:boot:995268449154629699>', 'grey', true, 'run'),
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

					if (skill.type === 'heal') {
						if (skill.heal.revive) {
							if (members[i].hp > 0) continue;
						}
						if (members[i]?.status === 'ego') continue;
					} else if (skill.type === 'status' && skill.statusses?.mimic) {
						if (members[i].hp <= 0) continue;
						if (members[i].id === char.id) continue;
						if (isBoss(members[i])) continue;
					} else {
						if (members[i].hp <= 0) continue;
					}

					comps[CalcCompins(comps, i)].push(
						makeButton(`${members[i].name}`, `${i}️⃣`, (btl.action.target[0] == char.team) ? 'green' : 'red', true, i.toString())
					)
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
		amount = Math.abs(amount)
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
	if (char.status)
		str += statusEmojis[char.status];
	if (char.confusion)
		str += statusEmojis.confusion;
	if (char.infatuation)
		str += statusEmojis.infatuation;
	return str
}

function GetCharName(char) {
	let str = char.name;
	if (char.transformed) str = `${elementEmoji[char.transformations[char.transformed].mainElement]}**__${char.name}__**`;

	return str;
}

sendStateEmbed = (char, btl) => {
	let settings = setUpSettings(btl.guild.id);

	let menustate = btl.intendedstate;

	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(elementColors[char.mainElement] ?? elementColors.strike)
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

			await i.update({
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

			await i.update({
				content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
				embeds: [DiscordEmbed],
				components: []
			}); 
			return;
		}

		await i.update({
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

sendCurTurnEmbed = (char, btl) => {
	if (btl.intendedstate) return sendStateEmbed(char, btl);

	let settings = setUpSettings(btl.guild.id);

	let menustate = MENU_ACT;

	let statDesc = `${getBar('hp', char.hp, char.maxhp)} ${char.hp}/${char.maxhp}HP\n${getBar('mp', char.mp, char.maxmp)} ${char.mp}/${char.maxmp}MP`;
	if (settings.mechanics.limitbreaks) statDesc += `, ${Math.round(char.lbp)}LB%`;
	if (char.pet) statDesc = `${char.name} wants to assist the team in battle! Tell it to do something!\n`;

	let weatherTxt = '';
	if (btl.weather) weatherTxt += `\n${btl.weather.type.toUpperCase()} Weather.`;
	if (btl.terrain) weatherTxt += `\n${btl.terrain.type.toUpperCase()} Terrain.`;
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
				let n = GetCharName(c);
				teamDesc += `${l}: ${s}${n} _(${c.hp}/${c.maxhp}HP, ${c.mp}/${c.maxmp}MP)_\n`;
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
			let n = GetCharName(c);
			myTeamDesc += `${l}: ${s}${n} _(${c.hp}/${c.maxhp}HP, ${c.mp}/${c.maxmp}MP)_\n`;
		}
	}
	
	let testtxt = '';
	if (btl.testing) testtxt = ` (__${btl.testing} test turns left__)`;

	if (teamDesc == '') teamDesc = "No opponents.";
	if (myTeamDesc == '') myTeamDesc = "No allies.";

	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(elementColors[char.mainElement] ?? elementColors.strike)
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

			await i.update({
				content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
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
				btl.action.melee = makeMelee(char);

				if ((btl.action.melee.target === "one" || btl.action.melee.target === "spreadopposing")) {
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

						return i.update({
							content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
							embeds: [DiscordEmbed],
							components: []
						});
					} else {
						menustate = MENU_TEAMSEL;
					}
				} else if (btl.action.melee.target === "ally" || btl.action.melee.target === "spreadallies") {
					btl.action.target[0] = char.team;
					if (btl.teams[char.team].members.length == 1) {
						alreadyResponded = true;

						doAction(char, btl, btl.action);
						collector.stop();

						return i.update({
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

					await i.update({
						content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
						embeds: [DiscordEmbed],
						components: []
					});
				} else {
					btl.action.target = [undefined, undefined];
					doAction(char, btl, btl.action);
					collector.stop();
					alreadyResponded = true;

					await i.update({
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

				return i.update({
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
				return i.update({
					content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
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
						if (lbDefs.target === 'allopposing' || lbDefs.target === 'allallies' || lbDefs.target === 'everyone' || lbDefs.target.includes('random')) {
							btl.action.target = [undefined, undefined];
							alreadyResponded = true;
							doAction(char, btl, btl.action);
							collector.stop();

							await i.update({
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

					return i.update({
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
				if (menustate == MENU_SKILL && skillFile[i.customId] && char.skills.includes(i.customId)) {
					btl.action.index = i.customId;
					let skill = skillFile[i.customId];

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

										return i.update({
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

									return i.update({
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
								for (let l in skill.extras[k]) {
									let txt = healList[k].canuse(char, skill, btl, skill.heal[k][l]);
									if (txt !== true) {
										DiscordEmbed.title = txt;
										alreadyResponded = true;

										return i.update({
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

									return i.update({
										content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
										embeds: [DiscordEmbed],
										components: setUpComponents(char, btl, menustate)
									});
								}
							}
						}
					}

					if (btl.terrain && btl.terrain.type === "blindingradiance" && ((typeof(skill.type) === "string" && skill.type === "curse") || (typeof(skill.type) === "object" && skill.type.includes("curse")))) {
						DiscordEmbed.title = "The cursed energy dissapears as soon as it appears...";
						alreadyResponded = true;

						return i.update({
							content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
							embeds: [DiscordEmbed],
							components: setUpComponents(char, btl, menustate)
						});
					} else if (btl.terrain && btl.terrain.type === "eternaldarkness" && ((typeof(skill.type) === "string" && skill.type === "bless") || (typeof(skill.type) === "object" && skill.type.includes("bless")))) {
						DiscordEmbed.title = "The blessed energy dissapears as soon as it appears...";
						alreadyResponded = true;

						return i.update({
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

							await i.update({
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

										return i.update({
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

									return i.update({
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

								await i.update({
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: setUpComponents(char, btl, menustate)
								});
							}
						}
					}

					if (hasStatus(skill, 'mimic')) {
						menustate = MENU_ANYSEL;
					} else if ((skill.target === "one" || skill.target === "spreadopposing")) {
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
							return i.update({
								content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
								embeds: [DiscordEmbed],
								components: []
							});
						} else {
							menustate = MENU_TEAMSEL;
						}
					} else if (skill.target === "ally" || skill.target === "spreadallies") {
						btl.action.target[0] = char.team;
						if (btl.teams[char.team].members.length == 1) {
							alreadyResponded = true;

							doAction(char, btl, btl.action);
							collector.stop();

							return i.update({
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

						await i.update({
							content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
							embeds: [DiscordEmbed],
							components: []
						});
					} else {
						btl.action.target = [undefined, undefined];
						doAction(char, btl, btl.action);
						collector.stop();
						alreadyResponded = true;

						await i.update({
							content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
							embeds: [DiscordEmbed],
							components: []
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
							content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
							embeds: [DiscordEmbed],
							components: []
						});
					} else {
						btl.action.target = [undefined, undefined];
						alreadyResponded = true;
						doAction(char, btl, btl.action);
						collector.stop();

						await i.update({
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
								teamDesc += `${l}: ${s}${c.name} _(${c.hp}/${c.maxhp}HP, ${c.mp}/${c.maxmp}MP)_\n`;
							}
						}

						DiscordEmbed.fields = [{name: 'Opponents', value: teamDesc, inline: true}, {name: 'Allies', value: myTeamDesc, inline: true}];
					}
				} else if (menustate == MENU_TARGET && btl.teams[btl.action.target[0]] && btl.teams[btl.action.target[0]].members[i.customId]) {
					btl.action.target[1] = parseInt(i.customId);
					let targ;

					switch(btl.action.move) {
						case 'pacify':
							targ = btl.teams[btl.action.target[0]].members[i.customId];

							if (!targ.negotiate || targ?.negotiate == [] || targ?.negotiate?.length <= 0) {
								DiscordEmbed.title = `${targ.name} seems adamant on attacking and will not listen to reason.`;
								alreadyResponded = true;

								await i.update({
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

								await i.update({
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
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
								content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
								embeds: [DiscordEmbed],
								components: setUpComponents(char, btl, menustate)
							});
							break;
						
						case 'enemyinfo':
							targ = btl.teams[btl.action.target[0]].members[i.customId];

							if (!targ.enemy) {
								DiscordEmbed.title = `${targ.name} isn't an enemy!`;
								alreadyResponded = true;

								await i.update({
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: setUpComponents(char, btl, menustate)
								});
							} else if (!foundEnemy(targ.truename, btl.guild.id)) {
								DiscordEmbed.title = `We've yet to learn about ${targ.name}.`;
								alreadyResponded = true;

								await i.update({
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: setUpComponents(char, btl, menustate)
								})
							} else {
								let enemyFile = setUpFile(`${dataPath}/json/${btl.guild.id}/enemies.json`);
								alreadyResponded = true;
								menustate = MENU_ENEMYINFO;

								await i.update({
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
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
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: setUpComponents(char, btl, menustate)
								});
							} else {
								btl.action.target[1] = parseInt(i.customId);
								alreadyResponded = true;

								doAction(char, btl, btl.action);
								collector.stop();

								await i.update({
									content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
									embeds: [DiscordEmbed],
									components: []
								});
							}
							break;
					
						default:
							doAction(char, btl, btl.action);
							alreadyResponded = true;
							collector.stop();

							await i.update({
								content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
								embeds: [DiscordEmbed],
								components: []
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
							content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
							embeds: [DiscordEmbed],
							components: []
						});
					}
				} else if (menustate == MENU_PACIFY) {
					btl.action.index = parseInt(i.customId);
					alreadyResponded = true;

					console.log(btl.action);
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
					await i.update({
						content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
						embeds: [DiscordEmbed],
						components: []
					});
				} else if (menustate == MENU_BACKUP) {
					btl.action.index = parseInt(i.customId);
					alreadyResponded = true;
					doAction(char, btl, btl.action);
					collector.stop();

					await i.update({
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

						await i.update({
							content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
							embeds: [DiscordEmbed],
							components: []
						});
					}
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
			content: `<@${btl?.initiator ? btl.initiator : char.owner}>`,
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
			useSkill(char, btl, action, action.melee);
			break;

		case 'skill':
		case 'skills':
			if (char.pet) {
				useSkill(char, btl, action, skillFile[char.pet.skill] ?? skillFile.Agi);
			} else {
				useSkill(char, btl, action);
			}

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
				.setDescription(itemTxt.replace(/\n{3,}/, () => "\n\n"))
			btl.channel.send({embeds: [DiscordEmbed]});
			break;

		case 'guard':
			char.guard = 0.45;

			let mpget = Math.max(1, Math.round((char.maxmp/100*5)-5+randNum(1,10)));
			char.mp = Math.min(char.maxmp, Math.round(char.mp+mpget));

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

				runFromBattle(char, btl, 0)
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

			lbDefs.pow += Math.round((char.lbp-lbDefs.cost)/3);
			lbDefs.cost = char.lbp;

			lbDefs.target = 'one';

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
					useCost(char, skillFile[skills[0][0]].cost, skillFile[skills[0][0]].costtype);
				}
				if (skillFile[skills[1][0]].cost && skillFile[skills[1][0]].costtype) {
					useCost(ally, skillFile[skills[1][0]].cost, skillFile[skills[1][0]].costtype);
				}

				char.donetc = true;
			}
			break;

		case 'transform':
			doTransformation(char, btl.action.index, btl);

			DiscordEmbed = new Discord.MessageEmbed()
				.setColor(elementColors[char.mainElement] ?? elementColors.strike)
				.setTitle(`${char.name} => Self`)
				.setDescription(`${char.name} undergoes a transformation, taking their ${btl.action.index} form!`)
			btl.channel.send({embeds: [DiscordEmbed]});
			break;

		case 'save':
			DiscordEmbed = new Discord.MessageEmbed()
				.setColor(elementColors[char.mainElement] ?? elementColors.strike)
				.setTitle('Saving trial...')
				.setDescription('You can resume this trial by using the "resumetrial" command.')
			btl.channel.send({embeds: [DiscordEmbed]});

			saveTrial(btl);
			return;
	}

	// Custom Variable EndTurn
	if (char.custom) {
		for (let i in char.custom) {
			if (customVariables[i] && customVariables[i].endturn) charStats = customVariables[i].endturn(btl, char, char.custom[i]);
		}
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

	// a
	let statusTxt = '';

	// Start Of Turn passives.
	if (doPassives(btl)) {
		for (let s of char.skills) {
			let skill = skillFile[s];

			if (skill && skill.type == 'passive') {
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
			if (statusEffectFuncs[char.status].onremove) statusEffectFuncs[char.status].onremove(char);
			delete char.status;
			delete char.statusturns;
		} else {
			char.statusturns--;
			if (char.statusturns <= 0) {
				if (statusEffectFuncs[char.status]?.onremove) statusEffectFuncs[char.status].onremove(char);
				delete char.status;
				delete char.statusturns;
			}
		}
	}

	let stackable = [];
	for (let i in statusEffectFuncs) {
		if (statusEffectFuncs[i].stackable) stackable.push(i);
	}

	for (let i in stackable) {
		if (char[stackable[i]] && statusEffectFuncs[stackable[i]] && statusEffectFuncs[stackable[i]].onturn) {
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

					if (char?.custom?.flinch) {
						canMove = false;
						delete char.custom.flinch;
					}
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

		if (char.type && (char.type.includes("boss") || char.type === "deity")) char.ignorestatus = true;
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
			char.lb = Math.min(Math.max(char.lb, 0), 1000);

			// This character is dead or pacified.
			if (char.hp <= 0 || char.pacified) {
				pLeft--;
				resetEffects(char);

				// If this character is a clone or reincarnate, remove them from the members.
				if (char.clone || char.reincarnate) btl.teams[i].members.splice(k, 1);

				// moving on...
				continue;
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

		//clear reincarnates
		for (let i in btl.teams) {
			while (btl.teams[i].members.some(m => m.reincarnate)) {
				let char = btl.teams[i].members.find(m => m.reincarnate);
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
	}

	// Write Data.
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, JSON.stringify(btl, null, '    '));

	// Let's do this character's turn.
	doTurn(btl);
}