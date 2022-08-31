/*
	[[[Hook Documentation - NEGOTIATION SPECIAL hooks in order of appearance.]]]

	- canproceed(char, targ, btl, vars)
	Can this proceed fully? Return a string if not, otherwise, return true. This is calculated right when the option is selected.

	- preapply(char, targ, amount, btl, vars)
	This will do things before the pacify amount gets added to the target. Should return a string.
	
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
		desc: "Requires a <Variable> variable to be or not to be present to pacify with a specified option. Will prompt with a <Failure Message> message, and can execute a special if the user doesn't meet requirements.\n\n[SPECIAL EXECUTION UNUSABLE]",
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
			/*{
				name: "Special",
				type: 'Word'
			},
			{
				name: "Variables",
				type: 'Word',
				multiple: true
			}*/
		],
		applyfunc(message, option, args) {
			let variable = args.shift();
			let present = args.shift();
			let failure = args.shift() ?? null;
			//let special = args.shift() ?? null;

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
		desc: "Clears <Variable> variables that were granted to the target. Can add {Clear Message} as flair.",
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