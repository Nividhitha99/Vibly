const userService = require("../services/userService");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // simple validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    // check if user exists
    const existing = await userService.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const newUser = await userService.createUser({
      name,
      email,
      password: hash
    });

    res.json({ message: "User registered", userId: newUser.id });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userService.findByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid password" });

    res.json({ message: "Login successful", userId: user.id });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await userService.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "Not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Error fetching user" });
  }
};
