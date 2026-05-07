import ws from "k6/ws";
import { check } from "k6";

export const options = {
  vus: 100,
  duration: "30s",
};

export default function () {
  const url = "ws://localhost:3000"; // adjust when running inside cluster
  const res = ws.connect(url, {}, function (socket) {
    socket.on("open", () => {
      socket.send(JSON.stringify({ type: "join-room", room: "test" }));
    });
    socket.on("message", (data) => {
      check(data, { "received message": (d) => d !== "" });
    });
    socket.setInterval(() => {
      socket.send(JSON.stringify({ type: "send-message", text: "hello" }));
    }, 1000);
  });
}