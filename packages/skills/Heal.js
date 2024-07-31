let targetColors = {
	hp: 'lime',
	hppercent: 'lime',
	mp: 'violet',
	mppercent: 'violet',
	lb: 'silver'
}

healList = {
	healstat: new Extra({
		name: "Heal Stat",
		desc: "The default heal type. Restores <Meter> by <Amount>.",
		multiple: true,
		diffflag: 0,
		args: [
			{
				name: "Amount",
				type: "Num",
				forced: true
			},
			{
				name: "Meter",
				type: "Word",
				forced: true
			}
		],
		doc: {
			pages: [
				{
					desc: `-# The default heal that you will see in some healing like need for example, is 60 HP.`+
					`\n\nThe only allowed meters you can use for this extra is: *hp, mp, hppercent, mppercent and lb*.`+
					`\n\nIf the amount is less than 0, it will **damage** the target in a similar way ${elementEmoji['almighty']} **Almighty** does. No affinity check.` 
				}
			]
		},
		applyfunc(message, skill, args) {
			if (args[0] == 0) return message.channel.send(`Healing 0 makes it redundant, doesn't it?`)
			if (!['hp', 'mp', 'hppercent', 'mppercent', 'lb'].includes(args[1].toLowerCase())) return void message.channel.send(`${args[1]} is an invalid meter to heal! Enter either HP, MP, HPPercent, MPPercent or LB.`);

			makeHeal(skill, "healstat", [args[0], args[1].toLowerCase()]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			let settings = setUpSettings(btl.guild.id);

			if (targ.custom?.pinch)
				return `__${targ.name}__ cannot be healed while they are in a pinch!`
			if (!vars[0] || vars[0] == null || vars[0] == 0) return '';

			vars[0] = modSkillResult(char, targ, vars[0], skill, btl);
//			vars[0] = Math.round(vars[0] * multiplier);

			if (settings?.mechanics?.trust && vars[0] > 0 && targ.team == char.team && targ.id != char.id) {
				changeTrust(targ, char, Math.round(20*(settings.rates.trustrate ?? 1)), true, btl, 'onheal');
			}

			let mainElementRate = settings?.rates?.mainelement ?? 1.2;
			let dualMainElementRate = settings?.rates?.dualmainelement ?? 1.1;

			switch(vars[1]) {
				case 'hp':
				case 'mp':
					let heal = vars[0] + (-8+randNum(16));

					if (isMainElement("heal", char))
						heal *= (typeof char.mainElement === "object") ? dualMainElementRate : mainElementRate;

					targ[vars[1]] = Math.max(Math.min(targ[`max${vars[1]}`], targ[vars[1]]+heal), 0);
					return `__${targ.name}__'s ${vars[1] == "hp" ? "HP" : (char.mpMeter ? char.mpMeter[1] : "MP")} was restored by **${heal}**!`;

				case 'hppercent':
					if (vars[0] >= 100) {
						targ.hp = targ.maxhp;
						return `__${targ.name}__'s HP was _fully restored_!`;
					} else {
						let amount = Math.round((targ.maxhp/100)*vars[0]);

						targ.hp = Math.max(Math.min(targ.maxhp, targ.hp+amount), 0);
						return `__${targ.name}__'s HP was restored by **${amount}**!`;
					}

				case 'mppercent':
					if (vars[0] >= 100) {
						targ.mp = targ.maxmp;
						return `__${targ.name}__'s ${targ.mpMeter ? targ.mpMeter[1] : "MP"} was _fully restored_!`;
					} else {
						let amountm = Math.round((targ.maxmp/100)*vars[0]);

						targ.mp = Math.max(Math.min(targ.maxmp, targ.mp+amountm), 0);
						return `__${targ.name}__'s ${targ.mpMeter ? targ.mpMeter[1] : "MP"} was restored by **${amountm}**!`;
					}

				case 'lb':
					targ.lbp = Math.max(targ.lbp + vars[0], 0);
					return `__${targ.name}__'s LB% was boosted by **${vars[0]}%**!`;
			}

			return '';
		},
		getinfo(vars, skill) {
			let text = 'Restores **'
			for (i in vars) {
				let healType = vars[i][1] ?? 'hp';

				if (healType.includes('percent')) healType = '% of target\'s ' + healType.replace('percent', '').toUpperCase();
				else if (healType.includes('lb')) healType = '% LB';
				else healType = ` ${healType.toUpperCase()}`;

				text += `${vars[i][0]}${healType}`;

				if (i < vars.length-2) text += ', ';
				else if (i == vars.length-2) text += ' and ';
			}
			
			return text+`**`
		}
	}),

	regenerate: new Extra({
		name: "Regenerate",
		desc: "Restores <Meter> by <Amount> over time for <Turns> turns.",
		multiple: true,
		args: [
			{
				name: "Amount",
				type: "Num",
				forced: true
			},
			{
				name: "Meter",
				type: "Word",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			},
			{
				name: "Activate after last regeneration?",
				type: "YesNo"
			},
			{
				name: "Turns before start",
				type: "Num"
			},
			{
				name: "Pause turns",
				type: "Num"
			}
		],
		doc: {
			pages: [
				{
					desc: `The only allowed meters you can use for this extra is: *hp, mp, hppercent, mppercent and lb*.`+
					`\n\nIf the amount is **less than 0**, it will **damage** the target in a similar way ${elementEmoji['almighty']} **Almighty** does. No affinity check.`+
					`\n\n*{Activate after last regeneration?}* deducts if it can go with previous regeneration or if it has to wait for it to finish. It defaults to **false**.`+
					`\n\n*{Turns before start} & {Pause turns}* change when the effect of it takes place, former at start and latter between each. The default is 0 for both, which means it will happen immediately with no pause.`
				}
			]
		},
		applyfunc(message, skill, args) {
			let hp = args[0];
			let meter = args[1].toLowerCase();
			let turns = args[2];
			let lastActivate = args[3] ?? false;
			let startTurns = Math.max(args[4] ?? 0, 0);
			let pauseTurns = Math.max(args[5] ?? 0, 0);

			if (hp == 0) return message.channel.send(`Healing 0 makes it redundant, doesn't it?`)
			if (!['hp', 'mp', 'hppercent', 'mppercent', 'lb'].includes(meter)) return void message.channel.send(`${args[1]} is an invalid meter to heal! Enter either HP, MP, HPPercent, MPPercent or LB.`);
			if (turns <= 0) return void message.channel.send(`${turns} is an invalid number of turns! Enter a number greater than 0.`);
			makeHeal(skill, "regenerate", [hp, meter, turns, lastActivate, startTurns, pauseTurns]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			vars[0] = modSkillResult(char, targ, vars[0], skill, btl);

			if (!targ.custom?.regenheal) addCusVal(targ, "regenheal", {});
			if (!targ.custom.regenheal[char.name]) targ.custom.regenheal[char.name + '-' + skill.name] = [] //to not fuck up regens from multiple ppl to the same char with each other with any waiting ones

			targ.custom.regenheal[char.name + '-' + skill.name].push({
				name: skill.name,
				username: char.name,
				heal: Math.round(vars[0] * ((!multiplier || isNaN(multiplier)) ? 1 : multiplier)),
				turns: vars[2],
				type: vars[1],
				wait: vars[4] > 0 ? vars[4]+1 : vars[3],
				pause: vars[5]+1,
				first: vars[3],
				user: char.id
			});

			if (vars[0] > 0 && targ.team == char.team && targ.id != char.id) {
				settings = setUpSettings(btl.guild.id);
				if (settings?.mechanics?.trust) changeTrust(targ, char, Math.round(5*(settings.rates.trustrate ?? 1)), true, btl, 'onregenerate');
			}
			return `__${targ.name}__ is surrounded in a ${targetColors[vars[1]]} coloured aura!`;
		},
		getinfo(vars, skill) {
			let txt = `Regenerates ` 
			for (i in vars) {
				let healType = vars[i][1];

				if (healType.includes('percent')) healType = '% of target\'s ' + healType.replace('percent', '').toUpperCase();
				else if (healType.includes('lb')) healType = '% LB';
				else healType = ` ${healType.toUpperCase()}`;

				txt += `**around ${vars[i][0]}${healType}** for **${vars[i][2]} turns**${vars[i][3] ? ' when last regeneration finishes' : ''}${vars[i][4] > 0 ? `, after **${vars[i][4]} turn${vars[i][4] > 1 ? 's' : ''}**` : ''}${vars[i][5] > 0 ? `, pausing each turn for **${vars[i][5]} turn${vars[i][5] > 1 ? 's' : ''}**` : ''}`

				if (i < vars.length - 2) txt += ', ';
				else if (i == vars.length - 2) txt += ' and ';
			}
			return txt;
		}
	}),

	revive: new Extra({
		name: "Revive",
		desc: "Revives the target to 1/<Amount> of their max HP.",
		args: [
			{
				name: "Amount",
				type: "Num",
				forced: true
			}
		],
		doc: {
			pages: [
				{
					desc: `The <Amount> may only be at least 1. The higher the number, the less HP it heals.`
				}
			]
		},
		applyfunc(message, skill, args) {
			if (args[0] <= 0) return void message.channel.send("You can't revive to 0 or less!");
			makeHeal(skill, "revive", [args[0]]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			vars[0] = modSkillResult(char, targ, vars[0], skill, btl);

			if (targ.hp > 0) return 'But it failed!';

			targ.hp = Math.round(targ.maxhp/vars[0] * multiplier);

			if (targ.team == char.team) {
				settings = setUpSettings(btl.guild.id);
				if (settings?.mechanics?.trust) changeTrust(targ, char, Math.round(30*(settings.rates.trustrate ?? 1)), true, btl, 'onrevive');
			}
			return `__${targ.name}__ was revived!`;
		},
		getinfo(vars, skill) {
			return `**Revives** the target to 1/${vars[0]} of their max HP`
		}
	}),

	recarmdra: new Extra({
		name: "Recarmdra (Persona)",
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
					if (settings?.mechanics?.trust) changeTrust(targ, char, Math.round(40*(settings.rates.trustrate ?? 1)), true, btl, 'onrecarmdra');
				}
			}

			return `The party's HP & MP was fully restored, but at the cost of __${char.name}__'s sacrifice!`;
		},
		getinfo(vars, skill) {
			return `**Fully** restores party HP and MP, but **downs the user**`
		}
	}),

	statusheal: new Extra({
		name: "Status Heal",
		desc: "Cures the target of the specified status.",
		args: [
			{
				name: "Status",
				type: "Word",
				forced: true
			}
		],
		multiple: true,
		diffflag: 0,
		doc: {
			pages: [
				{
					desc: `Any status ailment is allowed, but there are additional options:`+
					`\n- **"Physical" and "Mental"** are for all ailments that affect either the body or mind respectively.`+
					`\n- **"Positive", "Neutral" & "Negative"** are for all ailments that yield either kind of change on the target.`+
					`\n- **"All"** is for every kind of status, no matter what it is.`
				}
			]
		},
		applyfunc(message, skill, args) {
			const status = args[0]?.toLowerCase();

			if (![...statusEffects, "all", "physical", "mental", "positive", "neutral", "negative"].includes(status))
				return void message.channel.send("That's not a valid status effect.");

			makeHeal(skill, "statusheal", [status]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			switch(vars[0]) {
				case 'physical':
					if (targ.team == char.team && targ.id != char.id) {
						settings = setUpSettings(btl.guild.id);
						if (settings?.mechanics?.trust) changeTrust(targ, char, Math.round(15*(settings.rates.trustrate ?? 1)), true, btl, 'onstatushealphys');
					}

					for (let i in statusEffectFuncs) {
						if (statusEffectFuncs[i].stackable && isPhysicalStatus(targ.status)) delete targ[i];
					}

					if (isPhysicalStatus(targ.status)) {
						delete targ.status;
						delete targ.statusturns;
					}

					return `__${targ.name}__ had physical status ailments cured!`;

				case 'mental':
					if (targ.team == char.team && targ.id != char.id) {
						settings = setUpSettings(btl.guild.id);
						if (settings?.mechanics?.trust) changeTrust(targ, char, Math.round(15*(settings.rates.trustrate ?? 1)), true, btl, 'onstatushealmen');
					}

					for (let i in statusEffectFuncs) {
						if (statusEffectFuncs[i].stackable && !isPhysicalStatus(targ.status)) delete targ[i];
					}

					if (!isPhysicalStatus(targ.status)) {
						delete targ.status;
						delete targ.statusturns;
					}

					return `__${targ.name}__ had mental status ailments cured!`;

				case 'positive':
					if (targ.team == char.team && targ.id != char.id) {
						settings = setUpSettings(btl.guild.id);
						if (settings?.mechanics?.trust) changeTrust(targ, char, Math.round(-15*(settings.rates.trustrate ?? 1)), true, btl, 'onstatushealpos');
					}

					for (let i in statusEffectFuncs) {
						if (isPositiveStatus(i) && statusEffectFuncs[i].stackable) delete targ[i];
					}

					if (isPositiveStatus(targ.status)) {
						delete targ.status;
						delete targ.statusturns;
					} 

					return `__${targ.name}__ had positive status ailments removed.`;

				case 'neutral':
					if (targ.team == char.team && targ.id != char.id) {
						settings = setUpSettings(btl.guild.id);
						if (settings?.mechanics?.trust) changeTrust(targ, char, Math.round(10*(settings.rates.trustrate ?? 1)), true, btl, 'onstatushealneu');
					}

					for (let i in statusEffectFuncs) {
						if (isNeutralStatus(i) && statusEffectFuncs[i].stackable) delete targ[i];
					}

					if (isNeutralStatus(targ.status)) {
						delete targ.status;
						delete targ.statusturns;
					}

					return `__${targ.name}__ had neutral status ailments removed.`;

				case 'negative':
					if (targ.team == char.team && targ.id != char.id) {
						settings = setUpSettings(btl.guild.id);
						if (settings?.mechanics?.trust) changeTrust(targ, char, Math.round(15*(settings.rates.trustrate ?? 1)), true, btl, 'onstatushealneg');
					}

					for (let i in statusEffectFuncs) {
						if ((!isNeutralStatus(i) || !isPositiveStatus(i)) && statusEffectFuncs[i].stackable) delete targ[i];
					}

					if (!isNeutralStatus(targ.status) || !isPositiveStatus(targ.status)) {
						delete targ.status;
						delete targ.statusturns;
					}

					return `__${targ.name}__ had negative status ailments removed.`;

				case 'all':
					if (targ.team == char.team && targ.id != char.id) {
						settings = setUpSettings(btl.guild.id);
						if (settings?.mechanics?.trust) changeTrust(targ, char, Math.round(15*(settings.rates.trustrate ?? 1)), true, btl, 'onstatushealall');
					}

					for (let i in statusEffectFuncs) {
						if (statusEffectFuncs[i].stackable) delete targ[i];
					}

					delete targ.status;
					delete targ.statusturns;

					return `__${targ.name}__ had their status ailments removed.`;
				
				default:
					if (targ.status === vars[0]) {
						delete targ.status;
						delete targ.statusturns;
					} else if (targ[vars[0]]) {
						delete targ[vars[0]];
					}

					return `__${targ.name}__ had their ${statusEmojis[vars[0]]}**${vars[0]}** status effect cured!`;
			}

			return 'But it failed! Somehow..?';
		},
		getinfo(vars, skill) {
			let txt = 'Cures **'

			for (let i in vars) {
				txt += `${statusEmojis[vars[i]] ?? ''}${vars[i]}`
				if (i < vars.length - 2)
				txt += ', '
				else if (i === vars.length - 2)
				txt += ' and '
			}

			return txt + ' ailments**';
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
		doc: {
			pages: [
				{
					desc: `Any value for {HP} is allowed, but it has a hard cap in effect, 0 at the low end and max hp of the target at the high end.`+
					`\n\n-# If upon registration, the skill doesn't heal anything, it will make it heal 60 HP by default.`
				}
			]
		},
		applyfunc(message, skill, args) {
			makeHeal(skill, "sacrifice", [args[0] ?? 0]);
			let hasHeal = false;
			for (var i in skill.heal) {
				if (i != "wish" && i != "sacrifice" && i != "need") {
					hasHeal = true;
					break;
				}
			}
			if (!hasHeal) {
				makeHeal(skill, "healstat", [60, "hp"]);
			}
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (!vars[0])
				char.hp = 0;
			else {
				vars[0] = modSkillResult(char, targ, vars[0], skill, btl);
				char.hp = Math.round(vars[0] * multiplier);
			}

			if (char.hp > char.maxhp) char.hp = char.maxhp;
			if (char.hp < 0) char.hp = 0;

			return `__${char.name}__ sacrificed themselves, lowering their HP to __${char.hp}__!`;
		},
		getinfo(vars, skill) {
			return extrasList.sacrifice.getinfo(vars, skill);
		}
	}),

	wish: new Extra({
		name: "Wish",
		desc: "Will restore after <Turns> turns.",
		args: [
			{
				name: "Turns",
				type: "Num",
				forced: true
			}
		],
		doc: {
			pages: [
				{
					desc: `The amount of {Turns} needs to be at least 1. The higher, the longer the wait.`+
					`\n\n-# If upon registration, the skill doesn't heal anything, it will make it heal 60 HP by default.`
				}
			]
		},
		applyfunc(message, skill, args) {
			const turns = args[0];

			if (turns <= 0) return void message.channel.send("You can't wish for 0 turns or less!");
			makeHeal(skill, "wish", [turns]);

			let hasHeal = false
			for (var i in skill.heal) {
				if (i != "sacrifice" && i != "wish" && i != "need") {
					hasHeal = true;
					break;
				}
			}
			if (!hasHeal) makeHeal(skill, "healstat", [60, "hp"]);

			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			vars[0] = modSkillResult(char, targ, vars[0], skill, btl);
			vars[0] = ~~(vars[0] / multiplier);

			addCusVal(targ, "wishheal", {
				turns: vars[0],
				user: objClone(char),
				skill: skill
			})

			return `__${targ.name}__ will experience a healing wish in **${vars[0]}** turns...`;
		},
		getinfo(vars, skill) {
			return `Force the heal to occur after **${vars[0]} turns**`;
		}
	}),

	need: new Extra({
		name: extrasList.need.name,
		desc: extrasList.need.desc,
		multiple: extrasList.need.multiple,
		args: extrasList.need.args,
		doc: {
			pages: [
				{
					desc: "### The *{Affected Parameter}* can be either:"+
						"\n- **A Skill extra** - Checks for applicability of the extra.\n-# Can only check for the user on: need, movelink & painsplit."+
						"\n- **\"SkillBeforeUse\"** - Checks for usability of the skill entirely.\n-# The default option, but can't check for the target."+
						"\n- **\"SkillOnSelect\"** - Checks for usability of the skill after using cost.\n-# Alternate to **SKILLBEFOREUSE**, that can check for the target."+
						"\n\nA fair amount of options are not included for heals, like CRIT or STATUS. This is because they aren't meant to offer such."+
						`\n\n-# If upon registration, the skill doesn't heal anything, it will make it heal 60 HP by default.`
				},
				{
					desc: "### As for *<Condition>...*\nThere are multiple different kinds of conditions, and those come with different *<Additional Parameters>*. These are:",
					fields: Object.entries(needConditions).map(x => x = {
						name: `${x[1].name} (${x[0]})`,
						value: `\n\n${x[1].getFullDesc()}`,
						inline: true
					}).slice(0,6)
				},
				{
					desc: "### As for *<Condition>...*\nThere are multiple different kinds of conditions, and those come with different *<Additional Parameters>*. These are:",
					fields: Object.entries(needConditions).map(x => x = {
						name: `${x[1].name} (${x[0]})`,
						value: `\n\n${x[1].getFullDesc()}`,
						inline: true
					}).slice(6,12)
				}
			]
		},
		applyfunc(message, skill, args) {
			let condition = args[0].toLowerCase()
			let target = args[1].toLowerCase()
			let params = args.slice(3).map(v => v.toLowerCase())
			let affected = args[2]?.toLowerCase() ?? "skillbeforeuse"
			
			if (target != 'target' && target != 'user' && !['turn', 'battlecondition'].includes(condition)) //Target/User
				return void message.channel.send("You entered an invalid value for <User/Target>! It can be either Target or User.");

			//Affected Parameter
			if (!healList[affected] && !['skillbeforeuse', 'skillonselect'].includes(affected)) return void message.channel.send("That's not the valid affected parameter you can have.");

			if (affected == 'skillbeforeuse' && target == 'target') return void message.channel.send("Unfortunately it's not possible to check using the target here, as the check for usability of the skill in its entirety is done before you can choose the target.");

			if (healList[affected] && ['need', 'movelink', 'painsplit'].includes(affected)) return void message.channel.send(`Unfortunately ${affected.toUpperCase()} does not account for the target at all, only the user.`);

			if (!needConditions[condition]) return void message.channel.send(`Hold on, ${condition} is not the valid condition you can have.`);

			params = needConditions[condition].apply(message, skill, params, condition)

			if (params) {
				makeHeal(skill, "need", [condition, target, affected, ...params]);

				let hasHeal = false
				for (var i in skill.heal) {
					if (i != "sacrifice" && i != "wish" && i != "need") {
						hasHeal = true;
						break;
					}
				}
				if (!hasHeal) makeHeal(skill, "healstat", [60, "hp"]);

				return true;
			}

			return false;
		},
		canuse: extrasList.need.canuse,
		skillfailonuse: extrasList.need.skillfailonuse,
		getinfo: extrasList.need.getinfo
	}),

	powerheal: new Extra({
		name: "Power-based Healing",
		desc: "Restores <HP/MP> by <Amount>, but is calculated as if it were dealing damage.",
		multiple: true,
		diffflag: 0,
		args: [
			{
				name: "Amount",
				type: "Num",
				forced: true
			},
			{
				name: "HP/MP",
				type: "Word",
				forced: true
			},
			{
				name: "User Stat",
				type: "Word",
				forced: true
			},
			{
				name: "Target Stat",
				type: "Word",
				forced: true
			},
		],
		doc: {
			pages: [
				{
					desc: `As per *<HP/MP>*, the only allowed meters are: *hp and mp*.`+
					`\n\nIf the amount is less than 0, it will **damage** the target in a similar way ${elementEmoji['almighty']} **Almighty** does. No affinity check.`+
					`\n\nThe stats allowed for *<User Stat>* & *<Target Stat>* are: *${stats.join(', ')}*`+
					`\n\nPowerheal only uses the **Persona** damage formula exclusively.`
				}
			]
		},
		applyfunc(message, skill, args) {
			let ustat = args[2].toLowerCase();
			let ostat = args[3].toLowerCase();

			if (args[0] == 0)  return message.channel.send(`Healing 0 makes it redundant, doesn't it?`)

			if (!['hp', 'mp'].includes(args[1].toLowerCase())) return void message.channel.send(`${args[1]} is an invalid meter to heal! Enter either HP or MP.`);
			if (!stats.includes(ustat)) return void message.channel.send(`${args[2]} isn't a valid stat.`);
			if (!stats.includes(ostat)) return void message.channel.send(`${args[3]} isn't a valid stat.`);

			makeHeal(skill, "powerheal", [args[0], args[1].toLowerCase(), ustat, ostat]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (targ.custom?.pinch) return `__${targ.name}__ cannot be healed while they are in a pinch!`
			if (!vars[0] || vars[0] == null || vars[0] == 0) return '';

			vars[0] = modSkillResult(char, targ, vars[0], skill, btl);
//			vars[0] = Math.round(vars[0] * multiplier);

			if (vars[0] > 0 && targ.team == char.team && targ.id != char.id) {
				settings = setUpSettings(btl.guild.id);
				if (settings?.mechanics?.trust) changeTrust(targ, char, Math.round(20*(settings.rates.trustrate ?? 1)), true, btl, 'onpowerheal');
			}

			let atkStat = statWithBuff(char.stats[vars[2]], char.buffs[vars[2]] ?? char.buffs.mag, char) ?? char.stats.mag;
			let endStat = statWithBuff(targ.stats[vars[3]], targ.buffs[vars[3]] ?? targ.buffs.end, targ) ?? targ.stats.end;

			let def = (atkStat/endStat);

			let heal = Math.round(5 * (vars[0] / Math.abs(vars[0])) * Math.sqrt(def * Math.abs(vars[0] )))+randNum(-10, 10);
			console.log(`Attack Stat: ${atkStat}, Endurance Stat: ${endStat}, Skill Pow: ${vars[0]}, Base Dmg: ${Math.round(5 * Math.sqrt(def * vars[0]))}, Real Dmg: ${heal}`);

			targ[vars[1]] = Math.max(Math.min(targ[`max${vars[1]}`], targ[vars[1]]+heal), 0);
			return `__${targ.name}__'s **${vars[1] == "hp" ? "HP" : (char.mpMeter ? char.mpMeter[1] : "MP")}** was restored by **${heal}**!`;
		},
		getinfo(vars, skill) {
			let text = 'Restores '
			for (i in vars) {
				let healType = (vars[i][1] ?? 'hp').toUpperCase();
				text += `**${vars[i][0]}${healType}** based on **user ${vars[i][2]}** and **target ${vars[i][3]}**`;

				if (i < vars.length-2){
					text += ', ';
				} else if (i == vars.length-2) {
					text += ' and ';
				}
			}

			return `${text}, using the **Damage Formula**`
		}
	}),

	buff: new Extra({
		name: "Stat Buff",
		desc: extrasList.buff.desc,
		args: extrasList.buff.args,
		doc: extrasList.buff.doc,
		multiple: true,
		applyfunc(message, skill, args) {
			const target = args[0].toLowerCase()
			const stat = args[1].toLowerCase()
			const stages = args[2] ?? 1
			const chance = Math.min(args[3] ?? 100, 100)
			const turns = args[4] ?? null

			if (target != 'user' && target != 'target') 
				return void message.channel.send(`You typed ${target} as the target. It must be either \`user\` or \`target\`.`)
			if (!['atk', 'mag', 'prc', 'end', 'agl', "crit", "all"].includes(stat))
				return void message.channel.send("That's not a valid stat!");
			if (stages == 0)
				return void message.channel.send("...This amount of stages won't do anything, I'm afraid.");
			if (Math.abs(stages) > 3) 
				return void message.channel.send("The maximum amount of stages is 3!");
			if (chance <= 0)
				return void message.channel.send("You can't have a percentage less than 0, as then it would never happen!");
			if (turns && turns <= 0)
				return void message.channel.send("You can't have a turn amount less than 0, as then it would revert to normal too soon.");

			makeHeal(skill, "buff", [target, stat, stages, chance, turns])
			return true
		},
		onselect(char, skill, btl, vars, multiplier) {
			if (vars[0] != 'user') return '';
			return extrasList.buff.buffChange(char, char, skill, btl, vars);
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (vars[0] != 'target') return '';
			return extrasList.buff.buffChange(char, targ, skill, btl, vars);
		},
		getinfo: buffText
	}),

	charges: new Extra({
		name: extrasList.charges.name,
		desc: extrasList.charges.desc,
		args: extrasList.charges.args,
		doc: extrasList.charges.doc,
		canuse: extrasList.charges.canuse,
		onuse: extrasList.charges.onuse,
		getinfo: extrasList.charges.getinfo,
		applyfunc(message, skill, args) {
			let charges = args[0]
			let rate = args[1] ?? 0
			if (charges < 1)
				return void message.channel.send("What's the point of a skill that you can never use?")
			makeHeal(skill, "charges", [charges, rate, args[2]]);
			return true
		},
	}),

	movelink: new Extra({
		name: extrasList.movelink.name,
		desc: extrasList.movelink.desc,
		doc: extrasList.movelink.doc,
		hardcoded: extrasList.movelink.hardcoded,
		args: extrasList.movelink.args,
		getinfo: extrasList.movelink.getinfo,
		applyfunc(message, skill, args) {
			for (let i in args) {
				if (!skillFile[args[i]]) return void message.channel.send(`${args[i]} is not an existing skill.`);
				if (skillFile[args[i]] === skill) return void message.channel.send("You may not have skills link with themselves.");
			}

			makeHeal(skill, "movelink", args);
			return true
		}
	}),

	formchange: new Extra({
		name: extrasList.formchange.name,
		desc: extrasList.formchange.desc,
		args: extrasList.formchange.args,
		doc: extrasList.formchange.doc,
		onselect: extrasList.formchange.onselect,
		onuse: extrasList.formchange.onuse,
		getinfo: extrasList.formchange.getinfo,
		applyfunc(message, skill, args) {
			makeHeal(skill, "formchange", [args[0], Math.min(100, Math.max(0, parseInt(args[1] ?? 100))), args[2] ?? false, args[3] ?? undefined]);
			return true
		}
	}),

	painsplit: new Extra({
		name: "Pain Split (Pokémon)",
		desc: "Shares <Percent%> of all targets' <HP/MP/LB%> between them, equally.",
		diffflag: 0,
		args: [
			{
				name: "Percent%",
				type: "Decimal"
			},
			{
				name: "HP/MP/LB%",
				type: "Word",
				forced: true
			}
		],
		doc: {
			pages: [
				{
					desc: `As per *<HP/MP/LB%>*, the only allowed meters are: *hp, mp and lb%*.`+
					`\n\nPercentages that are *0%* and less, default to *100%* instead, meaning **all** of every target's meter is shared.\n-# Percentages above 100% cap at 100% though.`
				}
			]
		},
		applyfunc(message, skill, args) {
			let percent = 100;
			if (args[0] && (args[0] > 0 || args <= 100)) percent = args[0];

			if (!['hp', 'mp', 'lb%'].includes(args[1].toLowerCase())) return void message.channel.send(`${args[1]} is an invalid meter to share! Enter either HP, MP, or LB%.`);

			makeHeal(skill, "painsplit", [percent, args[1].toLowerCase()]);
			return true;
		},
		replaceatk(char, skill, targets, btl, vars) {
			let str = `The ${vars[1].toUpperCase()} between the targets was shared equally.`;

			let hp = 0;
			let stat = vars[1] == 'lb%' ? 'lbp' : vars[1];

			let targ;
			for (let i in targets) {
				targ = getCharFromId(targets[i][0], btl);
				hp += targ[stat];
			}

			hp = Math.round(hp*(vars[0]/100)/targets.length);

			let newhp = 0;
			let diffhp = 0;
			for (let i in targets) {
				targ = getCharFromId(targets[i][0], btl);

				newhp = Math.min(hp, vars[1] == 'lb%' ? 1000 : targ[`max${stat}`]);
				diffhp = newhp - targ[stat];

				str += `\n__${targ.name}__'s **${vars[1].toUpperCase()}** was set to **${newhp}**, _which is a difference of **${diffhp}**_.`;
				targ[stat] = newhp;
			}

			return [true, str];
		},
		getinfo(vars, skill) {
			return `Shares **${vars[0]}%** of the targets' **${vars[1].toUpperCase()}** between each of them`
		}
	}),
}

modSkillResult = (char, targ, result, skill, btl) => {
	if (doPassives(btl) && !skill.limitbreak) {
		for (let skillName of char.skills) {
			if (!skillFile[skillName]) continue;

			let psv = skillFile[skillName];
			if (psv.type != 'passive' || !psv.passive) continue;

			for (let i in psv.passive) {
				if (passiveList[i] && passiveList[i].dmgmod) {
					if (needCheck(char, targ, psv, 'passive', 'skillbeforeuse', btl) !== true) continue;
					if (!needCheck(char, targ, psv, 'passive', i, btl)) continue;

					if (passiveList[i].multiple) {
						for (let k in psv.passive[i]) result = passiveList[i].dmgmod(char, targ, result, skill, btl, psv.passive[i][k]) ?? result;
					} else
						result = passiveList[i].dmgmod(char, targ, result, skill, btl, psv.passive[i]) ?? result;
				}
			}
		}
	}

	return result
}

// Make a status type for a skill. "func" should be an array of 1-5 values indicating what the extra does.
makeHeal = (skill, extra, func) => {
	if (!skill.heal) skill.heal = {};
	if (!skill.heal[extra]) skill.heal[extra] = [];

	if (healList[extra].multiple) {
		/*if (healList[extra].diffflag) {
			for (i in skill.heal[extra]) {
				if (skill.heal[extra][i][healList[extra].diffflag] === func[healList[extra].diffflag]) {
					skill.heal[extra][i] = func;
					return true;
				}
			}
		}*/
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
applyHeal = (message, skill, skillExtra, rawargs, lb) => {
	if (!skill.heal) skill.heal = {};
	if (!skillExtra || !healList[skillExtra]) return message.channel.send("You're adding an invalid extra! Use the ''listhealextras'' command to list all extras.");

	if (lb) {
		if (!healList[skillExtra].apply(message, skill, rawargs.slice(3), healList[skillExtra].name)) return false;
	} else {
		if (!healList[skillExtra].apply(message, skill, rawargs, healList[skillExtra].name)) return false;
	}
	
	message.react('👍')
	skill.done = true;
	return true;
}

buildHeal = (message, extra, args) => {
	let skill = {
		name: args[0],
		type: 'heal',
		cost: args[1],
		costtype: args[2].toLowerCase(),
		target: args[3],
		creationtime: Date.now(),
		originalAuthor: message.author.id
	}

	if (healList?.[extra]?.unregsiterable && !utilityFuncs.RPGBotAdmin(message.author.id)) {
		message.channel.send(`You lack permissions to apply ${healList[extra].name} for this skill.`)
		return false;
	}

	applyHeal(message, skill, extra.toLowerCase(), args.slice(6))
	
	if (skill.done) {
		delete skill.done;
		return skill;
	} else {
		return false
	}
}