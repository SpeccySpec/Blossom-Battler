healList = {
	healstat: new Extra({
		name: "Heal Stat",
		desc: "The default heal type. Restores <Meter> by <Heal Amount>. _Negative values for <Heal Amount> will damage the target!_",
		args: [
			{
				name: "Heal Amount",
				type: "Num",
				forced: true
			},
			{
				name: "Meter",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (args[0] == 0) args[0] = 60;
			if (!['hp', 'mp', 'hppercent', 'mppercent', 'lb'].includes(args[1].toLowerCase())) return void message.channel.send(`${args[1]} is an invalid meter to heal! Enter either HP, MP, HPPercent, MPPercent or LB.`);

			makeHeal(skill, "healstat", [args[0], args[1].toLowerCase()]);
			return true;
		},
		onuse(char, targ, skill, btl, vars) {
			if (!vars[0] || vars[0] == null || vars[0] == 0) return '';

			if (vars[0] > 0 && targ.team == char.team && targ.id != char.id) {
				settings = setUpSettings(btl.guild.id);
				changeTrust(targ, char, Math.round(20*(settings.rates.trustrate ?? 1)), true, btl.channel);
			}

			switch(vars[1]) {
				case 'hp':
				case 'mp':
					targ[vars[1]] = Math.min(targ[`max${vars[1]}`], targ[vars[1]]+vars[0]);
					return `__${targ.name}__'s ${vars[1].toUpperCase()} was restored by **${vars[0]}**!`;

				case 'hppercent':
					if (vars[0] >= 100) {
						targ.hp = targ.maxhp;
						return `__${targ.name}__'s HP was _fully restored_!`;
					} else {
						let amount = Math.round((targ.hp/targ.maxhp)*vars[0]);

						targ.hp = Math.min(targ.maxhp, targ.hp+amount);
						return `__${targ.name}__'s HP was restored by **${amount}**!`;
					}

				case 'mppercent':
					if (vars[0] >= 100) {
						targ.mp = targ.maxmp;
						return `__${targ.name}__'s MP was _fully restored_!`;
					} else {
						let amountm = Math.round((targ.mp/targ.maxmp)*vars[0]);

						targ.mp = Math.min(targ.maxmp, targ.mp+amountm);
						return `__${targ.name}__'s MP was restored by **${amountm}**!`;
					}

				case 'lb':
					targ.lbp += vars[0];
					return `__${targ.name}__'s LB% was boosted by **${vars[0]}%**!`;
			}

			return '';
		},
		hardcodedinfo: true
	}),

	regenerate: new Extra({
		name: "Regenerate",
		desc: "Restores HP by <HP> over time for <Turns> turns. _Negative values for <HP> will damage the target!_",
		args: [
			{
				name: "HP",
				type: "Num",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const hp = args[0];
			const turns = args[1];

			if (hp == 0) hp = 20;
			if (turns) turns = 3;
			makeHeal(skill, "regenerate", [hp, turns]);
			return true;
		},
		onuse(char, targ, skill, btl, vars) {
			addCusVal(targ, "regenheal", {
				name: skill.name,
				username: char.name,
				heal: vars[0],
				turns: vars[1],
				type: "hp",
				user: char.id
			})

			if (vars[0] > 0 && targ.team == char.team && targ.id != char.id) {
				settings = setUpSettings(btl.guild.id);
				changeTrust(targ, char, Math.round(5*(settings.rates.trustrate ?? 1)), true, btl.channel);
			}
			return `__${targ.name}__ is surrounded in a lime coloured aura!`;
		},
		getinfo(vars) {
			return `Regenerates **around ${vars[0]} HP** for **${vars[1]} turns**`
		}
	}),

	invigorate: new Extra({
		name: "Invigorate",
		desc: "Restores MP by <MP> over time for <Turns> turns. _Negative values for <MP> will drain the target!_",
		args: [
			{
				name: "HP",
				type: "Num",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const mp = args[0];
			const turns = args[1];

			if (mp == 0) hp = 20;
			if (turns) turns = 3;
			makeHeal(skill, "invigorate", [mp, turns]);
			return true;
		},
		onuse: function(char, targ, skill, btl, vars) {
			addCusVal(targ, "regenheal", {
				name: skill.name,
				username: char.name,
				heal: vars[0],
				turns: vars[1],
				type: "mp",
				user: char.id
			})

			if (vars[0] > 0 && targ.team == char.team && targ.id != char.id) {
				settings = setUpSettings(btl.guild.id);
				changeTrust(targ, char, Math.round(5*(settings.rates.trustrate ?? 1)), true, btl.channel);
			}
			return `__${targ.name}__ is surrounded in a violet coloured aura!`;
		},
		getinfo(vars) {
			return `Regenerates **around ${vars[0]} MP** for **${vars[1]} turns**`
		}
	}),

	revive: new Extra({
		name: "Revive",
		desc: "Revives the target to 1/<Amount> of their max HP. _Negative values are not permitted._",
		args: [
			{
				name: "Amount",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (args[0] <= 0) return void message.channel.send("You can't revive to 0 or less!");
			makeHeal(skill, "revive", [args[0]]);
			return true;
		},
		onuse(char, targ, skill, btl, vars) {
			if (targ.hp > 0) return 'But it failed!';

			targ.hp = targ.maxhp/vars[0];

			if (targ.team == char.team) {
				settings = setUpSettings(btl.guild.id);
				changeTrust(targ, char, Math.round(30*(settings.rates.trustrate ?? 1)), true, btl.channel);
			}
			return `__${targ.name}__ was revived!`;
		},
		getinfo(vars) {
			return `**Revives** the target to 1/${vars[0]} of their max HP`
		}
	}),

	recarmdra: new Extra({
		name: "Recarmdra",
		desc: "Fully restores party HP and MP, but downs the user.",
		args: [],
		applyfunc(message, skill, args) {
			makeHeal(skill, "recarmdra", [true]);
			return true;
		},
		override(char, skill, btl, vars) {
			char.hp = 0;
			for (let i in btl.teams[char.team]) {
				targ.hp = targ.maxhp;
				targ.mp = targ.maxmp;

				if (targ.team == char.team) {
					settings = setUpSettings(btl.guild.id);
					changeTrust(targ, char, Math.round(40*(settings.rates.trustrate ?? 1)), true, btl.channel);
				}
			}

			return `The party's HP & MP was fully restored, but at the cost of __${char.name}__'s sacrifice!`;
		},
		getinfo(vars) {
			return `**Fully** restores party HP and MP, but **downs the user**`
		}
	}),

	statusheal: new Extra({
		name: "Status Heal",
		desc: "Cures the target of the specified status. Accepts 'physical', 'mental' and 'all' as statuses.",
		args: [
			{
				name: "Status",
				type: "Word",
				forced: true
			}
		],
		multiple: true,
		diffflag: 0,
		applyfunc(message, skill, args) {
			const status = args[0]?.toLowerCase();
			if (status != 'physical' || status != 'mental' || status != 'all') {
				if (!statusEffects.includes(status)) return void message.channel.send("That's not a valid status!");
			}
			makeHeal(skill, "statusheal", [status]);
			return true;
		},
		onuse(char, targ, skill, btl, vars) {
			if (targ.team == char.team) {
				settings = setUpSettings(btl.guild.id);
				changeTrust(targ, char, Math.round(15*(settings.rates.trustrate ?? 1)), true, btl.channel);
			}

			switch(vars[0]) {
				case 'physical':
					if (targ.confusion) delete targ.confusion;

					if (isPhysicalStatus(targ.status)) {
						delete targ.status;
						delete targ.statusturns;
					}

					return `__${targ.name}__ had physical status ailments cured!`;
					break;
			
				case 'mental':
					if (targ.infatuation) delete targ.infatuation;

					if (!isPhysicalStatus(targ.status)) {
						delete targ.status;
						delete targ.statusturns;
					}

					return `__${targ.name}__ had mental status ailments cured!`;
					break;

				case 'all':
					if (targ.confusion) delete targ.confusion;
					if (targ.infatuation) delete targ.infatuation;
					delete targ.status;
					delete targ.statusturns;

					return `__${targ.name}__ had their status ailments cured!`;
					break;
				
				default:
					if (vars[0] === 'confusion') {
						if (targ.confusion) delete targ.confusion;
					} else if (vars[0] === 'infatuation') {
						if (targ.infatuation) delete targ.infatuation;
					} else {
						if (targ.status === vars[0]) {
							delete targ.status;
							delete targ.statusturns;
						}
					}

					return `__${targ.name}__ had their ${statusEmojis[vars[0]]}**${vars[0]}** status effect cured!`;
			}

			return '...';
		},
		getinfo(vars) {
			let txt = `Cures **`

			for (let i in vars) {
				txt += `${statusEmojis[vars[i]] ?? ''}${vars[i]}`
				if (i < vars.length - 2)
				txt += `, `
				else if (i === vars.length - 2)
				txt += ` and `
			}

			return txt + ` ailments**`;
		}
	}),

	sacrifice: new Extra({
		name: "Sacrifice",
		desc: "Will reduce the user's HP to a {HP}.",
		args: [
			{
				name: "HP",
				type: "Num"
			}
		],
		applyfunc(message, skill, args) {
			makeHeal(skill, "sacrifice", [args[0] ?? 0]);
			let hasHeal = false;
			for (var i in skill.heal) {
				if (i != "wish" && i != "sacrifice") {
					hasHeal = true;
					break;
				}
			}
			if (!hasHeal) {
				makeHeal(skill, "healstat", [60, 'hp']);
			}
			return true;
		},
		onuse(char, targ, skill, btl, vars) {
			if (!vars[0])
				char.hp = 0;
			else
				char.hp = vars[0];

			return `__${char.name}__ sacrificed themselves, lowering their HP to __${vars[0]}__!`;
		},
		getinfo(vars) {
			return extraslist.sacrifice.getinfo(vars);
		}
	}),

	wish: new Extra({
		name: "Wish",
		desc: "Will restore after <Turns> turns. _Negative values are not permitted._",
		args: [
			{
				name: "Turns",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const turns = args[0];

			if (turns <= 0) return void message.channel.send("You can't wish for 0 or less!");
			makeHeal(skill, "wish", [turns]);
			let hasHeal = false
			for (var i in skill.heal) {
				if (i != "sacrifice" && i != "wish") {
					hasHeal = true;
					break;
				}
			}
			if (!hasHeal) makeHeal(skill, "healstat", [60, 'hp']);
			return true;
		},
		onuse(char, targ, skill, btl, vars) {
			addCusVal(targ, "wishheal", {
				turns: vars[0],
				vars: vars
			})

			return `__${char.name}__ will experience a healing wish in **${vars[0]}** turns.`;
		},
		getinfo(vars) {
			return `Heals after **${vars[0]} turns**`;
		}
	})
}

// Make a status type for a skill. "func" should be an array of 1-5 values indicating what the extra does.
function makeHeal(skill, extra, func) {
	if (!skill.heal) skill.heal = {};
	if (!skill.heal[extra]) skill.heal[extra] = [];

	if (healList[extra].multiple) {
		if (healList[extra].diffflag) {
			for (i in skill.heal[extra]) {
				if (skill.heal[extra][i][healList[extra].diffflag] === func[healList[extra].diffflag]) {
					skill.heal[extra][i] = func;
					return true;
				}
			}
		}
		skill.heal[extra].push(func);
	} else {
		skill.heal[extra] = func;
	}
}

// Checks if the skill has an extra
// just realise we dont need this either
hasHealType = (skill, extra) => {
	if (!skill.heal) return false;
	if (!skill.heal[extra]) return false;
	return skill.heal[extra];
}

// Apply Extra Effects to an existing skill using the extrasList above.
applyHeal = (message, skill, skillExtra, rawargs) => {
	if (!skill.heal) skill.heal = {};
	if (!skillExtra || !healList[skillExtra]) return message.channel.send("You're adding an invalid extra! Use the ''listhealextras'' command to list all extras.");
	if (!healList[skillExtra].apply(message, skill, rawargs)) return false
	
	message.react('👍')
	skill.done = true;
	return true;
}

buildHeal = (message, extra, args) => {
	let skill = {
		name: args[0],
		type: 'heal',
		cost: args[1],
		costtype: args[2],
		target: args[3],
		originalAuthor: message.author.id
	}

	if (healList?.[extra]?.unregsiterable && !utilityFuncs.RPGBotAdmin(message.author.id)) {
		message.channel.send(`You lack permissions to apply ${healList[extra].name} for this skill.`)
		return false;
	}

	applyHeal(message, skill, extra, args.slice(6))
	
	if (skill.done) {
		delete skill.done;
		return skill;
	} else {
		return false
	}
}