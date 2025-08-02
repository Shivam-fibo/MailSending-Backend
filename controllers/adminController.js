import User from "../models/User.js";
import Mail from "../models/Mail.js";
export const AllUser = async (req, res) => {
  try {
    const users = await User.find().select('_id email isUpgrade');
    console.log(users);
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const UpdateUser = async (req, res) => {
  // console.log("req is", req.body)
  console.log("hello")
  try {
    const { userId } = req.body;

    const user = await User.findById(userId); 

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.isUpgrade) {
      return res.status(400).json({ error: "User is already upgraded" });
    }
    // console.log(user.isUpgrade)
    user.isUpgrade = true;
    await user.save(); 
    // console.log(user.isUpgrade)

    res.status(200).json({
      message: "User upgraded successfully",
    });
  } catch (error) {
    console.error(error); 
    res.status(500).json({ error: "Something went wrong" });
  }
};


export const GetAllMail =  async(req, res) =>{
  try {
    const allMail = await Mail.find()
    const userId = allMail.map(mail => mail.userId);
    console.log(userId)
    return res.status(200).json({allMail, userId})
  } catch (error) {
    console.log(error)
     res.status(500).json({ error: "Something went wrong" });
  }
}