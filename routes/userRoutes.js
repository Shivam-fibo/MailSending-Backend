import express from 'express'
import { getSingleUser, getUserEmail } from '../controllers/userContoller.js'

const router = express.Router()

router.get('/:id', getSingleUser)
router.get('/userEmail/:id', getUserEmail)

export default router