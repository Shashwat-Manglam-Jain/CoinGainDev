// socket.js
const { Server } = require("socket.io");

let io;

const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // allow mobile app or web access
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("register", (userId) => {
      socket.join(userId); // user joins their personal room
      console.log(`User ${userId} registered and joined room`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};

const sendNotificationToUser = (userId, data) => {
  if (io) {
    io.to(userId).emit("new-notification", data);
  }
};

const sendApproveToAdmin = (adminId, data) => {
  if (io) {
    io.to(adminId).emit("new-approved-request", data);
  }
};

module.exports = {
  setupSocket,
  sendNotificationToUser,
  sendApproveToAdmin,
};
