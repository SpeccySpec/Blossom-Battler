/*
	[[[Hook Documentation - NEGOTIATION SPECIAL hooks in order of appearance.]]]

	- canproceed(char, targ, btl, vars)
	Can this proceed fully? Return a string if not, otherwise, return true. This is calculated right when the option is selected.

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
		canproceed(char, targ, btl, vars) {
			let variable = vars[0];
			let present = vars[1];
			let failure = replaceTxt(vars[2] ?? '%PLAYER% tried to pacify %ENEMY%.\n...But %ENEMY% does not pass the %VARIABLE% check.', '%VARIABLE%', variable);

			let failTxt = ((present && targ?.custom?.pacifyVars?.[variable]) || (!present && !targ?.custom?.pacifyVars?.[variable])) ? true : failure; 
			return failTxt
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
			if (!specialList[special].postapply) return void message.channel.send(`${special} is not a valid special for this. The valid ones present are: ${Object.keys(specialList).filter(x => specialList[x].postapply).join(', ')}.`);

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
	if (!specialList[special].apply(message, option, rawargs)) return false
	
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