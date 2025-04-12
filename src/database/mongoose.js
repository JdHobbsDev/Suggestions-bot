const mongoose = require('mongoose');

module.exports = {
    init: async () => {
        try {
            await mongoose.connect(process.env.mongoURI);
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            process.exit(1);
        }
    }
};