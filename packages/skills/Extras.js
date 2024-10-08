const weakSide = ['deadly', 'superweak', 'weak', 'normal'] //ChangeAffinity - Applied For Checking Sides Of An Affinity
const resistSide = ['normal', 'resist', 'block', 'repel', 'drain']
const damageFormulas = ['persona', 'pokemon', 'lamonka', 'beta', 'limitbreak'] //ForceFormula - Values

/*
	[[[Hook Documentation - EXTRAS hooks in order of appearance.]]]

	- onuseoverride(char, targ, skill, result, btl, vars)
	Overrides the turn, including all damage calculations, and does something else. Should return
	a string.
	
	- onuse(char, targ, skill, btl, vars)
	If the skill lands, this should do something extra. Should return a string.

	- canuse(char, skill, btl, vars)
	Can this skill be used? Return a string if not, otherwise, return true. This is calculated when the skill
	is selected through button. This also affects enemies, as they will ignore this skill in
	the ai if it cannot be used.

	- onselect(char, skill, btl, vars)
	onuse but it is ran before all of the damage functions. Should return a string.
	
	- statmod(char, skill, vars, btl)
	Lets you freely modify the stats of a character or skill before use. Don't worry, this is reverted
	after the damage for this particular skill on this particular target! Should not return anything.
	
	- ondamage(char, targ, dmg, skill, btl, vars)
	onuse but it's done AFTER damage is dealt. Also lets you use the damage we've taken freely, like in
	drain. Should return a string.

	- onuseatendoffunc(char, targ, skill, btl, vars)
	onuse but it's the VERY LAST THING THAT IS RAN.

	- skillfailonuse(char, targ, skill, btl, vars)
	On the skill's use, the skill will fail if the function returns true.
*/

extrasList = {
	ohko: new Extra({
		name: "One Hit KO (Persona)",
		desc: 'Instantly defeats the foe at a <Chance>% chance.',
		multiple: true,
		args: [
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			},
			{
				name: "Calculated Stat / 'None'",
				type: "Word",
			},
			{
				name: "Damage upon failure?",
				type: "YesNo",
			},
			{
				name: "Must pass all conditions?",
				type: "YesNo",
			},
			{
				name: "Statuses / Main Elements / Affinities",
				type: "Word",
				multiple: true
			}
		],
		doc: {
			pages: [
				{
					desc: `The chance for an OHKO can be modified with *{Calculated Stat / 'None'}* "None" will use raw chance instead of being dependent on a stat. It defaults to **LUK** if not specified.`+
					`\n\nIt can progress as a normal skill if it fails, with *{Damage upon failure?}*. It's set to **false** by default.`+
					`\n\nYou can also filter which foes this works with. Dependent on *{Must pass all conditions?}*, they either need to *pass **all**, or only **one** requirement* of them all. Defaults to *true*.`+
					`\n\nThose conditions can be based on **the main element of the target**, **the status ailment inflicted on the foe** or **affinity to the skill's element**.`
				}
			]
		},
		applyfunc(message, skill, args) {
			let chance = args.shift()
			let stat = args?.shift()?.toLowerCase() ?? 'luk';
			let failDamage = args?.shift() ?? false;
			let passAll = args?.shift() ?? false;
			let statuses = [...new Set(args.map(element => {
				return element.toLowerCase();
			}).filter(x => ['deadly', 'normal', ...Affinities, ...Elements, ...statusEffects].includes(x)))];

			if (chance <= 0)
				return void message.channel.send("What's the point of using this skill if it never lands?");

			if (![...stats, 'none'].includes(stat)) return void message.channel.send(`${stat} is not a valid stat that can be used.`);

			if (statuses.includes('almighty') || statuses.includes('passive')) {
				statuses = statuses.filter(x => x != 'almighty' && x != 'passive');
				message.channel.send('You have entered either almighty or passive, which aren\'t possible main elements. These will be filtered out.');
			}

			if (skill.type != 'almighty') {
				if (statuses.includes('repel') || statuses.includes('block') || statuses.includes('drain')) {
					statuses = statuses.filter(x => x != 'repel' && x != 'block' && x != 'drain');
					message.channel.send('You have entered either repel, block or drain, which are treated for one hit KOs as blocks. These will be filtered out.');
				}
			} else {
				if (statuses.includes('repel') || statuses.includes('block') || statuses.includes('drain') || statuses.includes('resist') || statuses.includes('normal') || statuses.includes('weak') || statuses.includes('superweak') || statuses.includes('deadly')) {
					statuses = statuses.filter(x => !['deadly', 'superweak', 'weak', 'normal', 'resist', 'block', 'repel', 'drain'].includes(x));
					message.channel.send('Since affinities don\'t work with almighty, these types of one hit KOs are to be treated as normal. These will be filtered out.');
				}
			}

			makeExtra(skill, "ohko", [chance, stat, failDamage, passAll, statuses]);
			return true
		},
		attackSkill(char, inf, skill, result, btl) {
			let newResults = attackWithSkill(char, inf, skill, btl, true, ['ohko']);
			result.oneMore = newResults.oneMore;
			result.teamCombo = newResults.teamCombo;

			return `...But it failed!\n`+newResults.txt;
		},
		onuseoverride(char, targ, skill, result, btl, vars) {
			let failDamage = vars[2];
			if (isBoss(targ)) return !failDamage ? "...But it failed!" : extrasList.ohko.attackSkill(char, targ, skill, result, btl);

			let OHKOchance = vars[0];
			let stat = vars[1];
			let passAll = vars[3];
			let conditions = vars[4];

			if (targ.hp <= 0) return '';

			let affinity = getAffinity(targ, skill.type);
			if (['block', 'repel', 'drain'].includes(affinity)) return !failDamage ? `${targ.name} blocked it!\n${selectQuote(char, 'badatk', null, "%ENEMY%", targ.name, "%SKILL%", skill.name)}${selectQuote(targ, 'block', null, "%ENEMY%", char.name, "%SKILL%", skill.name)}` : extrasList.ohko.attackSkill(char, targ, skill, result, btl);

			if (conditions && conditions.length != 0) {
				let statusOHKO = conditions.filter(x => statusEffects.includes(x));
				let elementOHKO = conditions.filter(x => Elements.includes(x));
				let affinityOHKO = conditions.filter(x => affinityEmoji[x]);

				if (passAll) {
					if ((elementOHKO.length > 0 && !elementOHKO.includes(targ.mainElement))
					|| (statusOHKO.length > 0 && !statusOHKO.includes(targ.status) && (statusOHKO.includes('infatuation') && !targ.infatuation) && (statusOHKO.includes('confusion') && !targ.confusion))
					|| (affinityOHKO.length > 0 && !affinityOHKO.includes(affinity))) return !failDamage ? dodgeTxt(targ, char) : extrasList.ohko.attackSkill(char, targ, skill, result, btl);
				} else {
					let hasFailed = true;

					if (hasFailed && elementOHKO.length > 0 && elementOHKO.includes(targ.mainElement)) hasFailed = false
					if (hasFailed && statusOHKO.length > 0 && (statusOHKO.includes(targ.status) || (statusOHKO.includes('infatuation') && targ.infatuation) || (statusOHKO.includes('confusion') && targ.confusion))) hasFailed = false
					if (hasFailed && affinityOHKO.length > 0 && affinityOHKO.includes(affinity)) hasFailed = false

					if (hasFailed) return !failDamage ? dodgeTxt(char, targ) : extrasList.ohko.attackSkill(char, targ, skill, result, btl);
				}
			}

			let chance = randNum(100);
			let target = OHKOchance;
			if (stat != 'none' && target < 100) target += ((char.stats[stat]-targ.stats[stat])/2);

			if (chance <= target) {
				targ.hp = 0;
				return `__${char.name}__ instantly KO'd __${targ.name}__!\n${selectQuote(char, 'kill', null, '%ENEMY%', targ.name, '%SKILL%', skill.name)}${selectQuote(targ, 'death', null, '%ENEMY%', char.name, '%SKILL%', skill.name)}`;
			} else {
				return !failDamage ? dodgeTxt(char, targ) : extrasList.ohko.attackSkill(char, targ, skill, result, btl);
			}
		},
		hardcodedinfo: true
	}),

	sacrifice: new Extra({
		name: "Sacrifice (Original)",
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
			if (isBlessed(char, btl)) return `__${char.name}__ is unnable to sacrifice themselves...?`;

			if (!vars[0])
				char.hp = 0;
			else {
				if (char.hp <= vars[0]) return '';
				char.hp = vars[0];
			}

			if (char.hp > char.maxhp) char.hp = char.maxhp;
			if (char.hp < 0) char.hp = 0;

			return `__${char.name}__ sacrificed themselves! Their HP dropped to **${vars[0]}**!`;
		},
		getinfo(vars, skill) {
			return `Drops _user_ HP to **${vars[0]}**`;
		}
	}),

	charges: new Extra({
		name: "Charges (Pixel Dungeon)",
		desc: "_(Not to be confused with Charge)_\nThe skill will consume a charge when used, and cannot be used when it runs out of charges, the skill will recharge if <Recharge Rate> is set.",
		args: [
			{
				name: "Charges",
				type: "Num",
				forced: true,
			},
			{
				name: "Recharge Rate",
				type: "Decimal",
			},
			{
				name: "Prevent negative?",
				type: "YesNo",
			}
		],
		applyfunc(message, skill, args) {
			let charges = args[0]
			let rate = args[1] ?? 0
			if (charges < 1)
				return void message.channel.send("What's the point of a skill that you can never use?")
			makeExtra(skill, "charges", [charges, rate, args[2]]);
			return true
		},
		canuse(char, skill, btl, vars) {
			const charges = vars[0]
			if (!char.custom?.charges)
				addCusVal(char, "charges", {})
			const allcharges = char.custom.charges
			const name = skill.name
			if (!allcharges[name])
				allcharges[name] = [charges, vars[1], name, charges, 1]
			return allcharges[name][0] < 1 ? `${name} ran out of charges!` : true
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (!char.custom || !char.custom.charges) {
				if (!char.custom?.charges) addCusVal(char, "charges", {});
				char.custom.charges[skill.name] = [vars[0], vars[1], skill.name, vars[0], 1]
			}

			charges = char.custom.charges[skill.name]
			charges[0] -= 1;
			charges[0] = parseFloat(charges[0].toFixed(2))
			if (vars[2] && charges[0] < 0) {
				charges[0] = 0
			}
			
			if ((skill.type == 'support' || skill.type == 'status') && multiplier && multiplier != 1 && charges[4] == 1) charges[4] = multiplier
			return `*(${Math.floor(charges[0])}/${vars[0]}) charges left.*`
		},
		getinfo(vars, skill) {
			let info = `Has **${vars[0]}** charges`
			if (vars[1]) {
				info += `, recharges by **${vars[1]}** every turn`
			}
			return info
		}
	}),

	need: new Extra({
		name: "Need",
		desc: "Will make the skill require from <User/Target>'s <Condition> for {Affected Parameter} to work.",
		multiple: true,
		args: [
			{
				name: "Condition",
				type: "Word",
				forced: true
			},
			{
				name: "User/Target",
				type: "Word",
				forced: true
			},
			{
				name: "Affected Parameter",
				type: "Word",
				forced: true
			},
			{
				name: "Additional Parameters",
				type: "Word",
				multiple: true,
			},
		],
		doc: {
			pages: [
				{
					desc: "### The *{Affected Parameter}* can be either:"+
						"\n- **A Skill extra** - Checks for applicability of the extra.\n-# Forcemsg is unavailable. Can only check for the user on: powerbuff, lonewolf, heavenwrath, affinitypow, rollout, multihit, guts, weaponmod, steamroller, need, metronome, copyskill, fakeout & movelink."+
						"\n- **\"SkillBeforeUse\"** - Checks for usability of the skill entirely.\n-# The default option, but can't check for the target."+
						"\n- **\"SkillOnSelect\"** - Checks for usability of the skill after using cost.\n-# Alternate to **SKILLBEFOREUSE**, that can check for the target."+
						"\n- **\"Crit\"** - Decides if the skill's critical chance can be used."+
						"\n- **\"Status\"** - Chooses if the skill's status chance can be used.\n-# Different from applying **MULTISTATUS** as it checks for all general status affliction."+
						"\n- **\"Tech\"** - Determines if technical damage can be dealt.\n-# Depends on Technical Damage being enabled."+
						"\n- **\"OneMores\"** - Establishes ability to strike once more.\n-# Depends on One Mores being enabled."+
						"\n- **\"LBGain\"** - Deducts ability gain LB from skill.\n-# Depends on Limit Breaks being enabled."
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
			if (!extrasList[affected] && !['skillbeforeuse', 'skillonselect', 'crit', 'status', 'tech', 'onemores', 'lbgain'].includes(affected)) return void message.channel.send("That's not the valid affected parameter you can have.");

			if (affected == 'forcemsg') return void message.channel.send("That's a cosmetic change. Why would you gatekeep it?");

			if (affected == 'skillbeforeuse' && target == 'target') return void message.channel.send("Unfortunately it's not possible to check using the target here, as the check for usability of the skill in its entirety is done before you can choose the target.");

			if (target == 'target' && extrasList[affected] && (['need', 'metronome', 'copyskill', 'movelink', 'fakeout'].includes(affected) || extrasList[affected].statmod)) return void message.channel.send(`Unfortunately ${affected.toUpperCase()} does not account for the target at all, only the user.`);

			if (!needConditions[condition]) return void message.channel.send(`Hold on, ${condition} is not the valid condition you can have.`);

			params = needConditions[condition].apply(message, skill, params, condition)

			if (params) {
				makeExtra(skill, "need", [condition, target, affected, ...params]);
				return true;
			}

			return false;
		},
		variableCheck(target, skill, btl, vars) {
			let isSkillAffected = (vars[2] == "skillbeforeuse" && skill.type !== 'passive')

			let team = btl.teams[target.team];

			return needConditions[vars[0]].check(target, skill, btl, vars, isSkillAffected, team)
		},
		canuse(char, skill, btl, vars) {
			//the target variable here is covered with CHAR
			if (vars[2] != 'skillbeforeuse') return true;

			return extrasList.need.variableCheck(char, skill, btl, vars);
		},
		skillfailonuse(char, targ, skill, btl, vars) {
			if (vars[2] != 'skillonselect') return false;

			let needTarget = vars[1] == 'target' ? targ : char

			return !extrasList.need.variableCheck(needTarget, skill, btl, vars);
		},
		requirement(vars, filtration) {
			let text = `**`

			let filteredVars = vars.filter(x => x[2] == filtration)

			for (i in filteredVars) {
				text += needConditions[filteredVars[i][0]].getinfo(filteredVars[i])

				if (i < filteredVars.length - 2) text += ', ';
				else if (i == filteredVars.length - 2) text += ' AND ';
			}

			return text + '**';
		},
		getinfo(vars, skill) {
			let someTexts = ""

			let isSkill = vars.some(x => x[2] == 'skillbeforeuse')
			let is2Skill = vars.some(x => x[2] == 'skillonselect')

			if (isSkill) someTexts += "To use this skill, it needs " + extrasList.need.requirement(vars, 'skillbeforeuse');
			if (is2Skill) someTexts += `${isSkill ? ".\n" : ""}For the skill to work after using cost, it needs ${extrasList.need.requirement(vars, 'skillonselect')}`
			return someTexts;
		}
	}),

	changeaffinity: new Extra({
		name: "Change Affinity (Pokémon)",
		desc: "Will change <Target/User>'s affinity from the <Weak/Resist/Both> side of <Element> to <Affinity>.",
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
		doc: {
			pages: [
				{
					desc: `Every element is allowed except for: *${elementEmoji['almighty']} **Almighty**, ${elementEmoji['support']} **Support**, ${elementEmoji['heal']} **Heal** & ${elementEmoji['passive']} **Passive***.`+
					`\n\nAffinities allowed are: *Deadly, Superweak, Weak, Normal, Resist, Block, Repel & Drain*.`+
					`\n\nYou can have it be temporary with *{Turns}*. It lasts forever otherwise, unless changed. *Keep in mind that if it's specified, then it can't be overwritten by a different affinity until then*.`
				}
			]
		},
		applyfunc(message, skill, args) {
			const target = args[0].toLowerCase()
			const element = args[1].toLowerCase()
			const affinity = args[2].toLowerCase()
			const side = args[3].toLowerCase()
			const turns = args[4]
			if (target != 'target' && target != 'user')
				return void message.channel.send("You entered an invalid value for <target/user>! It can be either Target or User.");
			if (![...Affinities, 'normal', 'deadly'].includes(affinity))
				return void message.channel.send("You entered an invalid value for <Affinity>! It can be any of the following: deadly, " + Affinities.join(', ') + " or Normal.");
			if (!Elements.includes(element))
				return void message.channel.send("You entered an invalid value for <Element>!");
			if (['support', 'status', 'heal', 'passive', 'almighty'].includes(element))
				return void message.channel.send("This element cannot have an affinity!");
			if (side != 'weak' && side != 'resist' && side != 'both')
				return void message.channel.send("You entered an invalid value for <Weak/Resist/Both>! It can be either Weak, Resist, or Both.");
			if (turns && turns < 1)
				return void message.channel.send("You can't have a turn count less than 1!");
			makeExtra(skill, "changeaffinity", [target, element, affinity, side, turns]);
			return true
		},
		onselect(char, skill, btl, vars, multiplier) {
			if (vars[0].toLowerCase() != 'user') return '';

			return extrasList.changeaffinity.targetchange(char, char, skill, btl, vars, multiplier)
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (vars[0].toLowerCase() != 'target') return '';

			return extrasList.changeaffinity.targetchange(char, targ, skill, btl, vars, multiplier)
		},
		targetchange(char, targ, skill, btl, vars, multiplier) {
			let element = vars[1].toLowerCase()
			let affinity = vars[2].toLowerCase()
			let side = vars[3].toLowerCase()
			let turns = vars[4]

			if ((skill.type == 'support' || skill.type == 'status') && multiplier) {
				if (multiplier != 1) {
					let extraBuffChance = 10;
					extraBuffChance = Math.round(modSkillResult(char, targ, extraBuffChance, skill, btl) * multiplier);

					if (randNum(1, 100) <= extraBuffChance) {
						turns = null;
					}
				}
			}

			if (!targ.affinities) targ.affinities = [];

			// Fail on bosses
			if (char.team != targ.team && isBoss(targ) && (skill.type === "support" || skill.type === "status")) return "...but it failed!";

			let setAffinities = [];
			let wasChanged = false;

			if (affinity != 'normal') {
				if (targ.affinities[affinity] && targ.affinities[affinity].includes(element)) {
					return `__${targ.name}__ wasn't affected by __${skill.name}__!`;
				}
			}

			if (turns && !isNaN(turns) && isFinite(turns)) {
				if (!targ?.custom?.oldAffinities) 
					addCusVal(targ, "oldAffinities", {});
			}

			for (let i in targ.affinities) {
				setAffinities.push(...targ.affinities[i])

				if (targ?.custom?.oldAffinities?.[i] && Object.keys(targ?.custom?.oldAffinities?.[i]).includes(element)) continue;

				if (turns && !isNaN(turns) && isFinite(turns)) {
					if (!targ?.custom?.oldAffinities[i]) targ.custom.oldAffinities[i] = {};
				}

				if (side == 'resist' && !resistSide.includes(i)) continue
				if (side == 'weak' && !weakSide.includes(i)) continue

				if (targ.affinities[i].includes(element)) {
					targ.affinities[i].splice(targ.affinities[i].indexOf(element), 1);
					wasChanged = true;
					if (turns && !isNaN(turns) && isFinite(turns)) {
						if (!targ?.custom?.oldAffinities[i][element]) targ.custom.oldAffinities[i][element] = turns;
					}
					break;
				}
			}

			let normalAffinities = Elements.filter(e => !setAffinities.includes(e));

			if (!wasChanged && ((!normalAffinities.includes(element) && affinity != 'normal') || (affinity == 'normal' && normalAffinities.includes(element)))) {
				return `__${targ.name}__ wasn't affected by __${skill.name}__!`;
			}

			if (affinity != 'normal') {
				if (normalAffinities.includes(element) && turns && !isNaN(turns) && isFinite(turns)) {
					if (!targ?.custom?.oldAffinities['normal']) targ.custom.oldAffinities['normal'] = {};
					if (!targ?.custom?.oldAffinities['normal'][element]) targ.custom.oldAffinities['normal'][element] = turns;
				}

				if (!targ.affinities[affinity]) targ.affinities[affinity] = [];
				targ.affinities[affinity].push(element);
			}

			return `__${targ.name}__'s affinity for ${elementEmoji[element]}**${element}** was changed to ${affinityEmoji[affinity]}**${affinity}**!`;
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
		name: "Rest (Pokémon)",
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
		name: "Stat Buff (Most Series)",
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
		doc: {
			pages: [
				{
					desc: `Allowed stats are: ATK, MAG, PRC, END, AGL & CRIT. "Random" and "All" are allowed too.\n\nYou can't choose any more than 3 buffs or debuffs. If it's not specified, it will default to a single buff.`+
					`\n\nYou can have it be temporary with *{Turns}*. It lasts forever otherwise, unless changed.`
				}
			]
		},
		applyfunc(message, skill, args) {
			const target = args[0].toLowerCase()
			const stat = args[1].toLowerCase()
			const stages = args[2] ?? 1
			const chance = Math.min(args[3] ?? 100, 100)
			const turns = args[4] ?? null

			if (target != 'user' && target != 'target') 
				return void message.channel.send(`You typed ${target} as the target. It must be either \`user\` or \`target\`.`)
			if (![...stats, "crit", "all", "random"].includes(stat))
				return void message.channel.send("That's not a valid stat!");
			if (stages == 0)
				return void message.channel.send("...This amount of stages won't do anything, I'm afraid.");
			if (Math.abs(stages) > 3) 
				return void message.channel.send("The maximum amount of stages is 3!");
			if (chance <= 0)
				return void message.channel.send("You can't have a percentage less than 0, as then it would never happen!");
			if (turns && turns <= 0)
				return void message.channel.send("You can't have a turn amount less than 0, as then it would revert to normal too soon.");

			makeExtra(skill, "buff", [target, stat, stages, chance, turns])
			return true
		},
		onselect(char, skill, btl, vars) {
			if (vars[0] != 'user') return '';
			return extrasList.buff.buffChange(char, char, skill, btl, vars);
		},
		onuse(char, targ, skill, btl, vars) {
			if (vars[0] != 'target') return '';
			return extrasList.buff.buffChange(char, targ, skill, btl, vars);
		},
		buffChange(char, targ, skill, btl, vars, multiplier, boosted) {
			const stat = vars[1] ?? 'atk';
			let amount = !isNaN(vars[2]) ? vars[2] : 1;
			let absamount = Math.abs(amount);
			let chance = vars[3] ?? 100;
			const turns = vars[4];
			let boostedAmount = boosted ?? false;

			if ((skill.type == 'support' || skill.type == 'status') && multiplier && !boostedAmount) {
				chance = modSkillResult(char, targ, chance, skill, btl);
				chance = Math.round(chance * multiplier);

				if (multiplier != 1) {
					let extraBuffChance = 10;
					extraBuffChance = Math.round(modSkillResult(char, targ, extraBuffChance, skill, btl) * multiplier);

					if (randNum(1, 100) <= extraBuffChance) {
						amount += vars[2] <= 0 ? -1 : 1;
						absamount++;
						boostedAmount = true;
					}
				}
			}

			if (stat == "all") {
				const buffChange = extrasList.buff.buffChange
				const target = vars[0]
				return buffChange(char, targ, skill, btl, [target, "atk", amount, chance, turns], null, boostedAmount) + "\n" +
					buffChange(char, targ, skill, btl, [target, "mag", amount, chance, turns], null, boostedAmount) + "\n" +
					buffChange(char, targ, skill, btl, [target, "end", amount, chance, turns], null, boostedAmount) + "\n" +
					buffChange(char, targ, skill, btl, [target, "agl", amount, chance, turns], null, boostedAmount) + "\n" +
					buffChange(char, targ, skill, btl, [target, "prc", amount, chance, turns], null, boostedAmount) + "\n" +
					buffChange(char, targ, skill, btl, [target, "crit", amount, chance, turns], null, boostedAmount)
			} else if (stat == "random") {
				const buffChange = extrasList.buff.buffChange
				const target = vars[0]
				const stat = ["atk", "mag", "end", "agl", "prc", "crit"][randNum(5)];

				return buffChange(char, targ, skill, btl, [target, stat, amount, chance, turns], null, boostedAmount);
			} else if (typeof stat == "object") {
				const buffChange = extrasList.buff.buffChange
				const target = vars[0]
				const stats = stat
				let finaltext = ""
				let i = 0
				for (const stat of stats) {
					i++
					finaltext += buffChange(char, targ, skill, btl, [target, stat, amount, chance, turns], null, boostedAmount)
					if (i < stats.length)
						finaltext += "\n"
				}
				return finaltext
			}
			if (targ.charms && targ.charms.includes("PureVision") && stat === 'prc') return `${targ.name}'s Pure Vision negated the change.`;

			let brimstoneInfluenced = false;

			if (targ.status && targ.status.toLowerCase() == 'brimstone') {
				if (hasStatusAffinity(targ, 'brimstone', 'weak')) {
					if (amount > 0) {amount *= -1; brimstoneInfluenced = 'debuff';}
				} else if (hasStatusAffinity(targ, 'brimstone', 'resist') || isBoss(targ)) {
					if (amount < 0) {amount *= -1; brimstoneInfluenced = 'buff';}
				} else {
					amount *= -1;
					brimstoneInfluenced = 'yes';
				}
			}

			let txt = amount > 0
				? `__${targ.name}__'s _${stat ? stat.toUpperCase() : "???"}_ was ${['yes', 'buff'].includes(brimstoneInfluenced) ? statusEmojis['brimstone'] : ''}buffed **${amount}** time(s)!`
				: `__${targ.name}__'s _${stat ? stat.toUpperCase() : "???"}_ was ${['yes', 'debuff'].includes(brimstoneInfluenced) ? statusEmojis['brimstone'] : ''}debuffed **${absamount}** time(s)!`

			// Force Message
			if (skill.extras && skill.extras.forcemsg) {
				for (let i in skill.extras.forcemsg) {
					if ((amount > 0 && skill.extras.forcemsg[i][0] == 'onbuff') || (amount <= 0 && skill.extras.forcemsg[i][0] == 'ondebuff')) {
						txt = replaceTxt(skill.extras.forcemsg[i][1], '%USER%', char.name, '%ENEMY%', targ.name, '%STAT%', stat ? stat.toUpperCase() : "???");
						break;
					}
				}
			}
			if (skill.statusses && skill.statusses.forcemsg) {
				for (let i in skill.statusses.forcemsg) {
					if ((amount > 0 && skill.statusses.forcemsg[i][0] == 'onbuff') || (amount <= 0 && skill.statusses.forcemsg[i][0] == 'ondebuff')) {
						txt = replaceTxt(skill.statusses.forcemsg[i][1], '%USER%', char.name, '%ENEMY%', targ.name, '%STAT%', stat ? stat.toUpperCase() : "???");
						break;
					}
				}
			}

			if (chance && chance < 100) {
				const rchance = randNum(1, 100);

				if (rchance <= chance) {
					buffStat(targ, stat, amount, boostedAmount);

					if (turns && typeof(turns) == "number") {
						if (!targ?.custom?.buffTurns) 
							addCusVal(targ, "buffTurns", []);

						let brimstoneProceed = false;
						if (targ.status && targ.status.toLowerCase() == 'brimstone') {
							if (!targ?.custom?.revertBuffTurns) addCusVal(targ, "revertBuffTurns", []);

							if (hasStatusAffinity(targ, 'brimstone', 'weak')) {
								if (!(amount < 0 && targ.custom.revertBuffTurns.filter(x => x[0] == stat && x[1] < 0).length >= 3)) brimstoneProceed = true;
							} else if (hasStatusAffinity(targ, 'brimstone', 'resist') || isBoss(targ)) {
								if (!(amount > 0 && targ.custom.revertBuffTurns.filter(x => x[0] == stat && x[1] > 0).length >= 3)) brimstoneProceed = true;
							} else {
								if (!((amount < 0 && targ.custom.revertBuffTurns.filter(x => x[0] == stat && x[1] < 0).length >= 3) || (amount > 0 && targ.custom.revertBuffTurns.filter(x => x[0] == stat && x[1] > 0).length >= 3))) brimstoneProceed = true;
							}
						}

						for (let i = 0; i < absamount; i++) {
							if (!((amount < 0 && targ.custom.buffTurns.filter(x => x[0] == stat && x[1] < 0).length >= 3) || (amount > 0 && targ.custom.buffTurns.filter(x => x[0] == stat && x[1] > 0).length >= 3))) {
								targ.custom.buffTurns.push([
									stat, turns * (amount / absamount)
								])

								if (brimstoneProceed) {
									targ.custom.revertBuffTurns.push([
										stat, turns * (-1 * amount / absamount)
									])
								}
							}
						}

						txt += `\nHowever, only for __${turns} turns__.`;
					}

					return txt;
				} else {
					if (skill.type == 'support' || skill.type == 'status')
						return `But it missed __${targ.name}__!`;
					else
						return '';
				}
			} else {
				buffStat(targ, stat, amount, boostedAmount);

				if (turns && typeof(turns) == "number") {
					if (!targ?.custom?.buffTurns) 
						addCusVal(targ, "buffTurns", []);

					let brimstoneProceed = false;
					if (targ.status && targ.status.toLowerCase() == 'brimstone') {
						if (!targ?.custom?.revertBuffTurns) addCusVal(targ, "revertBuffTurns", []);

						if (hasStatusAffinity(targ, 'brimstone', 'weak')) {
							if (!(amount < 0 && targ.custom.revertBuffTurns.filter(x => x[0] == stat && x[1] < 0).length >= 3)) brimstoneProceed = true;
						} else if (hasStatusAffinity(targ, 'brimstone', 'resist') || isBoss(targ)) {
							if (!(amount > 0 && targ.custom.revertBuffTurns.filter(x => x[0] == stat && x[1] > 0).length >= 3)) brimstoneProceed = true;
						} else {
							if (!((amount < 0 && targ.custom.revertBuffTurns.filter(x => x[0] == stat && x[1] < 0).length >= 3) || (amount > 0 && targ.custom.revertBuffTurns.filter(x => x[0] == stat && x[1] > 0).length >= 3))) brimstoneProceed = true;
						}
					}

					for (let i = 0; i < absamount; i++) {
						if (!((amount < 0 && targ.custom.buffTurns.filter(x => x[0] == stat && x[1] < 0).length >= 3) || (amount > 0 && targ.custom.buffTurns.filter(x => x[0] == stat && x[1] > 0).length >= 3))) {
							targ.custom.buffTurns.push([
								stat, turns * (amount / absamount)
							])

							if (brimstoneProceed) {
								targ.custom.revertBuffTurns.push([
									stat, turns * (-1 * amount / absamount)
								])
							}
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
		name: "Power Buff (Original)",
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
		doc: {
			pages: [
				{
					desc: `Allowed stats are: ATK, MAG, PRC, END, AGL & CRIT.`
				}
			]
		},
		applyfunc(message, skill, args) {
			const stat = args[0].toLowerCase()
			const trueFa = (args[3] == 'true' || args[3] == 'yes' || args[3] == 'y' || args[3] == '1')
			const upto = (args[2] == 'true' || args[2] == 'yes' || args[2] == 'y' || args[2] == '1')
			if (!['atk', 'mag', 'prc', 'end', 'agl', 'crit'].includes(stat))
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
			let txt = `Increases in power with `

			let curPB = []
			for (let i in vars) {
				curPB = vars[i]
				
				txt += `**${curPB[0].toUpperCase()}** buffs by **${curPB[2] ? 'up to' : ''} ${curPB[1] + ((curPB[2] && curPB[3]) ? 100 : 0) }${curPB[3] ? '% of' : ''} power**`

				if (i < vars.length - 2) {
					txt += `, `
				} else if (i == vars.length - 2) {
					txt += ` and `
				}
			}
			return txt
		}
	}),

	takemp: new Extra({
		name: "Take MP (Original)",
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

			let usermp = char.mpMeter ? char.mpMeter[1] : "MP";
			let targmp = targ.mpMeter ? targ.mpMeter[1] : "MP";

			if (usermp == targmp)
				return `__${char.name}__ drained **${MPtaken}${usermp}** from __${targ.name}__!`;
			else
				return `__${char.name}__ drained **${MPtaken}${targmp}** from __${targ.name}__, turning it into usable ${usermp}.`;
		},
		getinfo(vars, skill) {
			return `Takes **${vars[0]}MP** from the target`
		}
	}),

	stealmp: new Extra({
		name: "Steal MP (Persona)",
		desc: "Turns the skill into a skill that takes <Power> MP from the foe.",
		applyfunc(message, skill) {
			makeExtra(skill, "stealmp", [true]);
			return true
		},
		onuseoverride(char, targ, skill, result, btl, vars) {
			if (targ.mp <= 0) return `But it failed!`;
			let mpStolen = Math.floor(Math.max(1, skill.pow+randNum(-10, 10)));
			if (targ.mp < mpStolen) mpStolen = targ.mp;
			
			targ.mp = Math.max(0, targ.mp-mpStolen)
			char.mp = Math.min(char.maxmp, char.mp+mpStolen)
			
			return `__${char.name}__ managed to steal **${mpStolen}${char.mpMeter ? char.mpMeter[1] : "MP"}**!`;
		},
		getinfo(vars, skill) {
			return `Steals MP from the target instead of dealing damage`
		}
	}),

	steal: new Extra({
		name: "Steal (Original)",
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
		doc: {
			pages: [
				{
					desc: `The extra lets a person steal items, but it will let them steal un-equipped weapons and armor.\nAs for non-characters that are targetted by the skill, this will affect loot. It'll mean that upon victory, less items may drop from the loot table but the winning team may gain more.`
				}
			]
		},
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
			
			if (isBoss(targ)) return '';

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
			return '';
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
		name: "Drain (Original)",
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
		name: "Feint (Pokémon)",
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
		name: "Healverse (Sonic Robo Blast 2 Persona)",
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
		doc: {
			pages: [
				{
					desc: `With *{Deploy Message}*, there are keywords you can use to replace with what they represent. These are: **%USER%, %ENEMY%, and %SKILL%**`
				}
			]
		},
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
					turns: vars[1]
				});

				if (vars[2] && typeof vars[2] == 'string') {
					return vars[2].replace(/%SKILL%/ig, skill.name).replace(/%USER%/ig, char.name).replace(/%ENEMY%/ig, targ.name);
				} else {
					return `A green aura is deployed around __${targ.name}__!`;
				}
			}
		},
		getinfo(vars, skill) {
			return `Surrounds the target with a **healing aura** for **${vars[1]}** turns`;
		}
	}),

	revitaverse: new Extra({
		name: "Revitaverse (Original)",
		desc: "After the foe is hit with this skill, each hit done to it will give the attacker <Damage Percent>% of damage dealt MP. This lasts for <Turns> turns. You can add flair to this skill with a {Deploy Message}.",
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
		doc: {
			pages: [
				{
					desc: `With *{Deploy Message}*, there are keywords you can use to replace with what they represent. These are: **%USER%, %ENEMY%, and %SKILL%**`
				}
			]
		},
		applyfunc(message, skill, args) {
			const turns = args[1]
			if (turns < 1)
				return void message.channel.send("You can't have less than 1 turn for this skill.");
			makeExtra(skill, "revitaverse", [args[0], turns, args[2]]);
			return true
		},
		onuse(char, targ, skill, btl, vars) {
			if (targ.hp > 0) {
				addCusVal(targ, "revitaverse", {
					name: skill.name,
					infname: char.name,
					heal: vars[0],
					turns: vars[1],
					type: 'hp'
				});

				if (vars[2] && typeof vars[2] == 'string') {
					return vars[2].replace(/%SKILL%/ig, skill.name).replace(/%USER%/ig, char.name).replace(/%ENEMY%/ig, targ.name);
				} else {
					return `A purple aura is deployed around __${targ.name}__!`;
				}
			}
		},
		getinfo(vars, skill) {
			return `Surrounds the target with a **revitalising aura** for **${vars[1]}** turns`;
		}
	}),

	powerverse: new Extra({
		name: "Powerverse (Original)",
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
		doc: {
			pages: [
				{
					desc: `With *{Deploy Message}*, there are keywords you can use to replace with what they represent. These are: **%USER%, %ENEMY%, and %SKILL%**`
				}
			]
		},
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

				if (vars[2] && typeof vars[2] == 'string') {
					return vars[2].replace(/%SKILL%/ig, skill.name).replace(/%USER%/ig, char.name).replace(/%ENEMY%/ig, targ.name);
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
		name: "Spreadverse (Sonic Robo Blast 2 Persona)",
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
		doc: {
			pages: [
				{
					desc: `With *{Deploy Message}*, there are keywords you can use to replace with what they represent. These are: **%USER%, %ENEMY%, and %SKILL%**`
				}
			]
		},
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

				if (vars[2] && typeof vars[2] == 'string') {
					return vars[2].replace(/%SKILL%/ig, skill.name).replace(/%USER%/ig, char.name).replace(/%ENEMY%/ig, targ.name);
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
		name: "Lone Wolf (Original)",
		desc: "Skill Power boosted by <Multiplier>x when alone, or all allies are down.",
		args: [
			{
				name: "Multiplier",
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
		name: "Heaven's Wrath (Original)",
		desc: "Skill Power boosted by <Multiplier>x when not alone, and all allies are alive.",
		args: [
			{
				name: "Multiplier",
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
		name: "Stat Calculation (Original)",
		desc: "Uses the user's <Stat> in place of their offensive stat for dealing damage.",
		args: [
			{
				name: "Stat",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const stat = args[0].toLowerCase()
			if (!stats.includes(stat))
				return void message.channel.send("That's not a valid stat!");
			makeExtra(skill, "statcalc", [stat]);
			return true
		},
		hardcoded: true,
		getinfo(vars, skill) {
			return `Uses _user's_ **${vars[0].toUpperCase()}** to deal damage`;
		}
	}),

	hitcalc: new Extra({
		name: "Hit Calculation (Original)",
		desc: "Uses the opponent's <Stat> in place of their endurance for taking damage.",
		args: [
			{
				name: "Stat",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const stat = args[0].toLowerCase()
			if (!stats.includes(stat))
				return void message.channel.send("That's not a valid stat!");
			makeExtra(skill, "hitcalc", [stat]);
			return true
		},
		hardcoded: true,
		getinfo(vars, skill) {
			return `Uses _target's_ **${vars[0].toUpperCase()}** to take damage`;
		}
	}),

	hpcalc: new Extra({
		name: "HP Calculation (Original)",
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
		dmgmod(char, targ, dmg, skill, btl, vars, emojis) {
			dmg += dmg * ((char.hp / (char.maxhp / 2)) - 1) * (vars[0]/100)

			return dmg;
		},
		getinfo(vars, skill) {
			return `Current user's HP can modify damage by **${vars[0]}%**`;
		}
	}),

	mpcalc: new Extra({
		name: "MP Calculation (Original)",
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
		dmgmod(char, targ, dmg, skill, btl, vars, emojis) {
			dmg += dmg * ((char.mp / (char.maxmp / 2)) - 1) * (vars[0]/100)

			return dmg;
		},
		getinfo(vars, skill) {
			return `Current user's MP can modify damage by **${vars[0]}%**`;
		}
	}),

	grassknot: new Extra({
		name: "Grass Knot (Pokémon)",
		desc: "Uses the opponent's <Stat> in place of your offensive stat to deal damage.",
		args: [
			{
				name: "Stat",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const stat = args[0].toLowerCase()
			if (!stats.includes(stat))
				return void message.channel.send("That's not a valid stat!");
			makeExtra(skill, "grassknot", [stat]);
			return true
		},
		hardcoded: true,
		getinfo(vars, skill) {
			return `Uses _target's_ **${vars[0].toUpperCase()}** to deal damage`;
		}
	}),

	multistatus: new Extra({
		name: "Multistatus (Pokémon)",
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
		doc: {
			pages: [
				{
					desc: `Be careful with the first status, as it will replace the one already specfiied.`
				}
			]
		},
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
		name: "Dual Element (Original)",
		desc: "The skill may use the 2nd element in addition to the first.",
		args: [
			{
				name: "Element",
				type: "Word",
				forced: true
			}
		],
		doc: {
			pages: [
				{
					desc: `Every element is allowed except for: *${elementEmoji['support']} **Support**, ${elementEmoji['heal']} **Heal** & ${elementEmoji['passive']} **Passive***.`
				}
			]
		},
		applyfunc(message, skill, args) {
			const element = args[0].toLowerCase()
			if (Elements.includes(element) && element != skill.type && element != 'passive' && element != 'status' && element != 'support' && element != 'heal') {
				skill.type = [(typeof skill.type === 'object') ? skill.type[0] : skill.type, element];
			} else
				return void message.channel.send("That's not a valid element!");	
			return true;
		},
		hardcoded: true,
		hardcodedinfo: true
	}),

	affinitypow: new Extra({
		name: "Affinity Power (Original)",
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
		name: "Force Technical (Persona)",
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
		name: "Force Formula (Original)",
		desc: "Forces a skill to use a different damage formula.",
		args: [
			{
				name: "Formula",
				type: "Word",
				forced: true
			}
		],
		doc: {
			pages: [
				{
					desc: `The formulas allowed are: Persona, Pokemon, Lamonka and Beta.`
				}
			]
		},
		applyfunc(message, skill, args) {
			const formula = args[0].toLowerCase();
			if (!damageFormulas.includes(formula)) return void message.channel.send('Invalid damage formula!\nValid formulas are: Persona, Pokemon, Lamonka, Beta')
			makeExtra(skill, "forceformula", [formula]);
			return true;
		},
		hardcoded: true,
		getinfo(vars, skill) {
			return `Uses the **${vars[0]}** damage formula`;
		}
	}),

	rollout: new Extra({
		name: "Rollout (Pokémon)",
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
		name: "Sustain (Original)",
		desc: "Multi-Hits do not have power altered as hits go on. **Overrides the reverse extra.**",
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
		name: "Reverse (Original)",
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
		name: "Power Hit (Original)",
		desc: "With multi-hits, specific hits will have their power increased, by a given <Multiplier>.",
		multiple: true,
		args: [
			{
				name: "Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "Hit #1",
				type: "Num",
				forced: true,
				multiple: true
			}
		],
		applyfunc(message, skill, args) {
			if (args[0] <= 0) return void message.channel.send("You can't use a multiplier less than 0!");
			if (args.slice(1).some(arg => arg < 1)) return void message.channel.send("You can't use a hit less than 1!");

			makeExtra(skill, "powhit", [args]);
			return true;
		},
		getinfo(vars, skill) {
			if (!vars[0][0][0])
				return "**THIS SKILL'S _POWHIT_ EXTRA HAS BEEN BROKEN BY RECENT UPDATES.\n__RE-REGISTER THIS SKILL'S _POWHIT_ EXTRA__**";

			if (skill.hits && skill.hits > 1) {
				let txt = 'Hits ';

				for (const k in vars) {
					for (const i in vars[k][0]) {
						if (i > 0) {
							txt += `**#${vars[k][0][i]}**`
							if (i == vars[k][0].length-2)
								txt += ' and ';
							else if (i >= vars[k][0].length-1)
								txt += ` will deal ${vars[k][0][0]}x damage`;
							else
								txt += ', ';
						}
					}

					if (k < vars.length-1)
						txt += ', whereas, hits ';
				}

				return txt;
			} else
				return 'The `POWHIT` extra has no effect on single-hits..';
		}
	}),

	multihit: new Extra({
		name: "Multi (Original)",
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
		doc: {
			pages: [
				{
					desc: `*<Chance>* needs to be above 0%, and up to 50%.`+
					`\n\nIt will read how many hits the skill has beforehand, so it will limit the max amount because skills cannot exceed 99 hits.`
				}
			]
		},
		applyfunc(message, skill, args) {
			const chance = args[0];
			const hits = args[1];

			if (chance <= 0 || chance > 50) return message.channel.send("Invalid value for <Chance>! It should be above 0 or below 50.");
			
			if (hits <= 0 || hits > 99-(skill.hits ?? 1))
				return void message.channel.send(`Invalid value for <Number of Hits>. It should be above 0. Be aware that skills cannot exceed 99 hits, and so, the highest this number can be is ${99-(skill.hits ?? 1)}.`);

			makeExtra(skill, "multihit", [chance, hits]);
			return true;
		},
		statmod(char, skill, vars, btl) {
			let num = randNum(100);

			if (num <= vars[0]) {
				let extrahits = randNum(1, vars[1]);

				skill.hits = parseInt(skill.hits) + extrahits;
				addAtkMsg(btl, `__${char.name}__'s __${skill.name}__ landed **${extrahits}** extra time(s)!`);
				console.log(skill.hits + " hits")
			}
		},
		getinfo(vars, skill) {
			return `**${vars[0]}%** chance to add up to **${vars[1]}** extra hit(s) to the skill`;
		}
	}),

	guts: new Extra({
		name: "Guts (Pokémon)",
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
			statusses = statusses.filter(status => statusEffects.includes(status));
			if (statusses.length == 0) return void message.channel.send("You didn't specify any valid statuses!");

			makeExtra(skill, "guts", [args[0], ...statusses]);
			return true;
		},
		statmod(char, skill, vars, btl) {
			if (!char.status) return;

			if (vars.includes(char.status)) {
				console.log(`Guts activate for ${char.status}, ${skill.pow} => ${skill.pow*vars[0]}`);
				skill.pow *= vars[0];
			}
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
		name: "Metronome (Pokémon)",
		desc: "Uses a random skill... or chooses from a set of <Skills>.",
		args: [
			{
				name: "Skill #1",
				type: "Word",
				forced: false,
				multiple: true,
			}
		],
		doc: {
			pages: [
				{
					desc: `Every skill is applicable, except for ${elementEmoji['passive']} **Passives**.`
				}
			]
		},
		applyfunc(message, skill, args) {
			let skills = args;
			skills = skills.filter(skill => skillFile[skill] && skillFile[skill]?.type !== "passive");
			makeExtra(skill, "metronome", skills);
			return true
		},
		hardcoded: true,
		getinfo(vars, skill) {
			return 'Use a completely random skill';
		}
	}),

	copyskill: new Extra({
		name: "Copy Skill (Original)",
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
		name: "Brick Break (Pokémon)",
		desc: "Breaks any kind of shield the foe may have, but may reduce damage by {Multiplier} when doing so.",
		args: [
			{
				name: "Multiplier",
				type: "Decimal"
			}
		],
		doc: {
			pages: [
				{
					desc: `The default multiplier, if not specified is *0.5*, which means a skill will have **half the power** if it breaks a shield.`
				}
			]
		},
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
		name: "Endeavor (Pokémon)",
		desc: 'Brings the target to your HP. Fails if you have equal to or more HP than the target. Does not work on bosses.',
		args: [],
		applyfunc(message, skill, args) {
			makeExtra(skill, "endeavor", [true]);
			return true
		},
		onuseoverride(char, targ, skill, result, btl, vars) {
			if (targ.hp <= char.hp || isBoss(targ)) return 'But it failed...!';

			let c = randNum(1, 100);
			if (c <= skill.acc+((char.stats.prc-targ.stats.agl)/2)) {
				let dmg = targ.hp-char.hp;
				targ.hp = char.hp;
				return `__${char.name}__'s _${skill.name}_ dealt **${dmg}** damage to __${targ.name}__, cutting their health to theirs!`;
			} else {
				return dodgeTxt(targ, char);
			}
		},
		getinfo(vars, skill) {
			return 'Brings the target to the _user\'s_ HP.';
		}
	}),

	superfang: new Extra({
		name: "Super Fang (Pokémon)",
		desc: "Halves the target's current HP. Does not work on bosses.",
		args: [],
		applyfunc(message, skill, args) {
			makeExtra(skill, "superfang", [true]);
			return true
		},
		onuseoverride(char, targ, skill, result, btl, vars) {
			if (isBoss(targ)) return 'But it failed...!';

			let c = randNum(1, 100);
			if (c <= skill.acc+((char.stats.prc-targ.stats.agl)/2)) {
				let dmg = Math.round(targ.hp/2);
				targ.hp -= dmg;
				return `__${targ.name}__ had their HP halved, taking **${dmg}** damage!`;
			} else {
				return dodgeTxt(targ, char);
			}
		},
		getinfo(vars, skill) {
			return "Halves the target's current HP.";
		}
	}),

	psychoshift: new Extra({
		name: "Psycho Shift (Pokémon)",
		desc: "Transfers the user's status to the target. Cannot transfer stackable statusses.",
		args: [],
		applyfunc(message, skill, args) {
			makeExtra(skill, "psychoshift", [true]);
			return true
		},
		onuse(char, targ, skill, btl, vars) {
			if (char.status && char.statusturns) {
				targ.status = char.status;
				targ.statusturns = char.statusturns;
				statusEffectFuncs[targ.status].oninflict(targ);

				delete char.status;
				delete char.statusturns;
				return `__${char.name}__ transferred their **${targ.status}** to __${targ.name}__!`;
			}

			return '';
		},
		aithinker(char, targ, act, skill, btl, vars) {
			if (char.status) act.points += 2;
		},
		getinfo(vars, skill) {
			return "Transfers a **Non-Stackable Status** to the target.";
		}
	}),

	dragonrage: new Extra({
		name: "Dragon Rage (Pokémon)",
		desc: "Deals an exact number of damage to the target.",
		args: [
			{
				name: "Damage",
				type: "Num",
				forced: true
			}
		],
		doc: {
			pages: [
				{
					desc: `It overrides power calculations and affinity checks.`
				}
			]
		},
		applyfunc(message, skill, args) {
			if (args[0] <= 0 || args[0] > 2000) return message.channel.send(`${args[0]} is an invalid number! Please enter a value between 0 and 2000.`);

			skill.pow = args[0];
			makeExtra(skill, "dragonrage", [args[0]]);
			return true
		},
		onuseoverride(char, targ, skill, result, btl, vars) {
			let c = randNum(1, 100);
			if (c <= skill.acc+((char.stats.prc-targ.stats.agl)/2)) {
				let dmg = Math.round(vars[0]);
				targ.hp -= dmg;

				let txt = `__${targ.name}__ took **${dmg} forced** damage`;
				if (targ.hp <= 0) txt += ` and was defeated!\n${selectQuote(char, 'kill', null, '%ENEMY%', targ.name, '%SKILL%', skill.name)}${selectQuote(targ, 'death', null, '%ENEMY%', char.name, '%SKILL%', skill.name)}`;

				return txt;
			} else {
				return dodgeTxt(targ, char);
			}
		},
		getinfo(vars, skill) {
			return `Deals EXACTLY **${vars[0]}** damage.`;
		}
	}),

	link: new Extra({
		name: "Link (Persona Q: Shadow of the Labyrinth)",
		desc: "After use, if the same enemy is attacked with a single target skill, this skill with a <Power Boost per hit> multiplier is used after.",
		args: [
			{
				name: "Power Boost Per Hit",
				type: "Decimal",
				forced: false
			},
			{
				name: "Uses",
				type: "Num",
				forced: false
			}
		],
		doc: {
			pages: [
				{
					desc: `{Uses} has to be at least *1* if you want it to be **temporary**. However, setting it to *-1* will make it apply **indefinitely**, unless the target is not hit once within said uses.`+
					`\n-# It has to be consistently attacked by every party member for it to work its magic to the fullest.`+
					`\n\nIf *{Uses}* is not specified, it will default to *3* uses.`
				}
			]
		},
		applyfunc(message, skill, args) {
			// Check Power Boost Per Hit
			if (args[0]) {
				if (args[0] <= 0) return void message.channel.send("Please enter a value over 0 for ''Power Boost Per Hit''!");
			}

			// Check Turns
			if (args[1]) {
				if (args[1] < -1 || args[1] == 0) return void message.channel.send("Please enter a value over 0 for ''Uses'', or enter -1 for this to be done indefinitely!");
			}

			makeExtra(skill, "link", [args[0] ?? null, args[1] ?? null]);
			return true
		},
		onuse(char, targ, skill, btl, vars) {
			let id = getSkillID(skill);
			let pb = vars[0] ?? 1;
			let t = vars[1] ?? 3;

			if (targ.hp > 0) {
				if (!targ.custom?.link) addCusVal(targ, "link", {});

				if (!targ.custom.link[id]) {
					const skilldefs = objClone(skill)
					skilldefs.pow *= pb

					targ.custom.link[id] = {
						uses: t,
						username: char.name,
						notthisskill: true,
						skilldefs
					}

					return `__${char.name}__'s _${skill.name}_ was deployed on __${targ.name}__!`;
				}
			}
		},
		getinfo(vars, skill) {
			let txt = "Starts a link chain";
			if (vars[0] && vars[0] != 1) txt += ` with a **${vars[0]}x** multiplier`;
			if (vars[1] && vars[1] != 3) txt += ` that lasts **${vars[1]} ${vars[1] == 1 ? "use" : "uses"}**`;
			return txt;
		}
	}),

	roar: new Extra({
		name: "Roar (Pokémon)",
		desc: "<Chance>% chance to send the foe into backup, or debuff {Fail Stat} by {Fail Stages} if they cannot be sent into backup.",
		args: [
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			},
			{
				name: "Fail Stat",
				type: "Word"
			},
			{
				name: "Fail Stages",
				type: "Num"
			}
		],
		doc: {
			pages: [
				{
					desc: `Allowed stats are: ATK, MAG, PRC, END, AGL & CRIT. All is allowed too.\n\nYou can't choose any more than 3 buffs or debuffs. If it's not specified, it won't debuff the target if it fails to send to backup.`+
					`\n\nBosses cannot be sent into backup at all.`
				}
			]
		},
		applyfunc(message, skill, args) {
			if (args[0] <= 0 || args[0] > 100) return message.channel.send(`${args[0]} is an invalid number! Please enter a value between 0 and 100.`);
			let roar = [args[0]];

			if (args[1]) {
				if (!['atk', 'mag', 'prc', 'end', 'agl', "crit", "all"].includes(args[1]))
					return void message.channel.send("That's not a valid stat!");
				else
					roar.push(args[1]);

				if (args[2] == 0)
					return void message.channel.send("...This amount of stages won't do anything, I'm afraid.");
				else if (args[2] > 3 || args[2] < -3)
					return void message.channel.send("Too many/little stages! The minimum is -3, whilst the maximum is 3.");
				else
					roar.push(args[2]);
			}

			makeExtra(skill, "roar", roar);
			return true
		},
		onuseatendoffunc(char, targ, skill, btl, vars) {
			if (targ.hp > 0) {
				let canSwitch = true;
				let party = btl.teams[targ.team];
				let possiblebackup = [];

				if (party.backup.length <= 0)
					canSwitch = false;
				else {
					for (let i in party.backup) {
						if (party.backup[i].hp > 0) possiblebackup.push(i);
					}
				}

				if (isBoss(targ)) canSwitch = false;

				if (canSwitch) {
					if (vars[0] >= 100 || randNum(1, 100) <= vars[0]) {
						let k = randNum(possiblebackup.length-1);
						let char1 = objClone(targ);
						let char2 = objClone(party.backup[k]);
						party.members[targ.pos] = objClone(char2);
						party.backup[k] = objClone(char1);

						return `${char1.name} was blown out of battle and replaced with ${char2.name}!`;
					}
				} else {
					if (vars[1]) {
						let stat = vars[1] ?? 'agl';
						let stages = vars[2] ?? -1;

						buffStat(targ, stat, stages);
						return `${targ.name} felt winded from that last attack...\nTheir ${(stat == 'all') ? 'STATS' : stat.toUpperCase()} was decreased!`;
					} else {
						return `${targ.name} felt winded from that last attack...\n...but it had no effect.`;
					}
				}
			}
		},
		getinfo(vars, skill) {
			let str = `**${vars[0]}%** chance to **switch the target out of battle**`;

			if (vars[1]) str += `. If it fails, debuff the foe's **${vars[1]}**`;
			if (vars[1] && vars[2]) str += ` by **${-vars[2]}**`;

			return str;
		}
	}),

	flinch: new Extra({
		name: "Flinch (Pokémon)",
		desc: "If the user is faster than the target, the target may lose their next turn. Does not work on bosses.",
		args: [
			{
				name: "Turn Skip %",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let chance = parseFloat(args[0]);
			if (chance < 0 || chance > 100) return void message.channel.send("Please set a chance above 0 and below 100.");
			makeExtra(skill, "flinch", [chance]);
			return true
		},
		onuse(char, targ, skill, btl, vars) {
			if (targ.hp <= 0) return;
			if (targ.custom?.flinch) return;
			if (statWithBuff(char.stats.agl, char.buffs.agl, char) < statWithBuff(targ.stats.agl, targ.buffs.agl, targ)) return;

			if (isBoss(targ)) {
				if (skill.extras.fakeout && skill.extras.fakeout[0] <= 1) {
					// do nothing - we let this slide.
				} else {
					return;
				}
			}

			if (vars[0] >= 100 || randNum(1, 100) <= vars[0]) {
				addCusVal(targ, "flinch", true);
				return `__${targ.name}__ flinched!`;
			}
		},
		getinfo(vars, skill) {
			return `**${vars[0]}%** chance to make the target flinch`;
		}
	}),

	fakeout: new Extra({
		name: "Fake Out (Pokémon)",
		desc: "This move only works on the first <Turn Count> turn(s).",
		args: [
			{
				name: "Turn Count",
				type: "Num",
				forced: true
			}
		],
		doc: {
			pages: [
				{
					desc: `If the skill is paired with *FLINCH*, and the <Turn Count> is 1, it may bypass bosses.`
				}
			]
		},
		applyfunc(message, skill, args) {
			let turns = parseInt(args[0]);
			if (turns <= 0) return void message.channel.send("Please set turns above 0.");
			makeExtra(skill, "fakeout", [turns]);
			return true
		},
		canuse(char, skill, btl, vars) {
			if (btl.turn <= vars[0]) {
				if (vars[0] <= 1)
					return "This skill can only be used on the first turn!";
				else if (vars[0] <= 2)
					return "This skill can only be used before the second turn has passed!";
				else if (vars[0] <= 3)
					return "This skill can only be used before the third turn has passed!";

				return `This skill can only be used before turn #${vars[0]} has passed!`;
			}

			return true;
		},
		getinfo(vars, skill) {
			return `Only usable before **turn #${vars[0]}** has passed`;
		}
	}),

	nightshade: new Extra({
		name: "Night Shade (Pokémon)",
		desc: "Deals damage equal to the user's or opponent's level, with a multiplier.",
		args: [
			{
				name: "User/Target",
				type: "Word",
				forced: true
			},
			{
				name: "Multiplier in Percent",
				type: "Num",
				forced: true
			}
		],
		doc: {
			pages: [
				{
					desc: `The multiplier needs to be within the **0%-500%** range.`
				}
			]
		},
		applyfunc(message, skill, args) {
			const target = args[0].toLowerCase();
			const multiplier = parseFloat(args[1]);

			if (target != 'target' && target != 'user')
				return void message.channel.send("You entered an invalid value for <User/Target>! It can be either Target or User.");

			if (multiplier < 0 || multiplier > 500) 
				return void message.channel.send("Please set a multiplier between 0 and 500%.");

			makeExtra(skill, "nightshade", [target, multiplier]);
			return true
		},
		onuseoverride(char, targ, skill, result, btl, vars) {
			let c = randNum(1, 100);
			if (c <= skill.acc+((char.stats.prc-targ.stats.agl)/2)) {
				let level = char.level;
				if (vars[0] == 'target') level = targ.level;

				let dmg = Math.round(level*vars[1]/100);
				targ.hp -= dmg;

				let txt = `__${targ.name}__ took **${dmg} forced** damage`;
				if (targ.hp <= 0) txt += ` and was defeated!\n${selectQuote(char, 'kill', null, '%ENEMY%', targ.name, '%SKILL%', skill.name)}${selectQuote(targ, 'death', null, '%ENEMY%', char.name, '%SKILL%', skill.name)}`;

				return txt;
			} else {
				return dodgeTxt(targ, char);
			}
		},
		getinfo(vars, skill) {
			return `Deals damage **equal to the __${vars[0]}'s level__**, with a **${vars[1]}**% modifier`;
		}
	}),

	forcemsg: new Extra({
		name: "Force Message (Original)",
		desc: "A message will be displayed in a specific situation instead of the default message.",
		multiple: true,
		hardcoded: true,
		args: [
			{
				name: "Situation",
				type: "Word",
				forced: true,
			},
			{
				name: "Full Message",
				type: "Word",
				forced: true,
			}
		],
		doc: {
			pages: [
				{
					desc: `There are multiple situations you can consider for the message you want to replace. Each of them are self-explanatory. These are: **"OnUse", "OnHit", "OnMiss", "OnKill", "OnBuff", and "OnDebuff"**.`+
					`\n\nAs with *<Full Message>*, there are keywords you can use to replace with what they represent. These are: **%USER%, %ENEMY%, and %DAMAGE%**.`
				}
			]
		},
		applyfunc(message, skill, args) {
			let situation = args[0].toLowerCase();

			if (!['onuse', 'onhit', 'onmiss', 'onkill', 'onbuff', 'ondebuff'].includes(situation))
				return void message.channel.send(`${args[0]} is an invalid situation. Please enter one of the following:\n- OnUse\n- OnHit\n- OnMiss\n- OnKill\n- OnBuff\n- OnDebuff`);

			makeExtra(skill, "forcemsg", [situation, args[1]]);
			return true
		},
		getinfo(vars, skill) {
			return '*Has a custom message.*';
		}
	}),

	dekaja: new Extra({
		name: "Dekaja",
		desc: "Removes the target's positive buffs.",
		args: [],
		applyfunc(message, skill, args) {
			makeExtra(skill, "dekaja", [true]);
			return true;
		},
		onuse(char, targ, skill, btl, vars) {
			for (let i in targ.buffs) {
				if (targ.buffs[i] > 0) targ.buffs[i] = 0;
			}
			if(targ?.custom?.revertBuffs) {
				for (let i in targ.custom.revertBuffs) {
					if (targ.custom.revertBuffs[i] < 0) targ.custom.revertBuffs[i] = 0;
				}
			}
			if(targ?.custom?.buffTurns) {
				for (i in targ.custom.buffTurns) {
					if (targ.custom.buffTurns[i][1] >= 0) targ.custom.buffTurns[i] = ''
				}
				targ.custom.buffTurns = targ.custom.buffTurns.filter(x => x.length != 0);

				if (targ.custom.buffTurns.length == 0) {
					killVar(targ, "buffTurns");
				}
			}
			if(targ?.custom?.revertBuffTurns) {
				for (i in targ.custom.revertBuffTurns) {
					if (targ.custom.revertBuffTurns[i][1] <= 0) targ.custom.revertBuffTurns[i] = ''
				}
				targ.custom.revertBuffTurns = targ.custom.revertBuffTurns.filter(x => x.length != 0);

				if (targ.custom.revertBuffTurns.length == 0) {
					killVar(targ, "revertBuffTurns");
				}
			}

			return `__${targ.name}__'s positive buffs were nullified!`;
		},
		getinfo(vars, skill) {
			return "Removes the **target's** buffs";
		}
	}),

	firespin: new Extra({
		name: "Fire Spin (Pokemon)",
		desc: "<Chance%> to inflict the opponent with a constant <Damage%> damage of the original damage.",
		args: [
			{
				name: "Chance%",
				type: "Decimal",
				forced: true
			},
			{
				name: "Damage%",
				type: "Decimal",
				forced: true
			},
			{
				name: "Immobilize Chance%",
				type: "Decimal",
				forced: false
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			},
			{
				name: "Lingering Damage Name",
				type: "Word",
				forced: false
			}
		],
		doc: {
			pages: [
				{
					desc: `If *{Immobilize Chance%}* is specified, the lingering effect may be able to **immobilize** them in a similar fashion to **${statusEmojis['sleep']} ${statusNames['sleep']}**, meaning the target wouldn't be able to make a move.`+
					`\n\nSaid damage can be named with {Lingering Damage Name}. It uses the skill name instead if not specified.`
				}
			]
		},
		applyfunc(message, skill, args) {
			const chance = parseFloat(args[0]);
			const dmgmult = parseFloat(args[1]);
			const turns = parseInt(args[3]);
			const immobilize = parseFloat(args[2] ?? 0);

			makeExtra(skill, "firespin", [chance, dmgmult, turns, immobilize ?? null, args[4] ?? null]);
			return true
		},
		ondamage(char, targ, dmg, skill, btl, vars) {
			if (targ.custom?.firespin) return;

			var immobile = false;
			if (vars[3] && vars[3] > 0 && (randNum(1000) <= (vars[3]*10))) {
				immobile = true;
			}

			addCusVal(targ, "firespin", {
				name: vars[4] ?? skill.name,
				infname: char.name,
				damage: Math.round(vars[1]*dmg/100),
				immobilize: immobile,
				turns: vars[2]
			});

			if (immobile == true) {
				return `__${targ.name}__ has been trapped by __${char.name}__'s *${vars[4] ?? skill.name}*`;
			} else {
				return `__${targ.name}__ has been engulfed in __${char.name}__'s *${vars[4] ?? skill.name}*`;
			}
		},
		getinfo(vars, skill) {
			let txt = `**${vars[0] >= 100 ? "Guaranteed" : vars[0]+"% chance"}** to engulf the **target**, dealing **${vars[1]}%** of the dealt damage to the target, for **${vars[2]}** turns`;
			if (vars[3]) txt += `, and **${vars[3] >= 100 ? "guaranteed" : "a "+vars[3]+"% chance"}** to completely immobilize them during that time`;
			return txt;
		}
	}),

	weaponmod: new Extra({
		name: "Weapon Modifier (Original)",
		desc: "The skill may either recieve the weapon's element in addition to it's original, or use the element to replace the original.",
		args: [
			{
				name: "Replace",
				type: "YesNo"
			}
		],
		applyfunc(message, skill, args) {
			makeExtra(skill, "weaponmod", [args[0] ?? false]);
			return true
		},
		statmod(char, skill, vars, btl) {
			if (char.curweapon?.element) {
				if (vars[0]) {
					skill.type = char.curweapon.element;
				} else {
					if (typeof skill.type === 'object') {
						skill.type[skill.type.length] = char.curweapon.element;
					} else {
						skill.type = [skill.type, char.curweapon.element];
					}
				}
			}
		},
		getinfo(vars, skill) {
			return `Element **${vars[0] ? "replaced" : "added"}** to the original element **from the user's weapon**.`;
		}
	}),

	soulless: new Extra({
		name: "Soulless (Original)",
		desc: "<Chance%> to bypass a given status ailment",
		hardcoded: true,
		args: [
			{
				name: "Chance%",
				type: "Num",
				forced: true,
			},
			{
				name: "Status Effects",
				type: "Word",
				forced: true,
				multiple: true,
			}
		],
		doc: {
			pages: [
				{
					desc: `Many status ailments are supported. The exceptions are ${statusEmojis['brainwash']} **${statusNames['brainwash']}**, ${statusEmojis['infatuation']} **${statusNames['infatuation']}**, ${statusEmojis['guilt']} **${statusNames['guilt']}**, ${statusEmojis['mirror']} **${statusNames['mirror']}** & ${statusEmojis['dragonscale']} **${statusNames['dragonscale']}**.`+
					`\n\nIf you decide to include either ${statusEmojis['lovable']} **${statusNames['lovable']}** or ${statusEmojis['target']} **${statusNames['target']}**, *<Chance%>* has to be **guaranteed**.`
				}
			]
		},
		applyfunc(message, skill, args) {
			for (let i in args) {
				if (i <= 0) continue;
				if (!statusEffects.includes(args[i])) return void message.channel.send(`${args[i]} is not a valid status effect. Use "liststatuseffects" to obtain a list of status ailments.`);
			}

			if ((args.includes("lovable") || args.includes("target")) && args[0] < 100) return void message.channel.send("If soulless is made to bypass lovable and target, then it must be guaranteed.");
			if (args.includes("brainwash") || args.includes("infatuation") || args.includes("guilt") || args.includes("mirror") || args.includes("dragonscale")) return void message.channel.send("Soulless may not bypass Brainwash, Infatuation, Guilt, Mirror, or Dragon Scale.");

			makeExtra(skill, "soulless", args);
			return true;
		},
		getinfo(vars, skill) {
			let txt = `**${vars[0]}% chance** to bypass `;
			for (const i in vars) {
				if (i > 0) {
					txt += `**${statusEmojis[vars[i]]}${vars[i]}**`
					if (i == vars.length-2)
						txt += ' and ';
					else if (i >= vars.length-1)
						txt += ' when attacking an enemy';
					else
						txt += ', ';
				}
			}

			return txt;
		}
	}),

	weatherchange: new Extra({
		name: "Weather Change (Original)",
		desc: "Changes the weather to <Weather>, which will affect the battle.",
		args: [
			{
				name: "Weather",
				type: "Word",
				forced: true
			}
		],
		doc: {
			pages: [
				{
					desc: `When this is used, the weather change will last *from 8 to 16 turns*.`
				}
			]
		},
		applyfunc(message, skill, args) {
			if (!weathers.includes(args[0].toLowerCase())) return void message.channel.send("That's not a valid weather!");

			makeExtra(skill, "weatherchange", [args[0].toLowerCase()]);
			return true;
		},
		onuseatendoffunc(char, targ, skill, btl, vars) {
			if (btl.weather?.type != vars[0]) {
				if (btl?.weather?.type) {
					btl.weather.type = vars[0];
					btl.weather.turns = randNum(8, 16);
				} else {
					btl.weather = {
						type: vars[0],
						turns: randNum(8, 16)
					}
				}

				let str = `The weather has been changed to ${weatherDescs[vars[0]].emoji}**${vars[0]}**!\n`;

				for (let i in btl.teams) {
					for (let k in btl.teams[i].members)
						if (btl.teams[i].members[k].hp > 0) str += runPassiveHook(btl.teams[i].members[k], 'onweather', btl, btl.teams[i].members[k], btl.weather.type);
				}
	
				return str;
			}
		},
		getinfo(vars, skill) {
			return `Changes **Weather** to ${weatherDescs[vars[0]].emoji}**${vars[0]}**`;
		}
	}),

	terrainchange: new Extra({
		name: "Terrain Change (Pokemon)",
		desc: "Changes the terrain to <Terrain>, which will affect the battle.",
		args: [
			{
				name: "Terrain",
				type: "Word",
				forced: true
			}
		],
		doc: {
			pages: [
				{
					desc: `When this is used, the terrain change will last *from 8 to 16 turns*.`
				}
			]
		},
		applyfunc(message, skill, args) {
			if (!terrains.includes(args[0].toLowerCase())) return void message.channel.send("That's not a valid terrain!");

			makeExtra(skill, "terrainchange", [args[0].toLowerCase()]);
			return true;
		},
		onuseatendoffunc(char, targ, skill, btl, vars) {
			if (btl?.terrain?.type != vars[0]) {
				if (btl?.terrain?.type) {
					btl.terrain.type = vars[0];
					btl.terrain.turns = randNum(8, 16);
				} else {
					btl.terrain = {
						type: vars[0],
						turns: randNum(8, 16)
					}
				}

				let str = `The terrain has been changed to ${terrainDescs[vars[0]].emoji}**${vars[0]}**!\n`;

				for (let i in btl.teams) {
					for (let k in btl.teams[i].members)
						if (btl.teams[i].members[k].hp > 0) str += runPassiveHook(btl.teams[i].members[k], 'onterrain', btl, btl.teams[i].members[k], btl.terrain.type);
				}
	
				return str;
			}
		},
		getinfo(vars, skill) {
			return `Changes **Terrain** to ${terrainDescs[vars[0]].emoji}**${vars[0]}**`;
		}
	}),

	steelroller: new Extra({
		name: "Steel Roller (Pokemon)",
		desc: "If the current terrain is <Terrain>, the skill will get a power multiplier, and remove the terrain.",
		args: [
			{
				name: "Terrain / \"All\"",
				type: "Word",
				forced: true
			},
			{
				name: "Multiplier",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (![...terrains, "all"].includes(args[0].toLowerCase())) return void message.channel.send("That's not a valid terrain!");
			makeExtra(skill, "steelroller", [args[0].toLowerCase(), args[1]]);
			return true;
		},
		statmod(char, skill, vars, btl) {
			if (btl.terrain && (vars[0].toLowerCase() === "all" || btl.terrain.type == vars[0].toLowerCase())) skill.pow *= vars[1];
		},
		onuseatendoffunc(char, targ, skill, btl, vars) {
			if (btl.terrain && (vars[0].toLowerCase() === "all" || btl.terrain.type == vars[0].toLowerCase())) {
				delete btl.terrain;
				addAtkMsg(btl, "_The terrain was destroyed._");
			}
		},
		getinfo(vars, skill) {
			return `Consumes a **${vars[0]}** terrain to boost the attack power by **${vars[1]}x**`
		}
	}),

	elementalrend: new Extra({
		name: "Elemental Rend (Original)",
		desc: "Increase the damage of skills by <Damage Boost>% on characters with <Element> as their main element.",
		multiple: true,
		args: [
			{
				name: "Damage Boost",
				type: "Decimal",
				forced: true
			},
			{
				name: "Element",
				type: "Word",
				forced: true
			}
		],
		doc: {
			pages: [
				{
					desc: `The only element not allowed is ${elementEmoji['almighty']} **Almighty**, as it's prohibited to have that set as a main element.`+
					`\n\nIt's recommended that the *<Damage Boost>* is **higher than 100%**, as less will make the damage less prominent, or heal instead in some cases.`
				}
			]
		},
		applyfunc(message, skill, args) {
			let mult = args[0];
			let element = args[1].toLowerCase();

			if (element === "almighty") return void message.channel.send("It is normally impossible to set <:almighty:962465467316989962>**Almight** as a main element, anyway...")

			if (!Elements.includes(element)) {
				const DiscordEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle('List of usable elements:');
	
				let elementList = '';
				for (let i in Elements) elementList += `${elementEmoji[Elements[i]]}**${Elements[i].charAt(0).toUpperCase()}${Elements[i].slice(1)}**\n`;
		
				DiscordEmbed.setDescription(elementList);
				return void message.channel.send({content: `${element} is an invalid element. Try one of these:`, embeds: [DiscordEmbed]})
			}

			makeExtra(skill, "elementalrend", [mult, element]);
			return true
		},
		skillmod(char, targ, skill, btl, vars) {
			if (typeof targ.mainElement === "object") {
				if (targ.mainElement.includes(vars[1])) skill.pow *= vars[0]/100;
			} else {
				if (targ.mainElement === vars[1]) skill.pow *= vars[0]/100;
			}
		},
		getinfo(vars, skill) {
			let txt = "Skill's power boosted by ";
			
			for (let i in vars) {
				txt += `**${vars[i][0]}**% when used on ${elementEmoji[vars[i][1]]}**${vars[i][1].charAt(0).toUpperCase()}${vars[i][1].slice(1)}** elementals`;
				
				if (i == vars.length-2)
					txt += ' and ';
				else if (i >= vars.length-1)
					txt += ' when attacking the enemy';
				else
					txt += ', ';
			}

			return txt;
		}
	}),

	movelink: new Extra({
		name: "Move Link (Pokémon)",
		desc: `Skills with this extra will act as multiple skills when a character has them in possession.`,
		hardcoded: true,
		args: [
			{
				name: "Skill #1",
				type: "Word",
				forced: true,
				multiple: true,
			}
		],
		doc: {
			pages: [
				{
					desc: `It does not support *METRONOME* skills.\n\nAny skill is supported so long as it's not **itself** for obvious reasons.\n\n${elementEmoji['passive']} **Passives** are supported, they will be active so long as the character knows the skill.`
				}
			]
		},
		applyfunc(message, skill, args) {
			for (let i in args) {
				if (!skillFile[args[i]]) return void message.channel.send(`${args[i]} is not an existing skill.`);
				if (skillFile[args[i]] === skill) return void message.channel.send("You may not have skills link with themselves.");
			}

			makeExtra(skill, "movelink", args);
			return true
		},
		getinfo(vars, skill) {
			let txt = "Linked with "

			for (let i in vars) {
				txt += `**${getFullName(skillFile[vars[i]])}**`;

				if (i < vars.length - 2)
					txt += ', ';
				else if (i < vars.length - 1)
					txt += ' and ';
			}

			return txt;
		}
	}),

	formchange: new Extra({
		name: "Form Change (Original)",
		desc: "Changes the form of the user to <Form> on select, with a {Chance}% chance.",
		args: [
			{
				name: "Form",
				type: "Word",
				forced: true
			},
			{
				name: "Chance",
				type: "Decimal",
				forced: false
			},
			{
				name: "Transform on Failure Anyway",
				type: "YesNo",
				forced: false
			},
			{
				name: "Custom Message",
				type: "Word",
				forced: false
			}
		],
		doc: {
			pages: [
				{
					desc: `### _These skills should be character specific as forms are character specific and may not persist between characters._`+
					`\n\nIf *{Transform on Failure Anyway}* is Yes, then the move will allow transformation on block, repel, or other forms of failure.`+
					`\n\n*{Custom Message}* is the message that would be displayed on transformation. It doesn't show one if not specified.`+
					`\n\n*{Chance}* defaults to 100% if note specified.`
				}
			]
		},
		applyfunc(message, skill, args) {
			makeExtra(skill, "formchange", [args[0], Math.min(100, Math.max(0, parseInt(args[1] ?? 100))), args[2] ?? false, args[3] ?? undefined]);
			return true
		},
		onselect(char, skill, btl, vars) {
			if (!vars[2]) return;
			if (char.transformed) return
			if (char.notransform) return;
			if (char.mimic) return;
			if (char.ragesoul) return;
			if (char.custom?.orgiamode) return;

			if ((vars[0] === "normal" || (char.forms && char.forms[vars[0]])) && (vars[1] >= 100 || randNum(0, 100) <= vars[1])) {
				formChange(char, vars[0], btl);

				if (vars[3] && (typeof vars[3] === "string")) {
					return vars[3];
				} else {
					if (vars[0] === "normal") {
						return `__${char.name}__ returned to normal.`;
					} else {
						return `__${char.name}__ transformed into their __${vars[0]}__.`;
					}
				}
			} else {
				return '';
			}
		},
		onuse(char, targ, skill, btl, vars) {
			if (vars[2]) return;
			if (char.transformed) return;
			if (char.notransform) return;
			if (char.mimic) return;
			if (char.ragesoul) return;
			if (char.custom?.orgiamode) return;

			if ((vars[0] === "normal" || (char.forms && char.forms[vars[0]])) && (vars[1] >= 100 || randNum(0, 100) <= vars[1])) {
				formChange(char, vars[0], btl);

				if (vars[3] && (typeof vars[3] === "string")) {
					return vars[3];
				} else {
					if (vars[0] === "normal") {
						return `__${char.name}__ returned to normal.`;
					} else {
						return `__${char.name}__ transformed into their __${vars[0]}__.`;
					}
				}
			} else {
				return '';
			}
		},
		getinfo(vars, skill) {
			let str = `On use, may change into their **${(vars[0] === "normal") ? "Regular Form from any form they may be in now" : vars[0]}**`;
			if (vars[1] ?? vars[1] < 100) str = `On use, has a **${vars[1]}%** chance to change into their **${(vars[0] === "normal") ? "Regular Form from any form they may be in now" : vars[0]}**`;
			if (vars[2]) str += ', even on failure';
			return str;
		}
	}),

	critdmgmod: new Extra({
		name: "Critical Hit Damage Modifier (Original)",
		desc: "Landing a critical hit will multiply the damage dealt by <Multiplier> rather than the server standard.",
		hardcoded: true,
		args: [
			{
				name: "Multiplier",
				type: "Decimal",
				forced: true
			}
		],
		doc: {
			pages: [{desc: "A <Multiplier> below 1x will make critical hits deal less damage. A <Multiplier> below 0x and a <Multiplier> above 100x is not supported."}]
		},
		applyfunc(message, skill, args) {
			if (args[0] <= 0 || args[0] > 100) return void message.channel.send(`${args[0]} isn't a valid multiplier.`);
			makeExtra(skill, "critdmgmod", [args[0]]);
			return true;
		},
		critmod(char, targ, dmg, critRate, skill, btl, vars) {
			return vars[0];
		},
		getinfo(vars, skill) {
			return `Critical hits deal **${vars[0]}x** rather than the standard.`;
		}
	}),

	deathmark: new Extra({
		name: "Death Mark (Risk of Rain 2)",
		desc: "If the opponent has more than <Debuffs Count> total debuffs, they will be afflicted with a Death Mark, that deals <Multiplier>x damage for <Turns> turns.",
		args: [
			{
				name: "Debuff Count",
				type: "Num",
				forced: true
			},
			{
				name: "Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			}
		],
		doc: {
			pages: [
				{
					desc: `The Death Mark will stay even if they become cured of these debuffs. States that count as debuffs are as follows:
- Negative Status Ailments
- Neutral Status Ailments
- Debuffs
- Fire Spin
- Flinching
- Being the target of a link skill
- Verse skills
- ${elementEmoji.passive}**Pinch Mode**
- A ${elementEmoji.support}**Corrupted** foe.
- Being the target of a ${elementEmoji.support}**Future Sight** skill
- ${elementEmoji.support}**Simple Beam**
- ${elementEmoji.support}**Disable**
- Being angry during ${elementEmoji.passive}**Mood Swing**
- Affected by ${elementEmoji.passive}**Neutralising Gas**
- Being ${elementEmoji.physical}**collapsed**`
				}
			]
		},
		applyfunc(message, skill, args) {
			const debuffs = parseInt(args[0]);
			const dmgmult = parseFloat(args[1]);
			const turns = parseInt(args[2]);

			if (turns < 0) return void message.channel.send("But, it would ware off immediately-")
			if (dmgmult < 0) return void message.channel.send("I see no point in this.")

			makeExtra(skill, "deathmark", [debuffs, dmgmult, turns]);
			return true
		},
		ondamage(char, targ, dmg, skill, btl, vars) {
			if (targ.custom?.deathmark) return;

			let debuffs = 0;

			// Status ailments.
			if (targ.status && targ.status != "none") debuffs++;

			// Stackable status ailments.
			for (let i in statusEffectFuncs) {
				if (statusEffectFuncs[i].stackable && targ[i]) debuffs++;
			}

			// Debuffs
			for (let i in stats) {
				if (targ.buffs[stats[i]] && targ.buffs[stats[i]] < 0) debuffs -= targ.buffs[stats[i]];
			}

			// Extras debuffs
			if (targ.custom) {
				let debuffstuff = ["firespin", "flinch", "link", "healverse", "revitaverse", "powerverse", "spreadverse", "pinch", "futuresight", "simplebeam", "disable", "collapse"]

				for (let i in debuffstuff) {
					if (targ.custom[i]) debuffs++;
				}

				// Mood Swing
				if (targ.custom.moodswing?.isAngry) debuffs++;
			}

			// Battle State Debuffs
			if (btl.nopassives) debuffs++;

			// The final check
			console.log(`${debuffs} debuffs, must be over ${vars[0]}.`)
			if (debuffs >= vars[0]) {
				addCusVal(targ, "deathmark", {
					name: skill.name,
					infname: char.name,
					multiplier: vars[1],
					turns: vars[2]
				});

				return `__${targ.name}__ was _marked and weakened_!`;
			}
		},
		getinfo(vars, skill) {
			return `After the **opponent** has ${vars[0] ?? 4} debuffs, deal ${vars[1] ?? 1.5}✕ damage for ${vars[2] ?? 3} turns`
		}
	}),

	collapse: new Extra({
		name: "Collapse (Risk of Rain 2)",
		desc: "A <Chance>% chance to affects the opponent for <Turns> turns. After it wares off, the opponent takes the amount of damage that was dealt to them in that time multiplied by the <Multiplier>.",
		args: [
			{
				name: "Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			},
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			}
		],
		doc: {
			pages: [
				{
					desc: "This extra only tracks direct. It does not track damage from sources such as status ailments, fire spin, traps, ect. If it comes from a skill and is dealt in that moment, then it will most likely be tracked, but damage over time effects will not be tracked."
				}
			]
		},
		applyfunc(message, skill, args) {
			const dmgmult = parseFloat(args[0]);
			const turns = Math.max(parseInt(args[1]), 1);
			const chance = parseFloat(args[2]);

			if (dmgmult < 0) return void message.channel.send("I see no point in this.");
			if (chance < 0) return void message.channel.send("I see no point in this.");

			makeExtra(skill, "collapse", [dmgmult, turns, chance]);
			return true
		},
		ondamage(char, targ, dmg, skill, btl, vars) {
			if (targ.custom?.collapse) return;

			if (vars[2] >= 100 || (randNum(1, 1000)/10 <= vars[2])) {
				addCusVal(targ, "collapse", {
					name: skill.name,
					infname: char.name,
					multiplier: vars[0],
					turns: vars[1],
					dmg: dmg,
				});

				return `__${targ.name}__ was <:collapse:1290668933346623569>**Collapsed**!`;
			}
		},
		getinfo(vars, skill) {
			let txt = (vars[2] < 100 ? `${vars[2]}% chance to ` : "On hit, ") + `<:collapse:1290668933346623569>**Collapse** the foe, dealing ${vars[0]}✕ collective damage in ${vars[1]} turns`;
			return txt;
		}
	}),
}

// Make an Extra for a skill. "func" should be an array of 1-5 values indicating what the extra does.
makeExtra = (skill, extra, func) => {
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
applyExtra = (message, skill, skillExtra, rawargs, lb) => {
	if (!skill.extras) skill.extras = {};
	if (!skillExtra || !extrasList[skillExtra]) return void message.channel.send("You're adding an invalid extra! Use the ''listatkextras'' command to list all extras.");

	if (lb) {
		if (extrasList[skillExtra].apply(message, skill, rawargs.slice(3), extrasList[skillExtra].name)) {
			message.react('👍');
		} else {
			return false
		}
	} else {
		if (extrasList[skillExtra].apply(message, skill, rawargs, extrasList[skillExtra].name)) {
			message.react('👍');
		} else {
			return false
		}
	}

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
				useSkill(char, btl, vars[1], makeMelee(char, btl));
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
		toembed: "<:healverse:1004676931117129749>",
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
			inf.hp = Math.min(inf.maxhp, inf.hp+heal);

			return `__${vars.infname}__'s _${vars.name}_ allowed __${inf.name}__ to restore **${heal}**HP!`;
		}
	},

	revitaverse: {
		toembed: "<:revitaverse:1019325299067998260>",
		onturn(btl, char, vars) {
			vars.turns--;
			if (vars.turns <= 0) {
				killVar(char, "revitaverse");
				return `${vars.infname}'s ${vars.name} has worn off for ${char.name}!`;
			}

			return null;
		},
		onhit(btl, char, inf, dmg, vars) {
			let heal = Math.round((dmg/100)*vars.heal);
			inf.mp = Math.min(inf.maxmp, inf.mp+heal);

			return `__${vars.infname}__'s _${vars.name}_ allowed __${inf.name}__ to restore **${heal}${char.mpMeter ? char.mpMeter[1] : "MP"}**!`;
		}
	},

	powerverse: {
		toembed: "<:powerverse:1004676933109428294>",
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
		toembed: "<:spreadverse:1004676935126892574>",
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
						let thyAffinity 
						for (aff in char.affinities) {
							if (char.affinities[aff].includes(j)) {
								thyAffinity = aff;
								char.affinities[aff].splice(char.affinities[aff].indexOf(j), 1);
							}
						}

						if (i != 'normal' && !char.affinities[i])  char.affinities[i] = [];

						if (i != 'normal') {
							char.affinities[i].push(j);
						}

						text += `${char.name}'s ${affinityEmoji[thyAffinity]}**${thyAffinity}** affinity to ${elementEmoji[j]}**${j}** was restored to ${affinityEmoji[i]}**${i}**!\n`;

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
				killVar(char, 'revertBuffTurns');
			}

			if (text == '') return null;
			return text;
		}
	},

	revertBuffTurns: {
		onturn(btl, char, vars) {
			let text = ''

			if (!char?.custom?.buffTurns) {
				killVar(char, "revertBuffTurns");
				return null;
			}

			for (i in vars) {
				let wasPositive = vars[i][1] > 0;
				vars[i][1] += vars[i][1] > 0 ? -1 : 1;

				if (vars[i][1] == 0) vars[i] = ''
			}
			
			vars = vars.filter(x => x.length != 0);

			if (text == '') return null;
			return text;
		}
	},

	affinitypoint: {
		numeric: true
	},

	shield: {
		toembed(shield) {
			return statusEmojis[shield.type ?? "reduce"]
		},
		hardcoded: true
	},

	revert: {
		onturn(btl, char, vars) {
			if (char.custom?.revert) {
				char.custom.revert[0]--;

				let rev = char.custom.revert;
				if (rev[0] == 0) {
					if (char.mimic) delete char.mimic;
					if (char.transformed) delete char.transformed;

					for (let i in rev[1]) {
						if (char[i]) char[i] = rev[1][i];
					}

					let sotrue = rev[2];
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
		dmgmod(btl, char, inf, dmg, skill, vars, multiplier) {
			dmg = Math.round(dmg*vars[1]);

			let txt
			switch(vars[2].toLowerCase()) {
				case 'buff':
					addAtkMsg(btl, `${inf.name} set off the ${vars[0]}!\n${extrasList.buff.onuse(char, inf, skill, btl, ['target', vars[3], vars[4], vars[5], null], multiplier)}`);
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

						let settings = setUpSettings(btl.guild.id);

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
								killVar(char, 'trap');
								return void addAtkMsg(btl, txt);
						}

						inf.hp = Math.max(0, inf.hp-d);
						txt += `\n${inf.name} took ${d}${affinityTxt} damage from the trap!`;
					} else {
						txt += `\nBut ${inf.name} was able to evade the trap!\n${dodgeTxt(inf, char)}`
					}

					addAtkMsg(btl, txt);
					break;
			}

			killVar(char, 'trap');
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

					useSkill(inf, btl, act, char.custom.futuresight);
					killVar(char, 'futuresight');
					return '';
				}
			}
		}
	},

	charge: {
		toembed: "<:physical:973077052129423411>",
		statmod(btl, char, skill, vars) {
			if (vars.stat == 'crit' && skill.crit) {
				if (vars.mult >= 100)
					skill.crit = 9999;
				else
					skill.crit *= vars.mult;
			}
		},
		dmgmod(btl, char, inf, dmg, skill, vars, multiplier) {
			dmg = Math.round(modSkillResult(char, inf, dmg, skill, btl) / multiplier);
			if (vars.stat == 'phys' && (skill.atktype == 'physical' || skill.atktype == 'ranged')) {
				dmg = Math.round(dmg*vars.mult);
			} else if (vars.stat == 'mag' && (skill.atktype == 'magic' || skill.atktype == 'sorcery')) {
				dmg = Math.round(dmg*vars.mult);
			}
		},
		endturn(btl, char, vars) {
			if (!vars.toggle) {
				vars.toggle = true;
				return
			}
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

			skill.pow = Math.round(modSkillResult(char, char, skill.pow, skill, btl) * vars[2]);

			let attack = attackWithSkill(char, inf, skill, btl, true);
			return `__${char.name}__ struck back, with a stronger __${skill.name}__!\n${attack.txt}`;
		}
	},

	regenheal: {
		toembed(heal) { 
			let emojiTxt = ''

			for (user in heal) {
				for (i in heal[user]) {
					let curRegen = heal[user][i];

					if (curRegen.first && i != 0) break;

					let regenType = curRegen.type;

					switch(regenType) {
						case 'hp':
						case 'hppercent':
							emojiTxt += !emojiTxt.includes('<:hpregen:1019329492549902436>') ? '<:hpregen:1019329492549902436>' : '';
							break;
						case 'mp':
						case 'mppercent':
							emojiTxt += !emojiTxt.includes('<:mpregen:1019329489890713692>') ? '<:mpregen:1019329489890713692>' : '';
							break;
						case 'lb':
							emojiTxt += !emojiTxt.includes('<:lbregen:1019329487856488528>') ? '<:lbregen:1019329487856488528>' : '';
							break;
					}
				}
			}

			return emojiTxt
		},
		onturn(btl, char, vars) {
			if (char.custom?.regenheal) {
				let txt = '';

				for (heal in char.custom.regenheal) {
					for (i in char.custom.regenheal[heal]) {
						let curRegen = char.custom.regenheal[heal][i];

						if (curRegen.wait) {
							let prevHeal = char.custom.regenheal[heal][i-1];
							if (curRegen.first && i != 0 && (prevHeal.turns > 0 || prevHeal != '')) break;

							if (i != 0 && curRegen.first) {
								txt += `\n__${curRegen.username}__'s _${curRegen.name}_ started to take effect.`;
								delete curRegen.first;
							}

							if (isFinite(curRegen.wait)) curRegen.wait--;

							if (isFinite(curRegen.wait) && curRegen.wait > 0) continue;

							if (curRegen.wait > 0) continue;
							if (curRegen.wait === true || curRegen.wait == 0) delete curRegen.wait
						}

						let regenType = curRegen.type;

						if (curRegen?.decay && curRegen?.decay != 0) {
							if (!curRegen?.baseTurn) curRegen.baseTurn = curRegen.turns
							if (!curRegen?.baseHeal) curRegen.baseHeal = curRegen.heal

							curRegen.heal -= (curRegen.decayPercent ? (curRegen.baseHeal * curRegen.decay/100) : curRegen.decay) * (Math.min(1, curRegen.baseTurn - curRegen.turns))
						}

						let regenAmount = curRegen.heal;

						if (i != 0) txt += '\n';

						switch(regenType) {
							case 'hp':
							case 'mp':
								let heal = regenAmount + (-8+randNum(16));
								char[regenType] =  Math.max(Math.min(char[`max${regenType}`], char[regenType]+heal), 0);;
								txt += `__${char.name}__'s ${regenType == "hp" ? "HP" : (char.mpMeter ? char.mpMeter[1] : "MP")} was restored by **${heal}**!`;
								break;
			
							case 'hppercent':
								if (regenAmount >= 100) {
									char.hp = char.maxhp;
									txt += `__${char.name}__'s HP was _fully restored_!`;
								} else {
									let amount = Math.round((char.maxhp/100)*regenAmount);
			
									char.hp =  Math.max(Math.min(char.maxhp, char.hp+amount), 0);;
									txt += `__${char.name}__'s HP was restored by **${amount}**!`;
								}
								break;
			
							case 'mppercent':
								if (regenAmount >= 100) {
									char.mp = char.maxmp;
									txt += `__${char.name}__'s ${char.mpMeter ? char.mpMeter[1] : "MP"} was _fully restored_!`;
								} else {
									let amountm = Math.round((char.maxmp/100)*regenAmount);
			
									char.mp =  Math.max(Math.min(char.maxmp, char.mp+amountm), 0);;
									txt += `__${char.name}__'s ${char.mpMeter ? char.mpMeter[1] : "MP"} was restored by **${amountm}**!`;
								}
								break;
			
							case 'lb':
								char.lbp = Math.max(char.lbp + regenAmount, 0);
								txt += `__${char.name}__'s LB% was boosted by **${regenAmount}%**!`;
								break;
						}

						curRegen.turns--;
						if (curRegen.turns <= 0) {
							txt += `\n__${curRegen.username}__'s _${curRegen.name}_ wore off for __${char.name}__.\n`;
							char.custom.regenheal[heal][i] = ''
						}

						if (curRegen.pause > 0) curRegen.wait = curRegen.pause
					}

					char.custom.regenheal[heal] = char.custom.regenheal[heal].filter(x => x != '');
					if (char.custom.regenheal[heal].length == 0) delete char.custom.regenheal[heal]
				}
				
				if (Object.keys(char.custom.regenheal).length == 0) killVar(char, 'regenheal');

				return `${txt}\n`;
			}
		}
	},

	wishheal: {
		onturn(btl, char, vars) {
			if (char.custom?.wishheal) {
				char.custom.wishheal.turns--;
				if (char.custom.wishheal.turns <= 0) {
					let txt = "";
					let skill = vars.skill;
					let user = vars.user;

					for (let i in skill.heal) {
						if (!healList[i]) continue;
						if (!healList[i].onuse) continue;
						if (i.toLowerCase() == 'wish') continue;

						if (healList[i].multiple) {
							for (let k in skill.heal[i]) {
								txt += `\n${healList[i].onuse(user, char, skill, btl, skill.heal[i][k], skill.pow) ?? ''}`;
							}
						} else {
							txt += `\n${healList[i].onuse(user, char, skill, btl, skill.heal[i], skill.pow) ?? ''}`;
						}
					}

					killVar(char, 'wishheal');
					return txt;
				}
			}
		}
	},

	pinch: {
		toembed: "<:pinch:1004506376036429924>"
	},

	charges: {
		onturn(btl, char, vars) {
			let txt = ""
			for (const skill in vars) {
				const skillvars = vars[skill]
				const icharges = skillvars[0]
				if (icharges == skillvars[3])
					continue
				skillvars[0] += skillvars[1];
				skillvars[0] = Math.min((modSkillResult(char, char, parseFloat(skillvars[0]), skill, btl) * skillvars[4]).toFixed(2), skillvars[3])
				console.log(skill, skillvars[0], icharges)
				if (Math.floor(skillvars[0]) > icharges)
					txt += `${txt == "" ? "" : "\n"}${skillvars[2]} was recharged!`
			}
			return txt
		}
	},

	pacifyVars: {
		onturn(btl, char, vars) {
			let txt = ""

			for (pacify in vars) {
				let pacifyVar = vars[pacify];

				if (pacifyVar.turns !== true) pacifyVar.turns -= 1;

				if (pacifyVar.turns <= 0) {
					txt += `${txt == "" ? "" : "\n"}`
					txt += pacifyVar.revert ?? '';
					delete vars[pacify];
				}
			}

			if (Object.keys(vars).length == 0) delete char.custom.pacifyVars;

			return txt;
		}
	},

	link: {
		onturn(btl, char, v) {
			let txt = '';
			for (let i in v) {
				let vars = v[i];

				if (!char.attacked) {
					delete char.custom.link[i];
					txt += `${vars.username}'s ${vars.skilldefs.name} has worn off for ${char.name}!\n`;
				}
			}

			delete char.attacked;
			return txt;
		},
		onhit(btl, char, inf, dmg, v, skill) {
			let txt = '';
			for (let i in v) {
				let vars = v[i];

				if (vars.notthisskill) {
					delete vars.notthisskill;
					continue;
				}

				if (skill.target === 'one' || skill.target === 'ally' || skill.target === 'caster') {
					let linkatk = attackWithSkill(inf, char, vars.skilldefs, btl, null, ["link", "damage"], ["link", "damage"]);
					txt += `__${vars.username}__'s _${vars.skilldefs.name}_ strikes! ${linkatk.txt}\n`;
					if (!--vars.uses) {
						delete char.custom.link[i];
						txt += `${vars.username}'s ${vars.skilldefs.name} has worn off for ${char.name}!\n`;
					}
				}
			}

			char.attacked = true;
			return txt;
		}
	},

	flinch: {
		toembed: "<:warning:878094052208296007>",
		onturn(btl, char, vars) {
			return `__${char.name}__ flinched and was unable to move!`;
		}
	},

	evasionstate: {
		hardcoded: true,
		toembed: "<:boot:995268449154629699>",
		onturn(btl, char, vars) {
			if (char.custom?.evasionstate) {
				let txt = '';
				if (!char.custom.evasionstate.canact)
					txt = `In an evasive state, __${char.name}__ could not act.`;

				char.custom.evasionstate.turns--;
				if (char.custom.evasionstate.turns <= 0)
					killVar(char, 'evasionstate');

				return txt;
			}
		}
	},

	simplebeam: {
		onturn(btl, char, v) {
			let txt = '';
			for (let i in v) {
				let vars = v[i];

				vars[1]--;
				if (vars[1] <= 0) {
					char.skills.splice(vars[0], 1);
					txt += `${char.name} no-longer has ${vars[2]}.`;
				}
			}

			v = v.filter(x => x[1] > 0);
			if (v.length == 0) killVar(char, "simplebeam");

			if (txt == '') return null;
			return txt;
		}
	},

	disable: {
		onturn(btl, char, v) {
			if (char.custom?.disable) {
				char.custom.disable[1]--;
				if (char.custom.disable[1] <= 0) {
					let txt = `${char.name} is now able to use ${skillFile[char.custom.disable[0]].name}!`;
					killVar(char, "disable");
					return txt;
				}
			}
		}
	},

	firespin: {
		toembed: "<:firespin:1225496120285855765>",
		onturn: function(btl, char, v) {
			char.hp = Math.max(0, char.hp-v.damage);

			let txt = `__${char.name}__ took **${v.damage}** damage from __${v.infname}__'s _${v.name}_`

			if (char.hp <= 0)
				txt += " and was defeated!";
			else {
				if (v.immobilize)
					txt += " and is immobilized!"
				else
					txt += "!"
			}

			if (char.custom?.firespin) {
				char.custom.firespin.turns--;
				if (char.custom?.firespin.turns <= 0) {
					txt += `\n__${char.name}__ broke free!`;
					killVar(char, "firespin");
				}
			}

			return txt;
		}
	},

	sensitive: {
		onhit(btl, char, inf, dmg, v, skill) {
			if (dmg > 0) {
				let txt = '';

				for (let num in v) {
					txt += extrasList.buff.buffChange(inf, char, skill, btl, ["target", "random", -1, 100], null) + '\n'
				}

				return txt;
			}
		}
	},

	deathmark: {
		toembed: "<:deathmark:1290660187413282906>",
		dmgmod(btl, char, inf, dmg, skill, vars, emotes) {
			return [null, Math.round(dmg*vars.multiplier), "<:deathmark:1290660187413282906>"]
		},
		endturn(btl, char, vars) {
			if (char.custom?.deathmark) {
				char.custom.deathmark.turns--;
				if (char.custom.deathmark.turns <= 0) {
					let txt = `${char.name} is no longer marked.`;
					killVar(char, "deathmark");
					return txt;
				}
			}
		}
	},

	collapse: {
		toembed: "<:collapse:1290668933346623569>",
		dmgmod(btl, char, inf, dmg, skill, vars, emotes) {
			if (char.custom?.collapse) char.custom.collapse.dmg += dmg;
		},
		endturn(btl, char, vars) {
			if (char.custom?.collapse) {
				char.custom.collapse.turns--;
				if (char.custom.collapse.turns <= 0) {
					let txt = `${char.name} is struck with <:collapse:1290668933346623569>**Collapsing** energy!`;
					let dmg = Math.round(char.custom.collapse.dmg*char.custom.collapse.multiplier);
					char.hp -= Math.max(0, dmg);

					if (char.hp <= 0) {
						txt += `\n${char.name} took <:collapse:1290668933346623569>**${dmg}** damage and was defeated!`;
					} else {
						txt += `\n${char.name} took <:collapse:1290668933346623569>**${dmg}** damage!`;
					}

					killVar(char, "collapse");
					return txt;
				}
			}
		}
	},
}