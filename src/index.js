require('dotenv').config();
const { Client, Intents, Collection } = require('discord.js');
const path = require('path');
const fs = require('fs');

const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MEMBERS,
	],
});
client.commands = new Collection();

const config_path = path.join(__dirname, './configs/config.json');
try	{
	fs.readFileSync(config_path);
}
catch (err) {
	fs.writeFileSync(config_path, JSON.stringify({
		'reactions' : {
			'default_emoji': '😄',
			'default_delete': true,
			'default_notify': true,
			'channels' : [ ],
		},
		'proposal': {
			'default_channel': {
				'proposals': '',
				'discussion': '',
			},
			'mention': '',
		},
	}, null, '\t'));
}

for (const file of fs.readdirSync(path.join(__dirname, 'commands')).filter((f) => f.endsWith('.js'))) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}


client.once('ready', async () => {
	client.user.setPresence({
		activities: [
			{
				name: 'with high yields 📈',
				type: 'PLAYING',
			},
		],
	});
	const perms = process.env.ALLOWED_USERS.split(',').map(user => { return { id: user, type: 'USER', permission: true };}).concat(process.env.ALLOWED_ROLES.split(',').map(user => { return { id: user, type: 'ROLE', permission: true };}));

	const global_commands = [];

	client.commands?.filter(c => !c.guilds).forEach((command) => global_commands.push(command.name));

	client.commands?.filter(c => !!c.guilds).forEach(command => {
		const data = {
			name: command.name,
		};

		if (command.description) data.description = command.description;
		if (command.type) data.type = command.type;
		data.defaultPermission = false;

		if (command.options) {
			command.options.forEach(o => { if (o.name === 'command') o['choices'] = global_commands.map((gc) => {return { 'name': gc, 'value' : gc };});});
			data.options = command.options;
		}

		command.guilds?.forEach(async (guildKey) => {
			const guild = await client.guilds.cache.get(guildKey);
			const cmd = await guild?.commands.create(data);
			await guild?.commands.permissions.set({
				command: cmd.id, permissions: perms,
			});
			console.log(`Registered ${command.name} on a specific guild! [${guildKey}]`);
		});
	});

	console.log(`Logged in as ${client.user?.tag} and loaded ${client.commands.length || 0} commands!`);
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand() && !interaction.isContextMenu()) return;

	if (!client.commands.has(interaction.commandName)) {
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		return;
	}

	try {
		await client.commands.get(interaction.commandName).execute(interaction);
	}
	catch (error) {
		console.error(error);
		if (interaction.deferred || interaction.replied) await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
		else await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.on('messageCreate', async (message) => {
	const config = JSON.parse(fs.readFileSync(path.join(__dirname, './configs/config.json')).toString());
	const channelConfig = config.reactions.channels.find(c => c.id === message.channelId);
	if (!channelConfig || message.author.bot) return;

	if (channelConfig) {
		if (message.attachments.size > 0) { await message.react(channelConfig.emoji); }
		else if (channelConfig.delete) {
			const deleted = await message.delete().catch();
			if (deleted && channelConfig.notify) {
				const dm = await message.author.send({
					content: `🚫 The channel <#${message.channel.id}> only accepts images or videos!`,
				});
				if (!dm) {
					await message.reply({
						content: `🚫 The channel <#${message.channel.id}> only accepts images or videos!`,
					}).then(msg => { setTimeout(() => msg.delete(), 30000); });
				}
			}
		}
	}
});

client.on('error', (e) => {
	console.error(e);
});

client.login(process.env.BOT_TOKEN).catch((e) => {
	console.error(e);
	throw new Error('Check .ENV, missing BOT_TOKEN');
});