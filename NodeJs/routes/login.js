var express = require('express');
const User = require("../models/user");
var router = express.Router();

/* GET users listing. */
router.post("/", async (req, res) => {
    console.log("hej");
    let users = await User.find({});
    console.log(users);
    const { username, password } = req.body;
    console.log(username);

    const user = await User.findOne({ username: username }).exec();

    console.log("test" + user);

    if (!user) {
        return res.status(401).json({ message: "Invalid username" });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ userId: user._id }, "secret_key");
    res.json({ success: true, token });
});

module.exports = router;