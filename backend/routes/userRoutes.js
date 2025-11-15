const router = require("express").Router();
const userController = require("../controllers/userController");

// Debug middleware
router.use((req, res, next) => {
  console.log(`[UserRoutes] ${req.method} ${req.path}`);
  next();
});

// IMPORTANT: Specific routes must come BEFORE parameterized routes like /:id

// Register - POST only (but handle GET requests with helpful error)
router.post("/register", (req, res, next) => {
  console.log("Register route hit! (POST)");
  userController.register(req, res, next);
});

router.get("/register", (req, res) => {
  console.log("GET /register handler hit!");
  res.status(405).json({
    error: "Method not allowed",
    message: "This endpoint requires POST method, not GET.",
    hint: "Use POST /api/user/register with JSON body: { name, email, password }"
  });
});

// Login - POST only (but handle GET requests with helpful error)
router.post("/login", (req, res, next) => {
  console.log("Login route hit! (POST)");
  userController.login(req, res, next);
});

router.get("/login", (req, res) => {
  res.status(405).json({
    error: "Method not allowed",
    message: "This endpoint requires POST method, not GET.",
    hint: "Use POST /api/user/login with JSON body: { email, password }"
  });
});

// Preferences - redirect to taste controller
router.post("/preferences", (req, res, next) => {
  console.log("Preferences route hit! (POST)");
  const tasteController = require("../controllers/tasteController");
  tasteController.savePreferences(req, res, next);
});

// Update profile - PUT /api/user/:id
router.put("/:id", (req, res, next) => {
  console.log(`Update profile route hit! ID: ${req.params.id}`);
  userController.updateProfile(req, res, next);
});

// Get user by ID - must be LAST because it matches any GET /:id
router.get("/:id", (req, res, next) => {
  // Don't match "register" or "login" as IDs
  if (req.params.id === "register" || req.params.id === "login") {
    return res.status(404).json({
      error: "Not found",
      message: `Use POST /api/user/${req.params.id} instead of GET`
    });
  }
  console.log(`Get user route hit! ID: ${req.params.id}`);
  userController.getUser(req, res, next);
});

module.exports = router;
