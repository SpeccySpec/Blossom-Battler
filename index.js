// Include discord.js ShardingManger
const { ShardingManager } = require('discord.js');

require('dotenv').config();

// Create your ShardingManger instance
const manager = new ShardingManager('./client.js', {
    // for ShardingManager options see:
    // https://discord.js.org/#/docs/main/v12/class/ShardingManager
    totalShards: 'auto',
    token: process.env['TOKEN']
});

// Emitted when a shard is created
manager.on('shardCreate', (shard) => console.log(`Shard #${shard.id} launched! Please wait...`));

// On some kind of error :/
process.on('unhandledRejection', err => {
	console.log(`Oops! We messed up here! I've written down the error so you can track it! Good luck <3\n\n${err.stack}`, "error");
	
	console.log("Let's write this down so we don't forget...");
	if (battleFiles) {
		if (battleFiles.length > 0) fs.writeFileSync('./data/error.txt', JSON.stringify(battleFiles, null, '    '));
		console.log('Written in "./data/error.txt".');
	}
});

// Spawn your shards
manager.spawn();