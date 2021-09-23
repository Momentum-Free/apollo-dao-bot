const path = require('path');
const fs = require('fs');
const { Formatters } = require('discord.js');
const { isBotAdmin } = require('../utils/general');
let config = JSON.parse(fs.readFileSync(path.join(__dirname, '../configs/config.json')).toString());

module.exports = {
	name: 'config',
	description: 'Change the bot\'s config!',
	guilds: process.env.ALLOWED_GUILDS?.split(','),
	options: [
		{
			name: 'reaction-channels',
			description: 'Change settings for the auto reactions!',
			type: 'SUB_COMMAND_GROUP',
			options: [
				{
					name: 'add',
					description: 'Setup a new channel for auto reactions!',
					type: 'SUB_COMMAND',
					options: [
						{
							name: 'channel',
							description: 'Channel to add auto reactions',
							type: 'CHANNEL',
							required: true,
						},
						{
							name: 'emoji',
							description: `Emoji to react with (default: ${config.reactions.default_emoji})`,
							type: 'STRING',
							required: false,
						},
						{
							name: 'delete',
							description: `Whether to delete messages without attachments (default: ${config.reactions.default_delete})`,
							type: 'BOOLEAN',
							required: false,
						},
						{
							name: 'notify',
							description: `Whether to notify the members that images are needed (default: ${config.reactions.default_notify})`,
							type: 'BOOLEAN',
							required: false,
						},
					],
				},
				{
					name: 'remove',
					description: 'Removes a channel from auto reactions!',
					type: 'SUB_COMMAND',
					options: [
						{
							name: 'channel',
							description: 'Channel to add auto reactions',
							type: 'CHANNEL',
							required: true,
						},
					],
				},
				{
					name: 'list',
					description: 'List all currently active auto reaction channels!',
					type: 'SUB_COMMAND',
				},
			],
		},
		{
			name: 'proposals',
			description: 'Change settings for default values for the proposals!',
			type: 'SUB_COMMAND_GROUP',
			options: [
				{
					name: 'defaults',
					description: 'Setup the default configurations for the proposals!',
					type: 'SUB_COMMAND',
					options: [
						{
							name: 'proposals_channel',
							description: 'Proposals Channel',
							type: 'CHANNEL',
							required: false,
						},
						{
							name: 'discussion_channel',
							description: 'Discussion Channel',
							type: 'CHANNEL',
							required: false,
						},
						{
							name: 'role',
							description: 'Role to mention',
							type: 'ROLE',
							required: false,
						},
					],
				},
			],
		},
	],
	enabled: true,
	async execute(interaction) {
		config = JSON.parse(fs.readFileSync(path.join(__dirname, '../configs/config.json')).toString());

		const member = interaction.member;
		if (!(member.permissions.has('ADMINISTRATOR') || isBotAdmin(member.id))) {
			interaction.reply({ content: 'You need to be whitelisted to do that!', ephemeral: true });
			return;
		}

		const group = interaction.options.getSubcommandGroup();
		const subcmd = interaction.options.getSubcommand();
		const target = interaction.options.getChannel('channel');

		if (target && !target.isText()) {
			interaction.reply({ content: 'The channel needs to be a text type channel!', ephemeral: true });
			return;
		}

		const ch_proposals = interaction.options.getChannel('proposals_channel');
		const ch_discussion = interaction.options.getChannel('discussion_channel');
		const role = interaction.options.getRole('role');

		const embeds = [];
		let msg = 'Config has been saved!';

		switch (group) {
		case 'reaction-channels':
			switch (subcmd) {
			case 'add':
				if (target.isText()) {
					const emoji = interaction.options.getString('emoji');
					const deleteMsg = interaction.options.getBoolean('delete');
					const notify = interaction.options.getBoolean('notify');
					if (config.reactions.channels.find(c => c.id === target.id)) {
						config.reactions.channels.forEach(c => {
							if (c.id === target.id) {
								c.emoji = emoji === null ? c.emoji : emoji;
								c.delete = deleteMsg === null ? c.delete : deleteMsg;
								c.notify = notify === null ? c.notify : notify;
							}
						});
						msg = 'Auto reactions channel updated!';
					}
					else {
						config.reactions.channels.push({
							id: target.id,
							emoji: emoji || config.reactions.default_emoji,
							delete: deleteMsg || config.reactions.default_delete,
							notify: notify || config.reactions.default_notify,
						});
						msg = 'Auto reactions channel created!';
					}
				}
				break;
			case 'remove':
				if (config.reactions.channels.find(c => c.id === target.id)) {
					config.reactions.channels = config.reactions.channels.filter(c => c.id !== target.id);
					msg = 'Auto reactions channel removed!';
				}
				else {
					interaction.reply({ content: 'That channel is not registered for auto reactions!', ephemeral: true });
					return;
				}
				break;
			case 'list':
				msg = `__This is the list of all active auto reaction channels:__\n\n ${config.reactions.channels.map(c => { return Formatters.channelMention(c.id); }).join(', ')}`;
				break;
			}
			break;
		case 'proposals':
			switch (subcmd) {
			case 'defaults':
				if (!interaction.options) {
					interaction.reply({ content: 'You need to specify at least one option!!', ephemeral: true });
					return;
				}
				if (ch_proposals && !ch_proposals.isText()) {
					interaction.reply({ content: 'The proposals channel needs to be a text type channel!', ephemeral: true });
					return;
				}
				if (ch_discussion && !ch_discussion.isText()) {
					interaction.reply({ content: 'The discussion channel needs to be a text type channel!', ephemeral: true });
					return;
				}

				msg = 'Updating:';

				if (ch_proposals) {
					config.proposal.default_channel.proposals = ch_proposals.id;
					msg += ` default proposals channel to ${Formatters.channelMention(ch_proposals.id)}`;
				}
				if (ch_discussion) {
					config.proposal.default_channel.discussion = ch_discussion.id;
					msg += ` default discussion channel to ${Formatters.channelMention(ch_discussion.id)}`;
				}
				if (role) {
					config.proposal.mention = role.id;
					msg += ` default mention role to ${Formatters.roleMention(role.id)}`;
				}
				break;
			}
			break;

		}

		interaction.reply({
			content: `💾 ${msg}`,
			embeds: embeds,
			ephemeral: true,
		});

		fs.writeFile(path.join(__dirname, '../configs/config.json'), JSON.stringify(config, null, 2), () => console.error);
	},
};