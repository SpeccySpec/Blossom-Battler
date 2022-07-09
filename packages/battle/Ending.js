pvpWin = (btl, i) => {
	btl.channel.send(`**[DEBUG]**\nTeam #${i} won`);
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
}

loseBattle = (btl, i) => {
	let settings = setUpSettings(btl.guild.id);
	let parties = setUpFile(`${dataPath}/json/${btl.guild.id}/parties.json`, true);
	let party = parties[btl.teams[i].name];

	let lostmoney = randNum(Math.round(party.currency/2), party.currency);
	party.currency -= lostmoney;

	// Fully restore characters' HP and MP because we lost. Also, save trust.
	let charFile = setUpFile(`${dataPath}/json/${btl.guild.id}/characters.json`);
	for (let char of btl.teams[i].members) {
		if (charFile[char.truename]) {
			charFile[char.truename].hp = charFile[char.truename].maxhp;
			charFile[char.truename].mp = charFile[char.truename].maxmp;
			charFile[char.truename].trust = char.trust;
		}
	}
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/characters.json`, JSON.stringify(charFile, null, 4));

	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(elementColors[btl.teams[i].members[0].mainElement] ?? elementColors.strike)
		.setTitle("__Battle Results__")
		.setDescription(`**[BATTLE LOST...]**\nThe enemies defeated you...\nYou lost all of your items and ${lostmoney} ${settings.currency_emoji}${settings.currency}s...`)
	btl.channel.send({embeds: [DiscordEmbed]}).then(message => {
		if (Object.keys(party.items).length > 0) {
			let items = [`Team ${btl.teams[i].name}'s lost items`, btl.channel.id, 'true', 'none', '0', `Team ${btl.teams[i].name} lost a battle on ${getCurrentDate()}. This is what happened to their items.`];
			for (let i in party.items) {
				items.push('item');
				items.push(i);
				items.push(party.items[i]);
			}

			console.log(items);
			commands.registerchest.call(message, [...items]);

			party.items = {};
		}

		parties[btl.teams[i].name] = party;
		fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/parties.json`, JSON.stringify(parties, null, 4))
	})

	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
}

winBattle = (btl, i) => {
	// Handle colosseum differently...
	if (btl.trial) return nextWave(btl);

	// Setting and Party files
	let settings = setUpSettings(btl.guild.id);
	let parties = setUpFile(`${dataPath}/json/${btl.guild.id}/parties.json`, true);

	// Text to be on the embed.
	let embedtxt = "**[BATTLE COMPLETE!]**\n";

	// How did we win this battle. Were we murderers or friends :)
	let pacified = `Team ${btl.teams[i].name} defeated the enemies!`;
	let pacifycount = 0;
	let maxcount = 0;
	
	let intendedxp = 0; // psst lets sneak xp in here too
	let intendedmon = 0; // psst lets sneak money in here too
	for (let k in btl.teams) {
		if (k == i) continue;
		for (let char of btl.teams[k].members) {
			if (char.pacified) pacifycount++;
			maxcount++;

			if (char.xp) {
				let xp = char.xp
				if (char.golden) xp *= 2.5;

				intendedxp += Math.round(xp);
			}

			let money = 0;
			if (char.money) {
				if (char.money[0] > 0) {
					money = char.money[0];
					if (char.money[1]) money += randNum(-25, 25);
				}
			} else {
				if (char.type) {
					switch(char.type) {
						case 'miniboss':
							money = randNum(100, 250);
							break;

						case 'boss':
							money = randNum(200, 400);
							break;

						case 'bigboss':
							money = randNum(450, 600);
							break;

						case 'deity':
							money = randNum(750, 1000);
							break;

						default:
							money = randNum(5, 50);
					}
				} else {
					money = randNum(5, 50);
				}
			}

			if (money > 0) intendedmon += money;
		}
	}

	if (pacifycount >= maxcount)
		pacified = `Team ${btl.teams[i].name} befriended the enemies!`;
	else if (pacifycount > 0)
		pacified = `Team ${btl.teams[i].name} pacified _some_ of the enemies... and defeated the rest!`;

	embedtxt += pacified;

	// Now let's talk about XP.
	let enemyxp = intendedxp;

	// XP reduced for pacifying
	if (pacifycount >= maxcount) enemyxp = Math.round(enemyxp*0.6);

	// Inteligence added to XP
	for (let char of btl.teams[i].members) enemyxp += char.stats.int;

	// XP Rate
	enemyxp = Math.round(enemyxp*(settings.rates.xprate ?? 1));

	// Money, increased for pacifying
	let moneyamount = Math.round(intendedmon*settings.rates.moneyrate);
	if (pacifycount >= maxcount) moneyamount = Math.round(moneyamount*1.38);

	// Greed charms
	for (let char of btl.teams[i].members) {
		if (!char.charms) continue;
		if (char.charms.includes("FragileGreed") || char.charms.includes("UnbreakableGreed")) moneyamount = Math.round(moneyamount*1.4);
	}

	// Money leader skills
	if (settings?.mechanics?.leaderskills) {
		if (btl.teams[i]?.leaderskill?.type.toLowerCase() == 'money') moneyamount += Math.floor(moneyamount/100*parseInt(btl.teams[i].leaderskill.var2));
	}

	// Award Money!
	embedtxt += `\nThe team got ${moneyamount} ${settings.currency_emoji}${settings.currency}s from the enemies!\n`;
	parties[btl.teams[i].name].currency += moneyamount;

	// Alright, let's award XP!
	let charFile = setUpFile(`${dataPath}/json/${btl.guild.id}/characters.json`);

	for (let char of btl.teams[i].members) {
		if (charFile[char.truename]) {
			if (enemyxp > 0) gainXp(btl.channel, charFile[char.truename], enemyxp, true);
			charFile[char.truename].hp = Math.min(charFile[char.truename].maxhp, char.hp);
			charFile[char.truename].mp = Math.min(charFile[char.truename].maxmp, char.mp);

			// While I'm here... why don't I sort out Trust!
			if (!char.trust) char.trust = {};

			for (let char2 of btl.teams[i].members) {
				if (char2.id  == char.id) continue;
				embedtxt += `${changeTrust(char, char2, Math.round(35*settings.rates.trustrate), false)}`;
				charFile[char.truename].trust = char.trust;
				charFile[char2.truename].trust = char2.trust;
			}
		}
	}

	// Loot
	let items = {};
	lootFile = setUpFile(`${dataPath}/json/${btl.guild.id}/loot.json`, true);
	weaponFile = setUpFile(`${dataPath}/json/${btl.guild.id}/weapons.json`);
	armorFile = setUpFile(`${dataPath}/json/${btl.guild.id}/armor.json`);
    itemFile = setUpFile(`${dataPath}/json/${btl.guild.id}/items.json`);
	let party = parties[btl.teams[i].name];

	//in case the steal extra had done something, or someone used an item (it was not accounted for, Spectra)
	if (btl.teams[i].items != parties[btl.teams[i].name].items)
		parties[btl.teams[i].name].items = btl.teams[i].items;

	if (btl.teams[i].weapons != parties[btl.teams[i].name].weapons)
		parties[btl.teams[i].name].weapons = btl.teams[i].weapons;

	if (btl.teams[i].armors != parties[btl.teams[i].name].armors)
		parties[btl.teams[i].name].armors = btl.teams[i].armors;

	//the real deal
	for (let p of btl.teams) {
		for (let k in p.members) {
			if (p?.members[k]?.loot && p.members[k].loot.length > 0) {
				let loot = p.members[k].loot;

				for (let item of loot) {
					for (let j = 0; j < item.amount; j++) {
						if (randNum(1, 100) <= item.chance) {
							switch(item.type.toLowerCase()) {
								case 'item':
									if (itemFile[item.id]) {
										if (!items[itemFile[item.id].name]) items[itemFile[item.id].name] = 0;
										if (!party.items[item.id]) party.items[item.id] = 0;
										items[itemFile[item.id].name]++;
										party.items[item.id]++;
									}
									break;

								// btw we should only be able to aquire one weapon or armor of each type.
								case 'weapon':
									if (!party.weapons[item.id] && weaponFile[item.id]) {
										party.weapons[item.id] = objClone(weaponFile[item.id]);
										items[weaponFile[item.id].name] = 1;
									}
									break;

								case 'armor':
									if (!party.armors[item.id] && armorFile[item.id]) {
										party.armors[item.id] = objClone(armorFile[item.id]);
										items[armorFile[item.id].name] = 1;
									}
									break;
							}
						}
					}
				}

				embedtxt += `\nThe ${p.members[k].name} dropped`

				for (let j in items) {
					if (items[j] && items[j] > 0) {
						embedtxt += ` ${(items[j] <= 1) ? 'a' : items[j]} ${j}${(items[j] > 1) ? 's' : ''}`;

						if (Object.keys(items).indexOf(j) < Object.keys(items).length - 2) {
							embedtxt += ', ';
						} else if (Object.keys(items).indexOf(j) == Object.keys(items).length - 2) {
							embedtxt += ' and ';
						} else {
							embedtxt += '.';
						}
					}
				}

				fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/parties.json`, JSON.stringify(parties, '	', 4))
			}
		}
	}

	// Save character shit.
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));

	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(elementColors[btl.teams[i].members[0].mainElement] ?? elementColors.strike)
		.setTitle("__Battle Results__")
		.setDescription(embedtxt)
	btl.channel.send({embeds: [DiscordEmbed]})

	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
}

runFromBattle = (char, btl, i) => {
	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(elementColors[btl.teams[i].members[0].mainElement] ?? elementColors.strike)
		.setTitle("__Battle Results__")
		.setDescription("**[RAN AWAY!]**\nYou ran from battle!\n_(All rewards you would have gotten are not obtained.)_")
	btl.channel.send({embeds: [DiscordEmbed]})

	let parties = setUpFile(`${dataPath}/json/${btl.guild.id}/parties.json`);

	if (btl.teams[0].items != parties[btl.teams[0].name].items)
		parties[btl.teams[0].name].items = btl.teams[0].items;

	if (btl.teams[0].weapons != parties[btl.teams[0].name].weapons)
		parties[btl.teams[0].name].weapons = btl.teams[0].weapons;

	if (btl.teams[0].armors != parties[btl.teams[0].name].armors)
		parties[btl.teams[0].name].armors = btl.teams[0].armors;

	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/parties.json`, JSON.stringify(parties, '	', 4))

	// Save HP, MP and trust.
	let charFile = setUpFile(`${dataPath}/json/${btl.guild.id}/characters.json`);
	for (let char of btl.teams[i].members) {
		if (charFile[char.truename]) {
			charFile[char.truename].hp = Math.min(charFile[char.truename].maxhp, char.hp);
			charFile[char.truename].mp = Math.min(charFile[char.truename].maxmp, char.mp);
			charFile[char.truename].trust = char.trust;
		}
	}
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));

	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
}