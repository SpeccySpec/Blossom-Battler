pvpWin = (btl, i) => {
	btl.channel.send(`**[DEBUG]**\nTeam #${i} won`);
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
}

loseBattle = (btl, i) => {
	btl.channel.send('**[DEBUG]**\nEnemy team won');
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
}

winBattle = (btl, i) => {
	btl.channel.send('**[DEBUG]**\nPlayer team won');
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
}

runFromBattle = (char, btl) => {
	btl.channel.send('**[DEBUG]**\nRan from Battle :/');
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
}