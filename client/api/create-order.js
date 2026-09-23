const Razorpay = require("razorpay");

const plans = {
  mains: 799,
  advanced: 899,
  bundle: 1099,
  test1: 1,
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { plan } = req.body;

    if (!plans[plan]) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: plans[plan] * 100,
      currency: "INR",
      receipt: `dakhilaa_${Date.now()}`,
    });

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      error: "Unable to create Razorpay order",
    });
  }
};