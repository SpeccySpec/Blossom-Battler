enemyThinker = (char, btl) => {
	// Ah shit. Enemy AI. AH FUCk.
	// Placeholder AI uses random skill on random target.
	let action = {
		move: 'skills',
		index: char.skills[randNum(char.skills.length-1)],
		target: [0, randNum(btl.teams[0].length-1)],
	}

	return action;
}

doEnemyTurn = (char, btl) => {
	btl.action = enemyThinker(char, btl);
	return doAction(char, btl, btl.action);
}