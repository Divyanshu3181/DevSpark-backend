const mongoose = require('mongoose');

const connectDB = async () => {
    await mongoose.connect(
        "mongodb+srv://namastedev:1234@cluster0.wuxyg6t.mongodb.net/devTinder"
    );
};

module.exports = connectDB;

