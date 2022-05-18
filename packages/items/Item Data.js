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
			return `__${char.name}__ used the __${item.name}__ to heal **${item.healmp}MP** to __${targ.name}__!`;
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
			return `__${char.name}__ used the __${item.name}__ to heal **${item.healhpmp}HP** and **${item.healhpmp}MP** to __${targ.name}__!`;
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
			targ.hp = targ.maxhp/item.revive;

			return `__${char.name}__ used the __${item.name}__ to revive ${targ.name}!`;
		}
	},

	// Pacify items (Pacifying isn't a thing yet, so we'll leave it as this for now.
	pacify: {
		target: 'one',
		func: function(char, targ, item, btl) {
			return 'But it failed!';
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