const express = require('express');

const app = express();

app.use("/", (req,res) => {
    res.send("Hello from the namste / server!")
})


app.use("/test", (req,res) => {
    res.send("Hello from the test route server!")
})

app.listen(3000, () => {
    console.log("Server is successfully running on 3000");
});

