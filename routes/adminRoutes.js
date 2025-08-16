import express from "express"
import { AllUser, UpdateUser, GetAllMail } from "../controllers/adminController.js"
import { protect } from "../middleware/authAdmin.js"
const router = express.Router()

router.get("/allUser", protect,  AllUser)
router.put("/updateUser", protect,  UpdateUser)
router.get("/mail", protect, GetAllMail )
export default router;
