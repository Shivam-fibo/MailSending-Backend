import express from 'express'
import { getSingleUser } from '../controllers/userContoller.js'

const router = express.Router()

router.get('/:id', getSingleUser)


export default router