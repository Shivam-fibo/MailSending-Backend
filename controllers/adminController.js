import User from "../models/User.js";

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
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Toggle the isUpgrade field
    user.isUpgrade = !user.isUpgrade;
    await user.save();

    res.status(200).json({
      message: `User upgrade status changed to ${user.isUpgrade}`,
      isUpgrade: user.isUpgrade,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

