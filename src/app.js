const express = require('express');
const connectDB = require("./config/database");
const app = express();
const cookieParser = require('cookie-parser');
const cors = require("cors");
const http = require("http");

app.use(cors({
   origin: "http://localhost:5173",
   credentials: true,
}))



app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require('./routes/user');
const initializeSocket = require('./utils/socket');
const chatRouter = require('./routes/chat');
const paymentRouter = require('./routes/payment');

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);
app.use("/", chatRouter);

const server = http.createServer(app);
initializeSocket(server);


connectDB()
    .then(() => {
        console.log("Database connection established...");
        server.listen(process.env.PORT || 3000, () => {
            console.log("Server is successfully running on 3000");
        });
    })
    .catch(err => {
        console.error("Database cannot be connected");
    });



