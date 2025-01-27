const validator = require("validator");

const validateSignUpData = (req) => {
    const { firstName, lastName, emailId, password } = req.body;

    if (!firstName || !lastName) {
        throw new Error("First name and last name are required.");
    }

    if (firstName.length < 4 || firstName.length > 50) {
        throw new Error("First name should be between 4 and 50 characters.");
    }

    if (!validator.isEmail(emailId)) {
        throw new Error("Email address is not valid.");
    }

    if (!validator.isStrongPassword(password)) {
        throw new Error(
            "Password is not strong enough. It must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character."
        );
    }
};

const validateProfileEditData = (req) => {
    const allowedEditFields = [
        "firstName",
        "lastName",
        "emailId",
        "photoUrl",
        "githubUrl",
        "gender",
        "age",
        "location",
        "about",
        "skills"
    ];
    const isEditAllowed = Object.keys(req.body).every((field) => allowedEditFields.includes(field)
    );
    return isEditAllowed;
}

    module.exports = {
        validateSignUpData,
        validateProfileEditData,

    };
