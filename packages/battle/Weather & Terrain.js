weatherFuncs = {
	rain: {
		onturn: function(char, btl) {
			if (char.status && char.status === 'burn') {
				delete char.status;
				delete char.statusturns;
				return `__${char.name}__ is put out by the rain!`;
			}

			return null;
		},
		onselect: function(char, skill, btl) {
			if (skill.type === "water") {
				skill.pow *= 1.3;
			} else if (skill.type === "fire") {
				skill.pow *= 0.7;
			}
		}
	},

	thunder: {
		onselect: function(char, skill, btl) {
			if (skill.type === "electric") {
				skill.pow *= 1.3;
			} else if (skill.type === "water") {
				skill.type = ["water", "electric"];
				skill.pow *= 1.1;
			}
		}
	},

	sunlight: {
		onselect: function(char, skill, btl) {
			if (skill.type === "fire") {
				skill.pow *= 1.3;
			} else if (skill.type === "nuclear") {
				skill.pow *= 1.1;
			} else if (skill.type === "water" || skill.type === "grass") {
				skill.pow *= 0.7;
			}
		}
	},

	windy: {
		onselect: function(char, skill, btl) {
			if (skill.type === "wind") {
				skill.pow *= 1.3;
			} else if (skill.atktype === "physical" && typeof(skill.type) === "string" && skill.type != "wind") {
				skill.type = [skill.type, "wind"];
			}
		}
	},

	sandstorm: {
		statmod: function(char, stats, btl) {
			if (char.mainElement != "earth")
				stats.prc *= 1/3;

			return stats;
		}
	},

	hail: {
		onturn: function(char, btl) {
			if (char.mainElement != "ice") {
				let dmg = 10;
				let affinity = '';

				if (char.affinities.weak.includes("ice")) {
					dmg *= 2;
					affinity = affinityEmoji.weak;
				} else if (char.affinities.superweak.includes("ice")) {
					dmg *= 4;
					affinity = affinityEmoji.superweak;
				} else if (char.affinities.resist.includes("ice")) {
					dmg *= 0.5;
					affinity = affinityEmoji.resist;
				} else if (char.affinities.block.includes("ice") || char.affinities.repel.includes("ice")) {
					return `__${char.name}__ is able to negate the hail damage.`;
				} else if (char.affinities.drain.includes("ice")) {
					char.hp = Math.min(char.maxhp, char.hp+dmg);
					return `The __Hail__ heals __${char.name}__ by ${dmg}${affinityEmoji.drain} HP!`;
				}

				char.hp = Math.max(0, char.hp-dmg);

				if (char.hp <= 0) {
					return `__${char.name}__ was ___defeated${affinity}___ by the __Hail__!`;
				} else {
					return `__${char.name}__ took ___${dmg}${affinity}___ damage from the __Hail__!`;
				}
			}
		}
	},
}

terrainFuncs = {
}