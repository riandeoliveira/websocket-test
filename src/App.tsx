import { AxiosResponse } from "axios";
import { ReactElement, useCallback, useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { api } from "./api";
import { phone, socket } from "./socket";

type ApiResponse = {
  access?: string;
  refresh?: string;
};

type MessageType = {
  content?: string;
  sender?: string;
  role?: string;
  text?: string;
  targetNumber?: string;
};

export const App = (): ReactElement => {
  const [accessToken, setAccessToken] = useState<string>("");
  const [messageList, setMessageList] = useState<MessageType[]>([]);
  const [message, setMessage] = useState<string>("");

  const handleFetchMessages = useCallback(async (): Promise<void> => {
    const response = await api.get(`/chat/external/messages?contact=${phone}`);

    setMessageList(response.data);
  }, []);

  const handleAuthenticate = useCallback(async (): Promise<void> => {
    const request = {
      email: "user@example.com",
      password: "string",
    };

    const response: AxiosResponse<ApiResponse> = await api.post(
      "/token",
      request
    );

    const { access } = response.data;

    if (access) setAccessToken(access);
  }, []);

  const handleSendMessage = async (): Promise<void> => {
    const request = {
      target_phone: phone,
      text: `*Usuário*\n${message}`,
      from_bot: false,
      is_assigned: true,
    };

    await api.post("/whatsapp/send", request, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  };

  useEffect(() => {
    handleAuthenticate();
    handleFetchMessages();

    socket.onopen = () => {
      console.log("CLIENTE CONECTADO COM SUCESSO!");
    };

    socket.onerror = () => {
      console.log("NÃO FOI POSSÍVEL CONECTAR!");
    };

    socket.onmessage = (response: unknown) => {
      const messageData: MessageType = JSON.parse(response.data).message;

      if (messageData && messageData.sender === "customer") {
        const formattedMessage = {
          sender: messageData.targetNumber,
          role: messageData.sender,
          text: messageData.content,
        };

        setMessageList((previousMessages) => [
          ...previousMessages,
          formattedMessage,
        ]);
      }
    };

    return () => {
      if (socket.readyState === 1) socket.close();
    };
  }, [handleAuthenticate, handleFetchMessages]);

  return (
    <div className="p-4">
      <input
        type="text"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        className="bg-neutral-200 rounded-lg p-2"
      />
      <button
        type="button"
        onClick={handleSendMessage}
        className="bg-green-500 rounded-lg p-2 m-8 text-white hover:bg-green-600 transition-colors"
      >
        Enviar
      </button>
      <h1 className="text-xl p-6">Lista de Mensagens:</h1>
      <ul className="bg-neutral-300 p-6 flex flex-col gap-2 rounded-lg">
        {messageList.map(({ content, text, role }) => (
          <li
            key={uuid()}
            className={`flex ${
              role === "customer" ? "justify-start" : "justify-end"
            }`}
          >
            <span
              className={`rounded-lg p-1 ${
                role === "customer" ? "bg-green-500" : "bg-blue-500"
              }`}
            >
              {content ? content : text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
