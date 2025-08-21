// App.js
import { useState } from "react";
import { CMSProvider } from "./context/CMSContext";
import AdminHeader from "./Components/cms/AdminHeader";
import EntranceAnimation from "./Components/EntranceAnimation";
import MainContent from "./Components/MainContent";
import VisualTemplateSelector from "./Components/cms/VisualTemplateSelector";
import BlogPageGenerator from "./Components/cms/BlogPageGenerator";
import TemplateTest from "./Components/TemplateTest";
import "./MainPage.css";

const SITE_ID = "krachtkamer-gym";

export default function App() {
  const [animationDone, setAnimationDone] = useState(false);
  const [currentPage, setCurrentPage] = useState("main"); // Add 'template-test' as an option
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleCreateBlog = () => {
    console.log("Opening template selector");
    setCurrentPage("template-selector");
  };

  const handleTemplateSelect = (template) => {
    console.log("Selected template:", template);
    setSelectedTemplate(template);
    setCurrentPage("blog-creator");
  };

  const handleCloseBlogCreator = () => {
    console.log("Closing blog creation page");
    setCurrentPage("main");
    setSelectedTemplate(null);
  };

  const handleSaveBlog = (blogData) => {
    console.log("Saving blog:", blogData);
    setCurrentPage("main");
    setSelectedTemplate(null);
  };

  // TEST FUNCTION
  const handleTestBackend = () => {
    setCurrentPage("template-test");
  };

  return (
    <CMSProvider siteId={SITE_ID}>
      <AdminHeader
        onCreateBlog={handleCreateBlog}
        onTestBackend={handleTestBackend}
      />
      <div className="app-container">
        {/* TEMPLATE TEST PAGE */}
        {currentPage === "template-test" && (
          <div>
            <button
              onClick={() => setCurrentPage("main")}
              style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                padding: "10px 20px",
                backgroundColor: "#56642D",
                color: "#FFD700",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                zIndex: 9999,
                fontWeight: "bold",
              }}
            >
              ← Back to Main
            </button>
            <TemplateTest />
          </div>
        )}

        {currentPage === "main" && (
          <>
            <MainContent visible={animationDone} />
            <EntranceAnimation onComplete={() => setAnimationDone(true)} />
          </>
        )}

        {currentPage === "template-selector" && (
          <VisualTemplateSelector
            onSelectTemplate={handleTemplateSelect}
            onCancel={() => setCurrentPage("main")}
          />
        )}

        {currentPage === "blog-creator" && selectedTemplate && (
          <BlogPageGenerator
            template={selectedTemplate}
            onClose={handleCloseBlogCreator}
            onSave={handleSaveBlog}
          />
        )}
      </div>
    </CMSProvider>
  );
}
