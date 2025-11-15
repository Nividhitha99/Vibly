const userService = require("../services/userService");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("Register request received:", { name, email, password: password ? "***" : "missing" });

    // simple validation
    if (!name || !email || !password) {
      console.log("Validation failed: missing fields");
      return res.status(400).json({ error: "All fields required" });
    }

    // check if user exists
    const existing = await userService.findByEmail(email);
    if (existing) {
      console.log(`Registration failed: Email already exists - ${email}`);
      return res.status(409).json({ error: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const newUser = await userService.createUser({
      name,
      email,
      password: hash
    });

    console.log(`User registered successfully: ${newUser.id}`);
    res.json({ message: "User registered", userId: newUser.id });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await userService.findByEmail(email);
    if (!user) {
      console.log(`Login attempt failed: User not found for email: ${email}`);
      return res.status(404).json({ error: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.log(`Login attempt failed: Invalid password for email: ${email}`);
      return res.status(401).json({ error: "Invalid password" });
    }

    console.log(`Login successful for user: ${user.id}`);
    res.json({ message: "Login successful", userId: user.id });
  } catch (err) {
    console.error("Login error:", err);
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
