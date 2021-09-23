module.exports = {
	isBotAdmin: function(user_id) {
		const users = process.env.ALLOWED_USERS?.split(',');
		if (!users) throw new Error('Check .ENV, missing ALLOWED_USERS');
		return users.includes(user_id);
	},
};

