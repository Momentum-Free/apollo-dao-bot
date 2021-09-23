const { MessageEmbed, Formatters, MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js');
module.exports = {
	proposalEmbeds: function(info) {
		const embed = new MessageEmbed({
			title: `Proposal #${info.proposalId.padStart(4, '0')} - ${info.title}`,
			description: info.details,
		});
		embed.setURL(info.link);
		embed.setColor('YELLOW');
		embed.addField('🔗 Link', `[+ Info](${info.link})`, true);
		embed.addField('👤 Author', Formatters.userMention(info.member.id), true);
		embed.addField('⏰ Launched', Formatters.time(Math.floor(Date.now() / 1000), 'D'), true);
		embed.addField('⌛ Pending', Formatters.time(Math.floor(new Date().setHours(new Date().getHours() + 72) / 1000), 'R'), true);
		embed.addField('💬 Chat/Discuss', `Use the ${Formatters.channelMention(info.discuss.id)} channel`, true);
		return embed;
	},

	proposalsEditMenu: async function(main, response, info) {
		const filter = (int) => (int.customId === 'proposal_setting' || int.customId === 'proposal_setting_cancel') && int.user.id === main.member.id;
		const filter_messages = m => m.author.id === main.member.id;
		const rows = [
			new MessageActionRow().addComponents([
				new MessageSelectMenu({
					customId: 'proposal_setting',
					placeholder: 'Setting to Change!',
					options: [
						{
							label: 'Proposal ID',
							value: 'proposal_setting_id',
							description: 'Change the ID this proposal',
							emoji: '📝',
						},
						{
							label: 'Proposal Title',
							value: 'proposal_setting_title',
							description: 'Change the title',
							emoji: '📝',
						},
						{
							label: 'Proposal Details',
							value: 'proposal_setting_details',
							description: 'Change the details',
							emoji: '📝',
						},
						{
							label: 'Proposal Link',
							value: 'proposal_setting_link',
							description: 'Change the link for the proposal',
							emoji: '🔗',
						},
					],
				}),
			]),
			new MessageActionRow().addComponents([
				new MessageButton({
					customId: 'proposal_setting_cancel',
					label: 'Back',
					style: 'PRIMARY',
					emoji: '⬅️',
				}),
			]),
		];

		await response.editReply({
			content: 'What would you like to change?',
			components: rows,
		});


		let temp = await main.channel.awaitMessageComponent({ filter, time: 60000 }).catch();
		let new_value = [];
		await response.editReply({ components: rows });

		while (temp.customId !== 'proposal_setting_cancel') {
			switch (temp.customId) {
			case 'proposal_setting':
				switch (temp.values[0]) {
				case 'proposal_setting_id':
					await temp.reply({ content: 'Please type the new proposal ID' });
					new_value = await main.channel.awaitMessages({ filter_messages, max: 1, time: 60000 }).catch();
					if (!new_value) {
						break;
					}
					else {
						info.proposalId = new_value.first().content;
					}
					break;
				case 'proposal_setting_title':
					await temp.reply({ content: 'Please type your new title' });
					new_value = await main.channel.awaitMessages({ filter_messages, max: 1, time: 60000 }).catch();
					if (!new_value) {
						break;
					}
					else {
						info.title = new_value.first().content;
					}
					break;
				case 'proposal_setting_details':
					await temp.reply({ content: 'Please type the new details' });
					new_value = await main.channel.awaitMessages({
						filter: filter_messages,
						max: 1,
						time: 60000,
					}).catch();
					if (!new_value) {
						break;
					}
					else {
						info.details = new_value.first().content;
					}
					break;
				case 'proposal_setting_link':
					await temp.reply({ content: 'Please type the link for the question' });
					new_value = await main.channel.awaitMessages({
						filter: filter_messages,
						max: 1,
						time: 60000,
					}).catch();
					if (!new_value) {
						break;
					}
					else {
						info.link = new_value.first().content;
					}
					break;
				}
				break;
			}
			await new_value.first().delete();
			await temp.deleteReply();
			const embed = proposalEmbeds(info);
			await main.editReply({ embeds: [embed] });
			temp = await main.channel.awaitMessageComponent({ filter_button: filter, time: 60000 }).catch();
			await response.editReply({
				content: 'What would you like to change?',
				components: rows,
			});
		}
		await response.deleteReply();
		return info;
	},

};