const weakSide = ['superweak', 'weak', 'normal']
const resistSide = ['normal', 'resist', 'block', 'repel', 'drain']
const damageFormulas = ['persona', 'pokemon', 'lamonka', 'beta']
const ArgList = require("../arglist.js")

Extra = class extends ArgList {
	constructor(object) {
		super(object.args, object.desc)
		this.name = object.name
		this.multiple = object.multiple
		this.diffflag = object.diffflag
		this.unregsiterable = object.unregsiterable
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
			if (isBoss(targ)) return "...But it failed!";

			let chance = randNum(100);
			let target = vars[0]+((char.stats.luk-targ.stats.luk)/2)

			if (chance <= target) {
				targ.hp = 0;
				return `__${char.name}__ instantly KO'd __${targ.name}__!`;
			} else {
				return dodgeTxt(targ);
			}
		},
		hardcodedinfo: true
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
		},
		getinfo(vars, skill) {
			return `Drops _user_ HP to **${vars[0]}**`;
		}
	}),

	need: new Extra({
		name: "Need",
		desc: 'Will make the skill require <Less/More> than <Percent>% of <Cost Type> for it to work.',
		multiple: true,
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
		},
		getinfo(vars, skill) {
			let text = `Requires **`
			
			for (i in vars) {
				let healText = ` ${vars[i][3].toUpperCase()}`
				if (healText.includes('PERCENT')) healText = `% of target's max ${healText.replace('PERCENT', '')}`
				if (healText.includes('LB')) healText = `% LB`

				text += `${vars[i][0]} than ${vars[i][1] ? 'or equal to' : ''} ${vars[i][2]}${healText}`

				if (i < vars.length - 2) text += ', ';
				else if (i == vars.length - 2) text += ' and ';
			}

			return text + '** to use';
		}
	}),

	changeaffinity: new Extra({
		name: "Change Affinity",
		desc: "Will change <Target/User>'s affinity from the <Weak/Resist/Both> side of <Element> to <Affinity>. *Keep in mind that if you want it to last {Turns} turns, it can't be overwritten by a different affinity until then.*",
		multiple: true,
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
			if (['status', 'heal', 'passive', 'almighty'].includes(element))
				return void message.channel.send("This element cannot have an affinity!");
			if (side != 'weak' && side != 'resist' && side != 'both')
				return void message.channel.send("You entered an invalid value for <Weak/Resist/Both>! It can be either Weak, Resist, or Both.");
			if (turns && turns < 1)
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

			let setAffinities = [];
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
		},
		getinfo(vars, skill) {
			let finalText = ""
			let targetAffinities = vars.filter(x => x.includes('target'))
			let userAffinities = vars.filter(x => x.includes('user'))
			let affinityScore = {
				superweak: 0, 
				weak: 1, 
				normal: 2, 
				resist: 3, 
				block: 4, 
				repel: 5, 
				drain: 6
			}
			let sideScore = {
				weak: 0, 
				both: 1, 
				resist: 2
			}
			finalText += `Changes affinities of`
			let affinity = ''
			let oldAffinitySide = ''
			let affinitySide = ''
			if (targetAffinities.length > 0) {
				finalText += ` **the target** to:\n`
				targetAffinities.sort(function(a, b) {
					return (affinityScore[a[2]]*10 + sideScore[a[3]]) - (affinityScore[b[2]]*10 + sideScore[b[3]]);
				})
				for (let i in targetAffinities) {
					if (affinity != targetAffinities[i][2]) {
						if (affinity != '' && affinity != targetAffinities[i][2]) finalText += `\n`
						affinity = targetAffinities[i][2]
						finalText += `${affinityEmoji[targetAffinities[i][2]]}: `
					}
					affinitySide = targetAffinities[i][3]
					if (oldAffinitySide == '') {
						oldAffinitySide = affinitySide
					}
					finalText += `${elementEmoji[targetAffinities[i][1]]}`
					if (oldAffinitySide != affinitySide || i == targetAffinities.length - 1) {
						finalText += ` ${affinityEmoji[oldAffinitySide] ? `from ${affinityEmoji[oldAffinitySide]} side` : 'in general'}`
						if (i < targetAffinities.length - 1) {
							finalText += `, `
						}
					}
					oldAffinitySide = affinitySide
				}
			}
			affinity = ''
			oldAffinitySide = ''
			affinitySide = ''
			if (userAffinities.length > 0) {
				if (targetAffinities.length > 0) {
					finalText += `\nand affinities of **the user** to:\n`
				} else {
					finalText += ` **the user** to:\n`
				}
				userAffinities.sort(function(a, b) {
					return (affinityScore[a[2]]*10 + sideScore[a[3]]) - (affinityScore[b[2]]*10 + sideScore[b[3]]);
				})
				for (let i in userAffinities) {
					if (affinity != userAffinities[i][2]) {
						if (affinity != '' && affinity != userAffinities[i][2]) finalText += `\n`
						affinity = userAffinities[i][2]
						finalText += `${affinityEmoji[userAffinities[i][2]]}: `
					}
					affinitySide = userAffinities[i][3]
					if (oldAffinitySide == '') {
						oldAffinitySide = affinitySide
					}
					finalText += `${elementEmoji[userAffinities[i][1]]}`
					if (oldAffinitySide != affinitySide || i == userAffinities.length - 1) {
						finalText += ` ${affinityEmoji[oldAffinitySide] ? `from ${affinityEmoji[oldAffinitySide]} side` : 'in general'}`
						if (i < userAffinities.length - 1) {
							finalText += `, `
						}
					}
					oldAffinitySide = affinitySide
				}
			}
			return finalText
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
		},
		getinfo(vars, skill) {
			return 'User must rest for one turn';
		}
	}),

	buff: new Extra({
		name: "Stat Buff",
		desc: "Will buff or debuff the <Target/User>'s <Stat> at a <Chance>% chance. Positive values for <Stages> indicate a buff while negative values for <Stages> indicate a debuff. You can also make a buff/debuff last {Turns} turns.",
		multiple: true,
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
			const stat = vars[1];
			const amount = vars[2];
			const absamount = Math.abs(amount);
			const chance = vars[3];
			const turns = vars[4];
			if (stat == "all") {
				const buffChange = extrasList.buff.buffChange
				const target = vars[0]
				return buffChange(targ, skill, btl, [target, "atk", amount, chance, turns]) + "\n" +
					buffChange(targ, skill, btl, [target, "mag", amount, chance, turns]) + "\n" +
					buffChange(targ, skill, btl, [target, "end", amount, chance, turns]) + "\n" +
					buffChange(targ, skill, btl, [target, "agl", amount, chance, turns]) + "\n" +
					buffChange(targ, skill, btl, [target, "prc", amount, chance, turns])
			}
			if (targ.charms && targ.charms.includes("PureVision") && stat === 'prc') return `${targ.name}'s Pure Vision negated the change.`;
			let txt = amount > 0
				? `__${targ.name}__'s _${stat ? stat.toUpperCase() : "???"}_ was buffed **${amount}** time(s)!`
				: `__${targ.name}__'s _${stat ?stat.toUpperCase() : "???"}_ was debuffed **${absamount}** time(s)!`
			if (chance && chance < 100) {
				const rchance = randNum(1, 100);

				if (rchance <= chance) {
					buffStat(targ, stat, amount);

					if (turns && typeof(turns) == "number") {
						if (!targ?.custom?.buffTurns) 
							addCusVal(targ, "buffTurns", []);

						for (let i = 0; i < absamount; i++) {
							if (!((amount < 0&& targ.custom.buffTurns.filter(x => x[0] == stat && x[1] < 0).length >= 3) || (amount > 0 && targ.custom.buffTurns.filter(x => x[0] == stat && x[1] > 0).length >= 3))) {
								targ.custom.buffTurns.push([
									stat, turns * (amount / absamount)
								])
							}
						}

						txt += `\nHowever, only for __${turns} turns__.`;
					}

					return txt;
				} else {
					if (skill.type == 'status')
						return `But it missed __${targ.name}__!`;
					else
						return '';
				}
			} else {
				buffStat(targ, stat, amount);

				if (turns && typeof(turns) == "number") {
					if (!targ?.custom?.buffTurns) 
						addCusVal(targ, "buffTurns", []);

					for (let i = 0; i < absamount; i++) {
						if (!((amount < 0 && targ.custom.buffTurns.filter(x => x[0] == stat && x[1] < 0).length >= 3) || (amount > 0 && targ.custom.buffTurns.filter(x => x[0] == stat && x[1] > 0).length >= 3))) {
							targ.custom.buffTurns.push([
								stat, turns * (amount / absamount)
							])
						}
					}
				}

				return txt;
			}
		},
		getinfo: buffText
		//for consistency, this must use the same function as the support buff extra
		//buffText was made to generate text info about buffs even begore getinfo was added, don't change it
	}),

	powerbuff: new Extra({
		name: "Power Buff",
		desc: "Boosts skill power with <Stat> buffs by, or by up to <Number>, or <Number>% of skill's power.",
		multiple: true,
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
			if (!stats.includes(stat))
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
		},
		getinfo(vars, skill) {
			let powBuffs = vars.sort((a, b) => {
				return (stats.indexOf(a[0])*10000 + a[1]*10 + a[2] ? 0 : 1) - (stats.indexOf(b[0])*10000 + b[1]*10 + b[2] ? 0 : 1)
			})

			let txt = `Increases in power with`

			let curPB = []
			for (let i in powBuffs) {
				txt += ` **${powBuffs[i][0].toUpperCase()}** buffs`;

				curPB = powBuffs[i]

				txt += ` by **${curPB[2] ? 'up to' : ''} ${curPB[1] + ((curPB[2] && curPB[3]) ? 100 : 0) }${curPB[3] ? '% of' : ''} power**`

				if (i < powBuffs.length - 2) {
					txt += `, `
				} else if (i == powBuffs.length - 2) {
					txt += ` and `
				}
			}
			return txt
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
		},
		getinfo(vars, skill) {
			return `Takes **${vars[0]} MP** from the target`
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
		},
		getinfo(vars, skill) {
			return `Steals MP from the target instead of dealing damage`
		}
	}),

	steal: new Extra({
		name: "Steal",
		desc: "Has a <Chance>% chance to steal {Amount} of the foe team's items.",
		multiple: true,
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
		},
		getinfo(vars, skill) {
			let txt = `Has a ` 

			for (i in vars) {
				txt += `**${vars[i][0]}%** chance of stealing **${vars[i][1]}**`

				if (i < vars.length - 2) {
					txt += `, `
				} else if (i == vars.length - 2) {
					txt += ` and `
				}
			}

			return txt + ` of the target team's items`
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

			return `__${char.name}__ drained **${heal}HP** from ${targ.name}!`;
		},
		getinfo(vars, skill) {
			return `Drains 1/${vars[0]} of the damage dealt`;
		}
	}),

	feint: new Extra({
		name: "Feint",
		desc: "Bypasses shielding skills like Makarakarn and Tetrakarn.",
		applyfunc(message, skill) {
			makeExtra(skill, "feint", [true]);
			return true;
		},
		hardcoded: true,
		getinfo(vars, skill) {
			return `**Bypasses shielding skills**`;
		}
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
		},
		getinfo(vars, skill) {
			return `Surrounds the target with a **healing aura** for **${vars[1]}** turns`;
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
		},
		getinfo(vars, skill) {
			return `Surrounds the target with an **empowering aura** for **${vars[1]}** turns`;
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
		},
		getinfo(vars, skill) {
			return `Surrounds the target with a **scattering aura** for **${vars[1]}** turns`;
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
		},
		getinfo(vars, skill) {
			return `When alone, this skill's power is multiplied by **${vars[0]}x**`;
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
		},
		getinfo(vars, skill) {
			return `When not alone, this skill's power is multiplied by **${vars[0]}x**`;
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
		hardcoded: true,
		getinfo(vars, skill) {
			return `Uses _user's_ **${vars[0].toUpperCase()}** to calculate damage`;
		}
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
		hardcoded: true,
		getinfo(vars, skill) {
			return `Uses _target's_ **${vars[0].toUpperCase()}** to calculate damage`;
		}
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
		},
		getinfo(vars, skill) {
			return `Current user's HP can modify damage by **${vars[0]}%**`;
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
		},
		getinfo(vars, skill) {
			return `Current user's MP can modify damage by **${vars[0]}%**`;
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
		hardcoded: true,
		hardcodedinfo: true,
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
		hardcoded: true,
		hardcodedinfo: true
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
		},
		getinfo(vars, skill) {
			return `Skill's power boosted by **${vars[0]}** per <:passive:963413845253193758>**Affinity Point**`;
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
		hardcoded: true,
		getinfo(vars, skill) {
			let txt = `Techs off of `;
			for (const i in vars) {
				txt += `**${statusEmojis[vars[i]]}${vars[i]}**`
				if (i == vars.length-2)
					txt += ' and ';
				else if (i >= vars.length-1)
					txt += ' instead of the defaults';
				else
					txt += ', ';
			}

			return txt;
		}
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
			if (!damageFormulas.includes(formula))
				return void message.channel.send('Invalid damage formula!\nValid formulas are: Persona, Pokemon, Lamonka, Beta')
			makeExtra(skill, "forceformula", [formula]);
			return true;
		},
		hardcoded: true,
		getinfo(vars, skill) {
			return `Uses the **${vars[0]}** damage formula`;
		}
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
			if (!char.custom?.forcemove) {
				addCusVal(char, 'rollouts', 1);
				addCusVal(char, 'forcemove', [vars[2], btl.action]);
			} else if (char.custom?.rollouts) {
				char.custom.rollouts++;
				if (char.rollouts >= vars[2]) {
					killVar(char, 'rollouts');
					killVar(char, 'forcemove');
				}
			}
		},
		statmod(char, skill, vars, btl) {
			if (char.custom?.rollouts) {
				let bst = (vars[0]/100)*char.custom.rollouts;

				skill.pow += skill.pow * bst;
				if (bst >= vars[1]) {
					killVar(char, 'rollouts');
					killVar(char, 'forcemove');
				}
			}
		},
		getinfo(vars, skill) {
			return `Boost power by **${vars[0]}%** every consecutive use, until **${vars[1]}x** or used **${vars[2]} times**`;
		}
	}),

	sustain: new Extra({
		name: "Sustain",
		desc: "Multi-Hits do not have power altered as hits go on.",
		args: [],
		applyfunc(message, skill, args) {
			makeExtra(skill, "sustain", [true]);
			return true;
		},
		hardcoded: true,
		getinfo(vars, skill) {
			if (skill.hits && skill.hits > 1)
				return 'Constant power throughout the multi-hit';
			else
				return 'The `SUSTAIN` extra has no effect on single-hits..';
		}
	}),

	reverse: new Extra({
		name: "Reverse",
		desc: "Multi-Hits gradually increase in power instead of decreasing.",
		args: [],
		applyfunc(message, skill, args) {
			makeExtra(skill, "reverse", [true]);
			return true;
		},
		hardcoded: true,
		getinfo(vars, skill) {
			if (skill.hits && skill.hits > 1)
				return 'Power increases throughout the multi-hit instead of decreasing';
			else
				return 'The `REVERSE` extra has no effect on single-hits..';
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
		},
		getinfo(vars, skill) {
			if (skill.hits && skill.hits > 1) {
				let txt = 'Hits ';

				for (const i in vars) {
					txt += `**#${vars[i]}**`
					if (i == vars.length-2)
						txt += ' and ';
					else if (i >= vars.length-1)
						txt += ' will deal extra damage';
					else
						txt += ', ';
				}

				return txt;
			} else
				return 'The `POWHIT` extra has no effect on single-hits..';
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
		},
		getinfo(vars, skill) {
			return `**${vars[0]}%** chance to add up to **${vars[1]}** extra hit(s) to the skill`;
		}
	}),

	guts: new Extra({
		name: "Guts",
		desc: "When inflicted with <Status>, skills' power will be boosted by <Multiplier>x.",
		args: [
			{
				name: "Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "Status",
				type: "Word",
				forced: true,
				multiple: true
			}
		],
		applyfunc(message, skill, args) {
			let statusses = args.slice(1);
			statusses.filter(status => statusEffects.includes(status));
			if (statusses.length == 0) return void message.channel.send("You didn't specify any valid statuses!");

			makeExtra(skill, "guts", [args[0], ...statusses]);
			return true;
		},
		statmod(char, skill, vars, btl) {
			if (!char.status) return;
			if (vars.inlcludes(char.status)) skill.pow *= vars[0];
		},
		getinfo(vars, skill) { //SOMEONE HAS TO TEST IF THIS WORKS PROPERLY
			let txt = `**${vars[0]}x** power boost when inflicted with `;
			vars.shift();
			for (const i in vars) {
				txt += `**${statusEmojis[vars[i]]}${vars[i]}**`
				if (i == vars.length-2)
					txt += ' or ';
				else if (i < vars.length-1)
					txt += ', ';
			}

			return txt;
		}
	}),

	metronome: new Extra({
		name: "Metronome",
		desc: "Uses a random skill... or chooses from a set of <Skills>.",
		args: [
			{
				name: "Skill #1",
				type: "Word",
				forced: false,
				multiple: true,
			}
		],
		applyfunc(message, skill, args) {
			let skills = args;
			skills = skills.filter(skill => skillFile[skill] && skillFile[skill]?.type !== "passive");
			makeExtra(skill, "metronome", skills);
			return true
		},
		hardcoded: true,
		getinfo(vars, skill) {
			return 'Use a completely random skill..';
		}
	}),

	copyskill: new Extra({
		name: "Copy Skill",
		unregsiterable: true,
		hardcoded: true,
		applyfunc(message, skill, args) {
			makeExtra(skill, "copyskill", [true]);
			return true
		},
		getinfo(vars, skill) {
			return 'Copies a **random skill of user\'s team**';
		}
	}),

	brickbreak: new Extra({
		name: "Brick Break",
		desc: "Breaks any kind of shield the foe may have, but reduces damage when doing so.",
		args: [
			{
				name: "Multiplier",
				type: "Decimal"
			}
		],
		applyfunc(message, skill, args) {
			makeExtra(skill, "brickbreak", [args[0] ?? 0.5])
			return true
		},
		skillmod(char, targ, skill, btl, vars) {
			const shield = targ.custom?.shield
			if (shield) {
				const name = shield.name
				delete targ.custom.shield
				skill.pow *= vars[0]
				addAtkMsg(btl, `__${targ.name}__'s **${name}** was destroyed!`)
			}
		},
		getinfo(vars, skill) {
			return `**Breaks the foe's shield**, with attack multiplied by **${vars[0]}x**`;
		}
	}),

	endeavor: new Extra({
		name: "Endeavor",
		desc: 'Brings the target to your HP. Fails if you have equal to or more HP than the target.',
		args: [],
		applyfunc(message, skill, args) {
			makeExtra(skill, "endeavor", [true]);
			return true
		},
		onuseoverride(char, targ, skill, btl, vars) {
			if (targ.hp <= char.hp) return 'But it failed!';

			let c = randNum(1, 100);
			if (c <= skill.acc+((char.stats.prc-targ.stats.agl)/2)) {
				let dmg = targ.hp-char.hp;
				targ.hp = char.hp;
				return `__${char.name}__'s _${skill.name}_ dealt **${dmg}** damage to __${targ.name}__, cutting their health to theirs!`;
			} else {
				return dodgeTxt(targ);
			}
		},
		getinfo(vars, skill) {
			return 'Brings the target to the _user\'s_ HP.';
		}
	}),

	superfang: new Extra({
		name: "Super Fang",
		desc: "Halves the target's current HP.",
		args: [],
		applyfunc(message, skill, args) {
			makeExtra(skill, "superfang", [true]);
			return true
		},
		onuseoverride(char, targ, skill, btl, vars) {
			let c = randNum(1, 100);
			if (c <= skill.acc+((char.stats.prc-targ.stats.agl)/2)) {
				let dmg = Math.round(targ.hp/2);
				targ.hp -= dmg;
				return `__${targ.name}__ had their HP halved, taking **${dmg}** damage!`;
			} else {
				return dodgeTxt(targ);
			}
		},
		getinfo(vars, skill) {
			return "Halves the target's current HP.";
		}
	}),
}

// Make an Extra for a skill. "func" should be an array of 1-5 values indicating what the extra does.
function makeExtra(skill, extra, func) {
	if (!skill.extras) skill.extras = {};
	if (!skill.extras[extra]) skill.extras[extra] = [];

	if (extrasList[extra].multiple) {
/*
		if (extrasList[extra].diffflag) { //if there is a diffflag
			for (i in skill.extras[extra]) { //check through every element of an extra
				if (typeof skill.extras[extra][i] == "number") { //if the diffflag is not an array

					//so let's say the diffflag is 0 and the arrays are: [1, lmao] and [1, wow]. New one is latter. 
					//If the element of the first array with the index of 0 matches with the index 0 of latter, replace the former array with the new one.
					if (skill.extras[extra][i][extrasList[extra].diffflag] === func[extrasList[extra].diffflag]) {
						skill.extras[extra][i] = func;
						return true;
					}
				} else { //this is for if it's an array
					let alltrue = true;

					//this one is similar to the above, but it checks if all the elements the diffflag considers.
					//So let's say the difflag is [0, 1] and the arrays are [1, lmao, 2] and [1, wow, 2]. New one is latter.
					//It will compare all the elements the difflag considers, so 1 and lmao/wow.
					//If all the elements match eith each other, then it will replace the former array with the new one.
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
		} //If these fail, push the new one onto the array instead.
*/
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
	forcemove: {
		onturn(btl, char, vars) {
			if (vars[1].move === "melee") {
				useSkill(char, btl, vars[1], makeMelee(char));
			} else {
				if (vars[2])
					useSkill(char, btl, vars[1], vars[2]);
				else
					useSkill(char, btl, vars[1]);
			}

			vars[0]--;
			if (vars[0] == 0) killVar(char, "forcemove");

			return null;
		}
	},

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

	shield: {
		hardcoded: true
	},

	revert: {
		onturn(btl, char, vars) {
			if (char.custom?.revert) {
				char.custom.revert[0]--;

				if (char.custom.revert[0] == 0) {
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
	},

	orgiamode: {
		onturn(btl, char, vars) {
			if (char.custom?.orgiamode) {
				char.custom.orgiamode.turns--

				if (char.custom.orgiamode.turns <= 0) {
					char.stats = objClone(char.custom.orgiamode.revert);
					killVar(char, 'orgiamode');

					char.status = 'sleep';
					char.statusturns = 3;

					return `__${char.name}__'s power boost wore off... and they fell asleep from exhaustion.`;
				}
			}
		}
	},

	trap: {
		dmgmod(btl, char, inf, dmg, skill, vars) {
			dmg = Math.round(dmg*vars[1]);
			let txt
			switch(vars[2].toLowerCase()) {
				case 'buff':
					addAtkMsg(btl, `${inf.name} set off the ${vars[0]}!\n${extrasList.buff.onuse(char, inf, skill, btl, ['target', vars[3], vars[4], vars[5], null])}`);
					break;

				case 'status':
					txt = `${inf.name} set off the ${vars[0]}`;

					if (randNum(1, 100) <= vars[4]) {
						txt += `!\n${inflictStatus(inf, vars[3])}`;
					} else {
						txt += '... however, it did nothing.';
					}

					addAtkMsg(btl, txt);
					break;

				case 'damage':
					txt = `${inf.name} set off the ${vars[0]}!`;
					let d = vars[3];

					if (randNum(1, 100) <= vars[4]) {
						let affinity = getAffinity(inf, vars[5]);
						let affinityTxt = affinityEmoji[affinity] ?? '';

						switch(affinity) {
							case 'deadly':
								d *= settings.rates.affinities?.deadly ?? 4.2;
								break;
							
							case 'superweak':
								d *= settings.rates.affinities?.superweak ?? 2.1;
								break;
							
							case 'weak':
								d *= settings.rates.affinities?.weak ?? 1.5;
								break;
							
							case 'resist':
								d *= settings.rates.affinities?.resist ?? 0.5;
								break;
							
							case 'block':
							case 'repel':
								txt += `\nBut ${inf.name} blocked it.`;
								return void addAtkMsg(btl, txt);
							
							case 'drain':
								inf.hp = Math.min(inf.maxhp, inf.hp+d);

								txt += `\nBut ${inf.name} drained it. Their HP was restored by ${d}${affinityTxt}!`;
								return void addAtkMsg(btl, txt);
						}

						inf.hp = Math.max(0, inf.hp-d);
						txt += `\n${inf.name} took ${d}${affinityTxt} damage from the trap!`;
					} else {
						txt += `\nBut ${inf.name} was able to evade the trap!\n${selectQuote(inf, 'dodge', null, "%ENEMY%", char.name)}`
					}

					addAtkMsg(btl, txt);
					break;
			}
		}
	},

	futuresight: {
		onturn(btl, char, vars) {
			if (char.custom?.futuresight) {
				char.custom.futuresight.turns--;

				if (char.custom.futuresight.turns <= 0) {
					let inf = getCharFromId(char.custom.futuresight.user, btl);

					let act = {
						move: 'skills',
						index: '',
						target: [char.team, char.pos],
					};

					useSkill(inf, btl, act, char.custom.futuresight, ally);
					killVar(char, 'futuresight');
					return '';
				}
			}
		}
	},

	charge: {
		statmod(btl, char, stats, vars) {
			if (stats[vars.stat]) stats[vars.stat] *= vars.mult;
			return stats;
		},
		endturn(btl, char, vars) {
			killVar(char, 'charge');
		}
	},

	chaosstir: {
		onturn(btl, char, vars) {
			killVar(char, "chaosstir");
		},
		onhit(btl, char, inf, dmg, vars, s) {
			let skill = objClone(s);
			skill.pow *= vars[0];
			skill.acc = vars[1];

			let attack = attackWithSkill(char, inf, skill, btl, true);
			return `__${char.name}__ struck back, with a stronger __${skill.name}__!\n${attack.txt}`;
		}
	},

	regenheal: {
		onturn(btl, char, vars) {
			if (char.custom?.regenheal) {
				let txt = '';
				let rh = char.custom.regenheal;
				char[rh.type] = Math.min(char[`max${rh.type}`], char[rh.type]+rh.heal);
				txt += `__${char.name}__'s ${rh.type.toUpperCase()} was restored by **${rh.heal}**!`;

				char.custom.regenheal.turns--;
				if (char.custom.regenheal.turns <= 0) {
					txt += `\n__${rh.username}__'s _${rh.name}_ wore off for __${char.name}__.`;
					killVar(char, 'regenheal');
				}

				return txt;
			}
		}
	},

	wishheal: {
		onturn(btl, char, vars) {
			if (char.custom?.wishheal) {
				char.custom.wishheal.turns--;
				if (char.custom.wishheal.turns <= 0) {
					let txt = healList.healstat.onuse(char, char, {}, btl, vars.vars);
					killVar(char, 'wishheal');

					return txt;
				}
			}
		}
	},
}