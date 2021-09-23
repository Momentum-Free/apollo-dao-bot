const { isBotAdmin } = require('../utils/general');

module.exports = {
	name: 'deploy',
	description: 'Updates and registers the slash-commands!',
	guilds: process.env.ALLOWED_GUILDS?.split(','),
	enabled: true,
	async execute(interaction) {
		const member = interaction.member;
		if (!isBotAdmin(member.id)) {
			interaction.reply({ content: 'You need to be whitelisted to do that!', ephemeral: true });
			return;
		}

		let commands = await interaction.client.application?.commands.fetch();

		let commands_registered = 0;
		let commands_updated = 0;
		let commands_deleted = 0;

		interaction.client.commands?.filter(c => !c.guilds).forEach((command) => {
			const data = {
				name: command.name,
				description: command.description,
				options: undefined,
			};

			if (command.options) {
				data.options = command.options;
			}


			const exists = commands?.find(c => data.name === c.name);
			if (exists?.id) {
				console.log(`Updated ${command.name} globally!`);
				commands_updated++;
				interaction.client.application?.commands.edit(exists.id, {
					name: data.name,
					description: data.description,
					options: data.options,
				});
			}
			else {
				console.log(`Registered ${command.name} globally!`);
				commands_registered++;
				interaction.client.application?.commands.create({
					name: data.name,
					description: data.description,
					options: data.options,
				});
			}
			commands = commands?.filter(c => c.name !== command.name);
		});
		commands?.forEach((command) => {
			interaction.client.application?.commands.delete(command.id);
		});

		commands_deleted = commands?.size || 0;

		await interaction.reply({
			content: `A total of ${commands_registered + commands_updated + commands_deleted} commands have been processed! \nRegistered: ${commands_registered} | Updated: ${commands_updated} | Deleted: ${commands_deleted}`,
			ephemeral: true,
		});
	},
};