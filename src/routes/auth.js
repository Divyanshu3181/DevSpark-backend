const express = require("express");
const authRouter = express.Router();
const { validateSignUpData } = require("../utils/validation");
const bcrypt = require("bcrypt");
const User = require("../models/user");


authRouter.post("/signup", async (req, res) => {
    try {
        validateSignUpData(req);
        const { firstName, lastName, emailId, password, age, gender, photoUrl, githubUrl, about, skills, location } = req.body;

        const passwordHash = await bcrypt.hash(password, 10);
        console.log(passwordHash);
        const user = new User({
            firstName, lastName, emailId, age, gender, location, githubUrl, about, skills, password: passwordHash
        });

        const savedUser = await user.save();
        const token = await savedUser.getJWT();

        res.cookie("token", token, {
            expires: new Date(Date.now() + 8 * 3600000)
        });

        res.json({message: "User Added successfully", data: savedUser});
        
    } catch (error) {
        res.status(400).send("Error:" + error.message);
    }
});

authRouter.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;

        const user = await User.findOne({ emailId: emailId });
        if (!user) {
            throw new Error("Invalid Credential");
        }
        const isPasswordValid = await user.validatePassword(password);
        if (isPasswordValid) {
            const token = await user.getJWT();
           // res.cookie("token", token, {
             //   expires: new Date(Date.now() + 8 * 3600000)
            //});
            res.cookie("token", token, {
        httpOnly: true,    // ✅ Prevents client-side access
        secure: true,      // ✅ Required for HTTPS
        sameSite: "None",  // ✅ Required for cross-origin requests
        expires: new Date(Date.now() + 8 * 3600000),
        });


            res.send(user);
        } else {
            throw new Error("Invalid Credential");
        }
    } catch (error) {
        res.status(404).send("ERROR : " + error.message);
    }
});

authRouter.post("/logout", async (req, res) => {

    //res.cookie("token", null, {
       // expires: new Date(Date.now()),
  //  });
    res.cookie("token", "", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        expires: new Date(0),  // ✅ Clears cookie
    });
    res.send("Logout Successful")
});

module.exports = authRouter;
