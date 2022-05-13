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

// Send an Interactable Turn Embed, buttons and all
makeButton = (name, emoji, color) => {
	let btnType = {
		blue: 'PRIMARY',
		grey: 'SECONDARY',
		green: 'SUCCESS',
		red: 'DANGER'
	}

	return new Discord.MessageButton({
		label: name,
		customId: name.toLowerCase(),
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

setUpComponents = (char, btl, menustate) => {
	let comps = [];

	switch(parseInt(menustate)) {
		case MENU_ACT:
			comps[0] = [makeButton('Melee', elementEmoji.strike, 'red'), makeButton('Skills', elementEmoji.bless, 'blue'), makeButton('Items', itemTypeEmoji.healhpmp, 'green'), makeButton('Tactics', critEmoji, 'grey')];
			break;
	}

	for (let i in comps)
		comps[i] = new Discord.MessageActionRow({components: comps[i]});

	return comps;
}

sendCurTurnEmbed = (char, btl) => {
	let menustate = MENU_ACT;
	let statDesc = `${getBar('hp', char.hp, char.maxhp)}\n${char.hp}/${char.maxhp}HP\n\n${getBar('mp', char.mp, char.maxmp)}\n${char.mp}/${char.maxmp}MP`;
	
	let teamDesc = '';
	let multipleTeams = false;
	if (btl.teams.length > 2) {
		multipleTeams = true;

		for (let i in btl.teams) {
			if (i != char.team) teamDesc += `Team ${btl.teams[i].name}`;
		}
	} else {
		let op = (char.team <= 0) ? 1 : 0;

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
	})
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

	if (!btl.curturn) {
		btl.curturn = 0;
	} else {
		let toTurn = btl.curturn+1;

		if (!btl.turnorder[toTurn]) {
			btl.curturn = 0;

			newTurn = true;
			btl.turn++;
		} else
			btl.curturn = 1;
	}

	// Let's do this character's turn.
	doTurn(btl);
}