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
manager.on('shardCreate', (shard) => console.log(`Shard ${shard.id} launched`));

// Spawn your shards
manager.spawn();