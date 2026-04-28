import React, { createContext, useContext, useState, useEffect } from "react";
import { Children } from "react";
import { ChatContext } from "./createContext";

export const ChatProvider = ({ children }) => {
  const [message, setMessage] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectNiche, setSelectNiche] = useState("Hooks");
  const [codingMode, setCodingMode] = useState(false);
  const [resettingMode, setResettingMode] = useState(false);

  const [survey, setSurvey] = useState(() => {
    const surveyData = localStorage.getItem("surveyData"); // find the data from local storage

    return surveyData
      ? JSON.parse(surveyData)
      : {
          // unpacks the survey to use the items inside
          userName: "Ali",
          experience: "",
          techStack: "",
          targetRole: "",
          isCompleted: false,
          agentName: "",
        };
  });

  useEffect(() => {
    localStorage.setItem("surveyData", JSON.stringify(survey)); // converts the survey object into a string
  }, [survey]);

  const addMessage = (sender, text, audioBase64 = null) => {
    setMessage((prev) => [
      ...prev,
      {
        sender,
        text,
        audio: audioBase64,
      },
    ]);
  };

  const deleteMessage = () => {
    setMessage([]);
  };

  const resetInterview = () => {
    // for the 2 banner animation we add a flag
    setMessage([]);
    setIsProcessing(true);
    setResettingMode(true);
    const defaultState = {
      userName: "",
      experience: "",
      techStack: "",
      targetRole: "",
      isCompleted: false,
    };
    setSurvey(defaultState);

    localStorage.removeItem("surveyData");
  };

  const handleOptionUpdate = (option) => {
    setMessage((prev) => {
      const lastMsg = prev[prev.length - 1];

      if (lastMsg && lastMsg.sender === "chosenOption") {
        const newHistory = prev.slice(0, -1);
        return [
          ...newHistory,
          { sender: "chosenOption", text: option, audio: null },
        ];
      }

      return [...prev, { sender: "chosenOption", text: option, audio: null }];
    });
  };

  return (
    <ChatContext.Provider
      value={{
        message,
        isProcessing,
        setIsProcessing,
        addMessage,
        selectNiche,
        setSelectNiche,
        survey,
        setSurvey,
        handleOptionUpdate,
        deleteMessage,
        resetInterview,
        codingMode,
        setCodingMode,
        resettingMode,
        setResettingMode,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
