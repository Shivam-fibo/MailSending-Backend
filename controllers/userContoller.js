import User from "../models/User.js";
import Mail from "../models/Mail.js";

export const getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('email isUpgrade');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUserEmail = async(req, res) =>{
    // console.log(req.params.id)
    const {id} = req.params.id
   
    try {
        const userEmail = await Mail.find(id)
        if(!userEmail){
            return res.status(404).json({error: "user not found"})
        }

        res.status(200).json(userEmail)
    } catch (error) {
        console.log("Error", error)
            res.status(500).json({ error: 'Server error' });

    }
}
