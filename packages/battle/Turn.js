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

doTurn = (btl) => {
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
	if (char.status && char.statusturns && statusEffectFuncs[char.status.toLowerCase()]) {
		statusTxt += statusEffectFuncs[char.status.toLowerCase()].onturn(btl, char);

		char.statusturns--;
		if (char.statusturns == 0) {
			delete char.status;
			delete char.statusturns;
		}
	}
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