const weakSide = ['superweak', 'weak', 'normal']
const resistSide = ['normal', 'resist', 'block', 'repel', 'drain']
const damageFormulas = ['persona', 'pokemon', 'lamonka', 'beta']

Extra = class extends ArgList {
	constructor(object) {
		super(object.args, object.desc)
		this.name = object.name
		this.multiple = object.multiple
		this.diffflag = object.diffflag
		for (const i in object) {
			const func = object[i]
			if (typeof func != "function")
				continue
			this[i] = func
		}
	}

	apply(message, skill, rawargs) {
		const args = this.parse(message, rawargs)
		if (!args)
			return false
		return this.applyfunc(message, skill, args)
	}
}

extrasList = {
	ohko: new Extra({
		name: "One Hit KO",
		desc: 'Instantly defeats the foe at a <Chance>% chance. Can have {Status} to make it only affect foes with that status.',
		args: [
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			},
			{
				name: "Status",
				type: "Word",
			}
		],
		applyfunc(message, skill, args) {
			const chance = args[0]
			const status = args[1]?.toLowerCase()
			if (chance <= 0)
				return void message.channel.send("What's the point of using this skill if it never lands?");

			if (status && !statusEffects.includes(status))
				return void message.channel.send("You're adding an invalid status effect!");

			makeExtra(skill, "ohko", [chance, status]);
			return true
		},
		onuseoverride(char, targ, skill, btl, vars) {
			if (vars[1] && vars[1] != null && targ.status != vars[1]) return dodgeTxt(targ);

			let chance = randNum(100);
			let target = vars[0]+((char.stats.luk-targ.stats.luk)/2)

			if (chance <= target) {
				targ.hp = 0;
				return `__${char.name}__ instantly KO'd __${targ.name}__!`;
			} else {
				return dodgeTxt(targ);
			}
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
			makeExtra(skill, "sacrifice", [args[0] ?? 0]);
			return true
		},
		onuse(char, targ, skill, btl, vars) {
			char.hp = vars[0];

			return `__${char.name}__ sacrificed themselves! Their HP dropped to **${vars[0]}**!`;
		}
	}),

	need: new Extra({
		name: "Need",
		desc: 'Will make the skill require <Less/More> than <Percent>% of <Cost Type> for it to work.',
		multiple: true,
		diffflag: [0, 3],
		args: [
			{
				name: "Less/More",
				type: "Word",
				forced: true
			},
			{
				name: "Equal?",
				type: "Word"
			},
			{
				name: "Percent",
				type: "Decimal",
				forced: true
			},
			{
				name: "Cost Type",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let less = args[0].toLowerCase()
			let equal = (args[1] == 'true' || args[1] == 'yes' || args[1] == 'y' || args[1] == '1')
			const percent = args[2]
			const stat = args[3].toLowerCase()

			if (less != "less" && less != "more") return void message.channel.send("You specify if the skill needs to be less or more of something, not whatever you said.");
			if (percent < 1)
				return void message.channel.send("You can't need less than 0%!");
			if (stat != 'hp' && stat != 'mp' && stat != 'hppercent' && stat != 'mppercent' && stat != 'lb')
				return void message.channel.send("You entered an invalid value for <Cost Type>! It can be either HP, HPPercent, MP, MPPercent, or LB.");
			
			makeExtra(skill, "need", [less, equal, percent, stat]);
			return true
		},
		canuse(char, skill, btl, vars) {
			let check = vars[0] == 'less' ? '<' : '>';
			if (vars[1]) check += '=';

			const applyOperator = new Function('a', 'b', `return a ${check} b;`);

			switch(vars[3].toLowerCase()) {
				case 'mp':
					if (!applyOperator(char.mp, vars[2])) return `You need ${vars[0]} ${vars[1] ? 'or equal to' : 'than'} ${vars[2]}MP to use this move!`;
					break;
				case 'lb':
					if (!applyOperator(char.lbpercent, vars[2])) return `You need ${vars[0]} ${vars[1] ? 'or equal to' : 'than'} ${vars[2]}LB% to use this move!`;
					break;
				case 'mppercent':
					if (!applyOperator((char.mp/char.maxmp)*vars[2], vars[2])) return `You need ${vars[0]} ${vars[1] ? 'or equal to' : 'than'} ${(char.mp/char.maxmp)*vars[2]}% MP to use this move!`;
					break;
				case 'hppercent':
					if (!applyOperator((char.hp/char.maxhp)*vars[2], vars[2])) return `You need ${vars[0]} ${vars[1] ? 'or equal to' : 'than'} ${vars[2]}% HP to use this move!`;
					break;
				default:
					if (!applyOperator(char.hp, vars[2])) return `You need ${vars[0]} ${vars[1] ? 'or equal to' : 'than'} ${vars[2]}HP to use this move!`;
					break;
			}

			return true;
		}
	}),

	changeaffinity: new Extra({
		name: "Change Affinity",
		desc: "Will change <Target/User>'s affinity from the <Weak/Resist/Both> side of <Element> to <Affinity>. *Keep in mind that if you want it to last {Turns} turns, it can't be overwritten by a different affinity until then.*",
		multiple: true,
		diffflag: [0, 1, 2],
		args: [
			{
				name: "Target/User",
				type: "Word",
				forced: true
			},
			{
				name: "Element",
				type: "Word",
				forced: true
			},
			{
				name: "Affinity",
				type: "Word",
				forced: true
			},
			{
				name: "Weak/Resist/Both",
				type: "Word",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
			}
		],
		applyfunc(message, skill, args) {
			const target = args[0].toLowerCase()
			const element = args[1].toLowerCase()
			const affinity = args[2].toLowerCase()
			const side = args[3].toLowerCase()
			const turns = args[4]
			if (target != 'target' && target != 'user')
				return void message.channel.send("You entered an invalid value for <target/user>! It can be either Target or User.");
			if (![...Affinities, 'normal'].includes(affinity))
				return void message.channel.send("You entered an invalid value for <Affinity>! It can be any of the following: " + Affinities.join(', ') + " or Normal.");
			if (!Elements.includes(element))
				return void message.channel.send("You entered an invalid value for <Element>!");
			if (side != 'weak' && side != 'resist' && side != 'both')
				return void message.channel.send("You entered an invalid value for <Weak/Resist/Both>! It can be either Weak, Resist, or Both.");
			if (turns && turns < 5)
				return void message.channel.send("You can't have a turn count less than 1!");
			makeExtra(skill, "changeaffinity", [target, element, affinity, side, turns]);
			return true
		},
		onselect(char, skill, btl, vars) {
			if (vars[0].toLowerCase() != 'user') return

			return extrasList.changeaffinity.targetchange(char, vars, skill)
		},
		onuse(char, targ, skill, btl, vars) {
			if (vars[0].toLowerCase() != 'target') return

			return extrasList.changeaffinity.targetchange(targ, vars, skill)
		},
		targetchange(target, vars, skill) {
			if (!target.affinities) target.affinities = [];

			let setAffinities = []

			let wasChanged = false;

			if (vars[3] != 'normal') {
				if (target.affinities[vars[2]] && target.affinities[vars[2]].includes(vars[1])) {
					return `__${target.name}__ wasn't affected by __${skill.name}__!`;
				}
			}

			if (vars[4] && vars[4] != null) {
				if (!target?.custom?.oldAffinities) 
					addCusVal(target, "oldAffinities", {});
			}

			for (let i in target.affinities) {
				setAffinities.push(...target.affinities[i])

				if (target?.custom?.oldAffinities?.[i] && Object.keys(target?.custom?.oldAffinities?.[i]).includes(vars[1])) continue;

				if (vars[4] && vars[4] != null) {
					if (!target?.custom?.oldAffinities[i]) target.custom.oldAffinities[i] = {};
				}

				if (vars[3] == 'resist' && !resistSide.includes(i)) continue
				if (vars[3] == 'weak' && !weakSide.includes(i)) continue

				if (target.affinities[i].includes(vars[1])) {
					target.affinities[i].splice(target.affinities[i].indexOf(vars[1]), 1);
					wasChanged = true;
					if (vars[4] && vars[4] != null) {
						if (!target?.custom?.oldAffinities[i][vars[1]]) target.custom.oldAffinities[i][vars[1]] = vars[4];
					}
					break;
				}
			}

			let normalAffinities = Elements.filter(e => !setAffinities.includes(e));

			if (!wasChanged && ((!normalAffinities.includes(vars[1]) && vars[2] != 'normal') || (vars[2] == 'normal' && normalAffinities.includes(vars[1])))) {
				return `__${target.name}__ wasn't affected by __${skill.name}__!`;
			}

			if (vars[3] != 'normal') {
				if (normalAffinities.includes(vars[1])) {
					if (!target?.custom?.oldAffinities['normal']) target.custom.oldAffinities['normal'] = {};
					if (!target?.custom?.oldAffinities['normal'][vars[1]]) target.custom.oldAffinities['normal'][vars[1]] = vars[4];
				}

				if (!target.affinities[vars[2]]) target.affinities[vars[2]] = [];
				target.affinities[vars[2]].push(vars[1]);
			}

			return `__${target.name}__'s affinity for ${elementEmoji[vars[1]]}**${vars[1]}** was changed to ${affinityEmoji[vars[2]]}**${vars[2]}**!`;
		}
	}),

	rest: new Extra({
		name: "Rest",
		desc: "Forces the user to rest for one turn.",
		applyfunc(message, skill) {
			makeExtra(skill, "rest", [true]);
			return true
		},
		onselect(char, skill, btl, vars) {
			char.rest = true;
			return `__${char.name}__ must rest to regain their energy!`;
		}
	}),

	buff: new Extra({
		name: "Stat Buff",
		desc: "Will buff or debuff the <Target/User>'s <Stat> at a <Chance>% chance. Positive values for <Stages> indicate a buff while negative values for <Stages> indicate a debuff. You can also make a buff/debuff last {Turns} turns.",
		multiple: true,
		diffflag: [0, 1, 3],
		args: [
			{
				name: "Target/User",
				type: "Word",
				forced: true
			},
			{
				name: "Stat",
				type: "Word",
				forced: true
			},
			{
				name: "Stages",
				type: "Num"
			},
			{
				name: "Chance",
				type: "Decimal"
			},
			{
				name: "Turns",
				type: "Num"
			}
		],
		applyfunc(message, skill, args) {
			const target = args[0].toLowerCase()
			const stat = args[1].toLowerCase()
			const stages = args[2] ?? 1
			const chance = Math.min(args[3] ?? 100, 100)
			const turns = args[4] ?? null

			if (target != 'user' && target != 'target') 
				return void message.channel.send(`You typed ${target} as the target. It must be either \`user\` or \`target\`.`)
			if (!stats.includes(stat))
				return void message.channel.send("That's not a valid stat!");
			if (stages == 0)
				return void message.channel.send("...This amount of stages won't do anything, I'm afraid.");
			if (chance <= 0)
				return void message.channel.send("You can't have a percentage less than 0, as then it would never happen!");
			if (turns && turns <= 0)
				return void message.channel.send("You can't have a turn amount less than 0, as then it would revert to normal too soon.");

			makeExtra(skill, "buff", [target, stat, stages, chance, turns])
			return true
		},
		onselect(char, skill, btl, vars) {
			if (vars[0] != 'user') return;
			return extrasList.buff.buffChange(char, skill, btl, vars);
		},
		onuse(char, targ, skill, btl, vars) {
			if (vars[0] != 'target') return;
			return extrasList.buff.buffChange(targ, skill, btl, vars);
		},
		buffChange(targ, skill, btl, vars) {
			if (targ.charms && targ.charms.includes("PureVision") && vars[1].toLowerCase() === 'prc') return `${targ.name}'s Pure Vision negated the change.`;

			if (vars[3]) {
				let chance = randNum(1, 100);

				if (chance <= vars[3]) {
					buffStat(targ, vars[1].toLowerCase(), vars[2]);

					if (vars[4] && vars[4] != null) {
						if (!targ?.custom?.buffTurns) 
							addCusVal(targ, "buffTurns", []);

						for (let i = 0; i < Math.abs(vars[2]); i++) {
							if (!((vars[2] < 0 && targ.custom.buffTurns.filter(x => x[0] == vars[1].toLowerCase() && x[1] < 0).length >= 3) || (vars[2] > 0 && targ.custom.buffTurns.filter(x => x[0] == vars[1].toLowerCase() && x[1] > 0).length >= 3))) {
								targ.custom.buffTurns.push([
									vars[1].toLowerCase(),
									vars[4] * (vars[2] / Math.abs(vars[2]))
								])
							}
						}
					}

					return `__${targ.name}__'s _${vars[1].toUpperCase()}_ was buffed **${vars[2]}** time(s)!`;
				} else {
					if (skill.type == 'status')
						return `But it missed __${targ.name}__!`;
					else
						return '';
				}
			} else {
				buffStat(targ, vars[1].toLowerCase(), vars[2]);

				if (vars[4] && vars[4] != null) {
					if (!targ?.custom?.buffTurns) 
						addCusVal(targ, "buffTurns", []);

					for (let i = 0; i < Math.abs(vars[2]); i++) {
						if (!((vars[2] < 0 && targ.custom.buffTurns.filter(x => x[0] == vars[1].toLowerCase() && x[1] < 0).length >= 3) || (vars[2] > 0 && targ.custom.buffTurns.filter(x => x[0] == vars[1].toLowerCase() && x[1] > 0).length >= 3))) {
							targ.custom.buffTurns.push([
								vars[1].toLowerCase(),
								vars[4] * (vars[2] / Math.abs(vars[2]))
							])
						}
					}
				}

				return `__${targ.name}__'s _${vars[1].toUpperCase()}_ was buffed **${vars[2]}** time(s)!`;
			}
		}
	}),

	powerbuff: new Extra({
		name: "Power Buff",
		desc: "Boosts skill power with <Stat> buffs by, or by up to <Number>, or <Number>% of skill's power.",
		multiple: true,
		diffflag: 0,
		args: [
			{
				name: "Stat",
				type: "Word",
				forced: true
			},
			{
				name: "Number",
				type: "Num",
				forced: true
			},
			{
				name: "Up to?",
				type: "Word"
			},
			{
				name: "Percent?",
				type: "Word"
			}
		],
		applyfunc(message, skill, args) {
			const stat = args[0].toLowerCase()
			const trueFa = (args[3] == 'true' || args[3] == 'yes' || args[3] == 'y' || args[3] == '1')
			const upto = (args[2] == 'true' || args[2] == 'yes' || args[2] == 'y' || args[2] == '1')
			if (!utilityFuncs.validStat(stat))
				return void message.channel.send("That's not a valid stat!");
			makeExtra(skill, "powerbuff", [stat, args[1], upto, trueFa]);
			return true
		},
		statmod(char, skill, vars, btl) {
			let lmao = 0
			if (char?.buffs?.[vars[0]]) {
				if (vars[3])
					lmao += skill.pow * vars[1] / 100 * char.buffs[vars[0]]/3;
				else
					lmao += vars[1] * char.buffs[vars[0]]/3;
			}

			if (!vars[2]) skill.pow += lmao * 3
		}
	}),

	takemp: new Extra({
		name: "Take MP",
		desc: "Will take <MP> MP from the foe each hit.",
		args: [
			{
				name: "MP",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (args[0] == 0) return void message.channel.send("One would take no MP from a foe.");
			makeExtra(skill, "takemp", [args[0]]);
			return true
		},
		onuse(char, targ, skill, btl, vars) {
			if (targ.mp <= 0) return `But it failed!`;
			let MPtaken = vars[0] * skill.hits ?? 1;
			if (targ.mp < MPtaken) MPtaken = targ.mp;

			char.mp += MPtaken;
			if (char.mp > char.maxmp) char.mp = char.maxmp;
			targ.mp -= MPtaken;
			if (targ.mp < 0) targ.mp = 0;

			return `__${char.name}__ took **${MPtaken} MP** from __${targ.name}__!`;
		}
	}),

	stealmp: new Extra({
		name: "Steal MP",
		desc: "Turns the skill into a skill that takes <Power> MP from the foe.",
		applyfunc(message, skill) {
			makeExtra(skill, "stealmp", [true]);
			return true
		},
		onuseoverride(char, targ, skill, btl, vars) {
			if (targ.mp <= 0) return `But it failed!`;
			let mpStolen = Math.max(1, skill.pow+randNum(-10, 10));
			if (targ.mp < mpStolen) mpStolen = targ.mp;
			
			targ.mp = Math.max(0, targ.mp-mpStolen)
			char.mp = Math.min(char.maxmp, char.mp+mpStolen)
			
			return `__${char.name}__ managed to steal **${mpStolen}** MP!`;
		}
	}),

	steal: new Extra({
		name: "Steal",
		desc: "Has a <Chance>% chance to steal {Amount} of the foe team's items.",
		args: [
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			},
			{
				name: "Amount",
				type: "Num",
				forced: true
			}
		],
		multiple: true,
		diffflag: 0,
		applyfunc(message, skill, args) {
			const chance = args[0]
			const amount = args[1]
			if (chance <= 0)
				return void message.channel.send("What's the point of stealing if the extra never lands?");
			if (amount <= 0)
				return void message.channel.send("What's the point of stealing if you're not stealing anything?");
			makeExtra(skill, "steal", [chance, amount]);
			return true
		},
		onuse(char, targ, skill, btl, vars) {
			let num = randNum(100)
			let stealTxt = ''

			if (targ?.loot && num <= vars[0]) {
				let weaponFile = setUpFile(`${dataPath}/json/${btl.guild.id}/weapons.json`);
				let armorFile = setUpFile(`${dataPath}/json/${btl.guild.id}/armor.json`);
				let itemFile = setUpFile(`${dataPath}/json/${btl.guild.id}/items.json`);
				
				let party = btl.teams[0];

				let amount = vars[1]
				let curAmount = 0

				let items = {}

				while (curAmount != amount) {
					if (targ.loot.weapons.length <= 0) {
						curAmount = amount;
						break;
					}

					let chosenItem = targ.loot[randNum(targ.loot.length - 1)]
					let index = targ.loot.indexOf(chosenItem)

					switch(chosenItem.type.toLowerCase()) {
						case 'item':
							if (itemFile[chosenItem.id]) {
								if (!items[itemFile[chosenItem.id].name]) items[itemFile[chosenItem.id].name] = 0;
								if (!party.items[chosenItem.id]) party.items[chosenItem.id] = 0;
								items[itemFile[chosenItem.id].name]++;
								party.items[chosenItem.id]++;
							}
							break;

						// btw we should only be able to aquire one weapon or armor of each type.
						case 'weapon':
							if (!party.weapons[chosenItem.id] && weaponFile[chosenItem.id]) {
								party.weapons[chosenItem.id] = objClone(weaponFile[chosenItem.id]);
								items[weaponFile[chosenItem.id].name] = 1;
							}
							break;

						case 'armor':
							if (!party.armors[chosenItem.id] && armorFile[chosenItem.id]) {
								party.armors[chosenItem.id] = objClone(armorFile[chosenItem.id]);
								items[armorFile[chosenItem.id].name] = 1;
							}
							break;
					}

					targ.loot[index].amount--;

					if (targ.loot[index].amount == 0) {
						targ.loot.splice(index, 1);
					}

					curAmount++
				}

				if (Object.keys(items).length > 0) {
					stealTxt += `__${char.name}__ stole **`

					for (let j in items) {
						if (items[j] && items[j] > 0) {
							stealTxt += `${(items[j] <= 1) ? 'a' : items[j]} ${j}${(items[j] > 1) ? 's' : ''}`;

							if (Object.keys(items).indexOf(j) < Object.keys(items).length - 2) {
								stealTxt += ', ';
							} else if (Object.keys(items).indexOf(j) == Object.keys(items).length - 2) {
								stealTxt += ' and ';
							}
						}
					}

					stealTxt += `** from __${targ.name}__`

					btl.teams[0] = party;

					return stealTxt;
				}
			}
			return `__${char.name}__ failed to steal anything.`
		}
	}),

	drain: new Extra({
		name: "Drain",
		desc: "Heals the user for 1/<Amount> of the damage dealt.",
		args: [
			{
				name: "Amount",
				type: "Num"
			}
		],
		applyfunc(message, skill, args) {
			makeExtra(skill, "drain", [args[0] ?? 1]);
			return true
		},
		ondamage(char, targ, dmg, skill, btl, vars) {
			let heal = dmg/vars[0];
			char.hp = Math.min(char.maxhp, char.hp+heal);

			return `__${char.name}__ drained **${vars[0]}** HP from ${targ.name}!`;
		}
	}),

	feint: new Extra({
		name: "Feint",
		desc: "Bypasses shielding skills like Makarakarn and Tetrakarn.",
		applyfunc(message, skill) {
			makeExtra(skill, "feint", [true]);
			return true;
		},
		hardcoded: true
	}),

	healverse: new Extra({
		name: "Healverse",
		desc: "After the foe is hit with this skill, each hit done to it will heal <Damage Percent>% of damage dealt to the attacker. This lasts for <Turns> turns. You can add flair to this skill with a {Deploy Message}.",
		args: [
			{
				name: "Damage Percent",
				type: "Decimal",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			},
			{
				name: "Deploy Message",
				type: "Word"
			}
		],
		applyfunc(message, skill, args) {
			const turns = args[1]
			if (turns < 1)
				return void message.channel.send("You can't have less than 1 turn for this skill.");
			makeExtra(skill, "healverse", [args[0], turns, args[2]]);
			return true
		},
		onuse(char, targ, skill, btl, vars) {
			if (targ.hp > 0) {
				addCusVal(targ, "healverse", {
					name: skill.name,
					infname: char.name,
					heal: vars[0],
					turns: vars[1],
					type: 'hp'
				});

				if (vars[2]) {
					let txt = vars[2];
					while (txt.includes('%SKILL%')) txt = txt.replace('%SKILL%', skill.name);
					while (txt.includes('%USER%')) txt = txt.replace('%USER%', char.name);
					while (txt.includes('%ENEMY%')) txt = txt.replace('%ENEMY%', targ.name);
					return txt;
				} else {
					return `A green aura is deployed around __${targ.name}__!`;
				}
			}
		}
	}),

	powerverse: new Extra({
		name: "Powerverse",
		desc: "After the foe is hit with this skill, each hit done to it will boost LB% by <Damage Percent>%. This lasts for <Turns> turns. You can add flair to this skill with a {Deploy Message}.",
		args: [
			{
				name: "Damage Percent",
				type: "Decimal",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			},
			{
				name: "Deploy Message",
				type: "Word"
			}
		],
		applyfunc(message, skill, args) {
			const turns = args[1]
			if (turns < 1)
				return void message.channel.send("You can't have less than 1 turn for this skill.");
			makeExtra(skill, "powerverse", [args[0], turns, args[2]]);
			return true
		},
		onuse(char, targ, skill, btl, vars) {
			if (targ.hp > 0) {
				addCusVal(targ, "powerverse", {
					name: skill.name,
					infname: char.name,
					turns: vars[1],
					percent: vars[0]
				});

				if (vars[2]) {
					let txt = vars[2];
					while (txt.includes('%SKILL%')) txt = txt.replace('%SKILL%', skill.name);
					while (txt.includes('%USER%')) txt = txt.replace('%USER%', char.name);
					while (txt.includes('%ENEMY%')) txt = txt.replace('%ENEMY%', targ.name);
					return txt;
				} else {
					return `A red aura is deployed around __${targ.name}__!`;
				}
			}
		}
	}),

	spreadverse: new Extra({
		name: "Spreadverse",
		desc: "After the foe is hit with this skill, each hit done to it will spread <Damage Percent>% of damage to other foes. This lasts for <Turns> turns. You can add flair to this skill with a {Deploy Message}.",
		args: [
			{
				name: "Damage Percent",
				type: "Decimal",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			},
			{
				name: "Deploy Message",
				type: "Word"
			}
		],
		applyfunc(message, skill, args) {
			const turns = args[1]
			if (turns < 1)
				return void message.channel.send("You can't have less than 1 turn for this skill.");
			makeExtra(skill, "spreadverse", [args[0], turns, args[2]]);
			return true
		},
		onuse(char, targ, skill, btl, vars) {
			if (targ.hp > 0) {
				addCusVal(targ, "spreadverse", {
					name: skill.name,
					infname: char.name,
					turns: vars[1]
				});

				if (vars[2]) {
					let txt = vars[2];
					while (txt.includes('%SKILL%')) txt = txt.replace('%SKILL%', skill.name);
					while (txt.includes('%USER%')) txt = txt.replace('%USER%', char.name);
					while (txt.includes('%ENEMY%')) txt = txt.replace('%ENEMY%', targ.name);
					return txt;
				} else {
					return `A yellow aura is deployed around __${targ.name}__!`;
				}
			}
		}
	}),

	lonewolf: new Extra({
		name: "Lone Wolf",
		desc: "Skill Power boosted by <Multiplier>x when alone, or all allies are down.",
		args: [
			{
				name: "Mulitplier",
				type: "Decimal"
			}
		],
		applyfunc(message, skill, args) {
			makeExtra(skill, "lonewolf", [args[0] ?? 1.5]);
			return true
		},
		statmod(char, skill, vars, btl) {
			let allies = 0;
			for (let ally of btl.teams[char.team].members) {
				if (ally.hp > 0) allies++;
			}

			if (allies <= 1) skill.pow *= vars[0];
		}
	}),

	heavenwrath: new Extra({
		name: "Heaven's Wrath",
		desc: "Skill Power boosted by <Multiplier>x when not alone, and all allies are alive.",
		args: [
			{
				name: "Mulitplier",
				type: "Decimal"
			}
		],
		applyfunc(message, skill, args) {
			makeExtra(skill, "heavenwrath", [args[0] ?? 1.5]);
			return true
		},
		statmod(char, skill, vars, btl) {
			let allies = 0;
			for (let ally of btl.teams[char.team].members) {
				if (ally.hp > 0) allies++;
			}

			if (allies >= btl.teams[char.team].members.length) skill.pow *= vars[0];
		}
	}),

	statcalc: new Extra({
		name: "Stat Calculation",
		desc: "Uses the user's <Stat> for calculating damage.",
		args: [
			{
				name: "Stat",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const stat = args[0].toLowerCase()
			if (!utilityFuncs.validStat(stat))
				return void message.channel.send("That's not a valid stat!");
			makeExtra(skill, "statcalc", [stat]);
			return true
		},
		hardcoded: true
	}),

	hitcalc: new Extra({
		name: "Hit Calculation",
		desc: "Uses the opponent's <Stat> for calculating damage.",
		args: [
			{
				name: "Stat",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const stat = args[0].toLowerCase()
			if (!utilityFuncs.validStat(stat))
				return void message.channel.send("That's not a valid stat!");
			makeExtra(skill, "hitcalc", [stat]);
			return true
		},
		hardcoded: true
	}),

	hpcalc: new Extra({
		name: "HP Calculation",
		desc: "Current HP can boost or decrease damage by up to <Percent>%.",
		args: [
			{
				name: "Percent",
				type: "Decimal"
			}
		],
		applyfunc(message, skill, args) {
			makeExtra(skill, "hpcalc", [args[0] ?? 50]);
			return true
		}
	}),

	mpcalc: new Extra({
		name: "MP Calculation",
		desc: "Current MP can boost or decrease damage by up to <Percent>%.",
		args: [
			{
				name: "Percent",
				type: "Decimal"
			}
		],
		applyfunc(message, skill, args) {
			makeExtra(skill, "mpcalc", [args[0] ?? 50]);
			return true
		}
	}),

	multistatus: new Extra({
		name: "Multistatus",
		desc: "This skill becomes a status skill that will inflict one of multiple statuses.",
		args: [
			{
				name: "Status #1",
				type: "Word",
				forced: true
			},
			{
				name: "Status #2",
				type: "Word",
				forced: true,
				multiple: true
			}
		],
		applyfunc(message, skill, args) {
			try {
				skill.status = args.map(status => {
					status = status.toLowerCase()
					if (!statusEffects.includes(status))
						throw void message.channel.send(`The status ${status} does not exist!`)
					return status
				})
			} catch {
				return false
			}
			if (!skill.statuschance) skill.statuschance = 100;
			return true;
		},
		hardcoded: true
	}),

	dualelement: new Extra({
		name: "Dual Element",
		desc: "The skill may use the 2nd element in addition to the first.",
		args: [
			{
				name: "Element",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const element = args[0].toLowerCase()
			if (Elements.includes(element) && element != skill.type && element != 'passive' && element != 'status' && element != 'heal') {
				skill.type = [(typeof skill.type === 'object') ? skill.type[0] : skill.type, element];
			} else
				return void message.channel.send("That's not a valid element!");	
			return true;
		},
		hardcoded: true
	}),

	affinitypow: new Extra({
		name: "Affinity Power",
		desc: "Power boosted by <Damage> per affinity point. Works only for <:passive:963413845253193758>affinitypoint passives.",
		args: [
			{
				name: "Damage",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			makeExtra(skill, "affinitypow", [args[0]]);
			return true
		},
		statmod(char, skill, vars, btl) {
			if (char.custom?.affinitypoint) skill.pow += vars[0]*char.custom.affinitypoint;
		}
	}),

	forcetech: new Extra({
		name: "Force Technical",
		desc: "Forces a skill to tech off of different status effects instead of the preset ones.",
		args: [
			{
				name: "Status Effect #1",
				type: "Word",
				forced: true,
				multiple: true
			}	
		],
		applyfunc(message, skill, args) {
			let statuses
			try {
				statuses = args.map(status => {
					status = status.toLowerCase()
					if (!statusEffects.includes(status))
						throw void message.channel.send(`The status ${status} does not exist!`)
					return status
				})
			} catch {
				return false
			}
			makeExtra(skill, "forcetech", statuses)
			return true;
		},
		hardcoded: true
	}),

	forceformula: new Extra({
		name: "Force Formula",
		desc: "Forces a skill to use a different damage formula.",
		args: [
			{
				name: "Formula",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const formula = args[0].toLowerCase()
			if (damageFormulas.includes(formula))
				return void message.channel.send('Invalid damage formula!\nValid formulas are: Persona, Pokemon, Lamonka, Beta')
			makeExtra(skill, "forceformula", [formula]);
			return true;
		},
		hardcoded: true
	}),

	rollout: new Extra({
		name: "Rollout",
		desc: "Boost the skill's power by <Boost> every consecutive use, but the user is locked to using it until power reaches <Max Boost>x or skill is used <Times> times in a row.",
		args: [
			{
				name: "Boost",
				type: "Decimal",
				forced: true
			},
			{
				name: "Max Boost",
				type: "Decimal",
				forced: true
			},
			{
				name: "Times",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let boost = args[0]
			let maxboost = args[1]
			let times = args[2]

			if (maxboost < boost) return void message.channel.send("You can't have a max boost lower than the boost!");
			if (parseInt(maxboost) < 1) return void message.channel.send("You can't have less than 1 max boost!");
			if (parseInt(times) < 1) return void message.channel.send("You can't have less than 1 times!");

			makeExtra(skill, "rollout", [boost, maxboost, times]);
			return true
		},
		onselect(char, skill, btl, vars) {
			if (!char.forcemove) {
				char.rollouts = 1;
				char.forcemove = [vars[2], btl.action];
			} else {
				char.rollouts++;
				if (char.rollouts >= vars[2]) {
					delete char.rollouts
					delete char.forcemove
				}
			}
		},
		statmod(char, skill, vars, btl) {
			if (char.rollouts) {
				let bst = (vars[0]-1)*char.rollouts;
				skill.pow *= bst;
				if (bst >= vars[1]) {
					delete char.rollouts;
					delete char.forcemove;
				}
			}
		}
	}),

	sustain: new Extra({
		name: "Sustain",
		desc: "Multi-Hits do not have power altered as hits go on.",
		args: [],
		applyfunc(message, skill, args) {
			makeExtra(skill, "sustain", [true]);
			return true;
		}
	}),

	reverse: new Extra({
		name: "Reverse",
		desc: "Multi-Hits gradually increase in power instead of decreasing.",
		args: [],
		applyfunc(message, skill, args) {
			makeExtra(skill, "reverse", [true]);
			return true;
		}
	}),

	powhit: new Extra({
		name: "Power Hit",
		desc: "With multi-hits, specific hits will have their power increased.",
		args: [
			{
				name: "Hit #1",
				type: "Num",
				forced: true,
				multiple: true
			}
		],
		applyfunc(message, skill, args) {
			if (args.some(arg => arg < 1)) return void message.channel.send("You can't use a hit less than 1!");

			makeExtra(skill, "powhit", [args]);
			return true;
		}
	}),

	multihit: new Extra({
		name: "Multi",
		desc: "A <Chance>% chance to add <Number of Hits> extra hit(s) to the skill, multi-hit already or not.",
		args: [
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			},
			{
				name: "Number of Hits",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const chance = args[0]
			const hits = args[1]

			if (chance <= 0 || chance > 50) return message.channel.send("Invalid value for <Chance>! It should be above 0 or below 50.");
			
			if (hits <= 0 || hits > 99-(skill.hits ?? 1))
				return void message.channel.send(`Invalid value for <Number of Hits>. It should be above 0. Be aware that skills cannot exceed 99 hits, and so, the highest this number can be is ${99-(skill.hits ?? 1)}.`);

			makeExtra(skill, "multihit", [chance, hits]);
			return true;
		},
		statmod(char, skill, vars, btl) {
			let num = randNum(100);

			if (num <= vars[0]) {
				skill.hits += vars[1];
				addAtkMsg(btl, `__${char.name}__'s __${skill.name}__ landed **${vars[1]}** extra time(s)!`);
			}
		}
	})
}

// Make an Extra for a skill. "func" should be an array of 1-5 values indicating what the extra does.
function makeExtra(skill, extra, func) {
	if (!skill.extras) skill.extras = {};
	if (!skill.extras[extra]) skill.extras[extra] = [];

	if (extrasList[extra].multiple) {
		if (extrasList[extra].diffflag) {
			for (i in skill.extras[extra]) {
				if (typeof skill.extras[extra][i] == "number") {
					if (skill.extras[extra][i][extrasList[extra].diffflag] === func[extrasList[extra].diffflag]) {
						skill.extras[extra][i] = func;
						return true;
					}
				} else {
					let alltrue = true;
					for (j in extrasList[extra].diffflag) {
						if (skill.extras[extra][i][extrasList[extra].diffflag[j]] !== func[extrasList[extra].diffflag[j]]) {
							alltrue = false;
							break;
						}
					}
					if (alltrue) {
						skill.extras[extra][i] = func;
						return true;
					}
				}
			}
		}
		skill.extras[extra].push(func);
	} else {
		skill.extras[extra] = func;
	}
}

// Checks if the skill has an extra
// just realise we dont need this
hasExtra = (skill, extra) => {
	if (!skill.extras) return false;
	if (!skill.extras[extra]) return false;
	return skill.extras[extra];
}

// Apply Extra Effects to an existing skill using the extrasList above.
applyExtra = (message, skill, skillExtra, rawargs) => {
	if (!skill.extras) skill.extras = {};
	if (!skillExtra || !extrasList[skillExtra]) return message.channel.send("You're adding an invalid extra! Use the ''listatkextras'' command to list all extras.");
	if (extrasList[skillExtra].apply(message, skill, rawargs))
		message.react('👍')

	return true;
}

// Custom Variables!
addCusVal = (char, name, vars) => {
	if (!char.custom) char.custom = {};

	char.custom[name] = vars;
	return char.custom[name];
}

killVar = (char, name) => {
	if (!char.custom) return;
	if (!char.custom[name]) return;

	delete char.custom[name];

	if (Object.keys(char.custom).length == 0)
		delete char.custom;
}

customVariables = {
	healverse: {
		onturn(btl, char, vars) {
			vars.turns--;
			if (vars.turns <= 0) {
				killVar(char, "healverse");
				return `${vars.infname}'s ${vars.name} has worn off for ${char.name}!`;
			}

			return null;
		},
		onhit(btl, char, inf, dmg, vars) {
			let heal = Math.round((dmg/100)*vars.heal);
			switch(vars.type) {
				case 'mp':
					inf.mp = Math.min(inf.maxmp, inf.mp+heal);

				default:
					inf.hp = Math.min(inf.maxhp, inf.hp+heal);
			}

			return `${vars.infname}'s ${vars.name} allowed ${inf.name} to restore ${heal}${vars.type.toUpperCase()}`;
		}
	},

	powerverse: {
		onturn(btl, char, vars) {
			vars.turns--;
			if (vars.turns <= 0) {
				killVar(char, "powerverse");
				return `${vars.infname}'s ${vars.name} has worn off for ${char.name}!`;
			}

			return null;
		},
		onhit(btl, char, inf, dmg, vars) {
			let settings = setUpSettings(btl.guild.id);
			
			if (settings.mechanics.limitbreaks) {
				inf.lbp += truncNum((total/(skill.hits*((skill.target === 'one' || skill.target === 'ally') ? 2 : 8)))*(vars.percent/100), 2)
				return `${vars.infname}'s ${vars.name} allowed ${inf.name} to restore ${heal}${vars.type.toUpperCase()}`;
			}

			return null;
		}
	},

	spreadverse: {
		onturn(btl, char, vars) {
			vars.turns--;
			if (vars.turns <= 0) {
				killVar(char, "spreadverse");
				return `${vars.infname}'s ${vars.name} has worn off for ${char.name}!`;
			}

			return null;
		}

		// soon...
	},

	oldAffinities: {
		onturn(btl, char, vars) {
			let text = ''

			for (i in vars) {
				for (j in vars[i]) {
					vars[i][j]--;

					if (vars[i][j] <= 0) {
						for (aff in char.affinities) {
							if (char.affinities[aff].includes(j)) {
								char.affinities[aff].splice(char.affinities[aff].indexOf(j), 1);
							}
						}

						if (i != 'normal' && !char.affinities[i])  char.affinities[i] = [];

						if (i != 'normal') {
							char.affinities[i].push(j);
						}

						text += `${char.name}'s ${affinityEmoji[aff]}**${aff}** affinity to ${elementEmoji[j]}**${j}** was restored to ${affinityEmoji[i]}**${i}**!\n`;

						delete vars[i][j];
					}
				}

				if (vars[i] && Object.keys(vars[i]).length == 0) {
					delete vars[i];
				}
			}

			if (Object.keys(vars).length == 0) {
				killVar(char, "oldAffinities");
			}

			if (text == '') return null;
			return text;
		}
	},

	buffTurns: {
		onturn(btl, char, vars) {
			let text = ''

			for (i in vars) {
				let wasPositive = vars[i][1] > 0;
				vars[i][1] += vars[i][1] > 0 ? -1 : 1;

				if (vars[i][1] == 0) {
					buffStat(char, vars[i][0].toLowerCase(), wasPositive ? -1 : 1);
					text += `${char.name}'s ${vars[i][0].toUpperCase()} ${wasPositive ? '' : 'de'}buff has worn off!\n`;
					vars[i] = ''
				}
			}
			
			vars = vars.filter(x => x.length != 0);
			if (vars.length == 0) {
				killVar(char, "buffTurns");
			}

			if (text == '') return null;
			return text;
		}
	},

	affinitypoint: {
		numeric: true
	},

	revert: {
		onturn(btl, char, vars) {
			if (char.custom?.revert) {
				char.custom.revert[0]--;

				if (char.custom.revert[0] <= 0) {
					delete char.mimic;

					char.stats = objClone(char.custom.revert[1].stats);
					char.skills = char.custom.revert[1].skills;
					char.name = char.custom.revert[1].name;

					let sotrue = char.custom.revert[2];
					delete char.custom.revert;

					return sotrue;
				}
			}
		}
	}
}