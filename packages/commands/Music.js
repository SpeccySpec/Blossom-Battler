commands.joinvc = new Command({
	desc: 'Let me join and snuggle in vc, too!!!\n**[THIS IS DEPRICATED AND WILL BE REMOVED.]**',
	section: 'music',
	aliases: [],
	args: [
		{
			name: 'Channel ID',
			type: 'Word',
			forced: false
		},
    ],
	func: async(message, args, guilded) => {
        let channel;
        if (args[0]) {
            if (client.channels.cache.get(args[0])) {
                await joinVc(client.channels.cache.get(args[0]), message.channel)
                channel = client.channels.cache.get(args[0])
            } else {
                message.channel.send("Invalid Channel.")
                return false
            }
        } else {
            if (message.member.voice.channel) {
                await joinVc(message.member.voice.channel, message.channel);
                channel = message.member.voice.channel;
            } else {
                message.channel.send("Join a voice channel or specify it's ID, please!! Sowwy!!");
                return false;
            }
        }

        const connection = Voice.joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
        });

        voiceChannelShit[message.guild.id] = {
            sendShit: message.channel,
            connection: connection,
            player: null,
            cursong: {
                name: '',
                url: ''
            },
            queue: []
        }

        message.react('👍')
	}
})

commands.playsong = new Command({
	desc: 'Play a <Song>! Use a youtube link.\n**[THIS IS DEPRICATED AND WILL BE REMOVED.]**',
	section: 'music',
	aliases: ['playmusic', 'playtrack'],
	args: [
		{
			name: 'Song',
			type: 'Word',
			forced: true
		},
    ],
	func: async(message, args, guilded) => {
        if (message.member.voice.channel)
            joinVc(message.member.voice.channel, message.channel);
        else
            return void message.channel.send('Join a VC first!');

        if (args[0]) {
            if (!voiceChannelShit[message.guild.id].playing) {
                await playSong(message.guild.id, args[0], message.author, true);
                message.reply('Playing song!');
            } else {
                addToQueue(message.guild.id, args[0], message.author);
                message.reply('Added to song queue.');
            }
        }
	}
})

commands.loop = new Command({
	desc: 'Loop the song currently playing.\n**[THIS IS DEPRICATED AND WILL BE REMOVED.]**',
	section: 'music',
	aliases: [],
	args: [],
	func: async(message, args, guilded) => {
        if (!voiceChannelShit[message.guild.id])
			return message.channel.send("Join me to a VC first!")
		
		if (voiceChannelShit[message.guild.id].loop) {
			voiceChannelShit[message.guild.id].loop = false;
			message.channel.send("The song currently playing -- if any -- is no longer looping.")
        } else {
			voiceChannelShit[message.guild.id].loop = true;
			message.channel.send("The song currently playing -- if any -- is now going to loop.")
        }
	}
})

commands.skip = new Command({
	desc: 'Skip the song currently playing.\n**[THIS IS DEPRICATED AND WILL BE REMOVED.]**',
	section: 'music',
	aliases: ['skipsong', 'skipmusic'],
	args: [],
	func: async(message, args, guilded) => {
		if (!voiceChannelShit[message.guild.id])
			return message.channel.send("Join me to a VC first!");
		
		if (voiceChannelShit[message.guild.id].loop)
			delete voiceChannelShit[message.guild.id].loop;
		
		if (voiceChannelShit[message.guild.id].battlethemes)
			delete voiceChannelShit[message.guild.id].battlethemes;
		
		endSong(message.guild.id);
		message.react('👍')
	}
})

commands.leavevc = new Command({
	desc: 'Makes me leave the voice chat.\n**[THIS IS DEPRICATED AND WILL BE REMOVED.]**',
	section: 'music',
	aliases: ['fuckoff'],
	args: [],
	func: async(message, args, guilded) => {
		forceStop(message.guild.id);
		leaveVC(message.guild.id);
		message.react('👍');
	}
})