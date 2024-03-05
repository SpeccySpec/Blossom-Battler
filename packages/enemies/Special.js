/*
	[[[Hook Documentation - NEGOTIATION SPECIAL hooks in order of appearance.]]]

	- canproceed(char, targ, btl, vars, result)
	Can this proceed fully? Return a string, failure is decided by "result.failed". This is calculated right when the option is selected.

	- preapply(char, targ, result, btl, vars)
	This will do things before the pacify amount gets added to the target. Shouldn't return anything.
	
	- postapply(char, targ, btl, vars)
	This will do things once the pacify amount has been added to the target. Should return a string.
*/

specialList = {
    variable: new Extra({
        name: "Variable",
		desc: "Gives the target the <Variable> variable that can be used as a requirement for other pacify options. Can be reverted after {Turns} turns if specified and use a {Revert Message} message to spice it up.",
        multiple: true,
		args: [
			{
				name: "Variable",
				type: "Word",
                forced: true
			},
			{
				name: "Turns",
				type: "Num"
			},
			{
				name: "Revert Message",
				type: "Word"
			}
		],
		applyfunc(message, option, args) {
			let variable = args[0];
			let turns = args[1] ?? true;
			let revert = args[2] ?? null;

			if (variable.trim().length == 0) return void message.channel.send(`You can't set nothing as a variable.`);
			if (parseInt(turns) < 1) return void message.channel.send(`You can't set an amount of turns lower than 1.`);
			if (revert && revert.trim().length == 0) return void message.channel.send(`You can't have an empty message.`);

			makeSpecial(option, "variable", [variable, turns, revert]);
			return true
		},
		activeAt100Percent: false,
		postapply(char, targ, btl, vars) {
			let variable = vars[0];
			let turns = vars[1] ?? true;
			let rev = vars[2];

			if (!targ?.custom?.pacifyVars) {
                addCusVal(targ, 'pacifyVars', {});
            }
			if (!targ?.custom?.pacifyVars[variable]) {
				targ.custom.pacifyVars[variable] = {}
			}

			targ.custom.pacifyVars[variable].turns = turns;
			if (rev) targ.custom.pacifyVars[variable].revert = rev;

			return ``;
		}
    }),

	requiredvar: new Extra({
		name: "Required Variable",
		desc: "Requires a <Variable> variable to be or not to be present to pacify with a specified option. Will prompt with a <Failure Message> message.",
        multiple: true,
		args: [
			{
				name: "Variable",
				type: "Word",
                forced: true
			},
			{
				name: "Must be present?",
				type: "YesNo",
                forced: true
			},
			{
				name: "Failure Message",
				type: "Word",
			},
		],
		applyfunc(message, option, args) {
			let variable = args.shift();
			let present = args.shift();
			let failure = args.shift() ?? null;

			if (variable.trim().length <= 0) return void message.channel.send(`You didn't specify any valid variables.`);
			if (failure && failure.trim().length == 0) return void message.channel.send(`You can't have an empty message.`);

			makeSpecial(option, "requiredvar", [variable, present, failure]);
			return true
		},
		canproceed(char, targ, btl, vars, result) {
			let variable = vars[0];
			let present = vars[1];
			let failure = replaceTxt(vars[2] ?? '%PLAYER% tried to pacify %ENEMY%.\n...But %ENEMY% does not pass the %VARIABLE% check.', '%VARIABLE%', variable);

			let failTxt = ((present && targ?.custom?.pacifyVars?.[variable]) || (!present && !targ?.custom?.pacifyVars?.[variable])) ? '' : failure; 
			if (failTxt != '') result.failed = true;
			return failTxt;
		}
	}),

	clearvar: new Extra({
		name: "Clear Variable",
		desc: "Clears <Variables> variables that were granted to the target. Can add {Clear Message} as flair.",
		multiple: true,
		args: [
			{
				name: "Clear Message",
				type: "Word"
			},
			{
				name: "Variables",
				type: "Word",
                forced: true,
				multiple: true
			}
		],
		applyfunc(message, option, args) {
			let clear = args.shift();
			let variables = args.filter(x => x.trim().length != 0);
			if (clear.toLowerCase() == 'none') clear = null;

			if (variables.length <= 0) return void message.channel.send(`You didn't specify any valid variables.`);
			if (clear && clear.trim().length == 0) return void message.channel.send(`You can't have an empty message.`);

			makeSpecial(option, "clearvar", [clear, [...variables]]);
			return true
		},
		activeAt100Percent: false,
		postapply(char, targ, btl, vars) {
			let txt = ''
			let hasCleared = false;

			let clearTxt = vars[0];
			let variables = vars[1];

			for (i in variables) {
				let variable = variables[i];

				if (targ?.custom?.pacifyVars?.[variable]) {
					delete targ.custom.pacifyVars[variable];
					hasCleared = true;

					if (Object.keys(targ?.custom?.pacifyVars).length == 0) delete targ.custom.pacifyVars;
				}
			}

			if (hasCleared) txt += clearTxt;

			return txt;
		}
	}),

	failurespecial: new Extra({
		name: "Failure Special",
		desc: "Executes the specified <Special> special if pacification fails due to a <Requirement Special> requirement eg. required item.",
		multiple: true,
		args: [
			{
				name: "Requirement Special",
				type: "Word",
                forced: true,
			},
			{
				name: "Special",
				type: "Word",
                forced: true,
			},
			{
				name: "Variables",
				type: "Word",
				multiple: true
			}
		],
		applyfunc(message, option, args) {
			let requirement = args.shift();
			let special = args.shift();

			if (!specialList[requirement]) return void message.channel.send(`${requirement} doesn't exist in the negotiation specials list.`);
			if (!specialList[requirement].canproceed) return void message.channel.send(`${requirement} is not a requirement special. The valid ones present are: ${Object.keys(specialList).filter(x => specialList[x].canproceed).join(', ')}.`);
			if (!specialList[special]) return void message.channel.send(`${special} doesn't exist in the negotiation specials list.`);
			if (!specialList[special].postapply && !specialList[special].useonfail ) return void message.channel.send(`${special} is not a valid special for this. The valid ones present are: ${Object.keys(specialList).filter(x => specialList[x].postapply || specialList[x].useonfail).join(', ')}.`);

			let specialObject = {}
			if (applySpecial(message, specialObject, special, args)) {
				specialObject = specialObject.specials[special].flat(2);
				
				console.log(specialObject);
				
				makeSpecial(option, "failurespecial", [requirement, special, specialObject]);
				return true
			}
			return false;
		},
		hardcoded: true
	}),

	varboost: new Extra({
		name: "Variable Boost",
		desc: "Adds or multiplies the pacify amount given by <Amount> when target has the <Variable> variable present, or not present. Can add {Additional Message} message as flair.",
		multiple: true,
		args: [
			{
				name: "Variable",
				type: "Word",
                forced: true,
			},
			{
				name: "Must be present?",
				type: "YesNo",
                forced: true
			},
			{
				name: "Amount",
				type: "Decimal",
                forced: true,
			},
			{
				name: "Should be multiplied?",
				type: "YesNo",
                forced: true,
			},
			{
				name: "Additional Message",
				type: "Word"
			}
		],
		applyfunc(message, option, args) {
			let variable = args[0];
			let mustBePresent = args[1];
			let amount = args[2];
			let isMultiplied = args[3];
			let additional = args[4] ?? null;

			if (variable.trim().length <= 0) return void message.channel.send(`Your variable can't be empty.`);
			if (!isMultiplied && amount == 0) return void message.channel.send(`It's useless if it won't add anything to the table.`);
			if (additional && additional.trim().length == 0) return void message.channel.send(`You can't have an empty message.`);

			makeSpecial(option, "varboost", [variable, mustBePresent, amount, isMultiplied, additional]);
			return true
		},
		preapply(char, targ, result, btl, vars) {
			let variable = vars[0];
			let mustBePresent = vars[1];
			let amount = vars[2];
			let isMultiplied = vars[3];
			let additional = vars[4];

			if ((mustBePresent && targ?.custom?.pacifyVars?.[variable]) || (!mustBePresent && !targ?.custom?.pacifyVars?.[variable])) {
				if (isMultiplied) result.convince *= amount;
				else result.convince += amount;

				result.convince = Math.trunc(result.convince * 100)/100; //truncate to 2 places

				result.text = additional ?? '';
			}
		}
	}),

	maximum: new Extra({
		name: "Maximum",
		desc: "Limits the pacify percentage to <Value> value if amount will exceed it. Can add an {Additional Message} message as flair when the limit is reached.",
		args: [
			{
				name: "Amount",
				type: "Decimal",
                forced: true,
			},
			{
				name: "Additional Message",
				type: "Word"
			}
		],
		applyfunc(message, option, args) {
			if (args[0] >= 100) return void message.channel.send('It wouldn\'t matter. The target would already be fully pacified.')
			if (args[1] && args[1].trim().length == 0) return void message.channel.send(`You can't have an empty message.`);

			makeSpecial(option, "maximum", [args[0], args[1]]);
			return true
		},
		preapply(char, targ, result, btl, vars) {
			if (targ.pacify + result.convince > vars[0]) { 
				result.convince = Math.max(vars[0] - targ.pacify, 0);
				result.text = vars[1] ?? '';
			}
		}
	}),

	stagnant: new Extra({
		name: "Stagnant",
		desc: `Specified option won't be affected by ${elementEmoji['passive']}kindheart passives.`,
		applyfunc(message, option, args) {
			makeSpecial(option, "stagnant", [true]);
			return true
		},
		hardcoded: true
	}),

	variance: new Extra({
		name: "Variance",
		desc: "Pacify amount can vary by an amount between the <Minimum Range>-<Maximum Range> range.",
		args: [
			{
				name: "Minimum Range",
				type: "Decimal",
                forced: true,
			},
			{
				name: "Maximum Range",
				type: "Decimal",
                forced: true,
			}
		],
		applyfunc(message, option, args) {
			if (args[0] == args[1]) return void message.channel.send(`If you want the variance to be the same all the time, you can change the option pacify amount instead.`);
			if (args[0] > args[1]) return void message.channel.send(`Minimum has to be below the maximum.`);

			makeSpecial(option, "variance", [args[0], args[1]]);
			return true
		},
		preapply(char, targ, result, btl, vars) {
			result.convince += Math.trunc((Math.random()*(vars[1]-vars[0])+vars[0])*100) / 100;
		}
	}),

	reset: new Extra({
		name: "Reset",
		desc: `Resets pacify progress to 0%.`,
		applyfunc(message, option, args) {
			makeSpecial(option, "reset", [true]);
			return true
		},
		useonfail: true,
		preapply(char, targ, result, btl, vars) {
			result.convince = 0;
			result.reset = true;
			targ.pacify = 0;
		}
	}),

	status: new Extra({
		name: 'Status',
		desc: '<Chance>% to inflict one of multiple <Status Effect>s on the target or the user.',
		multiple: true,
		args: [
			{
				name: 'Target / User',
				type: 'Word',
				forced: true,
			},
			{
				name: 'Status Effect #1',
				type: 'Word',
				forced: true,
				multiple: true,
			},
			{
				name: 'Chance',
				type: 'Decimal'
			}
		],
		applyfunc(message, option, args) {
			let targetUser = args.shift();
			if (targetUser.toLowerCase() != 'target' && targetUser.toLowerCase() != 'user') return void message.channel.send("You entered an invalid value for <Target/User>! It can be either Target or User.")
			
			let statusEffect = args.filter(x => statusEffects.includes(x.toLowerCase()))
			if (statusEffect.length === 0) return void message.channel.send("You're not adding any valid status effects! Use the ''liststatus'' command to list all status effects.");
			statusEffect = statusEffect.map(x => x.toLowerCase())

			let chance = args[args.length - 1] > 0 ? args[args.length - 1] : 100;
			if (statusEffect.length === 1) statusEffect = statusEffect[0];

			makeSpecial(option, "status", [targetUser.toLowerCase(), statusEffect, chance]);
			return true;
		},
		postapply(char, targ, btl, vars) {
			let targetUser = vars[0];
			let statusses = vars[1];
			let chance = vars[2];

			target = targetUser == 'target' ? targ : char;
			user = targetUser == 'target' ? char : targ;

			let status;
			if (typeof(statusses) === 'object') {
				status = statusses[randNum(statusses.length-1)];
			} else {
				status = statusses;
			}

			return statusList.status.inflictStatus(user, target, {type: 'status', statuschane: chance}, status, btl);
		}
	}),

	math: new Extra({
		name: 'Math',
		desc: `The target will present the user with a math equation with a <Expression Amount> expression amount to answer in {Timer} seconds.`,
		args: [
			{
				name: 'Include addition?',
				type: 'YesNo',
				forced: true,
			},
			{
				name: 'Include subtraction?',
				type: 'YesNo',
				forced: true,
			},
			{
				name: 'Include multiplication?',
				type: 'YesNo',
				forced: true,
			},
			{
				name: 'Include division?',
				type: 'YesNo',
				forced: true,
			},
			{
				name: 'Include remainders?',
				type: 'YesNo',
			},
			{
				name: 'Include exponents?',
				type: 'YesNo',
			},
			{
				name: 'Include roots?',
				type: 'YesNo',
			},
			{
				name: 'Include negative numbers?',
				type: 'YesNo',
			},
			{
				name: 'Include parenthesis?',
				type: 'YesNo',
			},
			{
				name: 'Maximum decimals (0-3)',
				type: 'Num',
			},
			{
				name: 'Expression Amount (1-10)',
				type: 'Num',
				forced: true,
			},
			{
				name: 'Timer (5-360)',
				type: 'Num',
			},
			{
				name: 'Success Message',
				type: 'Word',
			},
			{
				name: 'Failure Message',
				type: 'Word',
			}
		],
		applyfunc(message, option, args) {
			let essentials = args.slice(0, 4);
			args.splice(0, 4);
			let optionals = args.slice(0, 6);
			args.splice(0, 6);

			let expressions = args[0];
			let timer = args[1] ?? 60;
			let success = args[2] ?? 'You succeeded!';
			let failure = args[3] ?? 'You failed!';

			if (!essentials.some(x => x == true)) return message.channel.send('You have to include one thing of the essentials');
			if (expressions < 1 || expressions > 10) return message.channel.send('That\'s not a valid expression amount. It should be between 1 and 10.');
			if (timer < 5) return void message.channel.send('Give people time to think of a solution.');
			if (timer > 360) return void message.channel.send('That\'s too much time given. The maximum I can allow is 5 minutes.');
			if (success.trim().length == 0) return void message.channel.send(`You can't have an empty success message.`);
			if (failure.trim().length == 0) return void message.channel.send(`You can't have an empty failure message.`);

			makeSpecial(option, "math", [{addition: essentials[0],subtraction: essentials[1],multiplication: essentials[2],division: essentials[3]}, 
			{remainders: optionals[0],exponents: optionals[1],roots: optionals[2],negativeNumbers: optionals[3],parenthesis: optionals[4],decimals:Math.max(Math.min(optionals[5], 3), 0)}, 
			expressions, timer, success, failure]);
			return true;
		},
		canproceed(char, targ, btl, vars, result) {
			if (!btl?.action?.question) return '';

			delete btl.intendedstate;

			if (btl.action.question.correctAnswer == btl.action.question.chosenAnswer) return vars[4];
			else {
				result.failed = true;
				return vars[5];
			}
		}
	})
}

function makeSpecial(option, special, func) {
	if (!option.specials) option.specials = {};
	if (!option.specials[special]) option.specials[special] = [];

	if (specialList[special].multiple) {
		option.specials[special].push(func);
	} else {
		option.specials[special] = func;
	}
}

applySpecial = (message, option, special, rawargs) => {
	if (!option.specials) option.specials = {};
	if (!special || !specialList[special]) return message.channel.send("You're adding an invalid extra! Use the ''listnegotiationspecials'' command to list all extras.");
	if (!specialList[special].apply(message, option, rawargs, specialList[special].name)) return false
	
	message.react('👍');
	console.log("win");
	option.done = true;
	return true;
}

buildNegotiation = (message, special, args) => {
	let negotiation = {
		name: args[1],
		action: args[4],
		convince: args[2]
	}

	if (args[3].toLowerCase() != 'none') negotiation.desc = args[3];

	if (special && special.toLowerCase() != 'none') { 
		applySpecial(message, negotiation, special.toLowerCase(), args.slice(6))
	
		if (negotiation.done) {
			delete negotiation.done;
		} else {
			return false
		}
	}
	return negotiation;
}