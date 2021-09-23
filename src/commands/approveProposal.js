const { Formatters } = require('discord.js');
module.exports = {
	name: 'Approve Proposal',
	type: 'MESSAGE',
	guilds: process.env.ALLOWED_GUILDS?.split(','),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		const message = await interaction.channel.messages.fetch(interaction.targetId);
		if (!(message.author.id === interaction.client.user.id && message.embeds?.length === 1 && message.embeds[0]?.title.startsWith('Proposal') && message.embeds[0]?.color === 16705372)) {
			throw ('This message is not a valid Proposal!');
		}
		const embed = message.embeds[0];
		embed.setColor('GREEN');
		embed.addField('Deadline', embed.fields[3].value.replace('D', 'f'), true);
		embed.fields[3].name = `${Formatters.formatEmoji('890255042202980402', true)} Closed`;
		embed.fields[3].value = Formatters.time(Math.floor(Date.now() / 1000), 'D');
		await message.edit({ embeds: [ embed ] });
		await interaction.editReply({ content: `${Formatters.formatEmoji('890255042202980402', true)} Proposal Approved` });
	},
};