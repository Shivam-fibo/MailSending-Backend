import User from "../models/User.js";

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
