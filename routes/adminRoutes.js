import express from "express"
import { AllUser, UpdateUser, GetAllMail } from "../controllers/adminController.js"

const router = express.Router()

router.get("/allUser" , AllUser)
router.put("/updateUser", UpdateUser)
router.get("/mail",GetAllMail )
export default router;
