// Are you a boss
isBoss = (f) => {
	if (!f) return false;
	if (!f.type) return false;
	return (f.type.includes('boss') || f.type.includes('deity'));
}

// Learn the affinities of using this skill.
learnAffinity = (char, targ, skill) => {
	let a = getAffinity(targ, skill.type);

	if (!char.affinitycheck[targ.id]) char.affinitycheck[targ.id] = {};
	if (!char.affinitycheck[targ.id][a]) char.affinitycheck[targ.id][a] = [];
	char.affinitycheck[targ.id][a].push(skill.type)

	return char.affinitycheck[targ.id];
}

// Recognise skill.
recogniseSkill = (char, targ, skill) => {
}

// All Opposing
allOpposing = (char, btl) => {
	let o = [];
	for (let i in btl.teams) {
		if (i == char.team) continue;
		for (let targ of btl.teams[i].members) o.push(targ);
	}

	return o;
}

// Status effects points.
let st = {
	burn: 1,
	bleed: 1,
	freeze: 3,
	paralyze: 2,
	dizzy: 2,
	sleep: 2,
	despair: 1,
	toxin: 1,
	brainwash: 4,
	fear: 2,
	rage: 1,
	ego: 4,
	silence: 3,
	dazed: 3,
	hunger: 2,
	mirror: 1,
	blind: 1,
	irradiation: 2,
	sensitive: 3,
	happy: 1
}

// Affinities
let pts = {
	deadly: 6,
	superweak: 4,
	weak: 2,
	resist: -3,
	block: -4,
	repel: -5,
	drain: -5,
}

// Legacy AI
// === REFACTORED CODE FROM OLD BB... well less refactored and more improved. ===
function legacyAi(char, btl) {
	let possibleSkills = [];
	for (let skill of char.skills) {
		let skillDefs = skillFile[skill];
		if (canUseSkill(char, skillFile[skill])) possibleSkills.push(skill);
	}

	let allySide = btl.teams[char.team].members;
	let oppSide = allOpposing(char, btl);
	
	// Heal if under 1/5 hp
	if (!isBoss(char) && Math.random() < 0.5) {
		let healSkills = objClone(possibleSkills).filter(s => (skillFile[s] && skillFile[s].type == "heal"));

		if (healSkills.length > 0 && char.hp < Math.round(char.maxhp/3)) {
			let healSkill = healSkills[randNum(healSkills.length-1)];
			for (const i in allySide) {
				if (allySide[i].id == char.id) {
					return {
						move: 'skills',
						index: healSkill,
						target: [char.team, char.pos],
						points: 69
					};
				}
			}
			
			let i = randNum(allySide.length-1);
			if (allySide[i]) {
				while (allySide[i].hp <= 0 || allySide[i]?.status == 'ego') i = randNum(allySide.length-1);
			}

			return {
				move: 'skills',
				index: healSkill,
				target: [i, targ.pos],
				points: 69
			};
		}
	}
	
	// Shield at low health
	if (char.hp < char.maxhp/2 && !isBoss(char) && !char.custom?.shield) {
		let shieldSkills = objClone(possibleSkills).filter(s => (!skillFile[s] || !skillFile[s].statusses?.karn || !skillFile[s].statusses?.trap || !skillFile[s].statusses?.shield));
		if (shieldSkills.length > 0) {
			return {
				move: 'skills',
				index: shieldSkills[randNum(shieldSkills.length-1)],
				target: [char.team,  char.pos],
				points: 69
			};
		}
	}

	// Finally, attack. Target weaknesses.
	if (!char.affinitycheck) char.affinitycheck = {};

	if (char.affinitycheck && Object.keys(char.affinitycheck).length > 0 && Math.random() <= 0.3) {
		for (let t of oppSide) {
			if (t.hp <= 0) continue;

			for (let aff in char.affinitycheck[t.id]) {
				for (let type of char.affinitycheck[t.id][aff]) {
					for (let s of char.skills) {
						let skill = skillFile[s];

						if (skill.type == type) {
							return {
								move: 'skills',
								index: s,
								target: [t.team, t.pos],
								points: 69
							};
						}
					}
				}
			}
		}
	}

	// Since we know nothing else... might as well experiment
	let t = oppSide[randNum(oppSide.length-1)];

	if (!char.affinitycheck[t.id]) {
		char.affinitycheck[t.id] = {
			superweak: [],
			weak: [],
			resist: [],
			block: [],
			repel: [],
			drain: []
		}
	}

	console.log(possibleSkills);
	return {
		move: 'skills',
		index: possibleSkills[randNum(possibleSkills.length-1)],
		target: [t.team, t.pos],
		points: 69
	};
}

// Enemy thinker!
enemyThinker = (char, btl) => {
	// Ah shit. Enemy AI. AH FUCk.
	let ai = [];

	// Difficulty levels should be handled
	switch(char.difficulty ?? 'easy') {
		case 'legacy': // Legacy AI.
			// Doesn't use the whole AI thing.
			ai.push(legacyAi(char, btl));
			break;

		case 'perfect': // Perfect mode AI:
			for (let i in btl.teams) {
				if (i == char.team) continue;

				for (let targ of btl.teams[i].members) {
					if (targ.hp <= 0) continue;

					let skillcheck = {
						melee: {
							name: char.melee.name,
							type: char.melee.type,
							pow: char.melee.pow,
							acc: Math.min(100, char.melee.acc),
							crit: char.melee.crit,
							atktype: char.melee.type,
							target: 'one',
							melee: true
						}
					}

					for (let k in char.skills) {
						if (!skillFile[char.skills[k]]) continue;
						skillcheck[char.skills[k]] = skillFile[char.skills[k]];
					}

					// Iterate over all my skills, AND my melee attack. Which one is the most optimal?
					// Highest Power: 1 point
					// 700+ Power: 2 points
					// Multi-Target: 1 point
					// Target is leader: 2 points

					// Weakness affinity: 2 points
					// SuperWeakness affinity: 4 points
					// Deadly affinity: 6 points
					// Resisting affinity: -4 points.
					// Block/Repel/Drain affinity: -6 points

					// Tech: 2 points

					// Shield: -2 point
					// Karn: -2 points
					// Trap: -2 point

					// Chaos Stir: -2 points
					// Mirror Status: -4 points if magic, +4 points if physical or ranged.
					if (!char.affinitycheck) char.affinitycheck = {};

					let powcheck = Object.keys(skillcheck);
					powcheck.sort(function(a, b) {return (skillcheck[b].pow ?? 0) - (skillcheck[a].pow ?? 0)});

					for (let j in skillcheck) {
						let skill = skillcheck[j];

						// If we can't use this skill, don't bother check for it.
						if (!skill.melee) {
							if (!canUseSkill(char, skill)) continue;
						}

						// This is the action we're going to use.
						let act = {
							move: skill.melee ? 'melee' : 'skills',
							index: j,
							target: [i, targ.pos],
							points: skill.melee ? -2 : 0
						}

						// Strongest move, 700+ Power, Multi-Target
						if (j == powcheck[0]) act.points++;
						if (skill.pow >= 700) act.points += 2;
						if (allOpposing(char, btl).length > 1 && (skill.target === 'allopposing' || skill.target === 'spreadopposing')) act.points++;
						if (targ.leader) act.points += 2;

						// Element.
						switch(skill.type) {
							case 'heal':
								switch(skill.target) {
									case 'allallies':
										for (let char2 of btl.teams[char.team].members) {
											if (skill.heal?.healstat) {
												if (!skill.heal.healstat[1] || skill.heal.healstat[1] == "hp") {
													if (char2.hp <= (isBoss(char2) ? char2.maxhp/10 : char2.maxhp/3)) {
														act.points += 5;
													}
												}
											}
										}

										ai.push(act);
										break;

									case 'ally':
									case 'spreadallies':
										for (let ally of btl.teams[char.team].members) {
											if (skill.heal?.healstat) {
												if (!skill.heal.healstat[1] || skill.heal.healstat[1] == "hp") {
													if (ally.hp <= (isBoss(ally) ? ally.maxhp/10 : ally.maxhp/3)) {
														act = {
															move: 'skills',
															index: j,
															target: [char.team, ally.pos],
															points: 5
														};

														// Care a little less if I can't heal this ONE ally the damage they just took back completely.
														if (ally.lastdmg && skill.heal.healstat[0] <= (ally.lastdmg[0]-10)) {
															act.points /= 3;
														}
													}
												}
											}
										}
										break;
								}
								break;

							case 'status':
								// Abuse good statusses to do shit.
								if (skill.status && !targ.status) {
									let statusses = skill.status;
									if (typeof(statusses) === "string") statusses = [statusses];

									for (let status of statusses) {
										act.points += 5+Math.round(st[status]/statusses.length);
									}
								}
								
								// AIThinker Hook
								if (skill.statusses) {
									for (let i in skill.statusses) {
										if (!statusList[i]) continue;
										if (!statusList[i].aithinker) continue;

										if (statusList[i].multiple) {
											for (let k in skill.statusses[i]) {
												statusList[i].aithinker(char, targ, act, skill, btl, skill.statusses[i][k]);
											}
										} else {
											statusList[i].aithinker(char, targ, act, skill, btl, skill.statusses[i]);
										}
									}
								}

								break;

							case 'passive':
								act.points = -9999;
								break;

							default:
								// Judge differently based on target types.
								let targets = [];
								switch(skill.target) {
									case 'allopposing':
										for (let a in btl.teams) {
											if (char.team == a) continue;

											for (let character of btl.teams[a].members) {
												if (character.hp > 0) targets.push(character);
											}
										}
										break;
									case 'allallies':
										for (let kay in btl.teams[char.team].members) {
											if (btl.teams[char.team].members[kay].hp > 0) targets.push(btl.teams[char.team].members[kay]);
										}
										break;
									case 'everyone':
										for (let eye in btl.teams) {
											for (let kay in btl.teams[eye].members) {
												if (btl.teams[eye].members[kay].hp > 0) targets.push(btl.teams[eye].members[kay]);
											}
										}
										break;
									case 'caster':
										targets = [char];
										break;
									default:
										targets = [targ];
								}

								// Judge for all targets of skill.
								for (let t of targets) {
									if (t.hp <= 0) continue;

									if (skill.type != 'almighty' && !skill.extras?.ohko && !skill.extras?.stealmp) {
										if (!char.affinitycheck[t.id]) char.affinitycheck[t.id] = objClone(t.affinities);

										for (let aff in char.affinitycheck[t.id]) {
											for (let type of char.affinitycheck[t.id][aff]) {
												if (skill.type == type) act.points += pts[aff];
											}
										}
									}

									// Guarding
									if (t.guard) act.points -= 3.5;

									// Techs
									if (t.status && !t.guard && isTech(t, skill.type)) act.points += 2;

									// Shields, Karns, ect. Brick break skills are acknowledged.
									if (t.custom?.shield && !skill.extras?.feint) {
										if (skill.extras?.brickbreak) {
											act.points += 3;
										} else {
											act.points -= 2;
											if (t.custom.shield.type && ((t.custom.shield.type == 'repelphys' && (skill.atktype === "physical" || skill.atktype === "ranged")) || (t.custom.shield.type == 'repelmag' && skill.atktype === "magic"))) act.points--;
										}
									}

									if (t.custom?.trap && !skill.extras?.brickbreak && !skill.extras?.feint) act.points--;
									if (t.custom?.chaosstir) act.points -= 2;

									// Mirror status
									if (t.status && t.status == 'mirror') act.points += (skill.atktype === "magic" ? -4 : 4);
								}
						}

						// Randomness modifier
						act.points += (-0.5 + Math.random());

						// Push this action.
						ai.push(act);
					}
				}
			}
			break;

		case 'hard': // Hard mode AI:
			for (let i in btl.teams) {
				if (i == char.team) continue;

				for (let targ of btl.teams[i].members) {
					if (targ.hp <= 0) continue;

					let skillcheck = {
						melee: {
							name: char.melee.name,
							type: char.melee.type,
							pow: char.melee.pow,
							acc: Math.min(100, char.melee.acc),
							crit: char.melee.crit,
							atktype: char.melee.type,
							target: 'one',
							melee: true
						}
					}

					for (let k in char.skills) {
						if (!skillFile[char.skills[k]]) continue;
						skillcheck[char.skills[k]] = skillFile[char.skills[k]];
					}

					// Iterate over all my skills, AND my melee attack. Which one is the most optimal?
					// Highest Power: 1 point
					// 700+ Power: 2 points
					// Multi-Target: 1 point

					// Weakness affinity: 2 points
					// SuperWeakness affinity: 4 points
					// Deadly affinity: 6 points
					// Resisting affinity: -4 points.
					// Block/Repel/Drain affinity: -6 points

					// Tech: 2 points

					// Shield: -2 point
					// Karn: -2 points
					// Trap: -2 point

					// Chaos Stir: -2 points
					// Mirror Status: -4 points if magic, +4 points if physical or ranged

					// Hard Mode must discover affinities first.
					if (!char.affinitycheck) char.affinitycheck = {};

					let powcheck = Object.keys(skillcheck);
					powcheck.sort(function(a, b) {return (skillcheck[b].pow ?? 0) - (skillcheck[a].pow ?? 0)});

					for (let j in skillcheck) {
						let skill = skillcheck[j];

						// If we can't use this skill, don't bother check for it.
						if (!skill.melee) {
							if (!canUseSkill(char, skill)) continue;
						}

						// This is the action we're going to use.
						let act = {
							move: skill.melee ? 'melee' : 'skills',
							index: j,
							target: [i, targ.pos],
							points: skill.melee ? -2 : 0
						}

						// Strongest move, 700+ Power, Multi-Target
						if (j == powcheck[0]) act.points++;
						if (skill.pow >= 700) act.points += 2;
						if (allOpposing(char, btl).length > 1 && (skill.target === 'allopposing' || skill.target === 'spreadopposing')) act.points++;

						// Element.
						switch(skill.type) {
							case 'heal':
								switch(skill.target) {
									case 'allallies':
										for (let char2 of btl.teams[char.team].members) {
											if (char2.hp <= 0) continue;

											if (skill.heal?.healstat) {
												if (!skill.heal.healstat[1] || skill.heal.healstat[1] == "hp") {
													if (char2.hp <= (isBoss(char2) ? char2.maxhp/10 : char2.maxhp/3)) {
														act.points += 5;
													}
												}
											}
										}

										ai.push(act);
										break;

									case 'ally':
									case 'spreadallies':
										for (let ally of btl.teams[char.team].members) {
											if (skill.heal?.healstat) {
												if (!skill.heal.healstat[1] || skill.heal.healstat[1] == "hp") {
													if (ally.hp <= (isBoss(ally) ? ally.maxhp/10 : ally.maxhp/3)) {
														act = {
															move: 'skills',
															index: j,
															target: [char.team, ally.pos],
															points: 5
														};

														// Care a little less if I can't heal this ONE ally the damage they just took back completely.
														if (ally.lastdmg && skill.heal.healstat[0] <= (ally.lastdmg[0]-10)) {
															act.points /= 3;
														}
													}
												}
											}
										}
										break;
								}
								break;

							case 'status':
								// Abuse good statusses to do shit.
								if (skill.status && !targ.status) {
									let statusses = skill.status;
									if (typeof(statusses) === "string") statusses = [statusses];

									for (let status of statusses) {
										act.points += 5+Math.round(st[status]/statusses.length);
									}
								}
								
								// AIThinker Hook
								if (skill.statusses) {
									for (let i in skill.statusses) {
										if (!statusList[i]) continue;
										if (!statusList[i].aithinker) continue;

										if (statusList[i].multiple) {
											for (let k in skill.statusses[i]) {
												statusList[i].aithinker(char, targ, act, skill, btl, skill.statusses[i][k]);
											}
										} else {
											statusList[i].aithinker(char, targ, act, skill, btl, skill.statusses[i]);
										}
									}
								}

								break;

							case 'passive':
								act.points = -9999;
								break;

							default:
								// Judge differently based on target types.
								let targets = [];
								switch(skill.target) {
									case 'allopposing':
										for (let a in btl.teams) {
											if (char.team == a) continue;

											for (let character of btl.teams[a].members) {
												if (character.hp > 0) targets.push(character);
											}
										}
										break;
									case 'allallies':
										for (let kay in btl.teams[char.team].members) {
											if (btl.teams[char.team].members[kay].hp > 0) targets.push(btl.teams[char.team].members[kay]);
										}
										break;
									case 'everyone':
										for (let eye in btl.teams) {
											for (let kay in btl.teams[eye].members) {
												if (btl.teams[eye].members[kay].hp > 0) targets.push(btl.teams[eye].members[kay]);
											}
										}
										break;
									case 'caster':
										targets = [char];
										break;
									default:
										targets = [targ];
								}

								// Judge for all targets of skill.
								for (let t of targets) {
									if (t.hp <= 0) continue;

									// Judge based on target affinity. Only do this 85% of the time on hard.
									if (skill.type != 'almighty' && !skill.extras?.ohko && !skill.extras?.stealmp) {
										if (char.affinitycheck[t.id]) {
											for (let aff in char.affinitycheck[t.id]) {
												if (!char.affinitycheck[t.id][aff]) continue;
												for (let type of char.affinitycheck[t.id][aff]) {
													if (skill.type == type && randNum(1, 100) <= 85) act.points += pts[aff];
												}
											}
										} else {
											char.affinitycheck[t.id] = {
												superweak: [],
												weak: [],
												resist: [],
												block: [],
												repel: [],
												drain: []
											}
										}
									}

									// Guarding
									if (t.guard) act.points -= 3.5;

									// Techs
									if (t.status && !t.guard && isTech(t, skill.type)) act.points += 2;

									// Shields, Karns, ect. Brick break skills are acknowledged.
									if (t.custom?.shield && !skill.extras?.feint) {
										if (skill.extras?.brickbreak) {
											act.points += 3;
										} else {
											act.points -= 2;
											if (t.custom.shield.type && ((t.custom.shield.type == 'repelphys' && (skill.atktype === "physical" || skill.atktype === "ranged")) || (t.custom.shield.type == 'repelmag' && skill.atktype === "magic"))) act.points--;
										}
									}

									if (t.custom?.trap && !skill.extras?.brickbreak && !skill.extras?.feint) act.points--;
									if (t.custom?.chaosstir) act.points -= 2;

									// Mirror status
									if (t.status && t.status == 'mirror') act.points += (skill.atktype === "magic" ? -4 : 4);
								}
						}

						// Randomness modifier
						act.points += (-0.5 + Math.random());

						// Push this action.
						ai.push(act);
					}
				}
			}
			break;

		case 'medium': // Medium mode AI:
			for (let i in btl.teams) {
				if (i == char.team) continue;

				for (let targ of btl.teams[i].members) {
					if (targ.hp <= 0) continue;

					let skillcheck = {
						melee: {
							name: char.melee.name,
							type: char.melee.type,
							pow: char.melee.pow,
							acc: Math.min(100, char.melee.acc),
							crit: char.melee.crit,
							atktype: char.melee.type,
							target: 'one',
							melee: true
						}
					}

					for (let k in char.skills) {
						if (!skillFile[char.skills[k]]) continue;
						skillcheck[char.skills[k]] = skillFile[char.skills[k]];
					}

					// Iterate over all my skills, AND my melee attack. Which one is the most optimal?
					// Highest Power: 1 point

					// Weakness affinity: 2 points
					// SuperWeakness affinity: 4 points
					// Deadly affinity: 6 points
					// Resisting affinity: -3 points.
					// Block/Repel/Drain affinity: -5 points

					// Shield: -1 point
					// Karn: -2 points
					// Trap: -1 point
					
					// Medium Mode is not aware of certain other status skills like Chaos Stir. It also
					// only remembers affinites 50% of the time.

					// Additionally, Medium Mode must discover affinities first.
					if (!char.affinitycheck) char.affinitycheck = {};

					let powcheck = Object.keys(skillcheck);
					powcheck.sort(function(a, b) {return skillcheck[b].pow - skillcheck[a].pow});

					for (let j in skillcheck) {
						let skill = skillcheck[j];

						// If we can't use this skill, don't bother check for it.
						if (!skill.melee) {
							if (!canUseSkill(char, skill)) continue;
						}

						// This is the action we're going to use.
						let act = {
							move: skill.melee ? 'melee' : 'skills',
							index: j,
							target: [i, targ.pos],
							points: skill.melee ? -2 : 0
						}

						// Strongest move
						if (j == powcheck[0]) act.points++;

						// Element.
						switch(skill.type) {
							case 'heal':
								switch(skill.target) {
									case 'allallies':
										for (let char2 of btl.teams[char.team].members) {
											if (skill.heal?.healstat) {
												if (!skill.heal.healstat[1] || skill.heal.healstat[1] == "hp") {
													if (char2.hp <= (isBoss(char2) ? char2.maxhp/10 : char2.maxhp/3)) {
														act.points += 3;
													}
												}
											}
										}

										ai.push(act);
										break;

									case 'ally':
									case 'spreadallies':
										for (let ally of btl.teams[char.team].members) {
											if (skill.heal?.healstat) {
												if (!skill.heal.healstat[1] || skill.heal.healstat[1] == "hp") {
													if (ally.hp <= (isBoss(ally) ? ally.maxhp/10 : ally.maxhp/3)) {
														act = {
															move: 'skills',
															index: j,
															target: [char.team, ally.pos],
															points: 3
														};

														// Care a little less if I can't heal this ONE ally the damage they just took back completely.
														if (ally.lastdmg && skill.heal.healstat[0] <= (ally.lastdmg[0]-10)) {
															act.points /= 3;
														}
													}
												}
											}
										}
										break;
								}
								break;

							case 'status':
								break;

							case 'passive':
								act.points = -9999;
								break;

							default:
								// Judge differently based on target types.
								let targets = [];
								switch(skill.target) {
									case 'allopposing':
										for (let a in btl.teams) {
											if (char.team == a) continue;

											for (let character of btl.teams[a].members) {
												if (character.hp > 0) targets.push(character);
											}
										}
										break;
									case 'allallies':
										for (let kay in btl.teams[char.team].members) {
											if (btl.teams[char.team].members[kay].hp > 0) targets.push(btl.teams[char.team].members[kay]);
										}
										break;
									case 'everyone':
										for (let eye in btl.teams) {
											for (let kay in btl.teams[eye].members) {
												if (btl.teams[eye].members[kay].hp > 0) targets.push(btl.teams[eye].members[kay]);
											}
										}
										break;
									case 'caster':
										targets = [char];
										break;
									default:
										targets = [targ];
								}

								// Judge for all targets of skill.
								for (let targ of targets) {
									if (targ.hp <= 0) continue;

									// Judge based on target affinity. Only do this 50% of the time on medium.
									if (skill.type != 'almighty' && !skill.extras?.ohko && !skill.extras?.stealmp) {
										if (char.affinitycheck[targ.id]) {
											for (let aff in char.affinitycheck[targ.id]) {
												for (let type of char.affinitycheck[targ.id][aff]) {
													if (skill.type == type && randNum(1, 100) <= 50) act.points += pts[aff];
												}
											}
										} else {
											char.affinitycheck[targ.id] = {
												superweak: [],
												weak: [],
												resist: [],
												block: [],
												repel: [],
												drain: []
											}
										}
									}

									// Guarding
									if (targ.guard) act.points -= 3.5;

									// Shields, Karns, ect. Brick break skills are acknowledged.
									if (targ.custom?.shield && !skill.extras?.feint) {
										if (skill.extras?.brickbreak) {
											act.points += 2;
										} else {
											act.points--;
											if (targ.custom.shield.type && ((targ.custom.shield.type == 'repelphys' && (skill.atktype === "physical" || skill.atktype === "ranged")) || (targ.custom.shield.type == 'repelmag' && skill.atktype === "magic"))) act.points--;
										}
									}

									if (targ.custom?.trap && !skill.extras?.brickbreak && !skill.extras?.feint) act.points--;
								}
						}

						// Randomness modifier
						act.points += (-1+randNum(2));

						// Push this action.
						ai.push(act);
					}
				}
			}
			break;

		default: // Easy mode AI:
			// Select random options. Only change if the target is dead.
			// Never consider bad outcomes.
			// Never watch out for affinities.
			// Never watch out for shields, traps, ect.
			for (let i in btl.teams) {
				if (i == char.team) continue;

				for (let targ of btl.teams[i].members) {
					if (targ.hp <= 0) continue;

					// Select random skill.
					let skill = char.skills[randNum(char.skills.length-1)];

					// Can we actually use this skill?
					let loops = 0;
					while (!canUseSkill(char, skillFile[skill]) && loops < 10) {
						skill = char.skills[randNum(char.skills.length-1)];
						loops++;
					}

					// Melee as failsafe
					if (loops >= 10) {
						ai.push({
							move: 'melee',
							target: [i, targ.pos],
							points: 0
						})
					} else {
						ai.push({
							move: 'skills',
							index: skill,
							target: [i, targ.pos],
							points: 0
						})
					}
				}
			}
	}

	// Save this shit
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, JSON.stringify(btl, '	', 4));

	// Sort the AI's possible options. Choose the one with the most points.
	ai.sort(function(a, b) {return b.points-a.points});
	console.log(ai[0]);
	return ai[0];
}

doEnemyTurn = (char, btl) => {
	btl.action = enemyThinker(char, btl);
	return doAction(char, btl, btl.action);
}

// Pacifying
doPacify = (char, btl, action) => {
	let i = action.index;
	let targ = btl.teams[action.target[0]].members[action.target[1]];
	let finaltxt = targ.negotiate[i].action ?? `%PLAYER% tries to pacify ${targ.name}`;

	while (finaltxt.includes('%PLAYER%')) finaltxt = finaltxt.replace('%PLAYER%', char.name);
	while (finaltxt.includes('%ENEMY%')) finaltxt = finaltxt.replace('%ENEMY%', targ.name);

	let convince = targ.negotiate[i].convince;
	let specialType = targ.negotiate[i].special ?? 'none';

	for (let s of char.skills) {
		let skill = skillFile[s]
		if (skill.type != 'passive') continue;

		if (skill.passive.kindheart) {
			convince += Math.trunc(((convince/100)*skill.passive.kindheart)*100)/100; // trunc to 2 decimal places
		}
	}
	convince = Math.min(convince, 100);

	switch(specialType) {
		default:
			targ.pacify += convince;
			finaltxt += `\n_(Pacified by ${convince}%!)_\n`;

			if (targ.pacify >= 100) {
				targ.pacified = true;
				finaltxt += `\n${targ.name} is fully pacified `;

				if (targ.negotiateDefs) {
					let parties = setUpFile(`${dataPath}/json/${btl.guild.id}/parties.json`, true);

					if (parties[btl.teams[char.team].id]) {
						let party = parties[btl.teams[char.team].id];

						if (!party.negotiates) party.negotiates = {};
						party.negotiates[targ.name] = party.negotiates[targ.name] ? party.negotiates[targ.name]+1 : 1;

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
			}
	}

	DiscordEmbed = new Discord.MessageEmbed()
		.setColor('#d613cc')
		.setTitle(`${char.name} => ${targ.name}`)
		.setDescription(finaltxt)
	btl.channel.send({embeds: [DiscordEmbed]})
}