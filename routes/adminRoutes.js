import express from "express"
import { AllUser, UpdateUser } from "../controllers/adminController.js"

const router = express.Router()

router.get("/allUser" , AllUser)
router.put("/updateUser", UpdateUser)
export default router;
