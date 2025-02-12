const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");



const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        index: true,
        minLength: 2,
        maxLength: 50,
    },
    lastName: {
        type: String
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid email address: " + value);
            }
        }
    },
    password: {
        type: String,
        required: true,
        validate(value) {
            if (!validator.isStrongPassword(value)) {
                throw new Error("Enter a strong Password: " + value);
            }
        }
    },
    age: {
        type: Number,
        min: 18
    },
    gender: {
        type: String,
        enum: {
            values: ["Male", "Female", "Other"],
            message: `{VALUE} is not a valid gender type`
        }
        
    },
    location: {
        type: String,
    },
    isPremium: {
        type: Boolean,
        default: false,
    },
    membershipType: {
        type: String
    },
    photoUrl: {
        type: String,
        default: "https://t4.ftcdn.net/jpg/09/64/89/19/360_F_964891988_aeRrD7Ee7IhmKQhYkCrkrfE6UHtILfPp.jpg",
    },
    githubUrl: {
        type: String,
    },
    about: {
        type: String,
        default: "This is default docs"
    },
    skills: {
        type: [String]
    },
},
    {
        timestamps: true,
    }
);

userSchema.methods.getJWT = async function () {
    const user = this;

    const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {expiresIn: "1d"});

    return token;
};

userSchema.methods.validatePassword = async function (passwordInputByUser) {
    const user = this;
    const passwordHash = user.password;
    const isPasswordValid = await bcrypt.compare(passwordInputByUser, passwordHash);

    return isPasswordValid;
};

module.exports = mongoose.model("User", userSchema);;