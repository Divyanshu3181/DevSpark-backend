const express = require("express");
const { userAuth } = require("../middlewares/auth");
const paymentRouter = express.Router();
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payment");
const { membershipAmount } = require("../utils/constant");
const User = require("../models/user")
const {validateWebhookSignature} = require('razorpay/dist/utils/razorpay-utils')

paymentRouter.post("/payment/create", userAuth, async (req, res) => {

    try {
        const { membershipType } = req.body;
        const { firstName, lastName, emailId } = req.user;

        const order = await razorpayInstance.orders.create({
            amount: membershipAmount[membershipType] * 100,
            currency: "INR",
            receipt: "order_rcptid_11",
            notes: {
                firstName,
                lastName,
                emailId,
                membershipType: membershipType,
            },
        });

        //Save it in DB
        const payment = new Payment({
            userId: req.user._id,
            orderId: order.id,
            status: order.status,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            notes: order.notes, 
        })

        const savedPayment = await payment.save();

        //Return back my order details to frontend
        res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });


    } catch (error) {
        return res.status(500).json({ msg: error.message });
    }

});

paymentRouter.post("/payment/webhook", async (req, res) => {
    try {
        const webhookSignature = req.headers("X-Razorpay-Signature");

        const isWebhookVaid = validateWebhookSignature(
            JSON.stringify(req.body), 
            webhookSignature, 
            process.env.RAZORPAY_WEBHOOK_SECRET
        );

        if(!isWebhookVaid) {
            return res.status(400).json({ msg: "Webhook signature is invalid" });
        }

        // Update my payment status in DB
        const paymentDetails = req.body.payload.payment.entity
        
        const payment = await Payment.findOne({ orderId: paymentDetails.order_id });
        payment.status = paymentDetails.status;
        await payment.save();

        const user = await User.findOne({_id: payment.userId});
        user.isPremium = true;
        user.membershipType = payment.notes.membershipType;

        await user.save();
        // Update the user as premium


        // if(req.body.event == "payment.captured") {
            
        // }

        // if(req.body.event == "payment.failed") {

        // }

        return res.status(200).json({ msg: "Webhook received successfully "});
        
    } catch (error) {
        return res.status(500).json({ msg: error.message });
    }
});

paymentRouter.get("/premium/verify", userAuth, async(req, res) => {
    const user = req.user;
    if(user.isPremium){
        return res.json({ isPremium: true });
    }
    return res.json({ isPremium: false });
});

module.exports = paymentRouter;

