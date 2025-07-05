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

export const listenToApprovedRequests = (callback) => {
  socket.on('new-approved-request', callback);

  return () => {
    socket.off('new-approved-request', callback);
  };
};


export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};
