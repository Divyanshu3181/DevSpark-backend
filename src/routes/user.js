const express = require("express");
const userRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const ConnectionRequests = require("../models/conneectionRequest");
const User = require("../models/user");

const USER_SAVE_DATA = "firstName lastName age photoUrl about gender skills location githubUrl";

userRouter.get("/user/requests/received", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;

        const connectionRequests = await ConnectionRequests.find({
            toUserId: loggedInUser._id,
            status: "interested",
        }).populate("fromUserId", USER_SAVE_DATA);


        res.json({
            message: "Fetched the data successfully",
            data: connectionRequests
        })

    } catch (error) {
        res.status(400).send("ERROR: ", error.message);
    }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;

        const connectionRequests = await ConnectionRequests.find({
            $or: [
                { toUserId: loggedInUser._id, status: "accepted" },
                { fromUserId: loggedInUser._id, status: "accepted" },
            ],
        })
            .populate("fromUserId", USER_SAVE_DATA)
            .populate("toUserId", USER_SAVE_DATA);

        if (connectionRequests.length === 0) {
            return res.status(200).json({ message: "No accepted connections found" })
        };

        const data = connectionRequests.map((row) => {
            if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
                return row.toUserId
            }
            return row.fromUserId
        });

        res.status(200).json({ data });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

userRouter.get("/feed", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;

        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        limit = limit > 50 ? 50 : limit;
        const skip = (page-1) * limit;
        
        const connectionRequests = await ConnectionRequests.find({
            $or: [{ fromUserId: loggedInUser._id}, {toUserId: loggedInUser._id}],
        }).select("fromUserId toUserId");

        const hideUserFromFeed = new Set();
        connectionRequests.forEach(req => {
            hideUserFromFeed.add(req.fromUserId.toString());
            hideUserFromFeed.add(req.toUserId.toString());
        });

        const users = await User.find({
            $and:[
            {_id: {$nin: Array.from(hideUserFromFeed)}},
            {_id: {$ne: loggedInUser._id}},
            ],
        }).select(USER_SAVE_DATA).skip(skip).limit(limit);

        res.send(users);

    } catch (error) {
        res.status(400).json({message: "ERRPR" + error.message});
    }
})

module.exports = userRouter;