import { w3cwebsocket as W3CWebSocket } from "websocket";

export const phone: string = "5511971297301";

export const socket = new W3CWebSocket(
  `ws://api.maximizeai.io:8100/ws/chat/${phone}`
);
