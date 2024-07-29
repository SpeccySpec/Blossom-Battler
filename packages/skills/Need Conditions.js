needConditions = {
	meter: new Extra({
		name: "Meter",
		desc: `Checks for the amount of meter needed to proceed.\n\n-# Viable meters: *${costTypes.join(', ').replace('lbpercent, ', '')}, level.*`,
		args: [
			{
				name: "Meter",
				type: "Word",
				forced: true,
			},
			{
				name: "Value",
				type: "Decimal",
				forced: true,
			},
			{
				name: "Less/More",
				type: "Word",
				forced: true,
			},
			{
				name: "Equal?",
				type: "YesNo",
			},
		],
		applyfunc(message, skill, params) {
			let meter = params[0]
			let value = params[1]
			let less = params[2]
			let equal = params[3] = params[3] ?? false

			//Meter Types
			if (!([...costTypes, 'level'].filter(x => x != 'lbpercent')).includes(meter)) return void message.channel.send(`You entered an invalid meter to use! It can be:\n- ${costTypes.join("\n- ").replace("\n- lbpercent", "")}\n- level`);
			//Less/More
			if (less != "less" && less != "more") return void message.channel.send("You specify if the condition needs to be less or more of something, not whatever you said.");

			if (['mp','hp','hpandmp','lb','money','level'].includes(meter)) { //Check if meter accepts decimals or not
				value = truncNum(value,0);

				if (value <= 0)
				{
					if (less == 'less') {
						if (equal) value = 0
						else return void message.channel.send("You can't need less than 0! You can make it be equal 0 tho.");

						if (['hp', 'hpandmp'].includes(meter)) return void message.channel.send("You would have to die in order to use this to its fullest! This doesn't make any sense.");
					}

					if (less == 'more' && value < 0) value = 0
				}
			} else {
				if (value <= 0)
				{
					if (less == 'less') {
						if (equal) value = 0
						else return void message.channel.send("You can't need less than 0%! You can make it be equal 0% tho.");

						if (['hp', 'hpandmp'].includes(meter)) return void message.channel.send("You would have to die in order to use this to its fullest! This doesn't make any sense.");
					}

					if (less == 'more' && value < 0) value = 0
				}
				if (value >= 100)
				{
					if (less == 'more') {
						if (equal) value = 100
						else return void message.channel.send(`You can't need more than 100%! You can make it be equal 100% though.`);
					}

					if (less == 'less' && value > 100) value = 100
				}
			}

			params[1] = value

			return params
		},
		check(target, skill, btl, vars, isSkillAffected, team) {
			let meter = vars[3]
			let value = vars[4]
			let less = vars[5]
			let equal = vars[6]

			let check = less == 'less' ? '<' : '>';
			if (equal) check += '=';

			let applyOperator = new Function('a', 'b', `return a ${check} b;`);

			let lessText = `${less} ${equal ? 'or equal to' : 'than'}`
			if (['mp','hp','hpandmp','lb','money','level'].includes(meter)) {
				if (value <= 0 && less == 'less') lessText = 'exactly'
			} else {
				if ((value <= 0 && less == 'less') || (value >= 100 && less == 'more')) lessText = 'exactly'
			}

			switch(meter) {
				case 'level':
					if (!applyOperator(target.level, value)) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					break;
				case 'hp':
					if (!applyOperator(target.hp, value)) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					break;
				case 'mp':
					if (!applyOperator(target.mp, value)) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					break;
				case 'hppercent':
					if (!applyOperator((target.hp/target.maxhp)*100, value)) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					break;
				case 'mppercent':
					if (!applyOperator((target.mp/target.maxmp)*100, value)) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					break;
				case 'hpandmp':
					if (!applyOperator(target.hp, value) || !applyOperator(target.mp, value)) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					break;
				case 'hpandmppercent':
					if (!applyOperator((target.hp/target.maxhp)*100, value) || !applyOperator((target.mp/target.maxmp)*100, value)) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					break;
				case 'money':
					if (!applyOperator(team.currency, value) || !team.currency) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					break;
				case 'moneypercent':
					if (!applyOperator((team.currency/team.maxcur)*100, value) || !team.currency) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					break;
				case 'lb':
					if (!applyOperator(target.lbpercent, value)) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					break;
			}

			return true;
		},
		getinfo(filteredVars) {
			let lessText = ``

			let meter = filteredVars[3]
			let value = filteredVars[4]
			let less = filteredVars[5]
			let equal = filteredVars[6]

			if (meter == "level") text += `the ${filteredVars[1]}'s level to be `

			lessText = `${less} ${equal ? 'or equal to' : 'than'}`

			if (['mp','hp','hpandmp','lb','money','level'].includes(meter)) {
				if (value <= 0 && less == 'less') lessText = 'exactly'
			} else {
				if ((value <= 0 && less == 'less') || (value >= 100 && less == 'more')) lessText = 'exactly'
			}

			lessText += ` ${value}`

			switch(meter) {
				case "hp":
					lessText += ` of the ${filteredVars[1]}'s HP`;
					break;
				case "hpandmp":
					lessText += ` of the ${filteredVars[1]}'s HP and MP`;
					break;
				case "hppercent":
					lessText += `% of the ${filteredVars[1]}'s Max HP`;
					break;
				case "mppercent":
					lessText += `% of the ${filteredVars[1]}'s Max MP`;
					break;
				case "hpandmppercent":
					lessText += `% of the ${filteredVars[1]}'s Max MP and Max HP`;
					break;
				case "money":
					lessText += ` of the ${filteredVars[1]} team's currency`;
					break;
				case "moneypercent":
					lessText += `% of the ${filteredVars[1]} team's currency`;
					break;
				case "lb":
					lessText += ` of the ${filteredVars[1]}'s LB`;
					break;
				case "level":
					break;
				default:
					lessText += ` of the ${filteredVars[1]}'s MP`;
			}
			
			return lessText
		}
	}),

	mainelement: new Extra({
		name: "Main Element",
		desc: `Checks for the kind of main element needed to proceed.\n\n-# <Type> can be either: "Single" - for single mains, and "Dual" - for dual mains, "Primary" and "Secondary" - for placement with dual element mains, and "Either" - with every case.\n\n-# Only non-viable element is ${elementEmoji['almighty']}almighty.`,
		args: [
			{
				name: "Type",
				type: "Word",
				forced: true,
			},
			{
				name: "Should Match?",
				type: "YesNo",
				forced: true,
			},
			{
				name: "Elements",
				type: "Word",
				forced: true,
				multiple: true
			}
		],
		applyfunc(message, skill, params) {
			let elemType = params[0]
			let shouldBe = params[1]
			let mElements = params.slice(2)

			if (!['single', 'dual', 'primary', 'secondary', 'either'].includes(elemType)) return void message.channel.send("That's not the correct type of main element you can apply. You can choose: single, dual, primary, secondary and either.");

			if (mElements.some(x => !Elements.includes(x))) return void message.channel.send(`The elements that are not elements themselves are: ${mElements.filter(x => !Elements.includes(x)).join(', ')}.`);

			if (mElements.some(x => x == 'almighty')) return void message.channel.send(`You included almighty, which is not viable. Please remove it.`);

			return params
		},
		check(target, skill, btl, vars, isSkillAffected, team) {
			let elemType = vars[3]
			let shouldBe = vars[4]
			let mElements = vars.slice(5)

			let applyOperator = new Function('a', `return ${shouldBe ? '' : '!'}["${mElements.join(`", "`)}"].includes(a);`);

			switch (elemType) {
				case 'single':
					if (!applyOperator(target.mainElement)) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					break;
				case 'dual':
					if (!applyOperator(target.mainElement[0]) || !applyOperator(target.mainElement[1])) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					break;
				case 'primary':
					if (!applyOperator(target.mainElement[0])) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					break;
				case 'secondary':
					if (!applyOperator(target.mainElement[1])) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					break;
				case 'either':
					if ((typeof target.mainElement === "string" && !applyOperator(target.mainElement)) || (typeof target.mainElement === "object" && (!applyOperator(target.mainElement[0]) || !applyOperator(target.mainElement[1])))) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					break;
			}

			return true;
		},
		getinfo(filteredVars) {
			let lessText = ``

			let elemType = filteredVars[3]
			let shouldBe = filteredVars[4]
			let mElements = filteredVars.slice(5)

			lessText += `the ${filteredVars[1]}'s `

			switch (elemType) {
				case "single": lessText += 'single main element '; break;
				case "dual": lessText += 'dual main element '; break;
				case "primary": lessText += 'primary dual main element '; break;
				case "secondary": lessText += 'secondary dual main element '; break;
				case "either": lessText += 'main element '; break;
			}

			lessText += `to ${shouldBe ? '' : 'not'} ${ ['dual', 'either',].includes(elemType) ? 'contain' : 'be'} ${mElements.length > 1 ? "either " : ""}`

			for (el in mElements) {
				lessText += `${elementEmoji[mElements[el]]}${mElements[el]}`

				if (el < mElements.length - 2) lessText += ', ';
				else if (el == mElements.length - 2) lessText += ' or ';
			}
			
			return lessText
		}
	}),

	turn: new Extra({
		name: "Turn",
		desc: `Checks for what the current battle turn should be to proceed.\n\n-# The turn number for either cannot be 1 or lower.\n\n-# Here, <User/Target> doesn't have much significance.`,
		args: [
			{
				name: "Below/Above/Every",
				type: "Word",
				forced: true,
			},
			{
				name: "Turn Number",
				type: "Num",
				forced: true,
			},
		],
		applyfunc(message, skill, params) {
			let turnType = params[0]
			let turnCounter = params[1]

			if (!['below', 'above', 'every'].includes(turnType)) return void message.channel.send("That's not the correct type of turn passage you can apply. It's either below, above or every.");

			if (turnCounter <= 1) return void message.channel.send("That's redundant.");

			return params
		},
		check(target, skill, btl, vars, isSkillAffected, team) {
			let turnType = vars[3]
			let turnCounter = vars[4]

			switch (turnType) {
				case 'below':
					if (btl.turn < turnCounter) return true;
					break;
				case 'above':
					if (btl.turn > turnCounter) return true;
					break;
				case 'every':
					if (btl.turn % turnCounter == 0) return true;
					break;
			}

			return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
		},
		getinfo(filteredVars) {
			let lessText = ``

			let turnType = filteredVars[3]
			let turnCounter = filteredVars[4]

			switch (turnType) {
				case "below": lessText += `the turn count to be below ${turnCounter}`; break;
				case "above": lessText += `the turn count to be above ${turnCounter}`; break;
				case "every": lessText += `the skill to be used every ${turnCounter} turns`; break;
			}
			
			return lessText
		}
	}),

	battlecondition: new Extra({
		name: "Battle Condition",
		desc: `Checks for the weather or terrain the fighters need to be in to proceed.\n\n-# <Types> can be any valid weather or terrain. None counts as well.\n\n-# Here, <User/Target> doesn't have much significance.`,
		args: [
			{
				name: "Weather/Terrain",
				type: "Word",
				forced: true,
			},
			{
				name: "Should Match?",
				type: "YesNo",
				forced: true,
			},
			{
				name: "Types/None",
				type: "Word",
				forced: true,
				multiple: true
			},
		],
		applyfunc(message, skill, params) {
			let battleCond = params[0]
			let shouldBeW = params[1]
			let mConds = params.slice(2)

			if (!['weather', 'terrain'].includes(battleCond)) return void message.channel.send("That's not the correct type of battle condition.");

			if (battleCond == 'weather') {
				if (mConds.some(x => !weathers.includes(x))) return void message.channel.send(`The weathers that are not weathers themselves are: ${mConds.filter(x => !weathers.includes(x)).join(', ')}.`);
			} else {
				if (mConds.some(x => !terrains.includes(x))) return void message.channel.send(`The terrains that are not terrains themselves are: ${mConds.filter(x => !terrains.includes(x)).join(', ')}.`);
			}

			return params
		},
		check(target, skill, btl, vars, isSkillAffected, team) {
			let battleCond = vars[3]
			let shouldBeW = vars[4]
			let mConds = vars.slice(5)

			let applyOperator = new Function('a', `return ${shouldBeW ? '' : '!'}["${mConds.join(`", "`)}"].includes(a);`);

			switch (battleCond) {
				case 'weather':
					if (mConds.includes('none')) {
						if ((shouldBeW && !btl?.weather) || (!shouldBeW && btl?.weather)) return true

						if (mConds.length == 1) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					}

					if (!applyOperator(btl?.weather?.type)) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					
					break;
				case 'terrain':
					if (mConds.includes('none')) {
						if ((shouldBeW && !btl?.terrain) || (!shouldBeW && btl?.terrain)) return true

						if (mConds.length == 1) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
					}

					if (!applyOperator(btl?.terrain?.type)) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;

					break;
			}

			return true;
		},
		getinfo(filteredVars) {
			let lessText = ``

			let battleCond = filteredVars[3]
			let shouldBeW = filteredVars[4]
			let mConds = filteredVars.slice(5)

			lessText += `the ${battleCond} to ${shouldBeW ? '' : 'not'} be ${mConds.length > 1 ? 'either' : ''} `

			for (el in mConds) {
				lessText += `${(battleCond == 'weather' ? weatherDescs : terrainDescs)[mConds[el]].emoji}${mConds[el]}`

				if (el < mConds.length - 2) lessText += ', ';
				else if (el == mConds.length - 2) lessText += ' or ';
			}
			
			return lessText
		}
	}),

	partycount: new Extra({
		name: "Party Count",
		desc: `Checks for the amount of alive or dead team members to proceed.\n\n-# "Exact" option is stationary, but "Percentage" is modular.\n\n-# You can't choose more than 16 with "Exact" numbers due to the Team Size limit. Clones and reincarnates are disregarded when checking.\n\n-# {Equal} does not matter if want the precise amount instead of a range.`,
		args: [
			{
				name: "Exact/Percentage",
				type: "Word",
				forced: true,
			},
			{
				name: "More/Less/Exact",
				type: "Word",
				forced: true,
			},
			{
				name: "Equal?",
				type: "YesNo",
				forced: true,
			},
			{
				name: "Amount",
				type: "Decimal",
				forced: true,
			},
			{
				name: "Should be alive?",
				type: "YesNo",
				forced: true,
			},
		],
		applyfunc(message, skill, params) {
			let countType = params[0]
			let countMore = params[1]
			let countEqual = params[2]
			let countNum = params[3]
			let countDead = params[4]
			
			if (countType != "exact" && countType != "percentage") return void message.channel.send(`You entered an invalid count type to use! It can be either exact, or percentage.`);

			if (countMore != "less" && countMore != "more" && countMore != "exact") return void message.channel.send("You specify if the condition needs to be less, more or exactly something, not whatever you said.");

			countNum = countType == 'exact' ? truncNum(params[3], 0) : params[3]

			if (countType == "exact") {
				if (countNum <= 1)
				{
					if (countMore == 'less') {
						if (countEqual) countNum = 1
						else return void message.channel.send("You can't need less than 1 party member! You can make it be equal 1 tho.");
					} else if (countMore == 'exact' && countNum <= 0) return void message.channel.send("You can't need less than 1 party member!");

					if (countMore == 'more' && countNum < 1) countNum = 1
				}

				if (countNum >= 16)
				{
					if (countMore == 'more') {
						if (countEqual) countNum = 16
						else return void message.channel.send("You can't need more than 16 party members! You can make it be equal 16 tho.");
					} else if (countMore == 'exact' && countNum >= 17) return void message.channel.send("You can't need more than 16 party members!");

					if (countMore == 'less' && countNum > 16) countNum = 16
				}
			} else {
				if (countNum <= 0)
				{
					if (countMore == 'less' || countMore == 'exact') return void message.channel.send("You can't need 0% or less of party members!");
					
					if (countMore == 'more' && countNum < 0) countNum = 0
				}

				if (countNum >= 100)
				{
					if (countMore == 'more') {
						if (countEqual) countNum = 100
						else return void message.channel.send("You can't need more than 100% of party members! You can make it be equal too 100% tho.");
					}
					
					if ((countMore == 'exact' || countMore == 'less') && countNum > 100) countNum = 100
				}
			}

			params[3] = countNum

			return params
		},
		check(target, skill, btl, vars, isSkillAffected, team) {
			let countType = vars[3]
			let countMore = vars[4]
			let countEqual = vars[5]
			let countNum = vars[6]
			let countDead = vars[7]

			let check = countMore == 'less' ? '<' : (countMore == 'more' ? '>' : '==');
			if (countEqual && countMore != 'exact') check += '=';

			let applyOperator = new Function('a', 'b', `return a ${check} b;`);

			let noCloneTeam = team.members.filter(x => !x.clone && !x.reincarnate)
			let countedTeam = noCloneTeam.filter(x => (countDead ? (x.hp > 0) : (x.hp <= 0))).length

			if (!applyOperator(countType == "exact" ? (countedTeam) : (countedTeam/noCloneTeam.length * 100), countNum)) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;

			return true;
		},
		getinfo(filteredVars) {
			let lessText = ``

			let countType = filteredVars[3]
			let countMore = filteredVars[4]
			let countEqual = filteredVars[5]
			let countNum = filteredVars[6]
			let countDead = filteredVars[7]

			lessText += `${countMore == 'exact' ? "" : `${countMore}${countEqual ? " or equal to" : " than"} ${countNum}${countType == 'percentage' ? '%' : ''} of the ${filteredVars[1]} team's members to be ${countDead ? 'alive' : 'dead'}`}`
			
			return lessText
		}
	}),

	buff: new Extra({
		name: "Buff",
		desc: `Checks for the amount of buffs or debuffs on a fighter's stat to proceed.\n\n-# Allowed stats are: ATK, MAG, PRC, END, AGL & CRIT. All and Random are allowed too.\n\n-# With stages, the range is 0-3. 4 is allowed but it will severely limit it to ${elementEmoji['support']}support mains only.`,
		args: [
			{
				name: "Stat",
				type: "Word",
				forced: true,
			},
			{
				name: "More/Less/Exact",
				type: "Word",
				forced: true,
			},
			{
				name: "Equal?",
				type: "YesNo",
				forced: true,
			},
			{
				name: "Stages",
				type: "Num",
				forced: true,
			},
		],
		applyfunc(message, skill, params) {
			let stat = params[0]
			let moreless = params[1]
			let equal = params[2]
			let amount = params[3]

			if (!["atk", "mag", "end", "prc", "agl", "crit", "all", "random"].includes(stat)) return void message.channel.send("That's not a valid stat! You can buff ATK, MAG, END, PRC, AGL, CRIT, all and random");

			if (moreless != "less" && moreless != "more" && moreless != "exact") return void message.channel.send("You specify if the condition needs to be less, more or exactly something, not whatever you said.");

			if (Math.abs(amount) >= 4) {
				if ((moreless == 'more' && amount >= 4) || (moreless == 'less' && amount <= -4)) {
					if (countEqual) amount = (amount < 0 ? -4 : 4) 
					else return void message.channel.send("The amount of stages can't exceed 4! You can make it be equal 4 tho.");
				} else if (moreless == 'exact' && Math.abs(amount) >= 5) return void message.channel.send("The amount of stages can't exceed 4!");

				if ((moreless == 'less' && amount > 4) || (moreless == 'more' && amount < -4)) amount = (amount > 0 ? 4 : -4) 
			}

			return params
		},
		check(target, skill, btl, vars, isSkillAffected, team) {
			let stat = vars[3]
			let moreless = vars[4]
			let equal = vars[5]
			let amount = vars[6]

			let check = moreless == 'less' ? '<' : (moreless == 'more' ? '>' : '==');
			if (equal && moreless != 'exact') check += '=';

			let applyOperator = new Function('a', 'b', `return a ${check} b;`);

			if (stat == 'random') stat = [['atk', 'mag', 'prc', 'end', 'agl', 'crit'][Math.floor(Math.random()*5.999)]]
			else if (stat == "all") stat = ['atk', 'mag', 'prc', 'end', 'agl', 'crit']
			else stat = [stat]

			for (s in stat) {
				if (!applyOperator(target.buffs[stat[s]], amount)) return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
			}

			return true;
		},
		getinfo(filteredVars) {
			let lessText = ``

			let stat = filteredVars[3]
			let moreless = filteredVars[4]
			let equal = filteredVars[5]
			let amount = filteredVars[6]

			lessText += `${stat == 'all' ? 'all of ' : ''}the ${filteredVars[1]}'s `
			lessText += `${(stat != 'random' && stat != 'all') ? `${statusEmojis[`${stat}${amount<0?'down':'up'}`]} ${stat.toUpperCase()}` : (stat == 'random' ? 'random' : '')}${stat == 'all' ? ' stats' : ' stat'} to `

			if (amount == 0 && moreless == 'exact') lessText += 'not be changed'
			else {
				lessText += 'be '

				if (amount == 0 && moreless == 'more') lessText += `buffed${equal ? ' or not changed' : ''}`
				if (amount == 0 && moreless == 'less') lessText += `debuffed${equal ? ' or not changed' : ''}`

				if (amount > 0 && moreless == 'exact') lessText += `buffed by ${amount} stage${Math.abs(amount) > 1 ? 's' : '' }`
				if (amount > 0 && moreless == 'more') lessText += `buffed by more ${equal ? 'or equal to ' : 'than '}${amount} stage${Math.abs(amount) > 1 ? 's' : '' }`
				if (amount > 0 && moreless == 'less') lessText += `buffed by less ${equal ? 'or equal to ' : 'than '}${amount} stage${Math.abs(amount) > 1 ? 's' : '' } or debuffed`

				if (amount < 0 && moreless == 'exact') lessText += `debuffed by ${Math.abs(amount)} stage${Math.abs(amount) > 1 ? 's' : '' }`
				if (amount < 0 && moreless == 'more') lessText += `debuffed by less ${equal ? 'or equal to ' : 'than '}${Math.abs(amount)} stage${Math.abs(amount) > 1 ? 's' : '' } or buffed`
				if (amount < 0 && moreless == 'less') lessText += `debuffed by more ${equal ? 'or equal to ' : 'than '}${Math.abs(amount)} stage${Math.abs(amount) > 1 ? 's' : '' }`
			}

			return lessText
		}
	}),

	status: new Extra({
		name: "Status",
		desc: `Checks for the status effect inflicted on a fighter to proceed.\n\n-# All status effects are allowed, but there are extra options:\n-# - "positive", "neutral" & "negative" - for the overall effect of the status\n-# - "physical", & "mental" - for if it affects the body or the mind\n-# - "non-stackable", & "stackable" - for if the status stacks\n-# - "none" - for if the fighter has no status`,
		args: [
			{
				name: "Should Match?",
				type: "YesNo",
				forced: true,
			},
			{
				name: "Types/None",
				type: "Word",
				forced: true,
				multiple: true
			},
		],
		applyfunc(message, skill, params) {
			let shouldBe = params[0]
			let statuses = params.slice(1);

			if (statuses.some(x => !['positive', 'neutral', 'negative', 'mental', 'physical', 'non-stackable', 'stackable', 'none'].includes(x) && !statusEffects.includes(x))) return void message.channel.send(`The types that are not correct are: ${statuses.filter(x => !['positive', 'neutral', 'negative', 'mental', 'physical', 'non-stackable', 'stackable', 'none'].includes(x) && !statusEffects.includes(x))}.`);

			return params
		},
		check(target, skill, btl, vars, isSkillAffected, team) {
			let shouldBe = vars[3]
			let statuses = vars.slice(4);

			let applyOperator = new Function('a', `return ${shouldBe ? '' : '!'}a;`);
			
			for(s in statuses) {
				if (target.status == statuses[s] || target[statuses[s]]) return true

				switch (statuses[s]) {
					case 'none':
						if (applyOperator(!target?.status || !statusEffects.some(x => target?.[x]))) return true
						break;
					case 'stackable':
						if (applyOperator(statusEffects.some(x => target?.[x]))) return true;
						break;
					case 'non-stackable':
						if (applyOperator(!statusEffects.some(x => target?.[x]))) return true;
						break;
					case 'physical':
						if (applyOperator((target?.status && isPhysicalStatus(target?.status)) || statusEffects.some(x => target?.[x] && isPhysicalStatus(x)))) return true;
						break;
					case 'mental':
						if (applyOperator((target?.status && !isPhysicalStatus(target?.status)) || statusEffects.some(x => target?.[x] && !isPhysicalStatus(x)))) return true;
						break;
					case 'positive':
						if (applyOperator((target?.status && isPositiveStatus(target?.status)) || statusEffects.some(x => target?.[x] && isPositiveStatus(x)))) return true;
						break;
					case 'neutral':
						if (applyOperator((target?.status && isNeutralStatus(target?.status)) || statusEffects.some(x => target?.[x] && isNeutralStatus(x)))) return true;
						break;
					case 'negative':
						if (applyOperator((target?.status && (!isPositiveStatus(target?.status) && !isNeutralStatus(target?.status))) || statusEffects.some(x => target?.[x] && (!isPositiveStatus(x) && !isNeutralStatus(x))))) return true;
						break;
				}
			}

			return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
		},
		getinfo(filteredVars) {
			let lessText = `the ${filteredVars[1]} to`

			let shouldBe = filteredVars[3]
			let statuses = filteredVars.slice(4);
			let statusesWithoutNone = statuses.filter(x => x != 'none')

			if (statuses.includes('none'))
				lessText += ` ${shouldBe ? "not " : ""}be inflicted with a status ailment${statusesWithoutNone.length > 0 ? ", or" : ""}`

			if (statusesWithoutNone.length > 0) lessText += ` be ${shouldBe ? "" : "not "} inflicted with${statusesWithoutNone.length > 1 ? " either" : ""}: `
			for (i in statusesWithoutNone) {
				if (statusEffects.includes(statusesWithoutNone[i])) lessText += `${statusEmojis[statusesWithoutNone[i]]} ${statusNames[statusesWithoutNone[i]]}`

				switch (statusesWithoutNone[i]) {
					case 'none':
						break;
					case 'positive':
						lessText += 'a <:positive:1225860207964585994> positive ailment'
						break;
					case 'neutral':
						lessText += 'a <:neutral:1225860206429208746> neutral ailment'
						break;
					case 'negative':
						lessText += 'a <:negative:1225860204118413435> negative ailment'
						break;
					case 'mental':
						lessText += 'a <:mental:1004855144745291887> mental ailment'
						break;
					case 'physical':
						lessText += 'a <:physical:973077052129423411> physical ailment'
						break;
					case 'stackable':
						lessText += 'a stackable ailment'
						break;
					case 'non-stackable':
						lessText += 'a non-stackable ailment'
						break;
				}

				if (i < statusesWithoutNone.length - 2) lessText += ', ';
				else if (i == statusesWithoutNone.length - 2) lessText += ' or ';
			}

			return lessText
		}
	}),

	affinity: new Extra({
		name: "Affinity",
		desc: `Checks for the affinity to an element or status effect from a fighter to proceed.\n\n-# With affinities the strongest ones are ${affinityEmoji['repel']} repel and ${affinityEmoji['drain']} drain, both of equal priority.\n\n-# Most elements and ailments are allowed, except for ${elementEmoji['almighty']} almighty, ${elementEmoji['support']} support, ${elementEmoji['heal']} heal, ${elementEmoji['passive']} passive & ${statusEmojis['dispelled']} dispelled.\n-# There are ailments that you can only check for ${affinityEmoji['normal']} normal and ${affinityEmoji['block']} block, such as: ${statusEmojis['infatuation']} infatuation, ${statusEmojis['confusion']} confusion, ${statusEmojis['drenched']} drenched, ${statusEmojis['stagger']} stagger, ${statusEmojis['grassimped']} grassimped, ${statusEmojis['dizzy']} dizzy & ${statusEmojis['guilt']} guilt.`,
		args: [
			{
				name: "Weaker/Stronger/Exact",
				type: "Word",
				forced: true,
			},
			{
				name: "And Exact?",
				type: "YesNo",
				forced: true,
			},
			{
				name: "Affinity",
				type: "Word",
				forced: true,
			},
			{
				name: "Elements/Status Ailments",
				type: "Word",
				forced: true,
				multiple: true
			},
		],
		applyfunc(message, skill, params) {
			let strength = params[0]
			let exact = params[1]
			let aff = params[2]
			let stel = params.slice(3)

			if (strength != "weaker" && strength != "stronger" && strength != "exact") return void message.channel.send("You specify the comparison method: weaker, stronger or exact, not whatever you said.");

			if (![...Affinities, 'deadly', 'normal'].includes(aff)) return void message.channel.send("That's not a valid affinity!");

			if ((aff == 'repel' || aff == 'drain') && !exact && strength == 'stronger') return void message.channel.send("You can't check for any stronger affinity than that without making it equal!");
			if (aff == 'deadly' && !exact && strength == 'weaker') return void message.channel.send("You can't check for any weaker affinity than that without making it equal!");

			if (stel.some(x => !Elements.includes(x) && !statusEffects.includes(x))) return void message.channel.send(`The elements or ailments that are not correct are: ${stel.filter(x => !Elements.includes(x) && !statusEffects.includes(x))}.`);

			if (stel.some(x => ['dispelled', 'almighty', 'support', 'heal', 'passive'].includes(x))) return void message.channel.send(`You put either: almighty, support, heal, passive or dispelled, which are valid but cannot have an affinity to. They're not allowed.`);

			if (stel.some(x => ['infatuation', 'confusion', 'drenched', 'stagger', 'grassimped', 'dizzy', 'guilt'].includes(x))) {
				let problemArray = stel.filter(x => ['infatuation', 'confusion', 'drenched', 'stagger', 'grassimped', 'dizzy', 'guilt'].includes(x))
				let problemtxt = ``

				if (((aff == 'repel' || aff == 'drain') && strength != 'weaker') || (aff == 'block' && strength == 'stronger' && !exact)) problemtxt = `${problemArray.length == 1 ? "It" : 'They'} cannot have an affinity stronger than a block.`
				
				if (aff == 'resist' && strength == 'exact') problemtxt = `${problemArray.length == 1 ? "It" : 'They'} cannot be resisted.`

				if (((aff == 'weak' || aff == 'superweak' || aff == 'deadly') && strength != 'stronger') || (aff == 'normal' && strength == 'weaker' && !exact)) problemtxt = `${problemArray.length == 1 ? "It" : 'They'} cannot have an affinity weaker than a normal.`

				if (problemtxt !== '') return void message.channel.send(`You have put in ${problemArray.join(', ')}, which ${problemArray.length == 1 ? "is" : 'are'} valid. But there is a problem when it comes to ${problemArray.length == 1 ? "it" : 'them'}. ` + problemtxt)
			}
			return params
		},
		check(target, skill, btl, vars, isSkillAffected, team) {
			let strength = vars[3]
			let exact = vars[4]
			let aff = vars[5]
			let stel = vars.slice(6)

			let settings = setUpSettings(btl.guild.id);
			let affinityIndex = {
				deadly: 0,
				superweak: 1,
				weak: 2,
				normal: 3,
				resist: 4,
				block: 5,
				repel: 6,
				drain: 6,
			}

			let check = strength == 'weaker' ? '<' : (strength == 'stronger' ? '>' : '==');
			if (exact && strength != 'exact') check += '=';

			let applyOperator = new Function('a', `return a ${check} ${affinityIndex[aff]};`);

			for (el in stel) {
				if (Elements.includes(stel[el])) {
					if (applyOperator(affinityIndex[(Object.entries(target?.affinities).filter(x => x[1]?.includes(stel[el])))?.[0]?.[0] ?? 'normal'])) return true
				} else {
					
					if (settings.mechanics.stataffinities && applyOperator(affinityIndex[(Object.entries(target?.statusaffinities).filter(x => x[1]?.includes(stel[el])))?.[0]?.[0] ?? 'normal'])) return true
				}
			}

			return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
		},
		getinfo(filteredVars) {
			let lessText = ``

			let strength = filteredVars[3]
			let exact = filteredVars[4]
			let aff = filteredVars[5]
			let stel = filteredVars.slice(6)

			lessText += `the ${filteredVars[1]}'s affinity for `

			for (i in stel) {
				lessText += `${elementEmoji[stel[i]] ?? statusEmojis[stel[i]]} ${statusNames[stel[i]] ?? stel[i]}`

				if (i < stel.length - 2) lessText += ', ';
				else if (i == stel.length - 2) lessText += ' or ';
			}

			lessText += ` to be ${strength == 'exact' ? "" : `${strength}${exact ? ' or equal to' : ' than'}`} ${affinityEmoji[aff]} ${aff}`

			return lessText
		}
	}),

	item: new Extra({
		name: "Item",
		desc: `Checks for the fighter team's items to proceed.\n\n-# All arguments are optional. If you don't type anything, it will check for existence of any item. The arguments are meant to narrow that down.`,
		args: [
			{
				name: "Should Have?",
				type: "YesNo",
			},
			{
				name: "More/Less/Exact - Amount",
				type: "Word",
			},
			{
				name: "Equal? - Amount",
				type: "YesNo",
			},
			{
				name: "Of an/Different - Amount",
				type: "Word",
			},
			{
				name: "Amount",
				type: "Num",
			},
			{
				name: "More/Less/Exact - Rarity",
				type: "Word",
			},
			{
				name: "Equal? - Rarity",
				type: "YesNo",
			},
			{
				name: "Rarity/\"Any\"",
				type: "Word",
			},
			{
				name: "Item Type/\"Any\"/\"Edible\"/\"Inedible\"",
				type: "Word",
			},
			{
				name: "More/Less/Exact - Cost",
				type: "Word",
			},
			{
				name: "Equal? - Cost",
				type: "YesNo",
			},
			{
				name: "Cost",
				type: "Num",
			},
		],
		applyfunc(message, skill, params) {
			let shouldHave = params[0] = params[0] ?? true
			let iMoreA = params[1] = params[1] ?? 'more'
			let iEqualA = params[2] = params[2] ?? true
			let aComparison = params[3] = params[3] ?? 'of'
			let iAmount = params[4] = params[4] ?? 1
			let iMoreR = params[5] = params[5] ?? 'more'
			let iEqualR = params[6] = params[6] ?? true
			let iRarity = params[7] = params[7] ?? 'any'
			let iType = params[8] = params[8] ?? 'any'
			let iMoreC = params[9] = params[9] ?? 'more'
			let iEqualC = params[10] = params[10] ?? true
			let iCost = params[11] = params[11] ?? 0

			if (!['more', 'less', 'exact'].includes(iMoreA)) return void message.channel.send("That's not the correct comparison type for amount. It's either less, more or exact.");

			if (iAmount <= 1) {
				if (iMoreA == 'less') {
					if (iEqualA) value = 1
					else return void message.channel.send("You can't need less than 1! You can make it be equal 1 tho.");
				}

				if (iMoreA != 'less' && iAmount < 1) iAmount = 1
			}

			if (!['different', 'of'].includes(aComparison)) return void message.channel.send("That's not the correct comparison type for type of amount check. It's either of, or different.");

			if (!['more', 'less', 'exact'].includes(iMoreR)) return void message.channel.send("That's not the correct comparison type for rarity. It's either less, more or exact.");
			if (![...itemRarities, 'any'].includes(iRarity)) return void message.channel.send(`That's not the right rarity of an item. You can choose either: ${itemRarities.join(', ')} & any.`)

			if (iRarity != 'any') {
				if (iRarity == "common" && iMoreR == 'less' && !iEqualR) return void message.channel.send(`You can't have the rarity be any more common than a common, without making it equal.`)
				
				if (iRarity == "artifact" && iMoreR == 'more' && !iEqualR) return void message.channel.send(`You can't have the rarity be any rarer than an artifact, without making it equal.`)
			}

			if (![...itemTypes, 'any', 'edible', 'inedible'].includes(iType)) return void message.channel.send(`That's not the right kind of an item. You can choose either: ${itemTypes.join(', ')}, edible, inedible & any.`)

			if (!['more', 'less', 'exact'].includes(iMoreC)) return void message.channel.send("That's not the correct comparison type for cost. It's either less, more or exact.");

			if (iCost <= 0) {
				if (iMoreC == 'less') {
					if (iEqualC) value = 0
					else return void message.channel.send("You can't need less than 0! You can make it be equal 0 tho.");
				}

				if (iMoreC != 'less' && iCost < 0) iCost = 0
			}

			return params
		},
		check(target, skill, btl, vars, isSkillAffected, team) {
			let itemFile = setUpFile(`${dataPath}/json/${btl.guild.id}/items.json`);
			let toCheck = target?.enemy ? Object.fromEntries(target.loot.filter(x => x.type == 'item').map(x => x = [x.id, x.amount])) : objClone(team.items)

			let shouldHave = vars[3]

			let iMoreA = vars[4]
			let iEqualA = vars[5]
			let aComparison = vars[6]
			let iAmount = vars[7]

			let iMoreR = vars[8]
			let iEqualR = vars[9]
			let iRarity = vars[10]

			let iType = vars[11]

			let iMoreC = vars[12]
			let iEqualC = vars[13]
			let iCost = vars[14]

			let checkRarity = iMoreR == 'less' ? '<' : (iMoreR == 'more' ? '>' : '==');
			if (iEqualR && iMoreR != 'exact') checkRarity += '=';
			let checkCost = iMoreC == 'less' ? '<' : (iMoreC == 'more' ? '>' : '==');
			if (iEqualC && iMoreC != 'exact') checkCost += '=';
			let checkAmount = iMoreA == 'less' ? '<' : (iMoreA == 'more' ? '>' : '==');
			if (iEqualA && iMoreA != 'exact') checkAmount += '=';

			let rarityOperator = new Function('a', `return a ${checkRarity} ${itemRarities.indexOf(iRarity)};`);
			let costOperator = new Function('a', `return a ${checkCost} ${iCost};`);
			let amountOperator = new Function('a', `return a ${checkAmount} ${iAmount};`);

			for (i in toCheck) {
				if (!itemFile[i]) toCheck[i] = "DO NOT DETECT"

				if (toCheck[i] != "DO NOT DETECT" && (iRarity != 'any' && !rarityOperator(itemFile[i]?.rarity ?? 'common'))) toCheck[i] = "DO NOT DETECT"

				if (toCheck[i] != "DO NOT DETECT" && (iType != 'any' && ((iType == "inedible" && consumableItems.includes(itemFile[i].type)) || (iType == "edible" && !consumableItems.includes(itemFile[i].type)) || itemFile[i].type != iType))) toCheck[i] = "DO NOT DETECT"

				if (toCheck[i] != "DO NOT DETECT" && !costOperator(itemFile[i]?.cost ?? 0)) toCheck[i] = "DO NOT DETECT"

				if (toCheck[i] != "DO NOT DETECT" && aComparison == 'of' && !amountOperator(toCheck[i])) toCheck[i] = "DO NOT DETECT"
			}

			toCheck = Object.entries(toCheck).filter(x => x[1] !== 'DO NOT DETECT')

			if (shouldHave && ((aComparison == 'of' && toCheck.length >= 1) || (aComparison == 'different' && amountOperator(toCheck.length)))) return true
			if (!shouldHave && !((aComparison == 'of' && toCheck.length >= 1) || (aComparison == 'different' && amountOperator(toCheck.length)))) return true

			return isSkillAffected ? "You don't meet the requirement to use this move at the moment!" : false;
		},
		getinfo(filteredVars) {
			let lessText = ``

			let shouldHave = filteredVars[3]
			let iMoreA = filteredVars[4]
			let iEqualA = filteredVars[5]
			let aComparison = filteredVars[6]
			let iAmount = filteredVars[7]
			let iMoreR = filteredVars[8]
			let iEqualR = filteredVars[9]
			let iRarity = filteredVars[10]
			let iType = filteredVars[11]
			let iMoreC = filteredVars[12]
			let iEqualC = filteredVars[13]
			let iCost = filteredVars[14]

			lessText += `the ${filteredVars[1]} to ${shouldHave ? "" : "not "}have ${iMoreA == 'exact' ? "" : `${iMoreA}${iEqualA ? ' or equal to' : ' than'}`} ${iAmount} ${aComparison} ${iType == 'any' ? (aComparison == "of" ? "an " : "") : (iType == 'inedible' ? `${aComparison == "of" ? "an " : ""}inedible` : (iType == 'edible' ? `${aComparison == "of" ? "an " : ""}edible` : `${aComparison == "of" ? "a " : ""}${itemTypeEmoji[iType]} ${iType}`))} item${aComparison == "of" ? "" : "s"}`

			if (iRarity != 'any') lessText += ` that ${aComparison == "of" ? "is" : "are"} ${iMoreR == 'exact' ? "" : `${iMoreR == 'more' ? 'rarer' : 'more common'}${iEqualR ? ' or equal to' : ' than'}`} ${itemRarityEmoji[iRarity]} ${iRarity}`

			if (!((iCost <= 0 && iMoreC == 'less' && !iEqualC) || (iCost <= 0 && iMoreC == 'exact'))) {
				lessText += ` ${iRarity == 'any' ? "that" : "and"} cost${aComparison == "of" ? "" : "s"} ${iMoreC == 'exact' ? "" : `${iMoreC}${iEqualC ? ' or equal to' : ' than'}`} ${iCost} currency`
			}

			return lessText + ' available'
		}
	}),
}