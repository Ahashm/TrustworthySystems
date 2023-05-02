const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

userSchema.methods.createuser = async function (password) {
  if (!this.isModified("password")) {
    return password;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    password = hash;
    console.log("hash" + password);
    return password;
  } catch (err) {
    password(err);
  }
};

userSchema.methods.comparePassword = async function (password) {
  console.log("a " + this.password);
  console.log("b " + password);
  return password == this.password;
  // return bcrypt.compare(password, this.password, function (err, result) {
  //   if (err) {
  //     console.log("Error: " + err);
  //   } else if (result === true) {
  //     console.log("Password match.");
  //   } else {
  //     console.log("Password does not match.");
  //   }
  // });
};

const User = mongoose.model("User", userSchema);
module.exports = User;
