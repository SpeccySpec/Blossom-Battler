itemData = {
	// Healing Items
	heal: {
		target: 'ally',
		func: function(char, targ, item, btl) {
			targ.hp = Math.min(targ.maxhp, targ.hp + item.heal);
			return `__${char.name}__ used the __${item.name}__ to heal **${item.heal}HP** to __${targ.name}__!`;
		}
	},

	healall: {
		target: 'allallies',
		func: function(char, targ, item, btl) {
			for (let i in btl.teams[char.team].members) {
				let t = btl.teams[char.team].members[i];
				t.hp = Math.min(t.maxhp, t.hp + item.healall);
			}

			return `__${char.name}__ used the __${item.name}__ to heal **${item.healall}HP** to their party!`;
		}
	},

	healmp: {
		target: 'ally',
		func: function(char, targ, item, btl) {
			targ.mp = Math.min(targ.maxmp, targ.mp + item.healmp);
			return `__${char.name}__ used the __${item.name}__ to heal **${item.healmp}${targ.mpMeter[1]}** to __${targ.name}__!`;
		}
	},

	healallmp: {
		target: 'allallies',
		func: function(char, targ, item, btl) {
			for (let i in btl.teams[char.team].members) {
				let t = btl.teams[char.team].members[i];
				t.mp = Math.min(t.maxmp, t.hp + item.healallmp);
			}

			return `__${char.name}__ used the __${item.name}__ to heal **${item.healall}MP** to their party!`;
		}
	},

	healhpmp: {
		target: 'ally',
		func: function(char, targ, item, btl) {
			targ.hp = Math.min(targ.maxhp, targ.hp + item.healhpmp);
			targ.mp = Math.min(targ.maxmp, targ.mp + item.healhpmp);
			return `__${char.name}__ used the __${item.name}__ to heal **${item.healhpmp}HP** and **${item.healhpmp}${targ.mpMeter[1]}** to __${targ.name}__!`;
		}
	},

	healallhpmp: {
		target: 'allallies',
		func: function(char, targ, item, btl) {
			for (let i in btl.teams[char.team].members) {
				let t = btl.teams[char.team].members[i];
				t.hp = Math.min(t.maxhp, t.hp + item.healallhpmp);
				t.mp = Math.min(t.maxmp, t.hp + item.healallhpmp);
			}

			return `__${char.name}__ used the __${item.name}__ to heal **${item.healallhpmp}HP** and **${item.healallhpmp}MP** to their party!`;
		}
	},

	// Revival Items.
	revive: {
		target: 'ally',
		func: function(char, targ, item, btl) {
			if (targ.hp > 0) return 'But it failed!';
			targ.hp = Math.round(targ.maxhp/100*item.revive);

			return `__${char.name}__ used the __${item.name}__ to revive ${targ.name}!`;
		}
	},

	// Pacify items
	pacify: {
		target: 'one',
		func: function(char, targ, item, btl) {
			if (!targ.enemy) return 'But it failed!';

			if (targ.pacify && targ.pacify > item.pacify) {
				let finaltxt = `${targ.name} was pacified by the ${item.name} `;

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

								melee: targ.melee,
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

				return finaltxt;
			} else {
				return 'But it failed!';
			}
		}
	},

	// Skill Items (Leave it as this for now)
	skill: {
		target: 'one',
		func: function(char, targ, item, btl) {
			return 'But it failed!';
		}
	},
}