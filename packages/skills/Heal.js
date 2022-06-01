healList = {
	default: new Extra({
		name: "Default",
		desc: "The default heal type. Restores HP by <HP>. _Negative values for <HP> will damage the target!_",
		args: [
			{
				name: "HP",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (args[0] == 0) args[0] = 60;
			
			makeHeal(skill, "default", [args[0]]);
			return true;
		},
		onuse(char, targ, skill, btl, vars) {
			if (!vars[0] || vars[0] === null) return '';

			targ.hp = Math.min(targ.maxhp, targ.hp+vars[0]);
			return `${targ.name}'s HP was restored by ${vars[0]}!`;
		}
	}),

	healmp: new Extra({
		name: "Heal MP",
		desc: "Restores MP by <MP>. _Negative values for <MP> will drain the target!_",
		args: [
			{
				name: "MP",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (args[0] == 0) args[0] = 30;
			makeHeal(skill, "healmp", [args[0]]);
			return true;
		},
		onuse(char, targ, skill, btl, vars) {
			targ.mp = Math.min(targ.maxmp, targ.mp+vars[0]);
			return `${targ.name}'s MP was restored by ${vars[0]}!`;
		}
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
			targ.regenheal = {
				heal: vars[0],
				turns: vars[1],
				type: "hp"
			}

			return `${targ.name} is surrounded in a lime coloured aura!`;
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
			targ.regenheal = {
				heal: vars[0],
				turns: vars[1],
				type: "mp"
			}

			return `${targ.name} is surrounded in a violet coloured aura!`;
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
			return `${targ.name} was revived!`;
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
			}

			return `The party's HP & MP was fully restored, but at the cost of ${char.name}'s sacrifice!`;
		}
	}),

	fullheal: new Extra({
		name: "Full Heal",
		desc: "Fully restores HP of the target.",
		args: [],
		applyfunc(message, skill, args) {
			makeHeal(skill, "fullheal", [true]);
			if (hasHealType(skill, "default")) delete skill.heal["default"];
			return true;
		},
		onuse(char, targ, skill, btl, vars) {
			targ.hp = targ.maxhp
			return `${targ.name}'s HP was fully restored!`;
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
			switch(vars[0]) {
				case 'physical':
					if (targ.confusion) delete targ.confusion;

					if (isPhysicalStatus(targ.status)) {
						delete targ.status;
						delete targ.statusturns;
					}

					return `${targ.name} had physical status ailments cured!`;
					break;
			
				case 'mental':
					if (targ.infatuation) delete targ.infatuation;

					if (!isPhysicalStatus(targ.status)) {
						delete targ.status;
						delete targ.statusturns;
					}

					return `${targ.name} had mental status ailments cured!`;
					break;

				case 'all':
					if (targ.confusion) delete targ.confusion;
					if (targ.infatuation) delete targ.infatuation;
					delete targ.status;
					delete targ.statusturns;

					return `${targ.name} had their status ailments cured!`;
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

					return `${targ.name} had their ${vars[0]} status effect cured!`;
			}

			return '...';
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
				makeHeal(skill, "default", [60]);
			}
			return true;
		},
		onuse(char, targ, skill, btl, vars) {
			if (!vars[0])
				char.hp = 0;
			else
				char.hp = vars[0];

			return `${char.name} sacrificed themselves, lowering their HP to ${vars[0]}!`;
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
			if (!hasHeal) makeHeal(skill, "default", [60]);
			return true;
		},
		onuse(char, targ, skill, btl, vars) {
			targ.wishheal = vars[0];
			return `${char.name} will experience a healing wish in ${vars[0]} turns.`;
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

	applyHeal(message, skill, extra, args.slice(6))
	
	if (skill.done) {
		delete skill.done;
		return skill;
	} else {
		return false
	}
}