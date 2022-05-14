getCharFromTurn = (btl) => {
	let id = btl.turnorder[btl.curturn];
	return getCharFromId(id, btl);
}

getTurnOrder = (btl) => {
	let turnorder = [];

	for (const i in btl.teams) {
		for (const k in btl.teams[i].members) {
			turnorder.push(objClone(btl.teams[i].members[k]));
		}
	}

	if (btl.terrain === 'psychic') {
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

MENU_ACT = 0;
MENU_SKILL = 1;
MENU_ITEM = 2;
MENU_TACTICS = 3;
MENU_TEAMSEL = 4;
MENU_TARGET = 5;
MENU_SELFTARGET = 6;

function CalcCompins(comps, i) {
	const compins = Math.min(Math.floor(Math.max(i - 0.1, 0) / 4), 3)
	if (!comps[compins])
		comps[compins] = [];
	return compins
}

const menuStates = {
	[MENU_ACT]: ({comps}) => {
		comps[0] = [
			makeButton('Melee', elementEmoji.strike, 'red'),
			makeButton('Skills', elementEmoji.bless, 'blue'),
			makeButton('Items', itemTypeEmoji.healhpmp, 'green'),
			makeButton('Tactics', critEmoji, 'grey'),
			makeButton('Guard', affinityEmoji.block, 'grey')
		]
	},
	[MENU_SKILL]: ({char, comps}) => {
		for (const i in char.skills) {
			const skillname = char.skills[i]
			const skillinfo = skillFile[skillname]
			if (skillinfo?.type === 'passive')
				continue;
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
	[MENU_TEAMSEL]: ({btl, comps}) => {
		for (const i in btl.teams)
			comps[CalcCompins(comps, i)].push(
				makeButton(`Team ${btl.teams[i].name}`, '#️⃣', 'green', true, i.toString())
			)
	},
	[MENU_TARGET]: ({btl, comps}) => {
		const members = btl.teams[btl.action.target[0]].members
		for (const i in members)
			comps[CalcCompins(comps, i)].push(
				makeButton(`${members[i].name}`, '#️⃣', (btl.action.target[0] == char.team) ? 'green' : 'red', true, i.toString())
			)
	}
}

setUpComponents = (char, btl, menustate) => {
	let comps = []
	menuStates[parseInt(menustate)]({char, btl, comps})

	if (menustate != MENU_ACT) {
		for (let i in comps) {
			if (comps[i].length < 5) {
				comps[i].push(makeButton('Back', '◀️', 'grey'));
				break;
			}
		}
	}

	for (let i in comps)
		comps[i] = new Discord.MessageActionRow({components: comps[i]});

	return comps;
}

sendCurTurnEmbed = (char, btl) => {
	let menustate = MENU_ACT;
	let statDesc = `${getBar('hp', char.hp, char.maxhp)}		${getBar('mp', char.mp, char.maxmp)}\n${char.hp}/${char.maxhp}HP						${char.mp}/${char.maxmp}MP`;

	let teamDesc = '';
	let op = (char.team <= 0) ? 1 : 0;
	let multipleTeams = false;
	if (btl.teams.length > 2) {
		multipleTeams = true;

		for (let i in btl.teams) {
			if (i != char.team) teamDesc += `Team ${btl.teams[i].name}`;
		}
	} else {
		for (let i in btl.teams[op].members) {
			let c = btl.teams[op].members[i];
			teamDesc += `${i}: ${c.name} _(${c.hp}/${c.maxhp}HP, ${c.mp}/${c.maxmp}MP)_\n`;
		}
	}

	let myTeamDesc = '';
	for (let i in btl.teams[char.team].members) {
		let c = btl.teams[char.team].members[i];
		myTeamDesc += `${i}: ${c.name} _(${c.hp}/${c.maxhp}HP, ${c.mp}/${c.maxmp}MP)_\n`;
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

	btl.channel.send(message);

	// Now...
	btl.action = {
		move: 'melee',
		index: 0,
		target: [0, 0],
	}

	let collector = btl.channel.createMessageComponentCollector({
		filter: ({user}) => user.id == char.owner
	})

	let currentIndex = 0;
	collector.on('collect', async i => {
		btl.action.laststate = menustate;

		switch(i.customId) {
			case 'melee':
				btl.action.move = 'melee';
				menustate = MENU_TEAMSEL;
				break;

			case 'skills':
				btl.action.move = 'skills';
				menustate = MENU_SKILL;
				break;

			case 'back':
				if (btl.action.laststate) menustate = MENU_ACT;
				break;

			default:
				if (menustate == MENU_SKILL && skillFile[i.customId] && char.skills.includes(i.customId)) {
					btl.action.index = i.customId;
					let skill = skillFile[i.customId];

					if (skill.target === "one" || skill.target === "spreadopposing") {
						menustate = MENU_TEAMSEL;
					} else if (skill.target === "ally" || skill.target === "spreadallies") {
						btl.action.target[0] = char.team;
						menustate = MENU_TARGET;
					} else if (skill.target === "caster") {
						btl.action.target = [char.team, char.id];
						doAction(char, btl, btl.action);
						collector.stop();
					} else {
						btl.action.target = [undefined, undefined];
						doAction(char, btl, btl.action);
						collector.stop();
					}
				} else if (menustate == MENU_TEAMSEL && btl.teams[i.customId]) {
					let skill = skillFile[i.customId];

					if (skill.target === "one" || skill.target === "spreadopposing") {
						btl.action.target[0] = parseInt(i.customId);
					} else if (skill.target === "ally" || skill.target === "spreadallies") {
						btl.action.target[0] = char.team;
					}
					menustate = MENU_TARGET;

					teamDesc = '';
					for (let i in btl.teams[btl.action.target[0]].members) {
						let c = btl.teams[btl.action.target[0]].members[i];
						teamDesc += `${i}: ${c.name} _(${c.hp}/${c.maxhp}HP, ${c.mp}/${c.maxmp}MP)_\n`;
					}

					DiscordEmbed.fields = [{name: 'Opponents', value: teamDesc, inline: true}, {name: 'Allies', value: myTeamDesc, inline: true}];
				} else if (menustate == MENU_TARGET && btl.teams[btl.action.target[0]] && btl.teams[btl.action.target[0]].members[i.customId]) {
					btl.action.target[1] = parseInt(i.customId);
					doAction(char, btl, btl.action);
					collector.stop();
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

		i.update({
			content: `<@${char.owner}>`,
			embeds: [DiscordEmbed],
			components: setUpComponents(char, btl, menustate)
		})
	})
}

doAction = (char, btl, action) => {
	btl.channel.send(`**[DEBUG]**\n\n**[INDEX]** _${action.index}_\n**[TARGET]**: _[${action.target[0]}, ${action.target[1]}]_`);

	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, JSON.stringify(btl, '	', 4));
	setTimeout(function() {
		advanceTurn(btl);
	}, 2500)
}

doTurn = (btl, noTurnEmbed) => {
	let char = getCharFromTurn(btl);
	let settings = setUpSettings(btl.guild.id)

	let statusTxt = '';

	// Start Of Turn passives.
	for (let skill of char.skills) {
		if (skill.type === 'passive') {
			for (let i in skill.passive) {
				if (passiveList[i] && passiveList[i].onturn) {
					if (passiveList[i].multiple) {
						for (let k in skill.passive[i]) statusTxt += passiveList[i].onturn(btl, char, skill.passive[i][k]);
					} else
						statusTxt += passiveList[i].onturn(btl, char, skill.passive[i]);

					statusTxt += '\n';
				}
			}
		}
	}

	// Status Effects.
	let canMove = true;

	if (char.status && char.statusturns && statusEffectFuncs[char.status.toLowerCase()]) {
		let statusEff = statusEffectFuncs[char.status.toLowerCase()].onturn(btl, char);
		
		if (typeof statusEff === 'string')
			statusTxt += statusEff
		else if (typeof statusEff === 'object') {
			if (!statusEff[1]) canMove = false;
			statusTxt += statusEff[0]
		}

		char.statusturns--;
		if (char.statusturns == 0) {
			delete char.status;
			delete char.statusturns;
		}

		statusTxt += '\n';
	}

	let stackable = ['confusion', 'infatuation'];

	for (let i in stackable) {
		if (char[i] && statusEffectFuncs[i]) {
			let statusEff = statusEffectFuncs[i].onturn(btl, char);
			
			if (typeof statusEff === 'string')
				statusTxt += statusEff
			else if (typeof statusEff === 'object') {
				if (!statusEff[1]) canMove = false;
				statusTxt += statusEff[0]
			}

			char[i]--;
			if (char[i] == 0) delete char[i];

			statusTxt += '\n';
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
		if (!canMove) return advanceTurn(btl)
		if (noTurnEmbed) return;

		// Now... send the turn embed!
		sendCurTurnEmbed(char, btl);
	}, 150)
}

advanceTurn = (btl) => {
	// End the battle in a test battle.
	if (btl.testing) {
		btl.testing--;
		if (btl.testing <= 0) {
			btl.channel.send("The test battle is now over!");
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, '{}');
			return;
		}
	}

	// We should check for death first. While we're here, let's reset some things.
	let teamsleft = [];

	for (let i in btl.teams) {
		let pLeft = btl.teams[i].members.length;

		for (let k in btl.teams[i].members) {
			let char = btl.teams[i].members[k];

			// This character is dead.
			if (char.hp <= 0) {
				btl.channel.send(`**[DEBUG]**\n${char.name} is dead!`);

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

	// Let's do this character's turn.
	doTurn(btl);
}