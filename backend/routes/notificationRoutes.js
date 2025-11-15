const router = require("express").Router();
const controller = require("../controllers/notificationController");

router.get("/:userId", controller.getNotifications);
router.get("/:userId/unread-count", controller.getUnreadCount);
router.put("/:notificationId/read", controller.markAsRead);
router.put("/:userId/read-all", controller.markAllAsRead);

module.exports = router;

