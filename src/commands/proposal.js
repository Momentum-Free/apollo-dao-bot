const { MessageActionRow, MessageButton, Formatters, DiscordAPIError } = require('discord.js');
const { proposalEmbeds, proposalsEditMenu } = require('../utils/proposals');
const fs = require('fs');
const path = require('path');

module.exports = {
	name: 'proposal',
	description: 'Setup proposals for voting!',
	guilds: process.env.ALLOWED_GUILDS?.split(','),
	options: [
		{
			name: 'create',
			description: 'Creates a new proposal!',
			type: 'SUB_COMMAND',
			options: [
				{
					name: 'channel',
					description: 'Pick the channel to send the message to!',
					type: 'CHANNEL',
					required: false,
				},
				{
					name: 'discussion_channel',
					description: 'Pick the channel to discuss the proposal!',
					type: 'CHANNEL',
					required: false,
				},
			],
		},
	],
	enabled: true,
	async execute(interaction) {
		const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../configs/config.json')).toString());
		await interaction.deferReply();
		const member = interaction.member;
		const target = interaction.options.getChannel('channel') || await interaction.guild.channels.fetch(config.proposal.default_channel.proposals);
		if (!target.isText()) {
			interaction.reply({ content: 'Channel must be a text channel!', ephemeral: true });
			return;
		}

		const discuss = interaction.options.getChannel('discussion_channel') || await interaction.guild.channels.fetch(config.proposal.default_channel.discussion);
		if (!target.isText()) {
			interaction.reply({ content: 'Discussion channel must be a text channel!', ephemeral: true });
			return;
		}

		const channel = interaction.channel;
		const subcmd = interaction.options.getSubcommand();
		const filter_messages = m => m.author.id === member.id;
		const main_filter_button = (int) => ['send_proposal', 'edit_proposal', 'cancel_proposal'].includes(int.customId) && int.user.id === member.id;


		let embed;
		let row;
		let temp;
		let info = {
			proposalId: undefined,
			title: undefined,
			details: undefined,
			link: undefined,
			discuss: discuss,
			member: member,
		};
		let sent;

		switch (subcmd) {
		case 'create':

			await interaction.editReply({ content: 'Please send me the number of your proposal' });
			await channel.awaitMessages({ filter: filter_messages, max: 1, time: 60000, errors: ['time'] })
				.then(collected => {
					info.proposalId = collected.first().content;
					collected.first().delete();
				})
				.catch(collected => console.log(collected));

			await interaction.editReply({ content: 'Please send me the title for your proposal' });
			await channel.awaitMessages({ filter: filter_messages, max: 1, time: 60000, errors: ['time'] })
				.then(collected => {
					info.title = collected.first().content;
					collected.first().delete();
				})
				.catch(collected => console.log(collected));

			await interaction.editReply({ content: 'Please send me the details of your proposal' });
			await channel.awaitMessages({ filter: filter_messages, max: 1, time: 60000, errors: ['time'] })
				.then(collected => {
					info.details = collected.first().content;
					collected.first().delete();
				})
				.catch(collected => console.log(collected));

			await interaction.editReply({ content: 'Please send me the link for your detailed proposal' });
			await channel.awaitMessages({ filter: filter_messages, max: 1, time: 60000, errors: ['time'] })
				.then(collected => {
					info.link = collected.first().content;
					collected.first().delete();
				})
				.catch(collected => console.log(collected));

			embed = proposalEmbeds(info);

			row = new MessageActionRow().addComponents([
				new MessageButton({
					customId: 'send_proposal',
					label: 'Send',
					style: 'SUCCESS',
					emoji: '✈️',
				}),
				new MessageButton({
					customId: 'edit_proposal',
					label: 'Edit',
					style: 'PRIMARY',
					emoji: '✏️',
				}),
				new MessageButton({
					customId: 'cancel_proposal',
					label: 'Cancel',
					style: 'DANGER',
					emoji: '🚫',
				}),
			]);

			await interaction.editReply(
				{
					content: `This is how it will look, are you ready to send it to <#${target.id}>?`,
					embeds: [ embed ],
					components: [ row ],
				},
			);

			temp = await channel.awaitMessageComponent({ main_filter_button, time: 60000 }).catch(() => {throw ('The interaction timed out');});
			await temp.deferReply();

			while (temp.customId === 'edit_proposal') {
				await interaction.editReply({ components: [] });
				info = await proposalsEditMenu(interaction, temp, info);
				await interaction.editReply(
					{
						content: `This is how it will look, are you ready to send it to <#${target.id}>?`,
						embeds: [ proposalEmbeds(info) ],
						components: [ row ],
					},
				);
				temp = await channel.awaitMessageComponent({ main_filter_button, time: 60000 }).catch();
				await temp.deferReply();
			}

			switch (temp.customId) {
			case 'send_proposal':
				await interaction.deleteReply();
				await target.send({ content: Formatters.roleMention(config.proposal.mention), embeds: [ embed ] })
					.then(async (msg) => {
						sent = true;
						await msg.react('890255042202980402').catch();
						await msg.react('890255041397665842').catch();
					})
					.catch(async () => {
						await temp.editReply({ content: 'I do not have permission to send messages to that channel!' });
					});

				if (!sent) return;
				await temp.editReply({
					content: '✅ The proposal message was sent!',
				});
				break;
			case 'cancel_proposal':
				await interaction.deleteReply();
				await temp.editReply({
					content: '❌ The proposal message was canceled!',
				});
				break;
			}
			return;
		}
	},
};