saveTrial = (btl) => {
	makeDirectory(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/${btl.trial.name}`);
	let save = setUpFile(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/${btl.trial.name}/save-${btl.teams[0].name.toLowerCase()}.json`);

	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/${btl.trial.name}/save-${btl.teams[0].name.toLowerCase()}.json`, JSON.stringify(btl, null, '    '));
	btl = {};
}