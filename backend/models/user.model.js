import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },
    assistantName: {
      type: String,
    },
    assistantImage: {
      type: String,
    },
    replyCount: {
      type: Number,
      default: 0,
    },

    lastReset: {
      type: Date,
      default: Date.now,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
        },
        text: String,
        time: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
