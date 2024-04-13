let st = {
	allallies: 'ally',
	allopposing: 'one',
	everyone: 'one',
	spreadopposing: 'one',
	spreadallies: 'ally',
	randomspreadallies: 'ally',
	randomspreadopposing: 'one',
	randomspread: 'one',
	randomwidespread: 'one',
	widespreadopposing: 'one',
	widespreadallies: 'ally',
	randomwidespreadopposing: 'one',
	randomwidespreadallies: 'ally'
}

forceSingleTarget = (skill) => {
	if (st[skill.target]) skill.target = st[skill.target];
	return skill;
}

/*
	[[[HOOK DOCUMENTATION - STATUS hooks in order of appearance]]]

	- onuse(char, targ, skill, btl, vars)
	If the skill lands, this should do something extra. Should return a string.

	- onselect(char, skill, btl, vars)
	onuse but it is ran before all of the damage functions. Should return a string.

	- aithinker(char, targ, act, skill, btl, vars)
	Modify the points for this action (act) for ai.
*/

statusList = {
	status: new Extra({
		name: 'Status',
		desc: '<Chance>% to inflict one of multiple <Status Effect>s on the target.',
		args: [
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
		applyfunc(message, skill, args) {
			let statusEffect = args.filter(x => statusEffects.includes(x.toLowerCase()))
			if (statusEffect.length === 0) return void message.channel.send("You're not adding any valid status effects! Use the ''liststatus'' command to list all status effects.");
			statusEffect = statusEffect.map(x => x.toLowerCase())

			let chance = args[args.length - 1] > 0 ? args[args.length - 1] : 100;

			if (statusEffect.length === 1) statusEffect = statusEffect[0];

			skill.status = statusEffect;
			skill.statuschance = chance;
			return true;
		},
		inflictStatus(char, targ, skill, status, btl, multiplier) {
			console.log(skill.type);
			if (hasStatusAffinity(targ, status, 'block')) return `__${targ.name}__ blocked it!\n${selectQuote(char, 'badatk')}\n${selectQuote(targ, 'block')}`;
			if (targ.status && skill.type === 'status') return "...But it failed!";

			let chance = 100
			if (skill.statuschance < 100) {
				chance = (skill.statuschance ?? 5) + ((char.stats.chr-targ.stats.chr)/2);
				if (isPhysicalStatus(status)) chance = (skill.statusChance ?? skill.statuschance) + ((char.stats.luk-targ.stats.luk)/2);
			}

			//Status Chance Leader Skills
			let settings = setUpSettings(btl.guild.id)
			let party = btl.teams[char.team];
			if (settings?.mechanics?.leaderskills && party?.leaderskill && party.leaderskill.type === 'status') {
				if (status == party.leaderskill.var1.toLowerCase()) {
					chance += party.leaderskill.var2;
				}
			}

			if (skill.type === 'status') {
				chance = modSkillResult(char, targ, chance, skill, btl);
				chance = Math.round(chance * multiplier);
			}

			let randChance = randNum(1, 100)

			if (randChance <= chance) {
				if (skill.type === 'status' && doPassives(btl)) {
					let repelChance = 0;
					let targChance = 0;
					for (let i in targ.skills) {
						if (!skillFile[targ.skills[i]]) continue;
						if (skillFile[targ.skills[i]].type != 'passive') continue;

						for (let k in skillFile[targ.skills[i]].passive) {
							if (k == "magicbounce") {
								repelChance = randNum(1, 100)
								targChance = skillFile[targ.skills[i]].passive[k][0];
								
								if (targChance < 100 && skillFile[targ.skills[i]].passive[k][1]) targChance += ((char.stats.luk-targ.stats.luk)/2);

								if (targChance >= 100 || repelChance <= targChance) {
									return `\nBut, ${targ.name}'s __${skillFile[targ.skills[i]].name}__ repelled the attack!\n\n${inflictStatus(char, status)}\n${selectQuote(targ, 'landed')}\n${selectQuote(char, 'hurt')}`
								}
							}
						}
					}
				}

				return `\n${inflictStatus(targ, status)}\n${selectQuote(char, 'landed')}\n${selectQuote(targ, 'hurt')}`;
			} else {
				if (skill.type == 'status')
					return dodgeTxt(char, targ);
				else
					return '';
			}
		}
	}),

	buff: new Extra({
		name: "Stat Buff",
		desc: extrasList.buff.desc,
		args: extrasList.buff.args,
		multiple: true,
		diffflag: [0, 1, 2],
		applyfunc(message, skill, args) {
			const target = args[0].toLowerCase()
			const stat = args[1].toLowerCase()
			const stages = args[2] ?? 1
			const chance = Math.min(args[3] ?? 100, 100)
			const turns = args[4] ?? null

			if (target != 'user' && target != 'target') 
				return void message.channel.send(`You typed ${target} as the target. It must be either \`user\` or \`target\`.`)
			if (![...stats, "crit", "all"].includes(stat))
				return void message.channel.send("That's not a valid stat!");
			if (stages == 0)
				return void message.channel.send("...This amount of stages won't do anything, I'm afraid.");
			if (Math.abs(stages) > 3) 
				return void message.channel.send("The maximum amount of stages is 3!");
			if (chance <= 0)
				return void message.channel.send("You can't have a percentage less than 0, as then it would never happen!");
			if (turns && turns <= 0)
				return void message.channel.send("You can't have a turn amount less than 0, as then it would revert to normal too soon.");

			makeStatus(skill, "buff", [target, stat, stages, chance, turns])
			return true
		},
		onselect(char, skill, btl, vars, multiplier) {
			if (vars[0] != 'user') return '';
			return extrasList.buff.buffChange(char, char, skill, btl, vars, multiplier);
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (vars[0] != 'target') return '';
			return extrasList.buff.buffChange(char, targ, skill, btl, vars, multiplier);
		},
		aithinker(char, targ, act, skill, btl, vars) {
			if (vars[0] === 'user') {
				if (vars[2] < 0) 
					act.points--;
				else {
					if (char.buffs[vars[1]]+vars[2] >= 3) {
						act.points -= 3;
					} else {
						act.points += 3-char.buffs[vars[1]];
					}
				}
			} else {
				if (skill.target === 'ally' || skill.target === 'spreadallies') {
					if (vars[2] < 0) 
						act.points -= 2;
					else {
						if (targ.buffs[vars[1]]+vars[2] >= 3) {
							act.points -= 3;
						} else {
							act.points += 3-targ.buffs[vars[1]];
						}
					}
				} else if (skill.target === 'allallies') {
					if (vars[2] < 0) 
						act.points -= btl.teams[char.team].length*2;
					else {
						for (let ally of btl.teams[char.team].members) {
							if (ally.buffs[vars[1]]+vars[2] >= 3) {
								act.points -= 3;
							} else {
								act.points += 3-ally.buffs[vars[1]];
							}
						}
					}
				} else {
					if (vars[2] > 0) 
						act.points -= 4;
					else {
						for (let i in btl.teams) {
							if (i === char.team) continue;

							for (foe of btl.teams[i].members) {
								if (foe.buffs[vars[1]]+vars[2] <= -3) {
									act.points -= 3;
								} else {
									act.points += 3+foe.buffs[vars[1]];
								}
							}
						}
					}
				}
			}
		},
		getinfo: buffText
	}),

	dekaja: new Extra({
		name: "Dekaja",
		desc: "Removes the target's positive buffs.",
		args: [],
		applyfunc(message, skill, args) {
			makeStatus(skill, "dekaja", [true]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			let change = 0;
			if (multiplier != 1) {
				let extraBuffChance = 10;
				extraBuffChance = Math.round(modSkillResult(char, targ, extraBuffChance, skill, btl) * multiplier);

				if (randNum(1, 100) <= extraBuffChance) {
					change = -1;
				}
			}

			for (let i in targ.buffs) {
				if (targ.buffs[i] > 0) targ.buffs[i] = change;
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

			return `__${targ.name}__'s positive buffs were nullified${change == -1 ? ' and debuffed 1 time' : ''}!`;
		},
		aithinker(char, targ, act, skill, btl) {
			switch(skill.target) {
				case 'allopposing':
					for (let team of btl.teams) {
						if (team === char.team) continue;
						
						for (let opp of team.members) {
							for (let i in opp.buffs) {
								if (opp.buffs[i] > 0) act.points += opp.buffs[i];
							}
						}
					}
					break;

				case 'one':
					for (let i in targ.buffs) {
						if (targ.buffs[i] > 0) act.points += targ.buffs[i];
					}
					break;
			}
		},
		getinfo(vars, skill) {
			return "Removes the target's buffs"
		}
	}),

	dekunda: new Extra({
		name: "Dekunda",
		desc: "Removes the target's negative buffs, or debuffs.",
		args: [],
		applyfunc(message, skill, args) {
			makeStatus(skill, "dekunda", [true]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			let change = 0;
			if (multiplier != 1) {
				let extraBuffChance = 10;
				extraBuffChance = Math.round(modSkillResult(char, targ, extraBuffChance, skill, btl) * multiplier);

				if (randNum(1, 100) <= extraBuffChance) {
					change = 1;
				}
			}
			
			for (let i in targ.buffs) {
				if (targ.buffs[i] < 0) targ.buffs[i] = change;
			}
			if(targ?.custom?.revertBuffs) {
				for (let i in targ.custom.revertBuffs) {
					if (targ.custom.revertBuffs[i] > 0) targ.custom.revertBuffs[i] = 0;
				}
			}
			if(targ?.custom?.buffTurns) {
				for (i in targ.custom.buffTurns) {
					if (targ.custom.buffTurns[i][1] <= 0) targ.custom.buffTurns[i] = ''
				}
				targ.custom.buffTurns = targ.custom.buffTurns.filter(x => x.length != 0);

				if (targ.custom.buffTurns.length == 0) {
					killVar(targ, "buffTurns");
				}
			}
			if(targ?.custom?.revertBuffTurns) {
				for (i in targ.custom.revertBuffTurns) {
					if (targ.custom.revertBuffTurns[i][1] >= 0) targ.custom.revertBuffTurns[i] = ''
				}
				targ.custom.revertBuffTurns = targ.custom.revertBuffTurns.filter(x => x.length != 0);

				if (targ.custom.revertBuffTurns.length == 0) {
					killVar(targ, "revertBuffTurns");
				}
			}

			return `__${targ.name}__'s debuffs were nullified${change == 1 ? ' and buffed 1 time' : ''}!`;
		},
		getinfo(vars, skill) {
			return "Removes the target's debuffs"
		}
	}),

	heartswap: new Extra({
		name: "Heart Swap",
		desc: "Swaps the target's stat changes with the user's.",
		args: [],
		applyfunc(message, skill, args) {
			forceSingleTarget(skill);
			makeStatus(skill, "heartswap", [true]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			let charbuffs = objClone(char.buffs);
			let targbuffs = objClone(targ.buffs);
			char.buffs = objClone(targbuffs);
			targ.buffs = objClone(charbuffs);

			let charTurns = char?.custom?.buffTurns;
			let targTurns = char?.custom?.buffTurns;
			let charRevertBuffs = char?.custom?.revertBuffs;
			let targRevertBuffs = char?.custom?.revertBuffs;
			let charRevertTurns = char?.custom?.revertBuffTurns;
			let targRevertTurns = char?.custom?.revertBuffTurns;

			if (charTurns || charRevertBuffs || charRevertTurns) {
				if (!targ.custom) targ.custom = {};

				if (charTurns) targ.custom.buffTurns = charTurns;
				if (charRevertBuffs) targ.custom.revertBuffs = charRevertBuffs;
				if (charRevertTurns) targ.custom.revertBuffTurns = charRevertTurns;
			}
			if (targTurns || targRevertBuffs || targRevertTurns) {
				if (!char.custom) char.custom = {};

				if (targTurns) char.custom.buffTurns = targTurns;
				if (targRevertBuffs) char.custom.revertBuffs = targRevertBuffs;
				if (targRevertTurns) targ.custom.revertBuffTurns = targRevertTurns;
			}

			let addText = ''
			if (multiplier != 1) {
				let extraBuffChance = 10;
				extraBuffChance = Math.round(modSkillResult(char, targ, extraBuffChance, skill, btl) * multiplier);

				if (randNum(1, 100) <= extraBuffChance) {
					addText = 'and altered by 1 stage'
					for (i in char.buffs) { 
						buffStat(char, i, 1, true);
					}
					for (i in targ.buffs) { 
						buffStat(targ, i, char.team == targ.team ? 1 : -1, true);
					}
				}
			}

			return `__${char.name}__'s buffs were switched ${addText} with __${targ.name}__!`;
		},
		aithinker(char, targ, act, skill, btl) {
			for (let i in targ.buffs) {
				if (targ.buffs[i] > char.buffs[i]) act.points += targ.buffs[i]-char.buffs[i];
			}
		},
		getinfo(vars, skill) {
			return "Swaps user's **stat chances** with the target's"
		}
	}),

	mimic: new Extra({
		name: "Mimic",
		desc: "Morphs into an ally or an enemy of the user's choice for <Turns> turns. The user can change back with {Skill}.",
		args: [
			{
				name: "Turns",
				type: "Num",
				forced: true
			},
			{
				name: "Skill",
				type: "Word"
			}
		],
		applyfunc(message, skill, args) {
			let turns = args[0]
			let skillName = args[1]
			if (turns < 1) return void message.channel.send("You can't have less than 1 turn!");

			if (skillName && !skillFile[skillName]) return void message.channel.send("That's not a valid skill!");
			if (skillName && skillFile[skillName] && (!skillFile[skillName].statusses || (skillFile[skillName].statusses && !skillFile[skillName].statusses.unmimic))) return void message.channel.send("That skill can't unmimic people!");

			skill.target = 'one';
			makeStatus(skill, "mimic", [turns, skillName ?? null]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (char.id === targ.id) return '...But you cannot transform into yourself!';
			if (isBoss(targ)) return '...But it failed!';
			if (char.mimic || char.custom?.revert) return '...But it failed!';

			addCusVal(char, 'revert', [vars[0], {}, `__${char.name}__ stopped mimicking __${targ.name}__!`]);

			if (char.custom?.revert) {
				char.custom.revert[1].stats = objClone(char.stats);
				char.custom.revert[1].skills = char.skills;
				char.custom.revert[1].name = char.name;

				char.mimic = true;
				char.name = `${targ.name} (${char.name})`;
				char.stats = objClone(targ.stats);
				char.skills = targ.skills;
				if (vars[1]) char.skills.push(vars[1]);

				for (i in char.stats) {
					char.stats[i] = Math.round(modSkillResult(char, targ, char.stats[i], skill, btl) * multiplier);
				}

				return `__${char.name}__ begun mimicking __${targ.name}__, copying _stats and skills_.`
			} else {
				return '...but something went wrong...';
			}
		},
		getinfo(vars, skill) {
			return `Mimics **an ally or foe** for **${vars[0]}** turns`
		}
	}),

	unmimic: new Extra({
		name: "Unmimic",
		desc: "Will return the user to their original form.",
		args: [],
		applyfunc: function(message, skill, args) {
			makeStatus(skill, "unmimic", [true]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			delete char.mimic;
			if (char.custom?.revert) {
				char.stats = objClone(char.custom.revert[1].stats);
				char.skills = char.custom.revert[1].skills;
				char.name = char.custom.revert[1].name;
				let sotrue = char.custom.revert[2];
				delete char.custom.revert;

				char.hp = Math.round(modSkillResult(char, targ, char.hp, skill, btl) * multiplier);
				char.mp = Math.round(modSkillResult(char, targ, char.mp, skill, btl) * multiplier);

				return sotrue;
			} else {
				return '...but it failed!';
			}
		},
		getinfo(vars, skill) {
			return "Cancels the effect of a **mimic** skill used **beforehand**"
		}
	}),

	clone: new Extra({
		name: "Clone",
		desc: "Clones the user into a new ally with <HP Percent>% of Max HP, <MP Percent>% of Max MP, and <Percent>% of the user's stats.",
		args: [
			{
				name: "HP Percent",
				type: "Decimal",
				forced: true
			},
			{
				name: "MP Percent",
				type: "Decimal",
				forced: true
			},
			{
				name: "Percent",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let hpPercent = args[0]
			let mpPercent = args[1]
			let percent = args[2]

			if (hpPercent < 10) return void message.channel.send("The clone would be dead with such a low HP!");
			if (mpPercent < 10) return void message.channel.send("The clone wouldn't really be able to use skills if the one it cloned is a magic user!");
			if (percent < 10) return void message.channel.send("With such low stats, the clone would be useless!");

			skill.target = 'caster';
			makeStatus(skill, "clone", [hpPercent, mpPercent, percent]);
			return true;
		},
		canuse(char, skill, btl, vars) {
			let members = btl.teams[char.team].members
			
			if (members.some(member => member.clone)) return 'You cannot have more than one clone at a time!'
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			for (let ally of btl.teams[char.team].members) {
				if (ally.clone) return "...but it failed!";
			}

			let newchar = objClone(char);
			let hpPercent = vars[0];
			let mpPercent = vars[1];
			let percent = vars[2];

			newchar.clone = true;
			newchar.enemy = true;
			newchar.maxhp *= hpPercent/100;
			newchar.maxmp *= mpPercent/100;
			for (let i in newchar.stats) {
				newchar.stats[i] *= percent/100;
				newchar.stats[i] = Math.round(modSkillResult(char, targ, newchar.stats[i], skill, btl) * multiplier);
			}

			newchar.maxhp = Math.round(newchar.maxhp);
			newchar.maxmp = Math.round(newchar.maxmp);
			newchar.hp = newchar.maxhp;
			newchar.mp = newchar.maxmp;
			newchar.id = nextAvaliableId(btl);
			if (newchar.leader) delete newchar.leader;

			btl.teams[char.team].members.push(newchar);
			btl.turnorder = getTurnOrder(btl)
			return `__${char.name}__ created a clone of themselves.`;
		},
		getinfo(vars, skill) {
			return "Clones **the user**"
		}
	}),

	// MAKARAKARN, TETRAKARN AND SHIELD CANNOT STACK
	// beccause i dont know op i guess

	shield: new Extra({
		name: "Shield",
		desc: "Protects the target with an <Element> shield called <Shield Name> that can take {Hits} hits.",
		args: [
			{
				name: "Shield Name",
				type: "Word",
				forced: true
			},
			{
				name: "Element",
				type: "Word",
				forced: true
			},
			{
				name: "Hits",
				type: "Num",
			}
		],
		applyfunc(message, skill, args) {
			let shieldName = args[0]
			let element = args[1].toLowerCase()
			let hits = args[2] ?? 1

			if (shieldName.length < 1) return void message.channel.send("You need to name the shield!");
			if (!Elements.includes(element)) return void message.channel.send("That's not a valid element!");
			if (hits < 1) return void message.channel.send("The shield would be destroyed before it can even serve its purpose!");
			
			makeStatus(skill, "shield", [shieldName, element, hits]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (multiplier != 1) {
				let extraBuffChance = 10;
				extraBuffChance = Math.round(modSkillResult(char, targ, extraBuffChance, skill, btl) * multiplier);

				if (randNum(1, 100) <= extraBuffChance) {
					vars[2] += 1;
				}
			}

			addCusVal(targ, 'shield', {
				name: vars[0],
				element: vars[1],
				hp: vars[2]
			});

			if (btl.pvp) {
				return `__${char.name}__ protected __${targ.name}__ with something...`;
			} else {
				return `__${char.name}__ protected __${targ.name}__ with a __${vars[0]}__!`;
			}
		},
		getinfo(vars, skill) {
			return `Surrounds the target with a **shield named ${elementEmoji[vars[1]]}${vars[0]}** that will take **${vars[2]} hit${vars[2] == 1 ? '' : 's'}** to destroy`
		}
	}),

	karn: new Extra({
		name: "Karn",
		desc: "Protects the target with a shield that repels <Phys/Mag> attacks.",
		args: [
			{
				name: "Phys/Mag",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let phys = args[0].toLowerCase()

			if (!["phys", "mag"].includes(phys)) return void message.channel.send("That's not a valid type! The shield can only repel physical or magical attacks.");

			makeStatus(skill, "karn", [phys]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			addCusVal(targ, 'shield', {
				name: skill.name,
				type: `repel${vars[0]}`
			});

			if (multiplier != 1) {
				let extraBuffChance = 10;
				extraBuffChance = Math.round(modSkillResult(char, targ, extraBuffChance, skill, btl) * multiplier);

				if (randNum(1, 100) <= extraBuffChance) {
					targ.custom.shield.hp = 1;
				}
			}

			if (btl.pvp) {
				return `__${char.name}__ protected __${targ.name}__ with something...`;
			} else {
				return `__${char.name}__ protected __${targ.name}__ with a __${skill.name}__!`;
			}
		},
		aithinker(char, targ, act, skill, btl) {
			switch(skill.target) {
				case 'allopposing':
				case 'one':
					act.points -= 5;
					break;

				case 'ally':
				case 'allallies':
					act.target[0] = char.team;

					if (btl.teams[char.team].members[act.target[1]]) {
						let a = btl.teams[char.team].members[act.target[1]];
						if (!a.custom?.shield && a.hp <= a.maxhp/3) act.points += 3;
					}
					break;
			}
		},
		getinfo(vars, skill) {
			return `Surrounds the target with a **${vars[0] == "phys" ? "Tetra" : "Makara"}karn**`
		}
	}),

	shieldbreak: new Extra({
		name: "Shield Break",
		desc: "Has a <Chance>% chance to break the target's <Shield/Tetra/Makara>.",
		args: [
			{
				name: "Shield/Tetra/Makara",
				type: "Word",
				forced: true
			},
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let type = args[0].toLowerCase();
			let chance = args[1];

			if (!["shield", "tetra", "makara", 'all'].includes(type)) return void message.channel.send("That's not shield/tetra/makara!");
			if (chance < 1) return void message.channel.send("How would you break a shield with a less than 1% chance?");
			
			makeStatus(skill, "shieldbreak", [type, chance]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (!targ.custom?.shield) return 'But it failed!';

			vars[1] = modSkillResult(char, targ, vars[1], skill, btl) * multiplier;

			if (randNum(1, 100) <= vars[1]) {
				delete targ.custom.shield;
				return `__${targ.name}__ had their shield broken!`;
			}
		},
		getinfo(vars, skill) {
			const shield = vars[0]
			`Breaks the target's **${shield.charAt(0).toUpperCase() + shield.slice(1)}${shield.includes('ra') ? 'karn' : ''}**`
		}
	}),

	trap: new Extra({
		name: "Trap",
		desc: "Protects the target with a trap called <Trap Name> that is set off once a physical attack strikes them and multiplies power by <Power Multiplier>x, which should be a value less than one. Variables differ based on <Type>\n```diff\n+ Buff: Stat, Stages, Chance\n+ Status: Valid Status Effect, Chance\n+ Damage: Power, Accuracy, Element```",
		args: [
			{
				name: "Trap Name",
				type: "Word",
				forced: true
			},
			{
				name: "Power Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "Type",
				type: "Word",
				forced: true
			},
			{
				name: "Variable #1",
				type: "Word",
				forced: true,
				multiple: true
			}
		],
		applyfunc(message, skill, args) {
			let trapName = args[0]
			let powerMult = args[1]
			let type = args[2].toLowerCase()

			if (trapName.length < 1) return void message.channel.send("You need to name the trap!");
			if (!["buff", "status", "damage"].includes(type)) return void message.channel.send("That's not a valid trap type! The trap can only be a buff, status, or damage type.");

			if (type == "buff") {
				let stat = args[3].toLowerCase()
				let stages = (args[4] && parseInt(args[4])) ? parseInt(args[4]) : -1
				let chance = (args[5] && parseFloat(args[4])) ? parseFloat(args[4]) : 100

				if (![...stats, 'crit'].includes(stat)) return void message.channel.send("That's not a valid stat!");
				if (stages == 0) return void message.channel.send("You can't set a trap to have 0 stages!");
				if (Math.abs(stages) > 3) return void message.channel.send("The maximum amount of stages is 3!");
				if (chance <= 0) return void message.channel.send("The trap would be useless if it had a chance of 0%!");

				makeStatus(skill, "trap", [trapName, powerMult, type, stat, stages, chance]);
			} else if (type == "status") {
				let status = args[3].toLowerCase()
				let chance = (args[4] && parseFloat(args[4])) ? parseFloat(args[4]) : 100

				if (!statusEffects.includes(status)) return void message.channel.send("That's not a valid status effect!");
				if (chance <= 0) return void message.channel.send("The trap would be useless if it had a chance of 0%!");

				makeStatus(skill, "trap", [trapName, powerMult, type, status, chance]);
			} else if (type == "damage") {
				let power = (args[3] && parseInt(args[3])) ? parseInt(args[3]) : 60
				let accuracy = (args[4] && parseFloat(args[4])) ? parseFloat(args[4]) : 100
				let element = args[5] ? args[5].toLowerCase() : "strike"

				if (power < 1) return void message.channel.send("The trap would be useless if it had a power of less than 1!");
				if (accuracy <= 0) return void message.channel.send("The trap would be useless if it had an accuracy of 0%!");

				if (!Elements.includes(element)) return void message.channel.send("That's not a valid element!");
				if (element == "heal") return void message.channel.send("You can't set a trap to heal!");
				if (element == "status") return void message.channel.send("You can't set a trap to status!");
				if (element == "passive") return void message.channel.send("You can't set a trap to passive!");

				makeStatus(skill, "trap", [trapName, powerMult, type, power, accuracy, element]);
			}
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			addCusVal(targ, 'trap', vars, multiplier);

			if (btl.pvp) {
				return `__${char.name}__ protected __${targ.name}__ with something...`;
			} else {
				return `__${char.name}__ deployed a trap infront of __${targ.name}__: __${vars[0]}__!`;
			}
		},
		getinfo(vars, skill) {
			return "Sets up a **trap**"
		}
	}),

	changeaffinity: new Extra({
		name: "Change Affinity",
		desc: extrasList.changeaffinity.desc,
		args: extrasList.changeaffinity.args,
		multiple: true,
		diffflag: extrasList.changeaffinity.diffflag,
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
			if (['status', 'heal', 'passive', 'almighty'].includes(element))
				return void message.channel.send("This element cannot have an affinity!");
			if (side != 'weak' && side != 'resist' && side != 'both')
				return void message.channel.send("You entered an invalid value for <Weak/Resist/Both>! It can be either Weak, Resist, or Both.");
			if (turns && turns < 1)
				return void message.channel.send("You can't have a turn count less than 1!");
			makeStatus(skill, "changeaffinity", [target, element, affinity, side, turns]);
			return true
		},
		onselect(char, skill, btl, vars, multiplier) {
			return extrasList.changeaffinity.onselect(char, skill, btl, vars, multiplier);
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			return extrasList.changeaffinity.onuse(char, targ, skill, btl, vars, multiplier);
		},
		getinfo: extrasList.changeaffinity.getinfo
	}),

	weather: new Extra({
		name: "Weather",
		desc: "Changes the weather to <Weather>, which will affect the battle.",
		args: [
			{
				name: "Weather",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (!weathers.includes(args[0].toLowerCase())) return void message.channel.send("That's not a valid weather!");

			makeStatus(skill, "weather", [args[0].toLowerCase()]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (btl?.weather?.type) {
				btl.weather.type = vars[0];
				btl.weather.turns = Math.round(modSkillResult(char, targ, randNum(8, 16), skill, btl) * multiplier);
			} else {
				btl.weather = {
					type: vars[0],
					turns: Math.round(modSkillResult(char, targ, randNum(8, 16), skill, btl) * multiplier)
				}
			}
			return `The weather has been changed to __${vars[0]}__!`;
		},
		getinfo(vars, skill) {
			return `Changes **Weather** to **${vars[0]}**`
		}
	}),

	terrain: new Extra({
		name: "Terrain",
		desc: "Changes the terrain to <Terrain>, which will affect the battle.",
		args: [
			{
				name: "Terrain",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (!terrains.includes(args[0].toLowerCase())) return void message.channel.send("That's not a valid terrain!");

			makeStatus(skill, "terrain", [args[0].toLowerCase()]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (btl?.terrain?.type) {
				btl.terrain.type = vars[0];
				btl.terrain.turns = randNum(8, 16);
			} else {
				btl.terrain = {
					type: vars[0],
					turns: Math.round(modSkillResult(char, targ, randNum(8, 16), skill, btl) * multiplier)
				}
			}

			return `The terrain has been changed to __${vars[0]}__!`;
		},
		getinfo(vars, skill) {
			return `Changes **Terrain** to **${vars[0]}**`
		}
	}),

	corrupt: new Extra({
		name: "Corrupt",
		desc: "Has a chance to corrupt the foe, and make them work for your party for a few turns, the corrupted foe will be weaker and will constantly take damage. Corruption chance based on foe's HP and <Chance Stat>, the chance cannot be exceed 20%.",
		args: [
			{
				name: "Chance stat",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const stat = args[0].toLowerCase()
			if (!stats.includes(stat))
				return void message.channel.send("That's not a valid stat!");
			makeStatus(skill, "corrupt", [stat])
			return true
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (btl.pvp) return "...But it failed!";

			const stat = vars[0]
			let chance = ((targ.maxhp / targ.hp) / 5) * (char.stats[stat] / targ.stats[stat]) * (char.stats.luk / targ.stats.luk)
			chance = modSkillResult(char, targ, chance, skill, btl) * multiplier;
			let maxChance = 20;
			
			if (multiplier != 1) {
				let extraBuffChance = 10;
				extraBuffChance = Math.round(modSkillResult(char, targ, extraBuffChance, skill, btl) * multiplier);

				if (randNum(1, 100) <= extraBuffChance) {
					maxChance = 40;
				}
			}

			if (Math.random() * 100 <= Math.min(chance, maxChance)) {
				if (isBoss(targ)) {
					extrasList.buff.buffChange(targ, skill, btl, ["target", "all", -1, 100, 3])
					return `...but __${targ.name}__ is too strong to be corrupted completely, they are weakened instead!${chance < 1 ? "\n**Extremely lucky!**" : ""}`
				}
				targ.hp = 0
				const corrupted = objClone(targ)
				corrupted.hp = corrupted.maxhp
				addCusVal(corrupted, "pinch", true)
				corrupted.skills.push("Corrupted")
				btl.teams[char.team].members.push(corrupted)
				return `__${targ.name}__ was defeated and corrupted!${chance < 1 ? "\n**Extremely lucky!**" : ""}`
			}
			return "...but it failed!"
		},
		getinfo(vars, skill) {
			return `Attempts to corrupt the foe using **${vars[0].toUpperCase()}**`
		}
	}),

	reincarnate: new Extra({
		name: "Reincarnate",
		desc: "Summons a level <Level> reincarnate to the user's team. The reincarnate will have stats randomized between <Minimum of Stat> and <Maximum of Stat>, HP at <HP Percent>% of user's Max HP and MP at <Percent>% of user's Max HP. You also choose which skills the reincarnated has. You can add flair to this skill with a {Deploy Message}. These can use %PLAYER% to replace with the user, and %UNDEAD% to replace with the undead.",
		args: [
			{
				name: "Level",
				type: "Num",
				forced: true
			},
			{
				name: "Minimum of Stat",
				type: "Num",
				forced: true
			},
			{
				name: "Maximum of Stat",
				type: "Num",
				forced: true
			},
			{
				name: "HP Percent",
				type: "Decimal",
				forced: true
			},
			{
				name: "MP Percent",
				type: "Decimal",
				forced: true
			},
			{
				name: "Deploy Message",
				type: "Word"
			},
			{
				name: "Reincarnate Name",
				type: "Word"
			},
			{
				name: "High Stat",
				type: "Word"
			},
			{
				name: "Low Stat",
				type: "Word"
			},
			{
				name: "Randomize Affinities",
				type: "YesNo"
			},
			{
				name: "Scale stats with User Level",
				type: "YesNo"
			},
			{
				name: "Skill #1",
				type: "Word",
				forced: true,
				multiple: true
			},
		],
		applyfunc(message, skill, args) {
			const level = args[0];
			let min = args[1];
			let max = args[2];
			let hp = args[3];
			let mp = args[4];
			let deploy = (args[5] && args[5].toLowerCase() != 'none') ? args[5] : "%PLAYER% has summoned an undead %UNDEAD%";
			let name = args[6] ?? "Reincarnate";
			let highstat = args[7] ? args[7].toLowerCase() : "none";
			let lowstat = args[8] ? args[8].toLowerCase() : "none";
			let levelup = args[10] ?? false;
			let skills = args.slice(11);

			let settings = setUpSettings(message.guild.id)

			if (level < 1 || level > settings.caps.levelcap) return void message.channel.send("You can't have a level less than 1 or greater than " + settings.caps.levelcap + "!");
			if (min < 1) return void message.channel.send("Minimum of Stat must be at least 1!");
			if (max < 1) return void message.channel.send("Maximum of Stat must be at least 1!");
			if (max < min) return void message.channel.send("Maximum of Stat must be greater than or equal to Minimum of Stat!");
			if (hp <= 0) return void message.channel.send("HP Percent must be at least 1!");
			if (mp <= 0) return void message.channel.send("MP Percent must be at least 1!");
			if (deploy.length <= 0 || deploy.length > 500) return void message.channel.send("Deploy Message must be between 1 and 500 characters!");
			if (levelup && max > 10) return void message.channel.send(`If __{Scale stats with User Level}__ is set to true, __<Maximum of Stat>__ should not be set above **10**.`);

			if (![...stats, "none"].includes(highstat))
				return void message.channel.send(`${highstat} is not a valid stat. You may also enter "none".`);

			if (![...stats, "none", "all"].includes(lowstat))
				return void message.channel.send(`${highstat} is not a valid stat. You may also enter "all" or "none".`);

			skills.filter(skill => skillFile[skill] && (!skill.levellock || (skill.levellock && (!skill.levellock != 'unobtainable' && skill.levellock <= level))))

			if (skills.length < 1) return void message.channel.send("None of the skills you entered are valid! They either don't exist or their level lock is higher than the level chosen.");

			makeStatus(skill, "reincarnate", [min, max, hp, mp, deploy, skills, name, highstat, lowstat, args[9] ?? false, levelup, level]);
			return true;
		},
		canuse(char, skill, btl, vars) {
			let members = btl.teams[char.team].members;
			if (members.some(member => member.reincarnate)) return 'You cannot have more than one summon at a time!';
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			let newchar = objClone(char);
			const name = vars[6];

			newchar.reincarnate = true;
			newchar.name = name;
			newchar.truename = name;

			newchar.maxhp = Math.round(char.maxhp * vars[2]/100);
			newchar.maxmp = Math.round(char.maxmp * vars[3]/100);
			newchar.hp = newchar.maxhp;
			newchar.mp = newchar.maxmp;

			newchar.id = nextAvaliableId(btl);
			newchar.melee.name = 'Strike Attack'
			if (newchar.mpMeter) newchar.mpMeter = ['Mana Points', 'MP']
			if (newchar.nickname) newchar.nickname = ''
			if (newchar.leader) delete newchar.leader
			if (newchar.donetc) delete newchar.donetc
			for (let i in newchar.buffs) newchar.buffs[i] = 0;
			if (newchar.lbp) newchar.lbp = 0;
			if (newchar.pacify) newchar.pacify = 0;

			if (newchar.dreams) newchar.dreams = []
			if (newchar.negotiate) newchar.negotiate = []
			delete newchar.negotiateDefs

			for (let i in newchar.stats) {
				if (i == vars[7] || vars[7] == "all") {
					newchar.stats[i] = Math.round(modSkillResult(char, targ, randNum(vars[0] + ((vars[1]-vars[0])/2), vars[1]), skill, btl) * multiplier);
				} else if (i == vars[8] || vars[8] == "all") {
					newchar.stats[i] = Math.round(modSkillResult(char, targ, randNum(vars[0], vars[1] - ((vars[1]-vars[0])/2)), skill, btl) * multiplier);
				} else {
					newchar.stats[i] = Math.round(modSkillResult(char, targ, randNum(vars[0], vars[1]), skill, btl) * multiplier);
				}

				// some new hacks in the works
				if (vars[10]) {
					newchar.basestats[`base${i}`] = newchar.stats[i];
					updateStats(newchar, btl.guild.id, false);
					newchar.maxhp = Math.round(char.maxhp * vars[2]/100);
					newchar.maxmp = Math.round(char.maxmp * vars[3]/100);
					newchar.hp = newchar.maxhp;
					newchar.mp = newchar.maxmp;
				}
			}

			const varsToDelete = ['lb', 'quotes', 'armor', 'weapon', 'bio', 'trust', 'teamCombo', 'custom', 'statusaffinities', 'memory']
			for (let i in varsToDelete) newchar[varsToDelete[i]] = {}

			if (vars[9]) {
				newchar.affinities = {};
				const affinities = ["superweak", "weak", "weak", "weak", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "resist", "resist", "block", "repel", "drain"]
				for (const k in Elements) {
					if (Elements[k] != "heal" && Elements[k] != "status" && Elements[k] != "passive" && Elements[k] != "almighty"){
						let elementAffinity = Math.floor(Math.random() * (affinities.length-1))
						if (!newchar.affinities[affinities[elementAffinity]]) newchar.affinities[affinities[elementAffinity]] = [];
						if (affinities[elementAffinity] != "normal") {newchar.affinities[affinities[elementAffinity]].push(Elements[k])}
					}
				}

				let settings = setUpSettings(btl.guild.id)
				if (settings?.mechanics?.statusaffinities) {
					const affinities = ["weak", "weak", "weak", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "resist", "resist", "block"]
					for (const k in statusEffects) {
						if (statusEffects[k] != "infatuation" && statusEffects[k] != "mirror" && statusEffects[k] != "happy"){
							let elementAffinity = Math.floor(Math.random() * (affinities.length-1))
							if (!newchar.statusaffinities[affinities[elementAffinity]]) newchar.statusaffinities[affinities[elementAffinity]] = [];
							if (affinities[elementAffinity] != "normal") {newchar.statusaffinities[affinities[elementAffinity]].push(statusEffects[k])}
						}
					}
				}
			}

			let skills = vars[5]
			let skillChance = Math.floor(Math.random() * 100)
			let randomskill = skills[Math.floor(Math.random() * skills.length)]

			newchar.skills = []
			if (newchar.skills.length < 1) {
				skills.splice(skills.indexOf(randomskill), 1)
				newchar.skills.push(randomskill)
				randomskill = skills[Math.floor(Math.random() * skills.length)]
			}
			
			while (skillChance > 50 - (50 / (skills.length + 1)) && skills.length > 0) {
				skills.splice(skills.indexOf(randomskill), 1)
				newchar.skills.push(randomskill)
				skillChance = Math.floor(Math.random() * 100 - (100 / (skills.length + 1)))
				randomskill = skills[Math.floor(Math.random() * skills.length)]
			}

			//in case an enemy spawned a reincarnate
			newchar.type = 'none';
			newchar.enemy = true;
			newchar.automove = true;
			delete newchar.boss;
			delete newchar.bigboss;
			delete newchar.deity

			btl.teams[char.team].members.push(newchar);
			btl.turnorder = getTurnOrder(btl);
			char.forceskipturnorder = 2;
			return replaceTxt(vars[4], '%PLAYER%', `__${char.name}__`, '%UNDEAD%', name);
		},
		getinfo(vars, skill) {
			let txt = `Summons **an undead ally**`;

			if (vars[7] && vars[7] != "none") txt += `, prioritizing their **${vars[7].toUpperCase()}**`;
			if (vars[8] && vars[8] != "none") txt += `, minimizing **${vars[8].toUpperCase()}**`;

			return txt;
		}
	}),

	futuresight: new Extra({
		name: "Futuresight",
		desc: "This skill becomes an attacking skill that strikes the foe in <Turns>.",
		args: [
			{
				name: "Turns",
				type: "Num",
				forced: true
			},
			{
				name: "Power",
				type: "Num",
				forced: true
			},
			{
				name: "Accuracy",
				type: "Decimal",
				forced: true
			},
			{
				name: "Critical Hit Chance",
				type: "Decimal",
			},
			{
				name: "Hits",
				type: "Num",
				forced: true
			},
			{
				name: "Element",
				type: "Word",
				forced: true
			},
			{
				name: "Attack Type",
				type: "Word",
				forced: true
			},
			{
				name: "Status",
				type: "Word",
			},
			{
				name: "Status Chance",
				type: "Decimal",
			}
		],
		applyfunc(message, skill, args) {
			let turns = args[0];
			let power = args[1];
			let accuracy = args[2];
			let critChance = Math.max((args[3] ?? 0), 0);
			let hits = args[4];
			let element = args[5]?.toLowerCase();
			let atype = args[6]?.toLowerCase();
			let status = args[7] || "none";
			let statusChance = Math.min(Math.max((args[8] ?? 0), 0), 100);

			if (turns < 1) return void message.channel.send("Turns must be at least 1!");

			if (power < 1) return void message.channel.send('Counters with 0 power or less will not function!');

			if (accuracy < 1) return void message.channel.send('Counters with 0% accuracy or less will not function!');

			if (hits < 1) return void message.channel.send('Counters with 0 hits or less will not function!');

			if (!Elements.includes(element)) {
				return void message.channel.send({content: 'Please enter a valid element for **Element!**', embeds: [elementList()]})
			}
			if (element == 'passive' || element == 'heal' || element == 'status')
				return void message.channel.send("The counter must be an attack!");

			if (atype != 'physical' && atype != 'magic' && atype != 'ranged' && atype != 'sorcery') return void message.channel.send(`${atype} is an invalid form of contact! Try physical, magic or ranged.`);

			let definition = {
				name: skill.name,
				pow: power,
				acc: accuracy,
				crit: critChance,
				type: element,
				hits: hits,
				atktype: atype,
				turns: turns,
				target: skill.target
			}

			if (status != 'none') {
				if (!utilityFuncs.inArray(status, statusEffects)) {
					let str = `${status} is an invalid status effect! Please enter a valid status effect for **Status!**` + '```diff'
					for (let i in statusEffects) str += `\n-${statusEffects[i]}`;
					str += '```'

					return void message.channel.send(str)
				}

				definition.status = status;
				definition.statuschance = statusChance;
			}

			makeStatus(skill, "futuresight", [definition]);
			return true
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			let a = objClone(vars[0]);
			a.user = char.id;
			a.futuresight = true;

			a.pow = Math.round(modSkillResult(char, targ, a.pow, skill, btl) * multiplier);
			a.acc = modSkillResult(char, targ, a.acc, skill, btl) * multiplier;

			addCusVal(targ, 'futuresight', a);

			if (btl.pvp) {
				return `__${char.name}__ is preparing something...`;
			} else {
				return `__${char.name}__ is going to strike __${targ.name}__ in ${vars[0].turns} turns!`;
			}
		},
		getinfo(vars, skill) {
			const attackInfo = vars[0];
			return `Strikes with a **${attackInfo.type}** attack in **${attackInfo.turns}** turns`;
		}
	}),

	chaosstir: new Extra({
		name: "Chaos Stir",
		desc: "Upon getting hit with a skill, the user strikes back with the same skill with <Power Multiplier>x power and <Accuracy>% accuracy.",
		args: [
			{
				name: "Power Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "Accuracy",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let power = args[0];
			let accuracy = args[1];

			if (power < 1) return void message.channel.send("Power must be above 0!");
			if (accuracy < 1) return void message.channel.send("Accuracy must be above 0!");
			skill.target = 'caster';

			makeStatus(skill, "chaosstir", [power, accuracy]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			addCusVal(targ, 'chaosstir', [...vars, multiplier]);

			if (btl.pvp) {
				return `__${char.name}__ is preparing something...`;
			} else {
				return `__${char.name}__ assumes a defensive stance, ready to strike back.`;
			}
		},
		getinfo(vars, skill) {
			return `Attack back when hit, with a **${vars[1]}%** accuracy attack with **${vars[0]}x** power`
		}
	}),

	pacifystatus: new Extra({
		name: "Pacify Status",
		desc: "_<Status Effect> <Amount>_\nPacifies the target if they have <Status Effect>, by <Amount>. Accepts 'physical', 'mental', and 'all' as statuses.",
		args: [
			{
				name: "Status Effect",
				type: "Word",
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
			let status = args[0].toLowerCase();
			let amount = args[1];

			if (!status == "physical" && !status == "mental" && !status == "all") {
				if (!statusEffects.includes(status)) return void message.channel.send("That's not a valid status effect!");
			}

			if (amount == 0) return void message.channel.send("It won't change anything if you set the amount to 0!");

			makeStatus(skill, "pacifystatus", [status, amount]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (!targ.enemy) return 'But it failed!';

			vars[1] = Math.round(modSkillResult(char, targ, vars[1], skill, btl) * multiplier);

			if ((vars[0] === 'all' && char.status) || 
				(char.status && vars[0] === 'mental' && !isPhysicalStatus(char.status)) ||
				(char.status && vars[0] === 'physical' && isPhysicalStatus(char.status)) ||
				(char.status && char.status === vars[0]))
			{
				let finaltxt = `${targ.name} was pacified by ${skill.name}, by ${vars[1]}%.`;
				targ.pacify += vars[1];

				if (targ.pacify >= 100) {
					targ.pacified = true;
					if (targ.negotiateDefs) {
						let parties = setUpFile(`${dataPath}/json/${btl.guild.id}/parties.json`, true);

						if (parties[btl.teams[char.team].id]) {
							let party = parties[btl.teams[char.team].id];

							if (!party.negotiates) party.negotiates = {};
							party.negotiates[targ.name] = party.negotiates[targ.name] ? party.negotiates[targ.name]+1 : 1

							if (party.negotiates[targ.name] == targ.negotiateDefs.required) {
								finaltxt += 'and wants to join your team!';

								party.negotiateAllies[targ.name] = {
									nickname: targ.name,
									hp: Math.round(targ.hp/2),
									mp: Math.round(targ.mp/2),
									maxhp: Math.round(targ.maxhp/2),
									maxmp: Math.round(targ.maxmp/2),
									stats: targ.stats,

									skill: targ.negotiateDefs.qualities.skill,
									atkbuff: targ.negotiateDefs.qualities.atk,
									magbuff: targ.negotiateDefs.qualities.mag,
									endbuff: targ.negotiateDefs.qualities.end,

									happines: 255, // OKAY BUT WHAT IF WE COULD DO THIS TAMAGOCHI THING WITH PETS THATD BE SO SICK
									mood: 'happy', // YOU'D GET TO SEE THEIR MOOD AND SHIT
									food: 100, // AND FEED THEM
									// Although there wouldn't be no real punishment, maybe just a boost in damage output.
									// Things like being forced to tank Makarakarn and Tetrakarn before would now lower happiness or mood ect
								}
							} else {
								finaltxt += `and is satisfied!\n\n_(**${party.negotiates[targ.name]}/${targ.negotiateDefs.required}** ${targ.name}s pacified.)_`;
							}

							fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
						}
					} else {
						finaltxt += 'and stops attacking!';
					}
				}

				return finaltxt;
			} else {
				return 'But it failed!';
			}
		},
		getinfo(vars, skill) {
			let finalText = "Pacifies the target with "
			let status
			let amount
			for (let i in vars) {
				status = vars[i][0]
				amount = vars[i][1]
				finalText += `${statusEmojis[status]}**${status}**${amount >= 100 ? '' : ` by ${amount}%`}`
				if (i < vars.length - 2) {
					finalText += `, `
				} else if (i == vars.length - 2) {
					finalText += ` and `
				}
			}
			return finalText
		}
	}),

	ragesoul: new Extra({
		name: "Rage Soul",
		desc: "Multiplies the user's Melee Attack Power by <Melee Power Multiplier> and their Attack Stat by <ATK Stat Multiplier>, but locks them into using Melee Attacks. If <Turns> is set to 0 or below, this will be indefinite.",
		args: [
			{
				name: "Melee Power Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "ATK Stat Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: false
			}
		],
		applyfunc(message, skill, args) {
			makeStatus(skill, "ragesoul", [args[0], args[1], Math.max(args[2], 0) ?? 0]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			addCusVal(char, 'revert', [vars[2] == 0 ? -1 : vars[2], {
				stats: char.stats,
				melee: char.melee
			}]);
			addCusVal(char, 'forcemove', [vars[2] == 0 ? -1 : vars[2], {
				move: 'melee',
				//target: [],
			}]);

			char.melee.pow *= vars[1];
			char.stats.atk *= vars[1];
			char.melee.pow = modSkillResult(char, targ, char.melee.pow, skill, btl) * multiplier;
			char.stats.atk = modSkillResult(char, targ, char.stats.atk, skill, btl) * multiplier;

			char.ragesoul = true;

			if (btl.pvp) {
				return `__${char.name}__ is preparing something...`;
			} else {
				return `__${char.name}__'s attack and melee attack power is boosted... but they are locked into using them!`;
			}
		},
		getinfo(vars, skill) {
			return `Locks the user into using Melee Attacks with **${vars[0]}x Melee Power** and **x${vars[1]} ATK Stat Multiplier** ${vars[2] <= 0 ? '**indefinitely**' : `for **${vars[2]}** turns`}`
		}
	}),

	charge: new Extra({
		name: "Charge (SMT)",
		desc: "_(Not to be confused with Charges)_\nBoosts <Phys/Mag/Crit> damage by <Power Multiplier>x for one turn. Removed whether attacked or not.",
		args: [
			{
				name: "Phys/Mag/Crit",
				type: "Word",
				forced: true
			},
			{
				name: "Power Multiplier",
				type: "Decimal",
				forced: true
			}
		],
		multiple: true,
		diffflag: 0,
		applyfunc(message, skill, args) {
			let type = args[0].toLowerCase();
			let power = Math.min(100, parseFloat(args[1]));

			if (type != "phys" && type != "mag" && type != "crit") return void message.channel.send("That's not a valid type! Try Phys, Mag or Crit.");

			makeStatus(skill, "charge", [type, power]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			vars[1] = modSkillResult(char, targ, vars[1], skill, btl) * multiplier;

			addCusVal(char, 'charge', {
				stat: vars[0],
				mult: vars[1],
				toggle: false
			});

			if (vars[0] == 'crit') {
				if (vars[1] >= 100) {
					return `A **critical hit** from __${char.name}__ is **guaranteed** for one turn!`;
				} else {
					return `The **crit rate** of __${char.name}__'s skills were boosted by **${vars[1]}%** for one turn!`;
				}
			} else if (vars[0] == 'mag') {
				return `The power of __${char.name}__'s **magic skills** was boosted by **${vars[1]}%** for one turn!`;
			} else {
				return `The power of __${char.name}__'s **physical skills** was boosted by **${vars[1]}%** for one turn!`;
			}
		},
		getinfo(vars, skill) {
			let finalText = "Boosts "
			for (let i in vars) {
				let type = 'physical';
				if (vars[i][0] == 'mag') {
					type = 'magic';
				} else if (vars[i][0] == 'crit') {
					type = 'critical';
				}

				if (vars[i][1] >= 100 && type == 'critical') {
					finalText += `**${type}** chance by ∞%`
				} else if (type == 'critical') {
					finalText += `**${type}** chance by ${vars[i][1]}×`
				} else {
					finalText += `**${type}** damage by ${vars[i][1]}×`
				}

				if (i < vars.length - 1) {
					finalText += ` and `
				} else {
					finalText += ` for one turn`
				}
			}
			return finalText
		}
	}),

	orgiamode: new Extra({
		name: "Orgia Mode",
		desc: "Modifies user's ATK and MAG by <ATK & MAG Multiplier>x and END by <END Multiplier>x for <Turns> turns. Falls asleep afterwards.",
		args: [
			{
				name: "ATK & MAG Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "END Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (args[2] < 1) return void message.channel.send("Turns must be above 0!");

			makeStatus(skill, "orgiamode", [args[0], args[1], args[2]]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (char.custom?.orgiamode) return 'But it failed!';

			addCusVal(char, 'orgiamode', {
				turns: vars[2],
				revert: objClone(char.stats)
			});

			char.stats.atk = Math.round(modSkillResult(char, targ, Math.round(char.stats.atk*vars[0]), skill, btl) * multiplier);
			char.stats.mag = Math.round(modSkillResult(char, targ, Math.round(char.stats.mag*vars[0]), skill, btl) * multiplier);
			char.stats.end = Math.round(modSkillResult(char, targ, Math.round(char.stats.end*vars[1]), skill, btl) * multiplier);

			return `__${char.name}__'s attack and magic was multiplied by ${vars[0]}, however, their endurance was multiplied by ${vars[1]}.`;
		},
		getinfo(vars, skill) {
			return `Modifies user's ATK and MAG by **${vars[0]}**x and END by **${vars[1]}**x for **${vars[2]}** turns. Falls asleep afterwards`
		}
	}),

	psychoshift: new Extra({
		name: "Psycho Shift (Pokémon)",
		args: [],
		desc: extrasList.psychoshift.desc,
		applyfunc(message, skill, args) {
			makeStatus(skill, "psychoshift", [true]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (char.status && char.statusturns) {
				targ.status = char.status;
				targ.statusturns = char.statusturns;
				if (statusEffectFuncs[targ.status].oninflict) statusEffectFuncs[targ.status].oninflict(targ);

				if (multiplier != 1) {
					let extraBuffChance = 30;
					extraBuffChance = Math.round(modSkillResult(char, targ, extraBuffChance, skill, btl) * multiplier);

					if (randNum(1, 100) <= extraBuffChance) {
						targ.statusturns += 1;
					}
				}

				delete char.status;
				delete char.statusturns;
				return `__${char.name}__ transferred their **${targ.status}** to __${targ.name}__!`;
			}

			return 'But it failed!';
		},
		aithinker(char, targ, act, skill, btl, vars) {
			if (char.status) act.points += 2;
		},
		getinfo(vars, skill) {
			return extrasList.psychoshift.getinfo(vars, skill);
		}
	}),

	charges: new Extra({
		name: extrasList.charges.name,
		desc: extrasList.charges.desc,
		args: extrasList.charges.args,
		applyfunc(message, skill, args) {
			let charges = args[0]
			let rate = args[1] ?? 0
			if (charges < 1)
				return void message.channel.send("What's the point of a skill that you can never use?")
			makeStatus(skill, "charges", [charges, rate]);
			return true
		},
		canuse: extrasList.charges.canuse,
		onuse: extrasList.charges.onuse,
		getinfo: extrasList.charges.getinfo,
	}),

	burst: new Extra({
		name: "Burst (Original)",
		desc: "Cures the user's status effects, and gives a healverse-like effect. (HP regeneration)\nThis skill __should__ cost a decent amount.",
		args: [
			{
				name: "HPPercent",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			skill.target = 'caster';
			makeStatus(skill, "burst", [parseFloat(args[0])]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (!char.custom?.regenheal) addCusVal(char, "regenheal", {});
			if (!char.custom.regenheal[char.name]) char.custom.regenheal[char.name + '-' + skill.name] = [] //to not fuck up regens from multiple ppl to the same char with each other with any waiting ones

			delete char.status;
			delete char.statusturns;

			for (let i in statusEffectFuncs) {
				if (statusEffectFuncs[i].stackable && char[i]) delete char[i];
			}

			char.custom.regenheal[char.name + '-' + skill.name].push({
				name: skill.name,
				username: char.name,
				heal: Math.round((char.maxhp/100*vars[0]) * multiplier),
				turns: 4,
				type: 'hp',
				wait: false,
				pause: 0,
				first: false,
				user: char.id
			});

			return `__${char.name}__ has burst, curing their status effects, and is regenerating their **HP** by **${vars[0]}%** for **3 turns**!`;
		},
		getinfo(vars, skill) {
			return `**Cures status effects**, and causes regeneration by **${vars[0]}%**, for 3 turns`;
		}
	}),

	evasionboost: new Extra({
		name: "Evasion Boost (Original)",
		desc: "When this skill is used you have a <Chance%> to dodge <Atk Type> skills <Activation Limit> times for <Turns> turns. Additionally, you <Can [not] act during evasion state>.",
		args: [
			{
				name: "Atk Type",
				type: "Word",
				forced: true
			},
			{
				name: "Chance%",
				type: "Num",
				forced: true
			},
			{
				name: "Activation Limit",
				type: "Num"
			},
			{
				name: "Turns",
				type: "Num"
			},
			{
				name: "Can act during evasion state",
				type: "YesNo"
			},
			{
				name: "User/Target",
				type: "Word"
			},
		],
		applyfunc(message, skill, args) {
			let element = args[0].toLowerCase();
			let chance = args[1] ?? 100;
			let activation = args[2] ?? 1;
			let turns = args[3] ?? 1;
			let canact = args[4] ?? false;
			let target = args[5] ?? 'user';

			if (![...Elements, 'all', 'physical', 'magic', 'ranged', 'sorcery'].includes(element)) return void message.channel.send("You entered an invalid type for <Atk Type>.");
			if (chance <= 0 || chance > 100) return void message.channel.send("You entered an invalid value for <Chance%>. This should be a value above 0 and below 100.");
			if (activation <= 0) return void message.channel.send("You entered an invalid value for <Activation Limit>.");
			if (turns <= 0) return void message.channel.send("You entered an invalid value for <Turns>.");
			if (target && target.toLowerCase() != 'user' && target.toLowerCase() != 'target') return void message.channel.send("You entered an invalid value for <User/Target>. This should be either 'user' or 'target'.");

			makeStatus(skill, "evasionboost", [element, chance, activation, turns, canact, target.toLowerCase()]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (vars[5] && vars[5] == 'target') {
				if (targ.custom?.evasionstate) return `__${targ.name}__ already is in an evasive state...`;

				addCusVal(targ, 'evasionstate', {
					name: skill.name,
					element: vars[0],
					chance: vars[1],
					activation: vars[2],
					turns: vars[3],
					canact: vars[4],
				});

				return `__${targ.name}__ has enabled an evasive state!`;
			} else {
				if (char.custom?.evasionstate) return `...But it failed!`;

				addCusVal(char, 'evasionstate', {
					name: skill.name,
					element: vars[0],
					chance: vars[1],
					activation: vars[2],
					turns: vars[3],
					canact: vars[4],
				});

				return `__${char.name}__ has entered an evasive state!`;
			}
		},
		getinfo(vars, skill) {
			return `Target enters evasive state for **${vars[3]} turns**, **${Math.round(vars[1])}% chance to dodge ${vars[0]} skills ${vars[2]} time(s)**`
		}
	}),

	simplebeam: new Extra({
		name: "Simple Beam (Pokémon)",
		desc: "Gives the target the specified skill for {Turns} turns, or until the battle ends.",
		args: [
			{
				name: "Skill",
				type: "Word",
				forced: true
			},
			{
				name: "Turns",
				type: "Num"
			},
			{
				name: "User/Target",
				type: "Word"
			},
			{
				name: "Chance",
				type: "Decimal"
			}
		],
		applyfunc(message, skill, args) {
			let skillName = args[0];
			let turns = args[1] ?? 0;
			let target = args[2] ? args[2].toLowerCase() : 'target';
			let chance = args[3] ?? 100;

			if (!skillFile[skillName]) return void message.channel.send(`${skillName} is not a valid skill!`);
			if (skillFile[skillName] == skill) return void message.channel.send("You can't use this skill.");
			if (skillFile[skillName].statusses?.simplebeam) return void message.channel.send("You can't use this skill.");
			if (target != 'user' && target != 'target') return void message.channel.send("<User/Target> must either be set to 'User' or 'Target'.");
			if (chance < 0) return void message.channel.send(`The **{Chance}** must be above 0%. ${chance}% does not apply.`);
			if (chance > 100) chance = 100;

			makeStatus(skill, "simplebeam", [skillName, turns, target, chance]);
			return true;
		},
		onselect(char, skill, btl, vars, multiplier) {
			let skillFile = setUpFile(`${dataPath}/json/skills.json`, true);
			let str = "";

			if (vars[3] && vars[3] < 100) {
				if (randNum(1000) > vars[3]*10) {
					return "But it failed...";
				}
			}

			if (vars[2] && vars[2] === 'user') {
				let skillnum = char.skills.length;
				char.skills.push(vars[0]);

				str = `__${char.name}__ has been given _${getFullName(skillFile[vars[0]])}_`;

				if (vars[1] > 0) {
					if (!char.custom?.simplebeam) addCusVal(char, "simplebeam", []);
					char.custom.simplebeam.push([skillnum, vars[1]+1, getFullName(skillFile[vars[0]])]);
					str += `, for _**${vars[1]}** turns_`;
				}
			}

			return `${str}!`;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			let skillFile = setUpFile(`${dataPath}/json/skills.json`, true);
			let str = "";

			if (vars[3] && vars[3] < 100) {
				if (randNum(1000) > vars[3]*10) {
					return "But it missed...";
				}
			}

			if (!vars[2] || vars[2] != 'user') {
				let skillnum = targ.skills.length;
				targ.skills.push(vars[0]);

				str = `__${targ.name}__ has been given _${getFullName(skillFile[vars[0]])}_`;

				if (vars[1] > 0) {
					if (!targ.custom?.simplebeam) addCusVal(targ, "simplebeam", []);
					targ.custom.simplebeam.push([skillnum, vars[1]+1, getFullName(skillFile[vars[0]])]);
					str += `, for _**${vars[1]}** turns_`;
				}
			}

			return `${str}!`;
		},
		getinfo(vars, skill) {
			let skillFile = setUpFile(`${dataPath}/json/skills.json`, true);

			let chance = "";
			if (vars[3] && vars[3] >= 100)
				chance = "Guaranteed to";
			else
				chance = `${vars[3]}% chance to`;

			let str = `${chance} give the __${vars[2] ?? "target"}__ a skill called **_${getFullName(skillFile[vars[0]])}_**`;
			if (vars[1] > 0) str += ` for **${vars[1]} turns**`;

			return str;
		}
	}),

	forcemsg: new Extra({
		name: "Force Message (Original)",
		desc: "A message will be displayed in a specific situation instead of the default message. Situations may include 'OnUse', 'OnBuff', and 'OnDebuff'. You can use %USER%, and %ENEMY% to replace these values with the specified ones.",
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
			},
			{
				name: "No Effect Message",
				type: "YesNo",
			}
		],
		applyfunc(message, skill, args) {
			let situation = args[0].toLowerCase();

			if (!['onuse', 'onbuff', 'ondebuff'].includes(situation))
				return void message.channel.send(`${args[0]} is an invalid situation. Please enter one of the following:\n- OnUse\n- OnBuff\n- OnDebuff`);

			makeStatus(skill, "forcemsg", [situation, args[1], args[2] ?? false]);
			return true
		},
		getinfo(vars, skill) {
			return '*Has a custom message.*';
		}
	}),

	disable: new Extra({
		name: "Disable (Pokémon)",
		desc: "The target is unnable to use their last move.",
		args: [],
		applyfunc(message, skill, args) {
			makeStatus(skill, "disable", [true]);
			return true;
		},
		onuse(char, targ, skill, btl, vars, multiplier) {
			if (!targ.lastskill) return "...But it failed!";

			addCusVal(targ, 'disable', [targ.lastskill, 5]);
			return `__${targ.name}__ has been disabled from using ${skillFile[targ.lastskill].name}!`;
		},
		getinfo(vars, skill) {
			return "Target **disabled** from using last skill"
		}
	}),
}

// Make a status type for a skill. "func" should be an array of 1-5 values indicating what the extra does.
function makeStatus(skill, extra, func) {
	if (!skill.statusses) skill.statusses = {};
	if (!skill.statusses[extra]) skill.statusses[extra] = [];

	if (statusList[extra].multiple) {
		/*if (statusList[extra].diffflag) {
			for (i in skill.statusses[extra]) {
				if (typeof skill.statusses[extra][i] == "number") {
					if (skill.statusses[extra][i][statusList[extra].diffflag] === func[statusList[extra].diffflag]) {
						skill.statusses[extra][i] = func;
						return true;
					}
				} else {
					let alltrue = true;
					for (j in statusList[extra].diffflag) {
						if (skill.statusses[extra][i][statusList[extra].diffflag[j]] !== func[statusList[extra].diffflag[j]]) {
							alltrue = false;
							break;
						}
					}
					if (alltrue) {
						skill.statusses[extra][i] = func;
						return true;
					}
				}
			}
		}*/
		skill.statusses[extra].push(func);
	} else {
		skill.statusses[extra] = func;
	}
}

// Checks if the skill has an extra
// just realise we dont need this either
hasStatus = (skill, extra) => {
	if (!skill.statusses) return false;
	if (!skill.statusses[extra]) return false;
	return skill.statusses[extra];
}

// Apply Extra Effects to an existing skill using the extrasList above.
applyStatus = (message, skill, skillExtra, rawargs, lb) => {
	if (!skill.statusses) skill.statusses = {};
	if (!skillExtra || !statusList[skillExtra]) return message.channel.send("You're adding an invalid extra! Use the ''liststatusextras'' command to list all extras.");

	if (lb) {
		if (!statusList[skillExtra].apply(message, skill, rawargs.slice(3), statusList[skillExtra].name)) return false;
	} else {
		if (!statusList[skillExtra].apply(message, skill, rawargs, statusList[skillExtra].name)) return false;
	}

	message.react('👍')
	skill.done = true;
	console.log("win")
	return true;
}

buildStatus = (message, extra, args, lb) => {
	let skill = {};

	if (!extra) {
		message.channel.send("No extra was supplied.\n\n_This is likely a bug. Please submit to the Blossom Battler discord server._")
		return false;
	}

	if (statusList?.[extra]?.unregsiterable && !utilityFuncs.RPGBotAdmin(message.author.id)) {
		message.channel.send(`You lack permissions to apply ${statusList[extra].name} for this skill.`)
		return false;
	}

	if (lb) {
		skill = {
			name: args[1],
			level: args[2],
			class: args[3].toLowerCase(),
			cost: args[4],
			limitbreak: true,
			target: args[6],
			originalAuthor: message.author.id
		}

		applyStatus(message, skill, extra.toLowerCase(), args.slice(8));
	} else {
		skill = {
			name: args[0],
			type: 'status',
			cost: args[1],
			costtype: args[2].toLowerCase(),
			target: args[3],
			originalAuthor: message.author.id
		}

		applyStatus(message, skill, extra.toLowerCase(), args.slice(6));
	}
	
	if (skill && skill.done) {
		delete skill.done;
		return skill;
	} else {
		return false
	}
}

// Ah you know what
// This file shares names with Status Effects anyway lol
// We might as well shove some extra stuff in here
// statusEffectFuncs will be an object that doe ufnnye status
let phys = ['burn', 'freeze', 'petrified', 'stun', 'bleed', 'paralyze', 'toxin', 'dazed', 'hunger', 'blind', 'irradiation', 'mirror', 'dragonscale', 'airborne', 'cloud9', 'drenched', 'stagger', 'shrouded', 'dissolved', 'doomed', 'weakened', 'grassimped', 'dry', 'wet', 'light', 'heavy', 'enchanted', 'invisible', 'blessed', 'chilled', 'overheat', 'stuffed', 'disabled', 'brimstone', 'tired', 'energized', 'haste', 'dispelled', 'cursed', 'neutralized', 'trisagion'];
isPhysicalStatus = (status) => {
	if (!status) return false;

	return phys.includes(status.toLowerCase());
}

let stackable = ['confusion', 'infatuation', 'drenched', 'shrouded', 'blessed', 'lovable', 'light', 'heavy', 'dry', 'wet', 'doomed', 'weakened', 'overheat', 'chilled', 'target', 'cursed', 'neutralized', 'dispelled', 'unstable'];
isStackableStatus = (status) => {
	if (!status) return false;

	return stackable.includes(status.toLowerCase());
}

let positive = ['mirror', 'dragonscale', 'airborne', 'cloud9', 'happy', 'blessed', 'brave', 'lovable', 'energized', 'haste'];
isPositiveStatus = (status) => {
	if (!status) return false;

	return positive.includes(status.toLowerCase());
}

let neutral = ['dry', 'wet', 'light', 'heavy', 'enchanted', 'invisible', 'chilled', 'overheat', 'brimstone', 'neutralized', 'trisagion'];
isNeutralStatus = (status) => {
	if (!status) return false;

	return neutral.includes(status.toLowerCase());
}

statusEffectFuncs = {
	burn: {
		endturn: function(btl, char) {
			let statusTxt = '';
			let affinityTxt = '';

			let dmg = Math.round(char.maxhp/10)
			if (isBoss(char)) dmg = 5;

			if (hasStatusAffinity(char, 'burn', 'weak')) {
				dmg *= 2;
				affinityTxt = affinityEmoji.weak;
			} else if (hasStatusAffinity(char, 'burn', 'resist')) {
				dmg /= 2;
				affinityTxt = affinityEmoji.resist;
			}

			char.hp = Math.max(1, char.hp-Math.round(dmg));
			
			return `${char.name} took ${dmg}${affinityTxt} damage from their burns!`
		},
		statmod: function(char, stats) {
			if (isBoss(char)) return stats;
			if (hasStatusAffinity(char, 'burn', 'weak')) {
				stats.atk /= 4;
			} else if (hasStatusAffinity(char, 'burn', 'resist')) {
				stats.atk /= 1.25;
			} else {
				stats.atk /= 2;
			}

			return stats;
		}
	},

	toxin: {
		endturn: function(btl, char) {
			let statusTxt = '';
			let affinityTxt = '';

			let dmg = Math.round(char.maxhp/10)
			if (isBoss(char)) dmg = 5;

			if (hasStatusAffinity(char, 'toxin', 'weak')) {
				dmg *= 2;
				affinityTxt = affinityEmoji.weak;
			} else if (hasStatusAffinity(char, 'toxin', 'resist')) {
				dmg /= 2;
				affinityTxt = affinityEmoji.resist;
			}

			char.hp = Math.max(1, char.hp-dmg);
			return `${char.name} took ${dmg}${affinityTxt} damage from their toxin!`;
		},
		statmod: function(char, stats) {
			if (isBoss(char)) return stats;

			if (hasStatusAffinity(char, 'toxin', 'weak')) {
				stats.mag /= 4;
			} else if (hasStatusAffinity(char, 'toxin', 'resist')) {
				stats.mag /= 1.25;
			} else {
				stats.mag /= 2;
			}

			return stats;
		}
	},

	bleed: {
		endturn: function(btl, char) {
			let statusTxt = '';
			let affinityTxt = '';

			let dmg = Math.round(char.maxhp/10)
			if (isBoss(char)) dmg = 10;

			if (hasStatusAffinity(char, 'bleed', 'weak')) {
				dmg *= 2;
				affinityTxt = affinityEmoji.weak;
			} else if (hasStatusAffinity(char, 'bleed', 'resist')) {
				dmg /= 2;
				affinityTxt = affinityEmoji.resist;
			}

			char.hp = Math.max(0, char.hp-dmg);
			if (char.hp <= 0) return `${char.name} took ${dmg}${affinityTxt} damage from their bleeding, being defeated!`;

			return `${char.name} took ${dmg}${affinityTxt} damage from their bleeding!`;
		}
	},

	dissolved: {
		endturn: function(btl, char) {
			let statusTxt = '';
			let affinityTxt = '';

			let dmg = Math.round(char.maxhp/10);
			let chance = 10;

			if (isBoss(char)) dmg = 5;

			if (hasStatusAffinity(char, 'dissolved', 'weak')) {
				dmg *= 2;
				affinityTxt = affinityEmoji.weak;
				chance = 20;
			} else if (hasStatusAffinity(char, 'dissolved', 'resist')) {
				dmg /= 2;
				affinityTxt = affinityEmoji.resist;
				chance = 5;
			}

			char.hp = Math.max(1, char.hp-Math.round(dmg));

			let text = `${char.name} took ${dmg}${affinityTxt} damage from their caustic burns.`;

			if (!isBoss(char) && char?.curarmor && !char.curarmor?.disabled && randNum(1, 100) <= chance) {
				let boost = {
					atk: char.curarmor.atk ?? 0,
					mag: char.curarmor.mag ?? 0,
					end: char.curarmor.end ?? 0,
					agl: char.curarmor.agl ?? 0
				}
				for (let i in boost) {
					if (char.basestats[i] > 7) boost[i] = Math.round(boost[i]*0.75);
					char.stats[i] -= boost[i];
				}
		
				if (char.curarmor.skill) char.skills.splice(char.skills.lastIndexOf(char.curarmor.skill), 1);
		
				// Wrong Armor Class Drawbacks
				if (char.armorclass === 'none' && char.curarmor.class) {
					if (char.curarmor.class === "light") {
						char.stats.end = Math.max(1, char.stats.end+Math.round(char.level/10));
					} else if (char.curarmor.class === "heavy") {
						char.stats.agl = Math.max(1, char.stats.agl+Math.round(char.level/8));
					} else if (char.curarmor.class === "magic") {
						char.stats.atk = Math.max(1, char.stats.atk+Math.round(char.level/10));
					}
				}

				char.curarmor.disabled = true;

				text += `\n\n${char.name}'s ${char.curarmor.type ? elementEmoji[char.curarmor.type] : ''}${classEmoji.armor[char.curarmor.class ?? 'none']}__${char.curarmor.name}__ has been dissolved!`;
			}

			return text;
		},
		statmod: function(char, stats) {
			if (isBoss(char)) return stats;
			if (hasStatusAffinity(char, 'dissolved', 'weak')) {
				stats.end /= 4;
			} else if (hasStatusAffinity(char, 'dissolved', 'resist')) {
				stats.end /= 1.25;
			} else {
				stats.end /= 2;
			}

			return stats;
		}
	},

	freeze: {
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'freeze', 'weak'))
				char.statusturns = 2;
			else
				char.statusturns = 1;
		},
		onturn: function(btl, char) {
			if (isBoss(char)) {
				delete char.status;
				delete char.statuschance;
				return `${char.name} thaws out!`;
			}

			let chance = 100;
			if (hasStatusAffinity(char, 'freeze', 'resist')) chance = 50;

			if (randNum(1, 100) <= chance)
				return [`${char.name} is frozen, losing their turn!`, false];
			else {
				delete char.status;
				delete char.statuschance;
				return `${char.name} thaws out!`;
			}
		}
	},

	petrified: {
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'petrified', 'weak'))
				char.statusturns = 3;
			else if (hasStatusAffinity(char, 'petrified', 'resist'))
				char.statusturns = 1;
			else
				char.statusturns = 2;
		},
		onremove: function(btl, char) {
			DiscordEmbed = new Discord.MessageEmbed()
				.setColor("#ff1fa9")
				.setTitle(`${char.name}'s turn!`)
				.setDescription(`${char.name} breaks out!`);
			btl.channel.send({embeds: [DiscordEmbed]});
		},
		onturn: function(btl, char) {
			if (isBoss(char)) {
				delete char.status;
				delete char.statuschance;
				return `${char.name} breaks out!`;
			}

			return [`${char.name} is petrified, losing their turn!`, false];
		},
		dmgmod: function(btl, targ, dmg, skill, emojitxt) {
			if (hasStatusAffinity(targ, 'petrified', 'weak'))
				dmg *= 0.97;
			else if (hasStatusAffinity(targ, 'petrified', 'resist'))
				dmg *= 0.95;
			else
				dmg *= 0.96;

			return dmg;
		},
		critmod: function(btl, targ, critRate, skill) {
			if (hasStatusAffinity(targ, 'petrified', 'weak'))
				critRate *= 1.4;
			else if (hasStatusAffinity(targ, 'petrified', 'resist'))
				critRate *= 1.1;
			else
				critRate *= 1.2;

			return critRate;
		}
	},

	stun: {
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'stun', 'weak'))
				char.statusturns = 2;
			else
				char.statusturns = 1;
		},
		onturn: function(btl, char) {
			if (isBoss(char)) {
				delete char.status;
				delete char.statuschance;
				return `__${char.name}__ shakes the <:stun:1225850856021168200>**stun** off!`;
			}

			let chance = 100;
			if (hasStatusAffinity(char, 'stun', 'resist')) chance = 50;

			if (randNum(1, 100) <= chance)
				return [`__${char.name}__ is stunned, losing their turn!`, false];
			else {
				delete char.status;
				delete char.statuschance;
				return `__${char.name}__ shakes the <:stun:1225850856021168200>**stun** off!`;
			}
		}
	},

	paralyze: {
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'paralysis', 'weak')) {
				char.parachance = 160;
				char.statusturns = 5;
			} else if (hasStatusAffinity(char, 'paralysis', 'resist')) {
				char.parachance = 40;
				char.statusturns = 4;
			} else {
				char.parachance = 80;
				char.statusturns = 3;
			}
		},
		onremove: function(btl, char) {
			delete char.parachance
		},
		onturn: function(btl, char) {
			if (isBoss(char)) {
				delete char.status;
				delete char.statuschance;
				return `${char.name} shook off the paralysis.`;
			}

			if (randNum(1, 100) <= char.parachance) {
				char.parachance /= 2;
				return [`${char.name} is stopped in their tracks by paralysis, losing their turn!`, false];
			} else {
				char.parachance /= 2;
			}
		}
	},

	sleep: {
		forceturns: 1,
		onturn: function(btl, char) {
			if (char.statusturns <= 0) {
				delete char.status;
				delete char.statusturns;
				return `${char.name} woke up!`;
			}

			let hp = Math.round(char.maxhp/20);
			let mp = Math.round(char.maxmp/20);
			if (hasStatusAffinity(char, 'sleep', 'resist')) {
				hp *= 2
				mp *= 2
			}

			if (!isBoss(char)) {
				if (!hasStatusAffinity(char, 'sleep', 'weak')) {
					char.hp = Math.min(char.maxhp, char.hp+hp);
					char.mp = Math.min(char.maxmp, char.mp+mp);
					return [`${char.name} is asleep. They are able to restore ${hp}HP and ${mp}${char.mpMeter ? char.mpMeter[1] : "MP"}!`, false];
				} else {
					return [`${char.name} is in a deep sleep...`, false];
				}
			} else {
				return `${char.name} is a little drowsy...`;
			}
		}
	},

	dizzy: {
		onturn: function(btl, char) {
			return `${char.name} is dizzy!`;
		},
		skillmod: function(char, skill, btl) {
			skill.acc /= 2;
			skill.nomod = {
				acc: true
			};
		}
	},

	despair: {
		endturn: function(btl, char) {
			let statusTxt = '';
			let affinityTxt = '';

			let dmg = Math.round(char.maxmp/10)
			if (isBoss(char)) dmg = 10;

			if (hasStatusAffinity(char, 'despair', 'weak')) {
				dmg *= 2;
				affinityTxt = affinityEmoji.weak;
			} else if (hasStatusAffinity(char, 'despair', 'resist')) {
				dmg /= 2;
				affinityTxt = affinityEmoji.resist;
			}

			char.mp = Math.max(0, char.mp-dmg);
			if (char.mp <= 0) {
				char.hp = 0;
				return `${char.name} lost ${dmg}${affinityTxt}${char.mpMeter ? char.mpMeter[1] : "MP"} from their despair, running out of ${char.mpMeter ? char.mpMeter[1] : "MP"} and therefore being defeated!`;
			}

			return `${char.name} lost ${dmg}${affinityTxt}${char.mpMeter ? char.mpMeter[1] : "MP"} from their despair!`;
		}
	},

	brainwash: {
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'brainwash', 'weak')) {
				char.statusturns = 3;
			} else if (hasStatusAffinity(char, 'brainwash', 'resist')) {
				char.statusturns = 1;
			} else {
				char.statusturns = 2;
			}
		},
		turnoverride: function(btl, char) {
			if (isBoss(char)) {
				DiscordEmbed = new Discord.MessageEmbed()
					.setColor("#ff1fa9")
					.setTitle(`${char.name}'s turn!`)
					.setDescription(`${char.name} shakes it off immediately!`);
				btl.channel.send({embeds: [DiscordEmbed]});

				delete char.status;
				delete char.statusturns;
				return true;
			}

			let skillFile = setUpFile(`${dataPath}/json/skills.json`, true);
			
			let usableskills = [];
			for (let i in char.skills) {
				if (canUseSkill(char, skillFile[char.skills[i]], char.skills[i], btl)) usableskills.push(char.skills[i]);
			}
			
			if (usableskills.length <= 0) {
				let dmg = char.stats.atk + (-8 + randNum(16));

				DiscordEmbed = new Discord.MessageEmbed()
					.setColor(elementColors[char.mainElement] ?? elementColors.strike)
					.setTitle(`${char.name} => Self`)
					.setDescription(`__${char.name}__ has no usable skills! __${char.name}__ strikes themselves, taking ${dmg} damage!`);
				btl.channel.send({embeds: [DiscordEmbed]});
				
				char.hp -= dmg;
				return false;
			}

			let skill = usableskills[randNum(usableskills.length-1)];
			let skillDefs = objClone(skillFile[skill]);

			// Flip the skill's target.
			let targFlip = {
				one: 'ally',
				ally: 'one',
				caster: 'caster',
				allopposing: 'allallies',
				allallies: 'allopposing',
				randomopposing: 'randomallies',
				randomallies: 'randomopposing',
				random: 'random',
				everyone: 'everyone',
				randomspread: 'randomspread',
				randomwidespread: 'randomwidespread',
				spreadopposing: 'spreadallies',
				spreadallies: 'spreadopposing',
				randomspreadopposing: 'randomspreadallies',
				randomspreadallies: 'randomspreadopposing',
				widespreadopposing: 'widespreadallies',
				widespreadallies: 'widespreadopposing',
				randomwidespreadopposing: 'randomwidespreadallies',
				randomwidespreadallies: 'randomwidespreadopposing'
			}

			if (!skillDefs.target)
				skillDefs.target = 'ally';
			else
				skillDefs.target = targFlip[skillDefs.target];

			let result = {
				move: 'skills',
				index: skill,
				target: [char.team, randNum(btl.teams[char.team].members.length-1)],
			}

			useSkill(char, btl, result, skillDefs);
			return false;
		}
	},

	fear: {
		onturn: function(btl, char) {
			if (isBoss(char)) {
				delete char.status;
				delete char.statuschance;
				return `${char.name} shook off the fear!`;
			}

			let chance = 50;
			if (hasStatusAffinity(char, 'fear', 'weak')) chance = 75;
			if (hasStatusAffinity(char, 'fear', 'resist')) chance = 25;

			if (randNum(1, 100) <= chance) {
				if (chance != 75) {
					delete char.status;
					delete char.statuschance;
				}
				return [`${char.name} is stopped in their tracks by fear, losing their turn!`, false];
			}
		}
	},

	rage: {
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'rage', 'weak')) {
				char.statusturns = 3;
			} else if (hasStatusAffinity(char, 'rage', 'resist')) {
				char.statusturns = 1;
			} else {
				char.statusturns = 2;
			}
		},
		onremove(btl, char) {
			killVar(char, 'forcemove');
		},
		turnoverride(btl, char) {
			if (isBoss(char)) {
				DiscordEmbed = new Discord.MessageEmbed()
					.setColor("#ff1fa9")
					.setTitle(`${char.name}'s turn!`)
					.setDescription(`${char.name} shakes it off immediately!`);
				btl.channel.send({embeds: [DiscordEmbed]});

				delete char.status;
				delete char.statusturns;
				killVar(char, 'forcemove');
				return true;
			}

			let targs = [];
			let team = {};
			let targ = {};
			for (let i in btl.teams) {
				team = btl.teams[i];
				for (let k in team.members) {
					targ = team.members[k];
					if (targ.hp > 0 && targ.id != char.id) targs.push([i, k]);
				}
			}

			let randnum = randNum(0, targs.length-1)

			let result = {move: 'melee', index: 0, target: [randnum[0], randnum[1]]};
			addCusVal(char, 'forcemove', [char.statusturns, result]);
		}
	},

	ego: {
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'ego', 'weak')) {
				char.statusturns = 5;
			} else if (hasStatusAffinity(char, 'ego', 'resist') || isBoss(char)) {
				char.statusturns = 1;
			} else {
				char.statusturns = 3;
			}
		},
		hardcoded: true
	},

	silence: {
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'silence', 'weak')) {
				char.statusturns = 3;
			} else if (hasStatusAffinity(char, 'silence', 'resist') || isBoss(char)) {
				char.statusturns = 1;
			} else {
				char.statusturns = 2;
			}
		},
		hardcoded: true
	},

	dazed: {
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'dazed', 'weak')) {
				char.statusturns = 3;
			} else if (hasStatusAffinity(char, 'dazed', 'resist') || isBoss(char)) {
				char.statusturns = 1;
			} else {
				char.statusturns = 2;
			}
		},
		hardcoded: true
	},

	hunger: {
		opposite: ['stuffed'],
		statmod: function(char, stats) {
			if (hasStatusAffinity(char, 'hunger', 'weak')) {
				stats.atk /= 4;
				stats.mag /= 4;
			} else if (hasStatusAffinity(char, 'hunger', 'resist')) {
				stats.atk /= 1.5;
				stats.mag /= 1.5;
			} else {
				stats.atk /= 2;
				stats.mag /= 2;
			}

			return stats;
		}
	},

	infatuation: {
		stackable: true,
		opposite: ['guilt'],
		onturn: function(btl, char) {
			if (randNum(1, 100) <= 50) return [`${char.name} is stopped in their tracks by lust, losing their turn!`, false];
		},
	},

	guilt: {
		stackable: true,
		opposite: ['infatuation'],
		onturn: function(btl, char) {
			if (randNum(1, 100) <= 50) return [`${char.name} is held back by guilt...`, false];
		},
	},

	blind: {
		statmod: function(char, stats) {
			if (hasStatusAffinity(char, 'blind', 'weak')) {
				stats.agl /= 4;
				stats.prc /= 4;
			} else if (hasStatusAffinity(char, 'blind', 'resist')) {
				stats.agl /= 1.5;
				stats.prc /= 1.5;
			} else {
				stats.agl /= 2;
				stats.prc /= 2;
			}

			return stats;
		}
	},

	confusion: {
		stackable: true,
		onturn: function(btl, char) {
			if (randNum(1, 100) <= 50) {
				let dmg = Math.max(1, randNum(char.stats.atk-10, char.stats.atk+10));
				char.hp -= dmg;

				let txt = `${char.name} is confused! They hit themselves in confusion, taking ${dmg} damage`;

				if (char.hp <= 0) {
					txt += ' and was defeated!';
					char.hp = 0;
				} else {
					txt += '!';
				}

				return [txt, false];
			} else {
				return `${char.name} is confused...`;
			}
		}
	},

	irradiation: {
		oninflict: function(char) {
			char.originalstats = objClone(char.stats);

			if (hasStatusAffinity(char, 'irradiation', 'weak')) {
				char.statusturns = 5;
			} else if (hasStatusAffinity(char, 'irradiation', 'resist')) {
				char.statusturns = 1;
			}
		},
		onremove: function(btl, char) {
			char.stats = objClone(char.originalstats);
			delete char.originalstats;
		},
		onturn: function(btl, char) {
			let statswap = [];
			let swapnum = hasStatusAffinity(char, 'irradiation', 'weak') ? 3 : 2;

			for (let i = 0; i < swapnum; i++) {
				let stat = stats[randNum(stats.length-1)];
				while (statswap.includes(stat)) stat = stats[randNum(stats.length-1)];

				statswap.push(stat);
			}

			let newarray = objClone(statswap);
			newarray.sort(() => Math.random() - 0.5);

			for (let i in statswap) {
				char.stats[statswap[i]] = char.originalstats[newarray[i]];
			}

			return `${swapnum} of ${char.name}'s stats have been __randomised__!`;
		}
	},

	sensitive: {
		onremove: function(btl, char) {
			killVar(char, 'sensitive');
		},
		oninflict: function(char) {
			char.originalstats = objClone(char.stats);

			if (hasStatusAffinity(char, 'sensitive', 'resist') || isBoss(char)) {
				char.statusturns = 1;
			} else char.statusturns = 2;

			addCusVal(char, 'sensitive', (hasStatusAffinity(char, 'sensitive', 'weak') && !isBoss(char) ? [1,1] : [1]));
		},
		hardcoded: true
	},

	happy: {
		opposite: ['apathy'],
		statmod: function(char, stats) {
			stats.prc -= char.level/10;
			if (hasStatusAffinity(char, 'happy', 'weak')) {
				stats.agl += char.level/7;
				stats.luk += char.level/7;
			} else if (hasStatusAffinity(char, 'happy', 'resist')) {
				stats.agl += char.level/15;
				stats.luk += char.level/15;
			} else {
				stats.agl += char.level/10;
				stats.luk += char.level/10;
			}

			return stats;
		}
	},

	mirror: {
		hardcoded: true,
		onturn: function(btl, char) {
			return [`${char.name} is encased in a mirror.`, false];
		}
	},

	dragonscale: {
		hardcoded: true,
		onturn: function(btl, char) {
			return [`${char.name} is encased in a magnificent dragon scales... far too heavy to move.`, false];
		}
	},

	airborne: {
		hardcoded: true,
		skillmod: function(char, skill, btl) {
			if (skill.atktype == 'physical' || skill.atktype == 'sorcery') skill.pow *= 2;
		}
	},

	cloud9: {
		hardcoded: true,
		skillmod: function(char, skill, btl) {
			if (skill.atktype == 'magic') skill.pow *= 2;
		}
	},

	drenched: {
		stackable: true,
		hardcoded: true,
		forceturns: 3,
	},

	stagger: {
		forceturns: 3,
		hardcoded: true
	},

	blessed: {
		opposite: ['cursed', 'neutralized'],
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'blessed', 'resist')) {
				char.blessed = 2;
			} else if (hasStatusAffinity(char, 'blessed', 'weak')) {
				char.blessed = 4;
			} else {
				char.blessed = 3;
			}

			let negStatuses = statusEffects.filter(x => !positive.includes(x) && !neutral.includes(x));
			for (stat of negStatuses) {
				if (char.status && char.status == stat) {
					delete char.status;
					delete char.statusturns;
				}
				if (char[stat]) delete char[stat];
			}
		},
		stackable: true,
		hardcoded: true,
	},

	cursed: {
		opposite: ['blessed', 'neutralized'],
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'cursed', 'resist')) {
				char.cursed = 2;
			} else if (hasStatusAffinity(char, 'cursed', 'weak')) {
				char.cursed = 4;
			} else {
				char.cursed = 3;
			}

			let negStatuses = statusEffects.filter(x => positive.includes(x));
			for (stat of negStatuses) {
				if (char.status && char.status == stat) {
					delete char.status;
					delete char.statusturns;
				}
				if (char[stat]) delete char[stat];
			}
		},
		stackable: true,
		hardcoded: true,
	},

	neutralized: {
		opposite: ['cursed', 'blessed'],
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'neutralized', 'resist')) {
				char.neutralized = 2;
			} else if (hasStatusAffinity(char, 'neutralized', 'weak')) {
				char.neutralized = 4;
			} else {
				char.neutralized = 3;
			}

			let negStatuses = statusEffects.filter(x => x != 'neutralized');
			for (stat of negStatuses) {
				if (char.status && char.status == stat) {
					delete char.status;
					delete char.statusturns;
				}
				if (char[stat]) delete char[stat];
			}
		},
		stackable: true,
		hardcoded: true,
	},

	dispelled: {
		forceturns: 3,
		stackable: true,
		hardcoded: true,
	},

	shrouded: {
		forceturns: 3,
		hardcoded: true,
		stackable: true,
	},

	insanity: {
		oninflict: function(char) {
			char.statusturns = (isBoss(char)) ? 1 : 3;
		},
		onremove(btl, char) {
			DiscordEmbed = new Discord.MessageEmbed()
				.setColor("#ff1fa9")
				.setTitle(`${char.name}'s turn!`)
				.setDescription(`${char.name} is brought back to clarity!`+(char.hp <= 0?`\n...And is defeated!\n${selectQuote(targ, 'death', null, "%ENEMY%", char.name, "%SKILL%", skill.name)}`:''));
			btl.channel.send({embeds: [DiscordEmbed]});
		},
		turnoverride: function(btl, char) {
			let actionTable = [];

			if (!isBoss(char)) {
				if (hasStatusAffinity(char, 'insanity', 'resist')) actionTable = ['skip'];
				else if (hasStatusAffinity(char, 'insanity', 'normal')) actionTable = ['skip', 'brainwash'];
				else actionTable = ['skip', 'brainwash', 'action'];
			} else {
				if (hasStatusAffinity(char, 'insanity', 'resist')) actionTable = [];
				else if (hasStatusAffinity(char, 'insanity', 'normal')) actionTable = ['skip'];
				else actionTable = ['skip', 'brainwash'];
			}

			if (actionTable.length == 0) {
				delete char.status;
				delete char.statusturns;

				DiscordEmbed = new Discord.MessageEmbed()
					.setColor("#ff1fa9")
					.setTitle(`${char.name}'s turn!`)
					.setDescription(`...But it failed! ${isBoss(char) ? `${char.name} shakes it off immediately!` : ''}`);
				btl.channel.send({embeds: [DiscordEmbed]});
				return true;
			}

			var act = actionTable[Math.floor(Math.random() * (actionTable.length-1+0.99))]; //that 0.99 is for ABSOLUTE even chances

			switch (act) {
				case 'brainwash':
					let skillFile = setUpFile(`${dataPath}/json/skills.json`, true);
			
					let usableskills = [];
					for (let i in char.skills) {
						if (canUseSkill(char, skillFile[char.skills[i]], char.skills[i], btl)) usableskills.push(char.skills[i]);
					}
					
					if (usableskills.length <= 0) {
						DiscordEmbed = new Discord.MessageEmbed()
							.setColor("#ff1fa9")
							.setTitle(`${char.name}'s turn!`)
							.setDescription(`...But it failed!`);
						btl.channel.send({embeds: [DiscordEmbed]});
						return false;
					}

					let skill = usableskills[randNum(usableskills.length-1)];
					let skillDefs = objClone(skillFile[skill]);

					let targRandom = {
						one: 'random',
						ally: 'random',
						caster: 'random',
						allopposing: (randNum(1) == 0 ? 'allopposing' : 'allallies'),
						allallies: (randNum(1) == 0 ? 'allallies' : 'allopposing'),
						randomopposing: 'random',
						randomallies: 'random',
						random: 'random',
						everyone: 'everyone',
						randomspread: 'randomspread',
						randomwidespread: 'randomwidespread',
						spreadopposing: 'randomspread',
						spreadallies: 'randomspread',
						randomspreadopposing: 'randomspread',
						randomspreadallies: 'randomspread',
						widespreadopposing: 'randomwidespread',
						widespreadallies: 'randomwidespread',
						randomwidespreadopposing: 'randomwidespread',
						randomwidespreadallies: 'randomwidespread'
					}

					if (!skillDefs.target)
						skillDefs.target = 'random';
					else
						skillDefs.target = targRandom[skillDefs.target];

					let result = {
						move: 'skills',
						index: skill,
						target: [char.team, randNum(btl.teams[char.team].members.length-1)],
					}

					useSkill(char, btl, result, skillDefs);
					break;
				case 'action':
					let skillDefine = {};

					switch (Math.floor(Math.random() * 2.99)) { //Hear me out. 0-0.99 is result 0, 1-1.99 is result 1, and 2-2.99 is result 2. Balanced!
						case 0: //Buff random enemy
							skillDefine = {
								"name": "Insanity Action: Buff",
								"type": "status",
								"cost": 0,
								"costtype": "mp",
								"target": "randomopposing",
								"statusses": {
									"buff": [
										[
											"target",
											"random",
											1,
											100
										],
									]
								},
							};
							break;
						case 1: //Debuff user
							skillDefine = {
								"name": "Insanity Action: Hinder",
								"type": "status",
								"cost": 0,
								"costtype": "mp",
								"target": "caster",
								"statusses": {
									"buff": [
										[
											"user",
											"random",
											-1,
											100
										],
									]
								},
							};
							break;
						case 2: //Heal Random Target
							skillDefine = {
								"name": "Insanity Action: Heal",
								"cost": 0,
								"costtype": "mp",
								"type": "heal",
								"target": "random",
								"heal": {
									"powerheal": [
										[
											50,
											"hp",
											"atk",
											"end"
										]
									]
								},
							}
							break;
					}

					let resultDefine = {
						move: 'skills',
						index: 0,
						target: [char.team, randNum(btl.teams[char.team].members.length-1)],
					}
					useSkill(char, btl, resultDefine, skillDefine);
					break;
				case 'skip':
					DiscordEmbed = new Discord.MessageEmbed()
						.setColor("#ff1fa9")
						.setTitle(`${char.name}'s turn!`)
						.setDescription(`${char.name} cannot comprehend what's going on, losing their turn!`);
					btl.channel.send({embeds: [DiscordEmbed]});
					break;
			}

			return false;
		}
	},

	brave: {
		opposite: ['apathy'],
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'brave', 'resist')) {
				char.statusturns = 2;
			} else if (hasStatusAffinity(char, 'brave', 'weak')) {
				char.statusturns = 4;
			} else {
				char.statusturns = 3;
			}
		},
		lbgain: function(char, targ, skill, lbgain, btl) {
			if (hasStatusAffinity(char, 'brave', 'resist')) {
				lbgain = Math.round(lbgain*1.25);
			} else if (hasStatusAffinity(char, 'brave', 'weak')) {
				lbgain = Math.round(lbgain*1.75);
			} else {
				lbgain = Math.round(lbgain*1.5);
			}
		}
	},

	apathy: {
		opposite: ['brave', 'happy'],
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'apathy', 'weak')) {
				char.statusturns = 4;
			} else if (hasStatusAffinity(char, 'apathy', 'resist')) {
				char.statusturns = 2;
			} else {
				char.statusturns = 3;
			}
		},
		lbgain: function(char, targ, skill, lbgain, btl) {
			if (hasStatusAffinity(char, 'apathy', 'weak')) {
				lbgain = Math.round(lbgain*0.25);
			} else if (hasStatusAffinity(char, 'apathy', 'resist')) {
				lbgain = Math.round(lbgain*0.75);
			} else {
				lbgain = Math.round(lbgain*0.5);
			}
		}
	},

	// this code is so lazy but it probably works lmao.
	wet: {
		stackable: true,
		forceturns: 3,
		opposite: ["dry"],
		dmgmod: function(btl, targ, dmg, skill, emojitxt) {
			if (hasStatusAffinity(targ, 'wet', 'weak')) {
				if (typeof skill.type === "object") {
					if (skill.type.includes("ice") || skill.type.includes("electric")) {
						dmg = Math.round(dmg*1.75);
						emojitxt += statusEmojis.wet;
					} else if (skill.type.includes("fire") || skill.type.includes("nuclear")) {
						dmg = Math.round(dmg*0.75);
					}
				} else {
					if (skill.type === "ice" || skill.type === "electric") {
						dmg = Math.round(dmg*1.75);
						emojitxt += statusEmojis.wet;
					} else if (skill.type === "fire" || skill.type === "nuclear") {
						dmg = Math.round(dmg*0.75);
					}
				}
			} else if (hasStatusAffinity(targ, 'wet', 'resist')) {
				if (typeof skill.type === "object") {
					if (skill.type.includes("ice") || skill.type.includes("electric")) {
						dmg = Math.round(dmg*1.25);
						emojitxt += statusEmojis.wet;
					} else if (skill.type.includes("fire") || skill.type.includes("nuclear")) {
						dmg = Math.round(dmg/4);
					}
				} else {
					if (skill.type === "ice" || skill.type === "electric") {
						dmg = Math.round(dmg*1.25);
						emojitxt += statusEmojis.wet;
					} else if (skill.type === "fire" || skill.type === "nuclear") {
						dmg = Math.round(dmg/4);
					}
				}
			} else {
				if (typeof skill.type === "object") {
					if (skill.type.includes("ice") || skill.type.includes("electric")) {
						dmg = Math.round(dmg*1.5);
						emojitxt += statusEmojis.wet;
					} else if (skill.type.includes("fire") || skill.type.includes("nuclear")) {
						dmg = Math.round(dmg/2);
					}
				} else {
					if (skill.type === "ice" || skill.type === "electric") {
						dmg = Math.round(dmg*1.5);
						emojitxt += statusEmojis.wet;
					} else if (skill.type === "fire" || skill.type === "nuclear") {
						dmg = Math.round(dmg/2);
					}
				}
			}

			return [dmg, emojitxt];
		}
	},

	dry: {
		stackable: true,
		forceturns: 3,
		opposite: ["wet"],
		dmgmod: function(btl, targ, dmg, skill, emojitxt) {
			if (hasStatusAffinity(targ, 'dry', 'weak')) {
				if (typeof skill.type === "object") {
					if (skill.type.includes("fire") || skill.type.includes("earth")) {
						dmg = Math.round(dmg*1.75);
						emojitxt += statusEmojis.dry;
					} else if (skill.type.includes("ice") || skill.type.includes("electric")) {
						dmg = Math.round(dmg*0.75);
					}
				} else {
					if (skill.type === "fire" || skill.type === "earth") {
						dmg = Math.round(dmg*1.75);
						emojitxt += statusEmojis.dry;
					} else if (skill.type === "ice" || skill.type === "electric") {
						dmg = Math.round(dmg*0.75);
					}
				}
			} else if (hasStatusAffinity(targ, 'dry', 'resist')) {
				if (typeof skill.type === "object") {
					if (skill.type.includes("fire") || skill.type.includes("earth")) {
						dmg = Math.round(dmg*1.25);
						emojitxt += statusEmojis.dry;
					} else if (skill.type.includes("ice") || skill.type.includes("electric")) {
						dmg = Math.round(dmg/4);
					}
				} else {
					if (skill.type === "fire" || skill.type === "earth") {
						dmg = Math.round(dmg*1.25);
						emojitxt += statusEmojis.dry;
					} else if (skill.type === "ice" || skill.type === "electric") {
						dmg = Math.round(dmg/4);
					}
				}
			} else {
				if (typeof skill.type === "object") {
					if (skill.type.includes("fire") || skill.type.includes("earth")) {
						dmg = Math.round(dmg*1.5);
						emojitxt += statusEmojis.dry;
					} else if (skill.type.includes("ice") || skill.type.includes("electric")) {
						dmg = Math.round(dmg/2);
					}
				} else {
					if (skill.type === "fire" || skill.type === "earth") {
						dmg = Math.round(dmg*1.5);
						emojitxt += statusEmojis.dry;
					} else if (skill.type === "ice" || skill.type === "electric") {
						dmg = Math.round(dmg/2);
					}
				}
			}

			return [dmg, emojitxt];
		}
	},

	light: {
		opposite: ['heavy'],
		stackable: true,
		forceturns: 3,
		dmgmod: function(btl, targ, dmg, skill, emojitxt) {
			if (hasStatusAffinity(targ, 'light', 'weak')) {
				if (typeof skill.type === "object") {
					if (skill.type.includes("wind") || skill.type.includes("explode")) {
						dmg = Math.round(dmg*1.75);
						emojitxt += statusEmojis.light;
					} else if (skill.type.includes("earth") || skill.type.includes("strike")) {
						dmg = Math.round(dmg*0.75);
					}
				} else {
					if (skill.type === "wind" || skill.type === "explode") {
						dmg = Math.round(dmg*1.75);
						emojitxt += statusEmojis.light;
					} else if (skill.type === "earth" || skill.type === "strike") {
						dmg = Math.round(dmg*0.75);
					}
				}
			} else if (hasStatusAffinity(targ, 'light', 'resist')) {
				if (typeof skill.type === "object") {
					if (skill.type.includes("wind") || skill.type.includes("explode")) {
						dmg = Math.round(dmg*1.25);
						emojitxt += statusEmojis.light;
					} else if (skill.type.includes("earth") || skill.type.includes("strike")) {
						dmg = Math.round(dmg/4);
					}
				} else {
					if (skill.type === "wind" || skill.type === "explode") {
						dmg = Math.round(dmg*1.25);
						emojitxt += statusEmojis.light;
					} else if (skill.type === "earth" || skill.type === "strike") {
						dmg = Math.round(dmg/4);
					}
				}
			} else {
				if (typeof skill.type === "object") {
					if (skill.type.includes("wind") || skill.type.includes("explode")) {
						dmg = Math.round(dmg*1.5);
						emojitxt += statusEmojis.light;
					} else if (skill.type.includes("earth") || skill.type.includes("strike")) {
						dmg = Math.round(dmg/2);
					}
				} else {
					if (skill.type === "wind" || skill.type === "explode") {
						dmg = Math.round(dmg*1.5);
						emojitxt += statusEmojis.light;
					} else if (skill.type === "earth" || skill.type === "strike") {
						dmg = Math.round(dmg/2);
					}
				}
			}

			return [dmg, emojitxt];
		}
	},

	heavy: {
		opposite: ['light'],
		stackable: true,
		forceturns: 3,
		dmgmod: function(btl, targ, dmg, skill, emojitxt) {
			if (hasStatusAffinity(targ, 'heavy', 'weak')) {
				if (typeof skill.type === "object") {
					if (skill.type.includes("earth") || skill.type.includes("strike")) {
						dmg = Math.round(dmg*1.75);
						emojitxt += statusEmojis.heavy;
					} else if (skill.type.includes("wind") || skill.type.includes("explode")) {
						dmg = Math.round(dmg*0.75);
					}
				} else {
					if (skill.type === "earth" || skill.type === "strike") {
						dmg = Math.round(dmg*1.75);
						emojitxt += statusEmojis.heavy;
					} else if (skill.type === "wind" || skill.type === "explode") {
						dmg = Math.round(dmg*0.75);
					}
				}
			} else if (hasStatusAffinity(targ, 'heavy', 'resist')) {
				if (typeof skill.type === "object") {
					if (skill.type.includes("earth") || skill.type.includes("strike")) {
						dmg = Math.round(dmg*1.25);
						emojitxt += statusEmojis.heavy;
					} else if (skill.type.includes("wind") || skill.type.includes("explode")) {
						dmg = Math.round(dmg/4);
					}
				} else {
					if (skill.type === "earth" || skill.type === "strike") {
						dmg = Math.round(dmg*1.25);
						emojitxt += statusEmojis.heavy;
					} else if (skill.type === "wind" || skill.type === "explode") {
						dmg = Math.round(dmg/4);
					}
				}
			} else {
				if (typeof skill.type === "object") {
					if (skill.type.includes("earth") || skill.type.includes("strike")) {
						dmg = Math.round(dmg*1.5);
						emojitxt += statusEmojis.heavy;
					} else if (skill.type.includes("wind") || skill.type.includes("explode")) {
						dmg = Math.round(dmg/2);
					}
				} else {
					if (skill.type === "earth" || skill.type === "strike") {
						dmg = Math.round(dmg*1.5);
					} else if (skill.type === "wind" || skill.type === "explode") {
						dmg = Math.round(dmg/2);
					}
				}
			}

			return [dmg, emojitxt];
		}
	},

	enchanted: {
		hardcoded: true,
		opposite: ['invisible'],
		forceturns: 2,
		dmgmod: function(btl, targ, dmg, skill, emojitxt) {
			if (skill.atktype === "physical" || skill.atktype === "ranged") {
				let mult = 2;

				if (hasStatusAffinity(targ, 'enchanted', 'weak')) {
					mult = 3;
				} else if (hasStatusAffinity(targ, 'enchanted', 'resist')) {
					mult = 1.5;
				}

				dmg = Math.round(dmg*mult);
				emojitxt += statusEmojis.enchanted;
			}
			return [dmg, emojitxt];
		}
	},

	invisible: {
		hardcoded: true,
		opposite: ['enchanted'],
		forceturns: 2,
		dmgmod: function(btl, targ, dmg, skill, emojitxt) {
			if (skill.atktype === "magic" || skill.atktype === "sorcery") {
				let mult = 2;

				if (hasStatusAffinity(targ, 'invisible', 'weak')) {
					mult = 3;
				} else if (hasStatusAffinity(targ, 'invisible', 'resist')) {
					mult = 1.5;
				}

				dmg = Math.round(dmg*mult);
				emojitxt += statusEmojis.invisible;
			}

			return [dmg, emojitxt];
		}
	},

	doomed: {
		stackable: true,
		opposite: ['weakened'],
		forceturns: 3,
		dmgmod: function(btl, targ, dmg, skill, emojitxt) {
			if ((typeof skill.type === "object" && skill.type.includes("bless")) || (skill.type === "bless")) {
				let mult = 1.5;

				if (hasStatusAffinity(targ, 'doomed', 'weak')) {
					mult = 2;
				} else if (hasStatusAffinity(targ, 'doomed', 'resist')) {
					mult = 1.25;
				}

				dmg = Math.round(dmg*mult);
				emojitxt += statusEmojis.doomed;
			}

			return [dmg, emojitxt];
		},
		statmod: function(char, stats) {
			if (isBoss(char)) return stats;

			if (hasStatusAffinity(char, 'doomed', 'resist')) {
				stats.end *= 0.75;
			} else {
				stats.end /= 2;
			}

			return stats;
		}
	},

	weakened: {
		stackable: true,
		opposite: ['doomed'],
		forceturns: 3,
		dmgmod: function(btl, targ, dmg, skill, emojitxt) {
			if ((typeof skill.type === "object" && skill.type.includes("curse")) || (skill.type === "curse")) {
				let mult = 1.5;

				if (hasStatusAffinity(targ, 'weakened', 'weak')) {
					mult = 2;
				} else if (hasStatusAffinity(targ, 'weakened', 'resist')) {
					mult = 1.25;
				}

				dmg = Math.round(dmg*mult);
				emojitxt += statusEmojis.weakened;
			}

			return [dmg, emojitxt];
		},
		statmod: function(char, stats) {
			if (isBoss(char)) return stats;

			if (hasStatusAffinity(char, 'weakened', 'resist')) {
				stats.atk *= 0.75;
			} else {
				stats.atk /= 2;
			}

			return stats;
		}
	},

	grassimped: {
		forceturns: 2,
		onturn: function(btl, char) {
			if (isBoss(char)) {
				delete char.status;
				delete char.statuschance;
				return `${char.name} magically returns to their normal form.`;
			}

			return [`${char.name} tries to waddle around... but as a **Grassimp**, they cannot do much.`, false];
		}
	},

	lovable: {
		hardcoded: true,
		stackable: true,
		opposite: ['target'],
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'lovable', 'weak')) {
				char.lovable = 3;
			} else if (hasStatusAffinity(char, 'lovable', 'resist')) {
				char.lovable = 1;
			} else {
				char.lovable = 2;
			}
		}
	},

	target: {
		hardcoded: true,
		stackable: true,
		opposite: ['lovable'],
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'target', 'weak')) {
				char.target = 3;
			} else if (hasStatusAffinity(char, 'target', 'resist')) {
				char.target = 1;
			} else {
				char.target = 2;
			}
		}
	},

	chilled: {
		stackable: true,
		forceturns: 3,
		opposite: ["overheat"],
		dmgmod: function(btl, targ, dmg, skill, emojitxt) {
			if (hasStatusAffinity(targ, 'chilled', 'weak')) {
				if (typeof skill.type === "object") {
					if (skill.type.includes("ice") || skill.type.includes("water")) {
						dmg = Math.round(dmg*1.75);
						emojitxt += statusEmojis.chilled;
					} else if (skill.type.includes("fire") || skill.type.includes("grass")) {
						dmg = Math.round(dmg*0.75);
					}
				} else {
					if (skill.type === "ice" || skill.type === "water") {
						dmg = Math.round(dmg*1.75);
						emojitxt += statusEmojis.chilled;
					} else if (skill.type === "fire" || skill.type === "grass") {
						dmg = Math.round(dmg*0.75);
					}
				}
			} else if (hasStatusAffinity(targ, 'chilled', 'resist')) {
				if (typeof skill.type === "object") {
					if (skill.type.includes("ice") || skill.type.includes("water")) {
						dmg = Math.round(dmg*1.25);
						emojitxt += statusEmojis.chilled;
					} else if (skill.type.includes("fire") || skill.type.includes("grass")) {
						dmg = Math.round(dmg/4);
					}
				} else {
					if (skill.type === "ice" || skill.type === "water") {
						dmg = Math.round(dmg*1.25);
						emojitxt += statusEmojis.chilled;
					} else if (skill.type === "fire" || skill.type === "grass") {
						dmg = Math.round(dmg/4);
					}
				}
			} else {
				if (typeof skill.type === "object") {
					if (skill.type.includes("ice") || skill.type.includes("water")) {
						dmg = Math.round(dmg*1.5);
						emojitxt += statusEmojis.chilled;
					} else if (skill.type.includes("fire") || skill.type.includes("grass")) {
						dmg = Math.round(dmg/2);
					}
				} else {
					if (skill.type === "ice" || skill.type === "water") {
						dmg = Math.round(dmg*1.5);
						emojitxt += statusEmojis.chilled;
					} else if (skill.type === "fire" || skill.type === "grass") {
						dmg = Math.round(dmg/2);
					}
				}
			}

			return [dmg, emojitxt];
		}
	},

	overheat: {
		stackable: true,
		forceturns: 3,
		opposite: ["chilled"],
		dmgmod: function(btl, targ, dmg, skill, emojitxt) {
			if (hasStatusAffinity(targ, 'overheat', 'weak')) {
				if (typeof skill.type === "object") {
					if (skill.type.includes("fire") || skill.type.includes("metal")) {
						dmg = Math.round(dmg*1.75);
						emojitxt += statusEmojis.overheat;
					} else if (skill.type.includes("ice") || skill.type.includes("water")) {
						dmg = Math.round(dmg*0.75);
					}
				} else {
					if (skill.type === "fire" || skill.type === "metal") {
						dmg = Math.round(dmg*1.75);
						emojitxt += statusEmojis.overheat;
					} else if (skill.type === "ice" || skill.type === "water") {
						dmg = Math.round(dmg*0.75);
					}
				}
			} else if (hasStatusAffinity(targ, 'overheat', 'resist')) {
				if (typeof skill.type === "object") {
					if (skill.type.includes("fire") || skill.type.includes("metal")) {
						dmg = Math.round(dmg*1.25);
						emojitxt += statusEmojis.chilled;
					} else if (skill.type.includes("ice") || skill.type.includes("water")) {
						dmg = Math.round(dmg/4);
					}
				} else {
					if (skill.type === "fire" || skill.type === "metal") {
						dmg = Math.round(dmg*1.25);
						emojitxt += statusEmojis.overheat;
					} else if (skill.type === "ice" || skill.type === "water") {
						dmg = Math.round(dmg/4);
					}
				}
			} else {
				if (typeof skill.type === "object") {
					if (skill.type.includes("fire") || skill.type.includes("metal")) {
						dmg = Math.round(dmg*1.5);
						emojitxt += statusEmojis.overheat;
					} else if (skill.type.includes("ice") || skill.type.includes("water")) {
						dmg = Math.round(dmg/2);
					}
				} else {
					if (skill.type === "fire" || skill.type === "metal") {
						dmg = Math.round(dmg*1.5);
						emojitxt += statusEmojis.chilled;
					} else if (skill.type === "ice" || skill.type === "water") {
						dmg = Math.round(dmg/2);
					}
				}
			}

			return [dmg, emojitxt];
		}
	},

	stuffed: {
		opposite: ['hunger'],
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'stuffed', 'weak')) {
				char.statusturns = 3;
			} else if (hasStatusAffinity(char, 'stuffed', 'resist') || isBoss(char)) {
				char.statusturns = 1;
			} else {
				char.statusturns = 2;
			}
		},
		hardcoded: true
	},

	tired: {
		opposite: ['energized'],
		forceturns: 3,
		hardcoded: true
	},

	energized: {
		opposite: ['tired'],
		forceturns: 3,
		hardcoded: true
	},

	disabled: {
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'disabled', 'weak')) {
				char.statusturns = 3;
			} else if (hasStatusAffinity(char, 'disabled', 'resist') || isBoss(char)) {
				char.statusturns = 1;
			} else {
				char.statusturns = 2;
			}
		},
		hardcoded: true
	},

	brimstone: {
		opposite: ['trisagion'],
		oninflict: function(char) {
			char.statusturns = 3;

			addCusVal(char, 'revertBuffs', objClone(char.buffs));
			for (i in char.buffs) {
				if (hasStatusAffinity(char, 'brimstone', 'weak')) {
					if (char.buffs[i] > 0) char.buffs[i] *= -1;
				} else if (hasStatusAffinity(char, 'brimstone', 'resist') || isBoss(char)) {
					if (char.buffs[i] < 0) char.buffs[i] *= -1;
				} else {
					char.buffs[i] *= -1;
				}
			}

			if (char?.custom?.buffTurns) {
				addCusVal(char, 'revertBuffTurns', objClone(char.custom.buffTurns));
				for (i in char.custom.buffTurns) {
					if (hasStatusAffinity(char, 'brimstone', 'weak')) {
						if (char.custom.buffTurns[i][1] < 0) char.custom.buffTurns[i][1] *= -1;
					} else if (hasStatusAffinity(char, 'brimstone', 'resist') || isBoss(char)) {
						if (char.custom.buffTurns[i][1] > 0) char.custom.buffTurns[i][1] *= -1;
					} else {
						char.custom.buffTurns[i][1] *= -1;
					}
				}
			}
		},
		onremove: function(btl, char) {
			char.buffs = objClone(char.custom.revertBuffs);
			killVar(char, 'revertBuffs');

			if (char?.custom?.buffTurns && char?.custom?.revertBuffTurns) {
				char.custom.buffTurns = objClone(char.custom.revertBuffTurns);
				killVar(char, 'revertBuffTurns');
			}
		},
		hardcoded: true
	},

	trisagion: {
		opposite: ['brimstone'],
		forceturns: 3,
		hardcoded: true
	},

	haste: {
		hardcoded: true,
		opposite: ['leisure'],
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'haste', 'weak')) {
				char.statusturns = 4;
			} else if (hasStatusAffinity(char, 'haste', 'resist')) {
				char.statusturns = 2;
			} else {
				char.statusturns = 3;
			}
		},
		onturn: function(btl, char) {
			return `__${char.name}__ is hyperfocused, moving quickly.`;
		}
	},

	leisure: {
		hardcoded: true,
		opposite: ['haste'],
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'leisure', 'weak')) {
				char.statusturns = 4;
			} else if (hasStatusAffinity(char, 'leisure', 'resist')) {
				char.statusturns = 2;
			} else {
				char.statusturns = 3;
			}
		},
		onturn: function(btl, char) {
			return `__${char.name}__ is aloof, not paying attention.`;
		}
	},

	unstable: {
		oninflict: function(char) {
			char.unstable = isBoss(char) ? 4 : 5;
			addCusVal(char, 'unstable', {"hp": 0, "mp": 0, "lb": 0, "money": 0});
		},
		stackable: true,
		hardcoded: true,
		onremove: function(btl, char) {
			let dmg = char.custom.unstable;

			if (isBoss(char)) {for (i in dmg) dmg[i] *= 1.5;}

			let txt = `__${char.name}'s__ **${statusEmojis['unstable']}Unstable** took effect!\n\n`;
			let didSmth = false;

			if (dmg.hp > 0) {
				char.hp = Math.max(0, char.hp-Math.round(dmg.hp));
				txt += `__${char.name}__ took **${Math.round(dmg.hp)}** HP${char.hp > 0 ? '' : ', and is defeated'}!\n`

				didSmth = true;
			}
			if (dmg.mp > 0) {
				char.mp = Math.max(0, char.mp-Math.round(dmg.mp));
				txt += `__${char.name}__ took **${Math.round(dmg.mp)}** ${char.mpMeter ? char.mpMeter[1] : "MP"}${(char.hp > 0 && char.mp <= 0) ? ', and runs out of it, causing defeat' : ''}!\n`

				if (char.hp > 0 && char.mp <= 0) char.hp = 0;
				didSmth = true;
			}
			if (dmg.lb > 0) {
				char.lbp -= Math.round(dmg.lb);
				txt += `__${char.name}__ took **${Math.round(dmg.lb)}** LB%!\n`
				didSmth = true;
			}
			if (dmg.money > 0) {
				let team = btl.teams[char.team];
				team.currency = Math.max(0, team.currency-Math.round(dmg.money));


				txt += `__${char.name}'s__ team lost **${Math.round(dmg.money)}** ${getCurrency(btl.guild.id)}s!\n`
				didSmth = true;
			}

			if (!didSmth) txt += `...But it did nothing!`;

			killVar(char, 'unstable');

			DiscordEmbed = new Discord.MessageEmbed()
				.setColor("#ff1fa9")
				.setTitle(`${char.name}'s turn!`)
				.setDescription(txt);
			btl.channel.send({embeds: [DiscordEmbed]});
		},
	},
}