const socket = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/chat");
const ConnectionRequest = require("../models/conneectionRequest");

const getSecretRoomId = (userId, targetUserId) => {
    return crypto
        .createHash("sha256")
        .update([userId, targetUserId].sort().join("_"))
        .digest("hex");
};

const initializeSocket = (server) => {
    const io = socket(server, {
        cors: {
            origin: "http://localhost:5173",
        },
    });

    io.on("connection", (socket) => {
        console.log("New socket connection");

        socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
            const roomId = getSecretRoomId(userId, targetUserId);
            socket.join(roomId);
            console.log(`User ${firstName} joined room ${roomId}`);
        });


        socket.on("sendMessage", async ({ firstName, lastName, userId, targetUserId, text }) => {
            try {
                const roomId = getSecretRoomId(userId, targetUserId);

                const checkConnection = await ConnectionRequest.findOne({
                    $or: [
                        { fromUserId: userId, toUserId: targetUserId, status: "accepted" },
                        { fromUserId: targetUserId, toUserId: userId, status: "accepted" }
                    ]
                });
        
                if (!checkConnection) {
                    socket.emit("messageError", { message: "Please make the connection to send the message!" });
                    return;
                }

                let chat = await Chat.findOne({
                    participants: { $all: [userId, targetUserId] },
                });

                if (!chat) {
                    chat = new Chat({
                        participants: [userId, targetUserId],
                        messages: []
                    });
                }

                chat.messages.push({
                    senderId: userId,
                    text,
                });

                await chat.save();

                io.to(roomId).emit("messageReceived", { firstName, lastName, text });
                console.log(`Message sent in room ${roomId}`);

            } catch (error) {
                console.error("Error saving chat:", error);
            }
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
        });
    });
};

module.exports = initializeSocket;