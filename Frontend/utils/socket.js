// utils/socket.js
import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

const socket = io(`${API_BASE_URL}`); 

export const registerUser = (userId) => {
  socket.emit("register", userId);
};

export const listenToNotifications = (callback) => {
  socket.on("new-notification", callback);
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};
