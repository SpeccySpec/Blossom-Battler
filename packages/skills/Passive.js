passiveList = {
	// On Attack.
	boost: {
		name: "Boost",
		desc: "_<Element> <Percentage>_\nBoosts the powers of skills of a specific element. Values for <Percentage> that are less than 100% will actually have negative effects! Negative values may even heal the foe... somehow.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Element>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Percentage>!");
			makePassive(skill, "boost", [extra1.toLowerCase(), parseInt(extra2)]);
			return true;
		}
	},

	moodswing: {
		name: "Mood Swing",
		desc: "_<Percentage Boost/Decrease> <Turns>_\nEvery <Turns> turns, your mood will switch from Calm to Angry and back, buffing/nerfing skills respectively.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1 || parseFloat(extra1) < 1) return message.channel.send("You didn't supply anything for <Element>!");
			if (!extra2 || parseInt(extra2) < 1) return message.channel.send("You didn't supply anything for <Percentage>!");
			makePassive(skill, "boost", [parseFloat(extra1), parseInt(extra2)]);
			return true;
		}
	},

	berserk: {
		name: "Berserk",
		desc: "_<Percentage Multiplier> <Highest HP Percent>_\n.With more HP, the user is more willing to fight. <Percentage Multiplier> should be over 100%... or you might get the opposite!",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1 || parseFloat(extra1) < 1) return message.channel.send("You didn't supply anything for <Element>!");
			if (!extra2 || parseFloat(extra2) < 1) return message.channel.send("You didn't supply anything for <Percentage>!");
			makePassive(skill, "boost", [parseFloat(extra1), parseFloat(extra2)]);
			return true;
		}
	},

	enraged: {
		name: "Enraged",
		desc: "_<Percentage Multiplier> <Highest HP Percent>_\n.With less HP, the user is more angered. <Percentage Multiplier> should be over 100%... or you might get the opposite!",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1 || parseFloat(extra1) < 1) return message.channel.send("You didn't supply anything for <Element>!");
			if (!extra2 || parseFloat(extra2) < 1) return message.channel.send("You didn't supply anything for <Percentage>!");
			makePassive(skill, "boost", [parseFloat(extra1), parseFloat(extra2)]);
			return true;
		}
	},

	// Start Of Turn
	heal: {
		name: "Heal",
		desc: "_<Amount> <Stat>_\nRestores <Amount> of max <Stat> on the start of your turn, <Stat> being either HP, HPPercent, MP, MPPercent, or LB.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1 || parseInt(extra1) < 1) return message.channel.send("You didn't supply anything for <Amount>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Stat>!");
			
			let stat = extra2.toLowerCase();
			if (stat != 'hp' && stat != 'mp' && stat != 'hppercent' && stat != 'mppercent' && stat != 'lb')
				return message.channel.send("You entered an invalid value for <Stat>! It can be either HP, HPPercent, MP, MPPercent, or LB.");

			makePassive(skill, "heal", [parseInt(extra1), stat]);
			return true;
		},
		onturn: function(btl, char, vars) {
			let settings = setUpSettings(btl.guild.id);

			switch(vars[1].toLowerCase()) {
				case 'mp':
					char.mp += parseInt(vars[0]);
					btl.channel.send(`${char.name}'s MP was restored by ${vars[0]}!`);
					break;

				case 'lb':
					if (settings.mechanics.limitbreaks) {
						char.lbpercent += parseInt(vars[0]);
						btl.channel.send(`${char.name}'s LB% was restored by ${vars[0]}!`);
					}

					break;

				case 'hppercent':
					char.hp += (char.maxhp/100)*parseInt(vars[0]);
					btl.channel.send(`${char.name}'s HP was restored by ${(char.maxhp/100)*parseInt(vars[0])}!`);
					break;

				case 'mppercent':
					char.mp += (char.maxmp/100)*parseInt(vars[0]);
					btl.channel.send(`${char.name}'s MP was restored by ${(char.maxmp/100)*parseInt(vars[0])}!`);
					break;
				
				default:
					char.hp += parseInt(vars[0]);
					btl.channel.send(`${char.name}'s HP was restored by ${vars[0]}!`);
					break;
			}

			char.hp = Math.min(char.maxhp, char.hp);
			char.hp = Math.min(char.maxmp, char.mp);
			return true;
		}
	},

	curestatus: {
		name: "Cure Status",
		desc: "_<Chance>_\n<Chance>% chance to cure a negative status effect on the start of your turn.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1 || parseFloat(extra1) < 1) return message.channel.send("You didn't supply anything for <Amount>!");
			makePassive(skill, "curestatus", [parseFloat(extra1)]);
			return true;
		}
	}
}

// Make a status type for a skill. "func" should be an array of 1-5 values indicating what the extra does.
function makePassive(skill, extra, func) {
	if (!skill.passive) skill.passive = {};
	if (!skill.passive[extra]) skill.passive[extra] = [];

	skill.passive[extra].push(func);
}

// Checks if the skill has an extra
// just realise we dont need this either
hasPassiveType = (skill, extra) => {
	if (!skill.passive) return false;
	if (!skill.passive[extra]) return false;
	return skill.passive[extra];
}

// Apply Extra Effects to an existing skill using the extrasList above.
applyPassive = (message, skill, skillExtra, extra1, extra2, extra3, extra4, extra5) => {
	if (!skill.passive) skill.passive = {};
	if (!skillExtra || !passiveList[skillExtra.toLowerCase()]) {
		message.channel.send("You're adding an invalid passive type! Use the ''listpassivetypes'' command to list all extras.");
		return false;
	}

	if (!passiveList[skillExtra.toLowerCase()].applyfunc(message, skill, extra1, extra2, extra3, extra4, extra5)) {
		message.channel.send("Something went wrong!");
		return false;
	}
	
	skill.done = true;
	
	/* === OLD EXTRAS HERE FOR REFERENCE ===

	if (statusType === 'status') {
		if (!utilityFuncs.validStatus(extra1)) return msg.channel.send(`${extra1} is an invalid status effect.`);

		skillFile[name].status = extra1.toLowerCase()
		skillFile[name].statuschance = parseInt(extra2)
		skillFile[name].levelLock = 10
	} else if (statusType === 'multistatus') {
		skillFile[name].status = []
		if (utilityFuncs.validStatus(extra1)) skillFile[name].status.push(extra1);
		if (utilityFuncs.validStatus(extra2)) skillFile[name].status.push(extra2);
		if (utilityFuncs.validStatus(extra3)) skillFile[name].status.push(extra3);
		
		if (skillFile[name].status.length <= 0)
			return msg.channel.send('All 3 status effects were invalid.');
		
		skillFile[name].levelLock = 25
	} else if (statusType === 'buff') {
		skillFile[name].buff = extra1.toLowerCase()
		skillFile[name].target = extra2.toLowerCase()
		skillFile[name].buffCount = parseInt(extra3)
		
		if (skillFile[name].buffCount <= 1) {
			delete skillFile[name].buffCount
			skillFile[name].levelLock = 10
		}

		if (skillFile[name].buffCount >= 6) {
			skillFile[name].buffCount = 6
			skillFile[name].levelLock = 60
		}
	} else if (statusType === 'debuff') {
		skillFile[name].debuff = extra1.toLowerCase()
		skillFile[name].target = extra2.toLowerCase()
		skillFile[name].levelLock = 10
	} else if (statusType === 'dualbuff' || statusType === 'dualdebuff') {
		skillFile[name][statusType] = [extra1.toLowerCase(), extra2.toLowerCase()];
		skillFile[name].target = extra3.toLowerCase();
		skillFile[name].levelLock = 40;
	} else if (statusType === 'mimic') {
		skillFile[name].mimic = true;
		skillFile[name].levelLock = 50;
	} else if (statusType === 'clone' || statusType === 'harmonics') {
		skillFile[name].clone = true;
		skillFile[name].levelLock = 50;
	} else if (statusType === 'shield') {
		skillFile[name].shield = extra1.toLowerCase()
		skillFile[name].target = extra2.toLowerCase()
		skillFile[name].levelLock = 25
	} else if (statusType === 'makarakarn' || statusType === 'tetrakarn') {
		skillFile[name][statusType] = true
		skillFile[name].target = extra1.toLowerCase()
		skillFile[name].levelLock = 40
	} else if (statusType === 'trap') {
		skillFile[name].trap = true
		skillFile[name].effect = [extra1.toLowerCase(), extra2.toLowerCase()]
		skillFile[name].levelLock = 30;

		if (extra1.toLowerCase() == "damage") {
			skillFile[name].effect[2] = parseInt(extra2);
			skillFile[name].levelLock = 40
		}
	} else if (statusType === 'weather')
		skillFile[name].weather = extra1.toLowerCase();
	else if (statusType === 'terrain')
		skillFile[name].terrain = extra1.toLowerCase();
	else if (statusType === 'reincarnate') {
		skillFile[name].reincarnate = true;
		skillFile[name].levelLock = 50;
	} else if (statusType === 'chaosstir' || statusType === 'chaos') {
		skillFile[name].chaosStir = true;
		skillFile[name].levelLock = 45;
	} else if (statusType === 'futuresight' || statusType === 'delayed' || statusType === 'future') {
		skillFile[name].futuresight = {
			pow: parseInt(extra1),
			acc: 90,
			type: extra2.toLowerCase(),
			atktype: "magic",
			turns: parseInt(extra3)
		};

		skillFile[name].levelLock = 50;
	} else
		return msg.channel.send('You inputted an invalid status type.');
	*/

	console.log("win")
	return true;
}

buildPassive = (message, args) => {
	let skill = {
		name: args[0],
		type: 'passive',
		originalAuthor: message.author.id
	}

	applyPassive(message, skill, args[1].toLowerCase(), args[2], args[3], args[4], args[5], args[6])
	
	if (skill.done) {
		delete skill.done;
		return skill;
	} else {
		return false
	}
}