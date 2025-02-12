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
        console.log("Webhook received:", {
            event: req.body.event,
            payload: req.body.payload
        });

        const webhookSignature = req.get("X-Razorpay-Signature");
        console.log("Received webhook signature:", webhookSignature);
        
        // Log the exact data being used for signature validation
        const webhookBody = JSON.stringify(req.body);
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        console.log("Webhook body for validation:", webhookBody);
        console.log("Webhook secret first 4 chars:", webhookSecret ? webhookSecret.substring(0, 4) : "null");

        let isWebhookVaid = false;
        try {
            isWebhookVaid = validateWebhookSignature(
                webhookBody,
                webhookSignature,
                webhookSecret
            );
            console.log("Signature validation result:", isWebhookVaid);
        } catch (signatureError) {
            console.error("Signature validation error details:", {
                error: signatureError.message,
                stack: signatureError.stack
            });
            return res.status(400).json({ msg: "Webhook signature validation error" });
        }

        if(!isWebhookVaid) {
            console.log("Invalid webhook signature");
            return res.status(400).json({ msg: "Webhook signature is invalid" });
        }

        // Update payment status in DB
        const paymentDetails = req.body.payload.payment.entity;
        console.log("Payment details:", paymentDetails);
        
        const payment = await Payment.findOne({ orderId: paymentDetails.order_id });
        if (!payment) {
            console.log("Payment not found for order_id:", paymentDetails.order_id);
            return res.status(404).json({ msg: "Payment not found" });
        }
        console.log("Found payment:", payment);
        
        payment.status = paymentDetails.status;
        await payment.save();

        // Only update user premium status if payment is successful
        if(req.body.event === "payment.captured") {
            console.log("Payment captured, updating user premium status");
            const user = await User.findOneAndUpdate(
                { _id: payment.userId },
                { 
                    isPremium: true,
                    membershipType: payment.notes.membershipType
                },
                { new: true }
            );
            if (!user) {
                console.log("User not found for userId:", payment.userId);
                return res.status(404).json({ msg: "User not found" });
            }
            console.log("Updated user:", user);
        } else if(req.body.event === "payment.failed") {
            console.log("Payment failed, updating user status");
            const user = await User.findOneAndUpdate(
                { _id: payment.userId },
                { 
                    isPremium: false,
                    membershipType: null
                },
                { new: true }
            );
            if (!user) {
                console.log("User not found for userId:", payment.userId);
                return res.status(404).json({ msg: "User not found" });
            }
            console.log("Updated user:", user);
        } else {
            console.log("Unhandled webhook event:", req.body.event);
        }

        return res.status(200).json({ msg: "Webhook received successfully" });
        
    } catch (error) {
        console.error("Webhook error:", error);
        return res.status(500).json({ msg: error.message });
    }
});

paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
    const user = req.user.toJSON();
    console.log(user);
    if (user.isPremium) {
        return res.json({ ...user }); // Changed to return full user object
    }
    return res.json({ ...user }); // Changed to return full user object
})

module.exports = paymentRouter;

