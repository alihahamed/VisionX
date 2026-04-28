import { ChatProvider } from "./chatContext";
import "./App.css";
import ChatConversation from "./components/chat";
import { WavyBackground } from "./components/ui/wavy-background";

import SurveyModal from "./components/surveyModal";
import PillNav from "./components/ui/PillNav";
import { BrowserRouter } from "react-router-dom";


function App() {
  return (
    <>
    <BrowserRouter>
      <ChatProvider>
        {/* <AudioRecorder /> */}
        <>
          <ChatConversation />
          <SurveyModal />
          
        </>
      </ChatProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
