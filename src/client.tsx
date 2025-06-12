import { initClient } from "rwsdk/client"

initClient()

import { createRoot } from "react-dom/client"
import { PostContent } from "./app/pages/components/PostContent"

console.log("client.tsx script loaded");

// Function to render markdown content
function renderMarkdownContent(elementId: string): boolean {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with ID ${elementId} not found`);
      return false;
    }
    
    const content = decodeURIComponent(element.getAttribute("data-content") || "");
    const format = element.getAttribute("data-format") || "markdown";
    
    console.log(`Rendering content in ${elementId} with format: ${format}`);
    console.log(`Content preview: ${content.substring(0, 50)}...`);
    
    // Create a container for the rendered content
    const container = document.createElement('div');
    container.className = 'prose prose-lg max-w-none';
    
    // Clear any existing content (except scripts)
    const scripts = Array.from(element.getElementsByTagName('script'));
    element.innerHTML = '';
    
    // Add the container
    element.appendChild(container);
    
    // Re-add any scripts that were removed
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      if (script.src) newScript.src = script.src;
      if (script.textContent) newScript.textContent = script.textContent;
      document.body.appendChild(newScript);
    });
    
    // Render the content
    const root = createRoot(container);
    root.render(
      <PostContent
        content={content}
        format={format as 'html' | 'plain' | 'markdown'}
      />
    );
    
    console.log(`Successfully rendered content in ${elementId}`);
    return true;
  } catch (error) {
    console.error(`Error rendering content in ${elementId}:`, error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    return false;
  }
}

// Process all content shells when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded, searching for content shells");
  
  // Find all content shells
  const contentShells = document.querySelectorAll("[id^='post-content-shell-']");
  console.log(`Found ${contentShells.length} content shells`);
  
  // Process each content shell
  contentShells.forEach(shell => {
    renderMarkdownContent(shell.id);
  });
});

// Define the custom event type
interface ContentShellMountedEvent extends CustomEvent {
  detail: {
    id: string;
  };
}

// Also listen for the contentShellMounted event
window.addEventListener("contentShellMounted", ((event: ContentShellMountedEvent) => {
  const { id } = event.detail;
  console.log(`Received contentShellMounted event for ${id}`);
  renderMarkdownContent(id);
}) as EventListener);

// Add a fallback mechanism to check periodically for unprocessed content shells
let checkCount = 0;
const maxChecks = 10;

const checkForContentShells = () => {
  if (checkCount >= maxChecks) return;
  
  const contentShells = document.querySelectorAll("[id^='post-content-shell-']");
  let unprocessedFound = false;
  
  contentShells.forEach(shell => {
    // Check if this shell has already been processed
    if (!shell.querySelector('.prose')) {
      console.log(`Found unprocessed content shell: ${shell.id}`);
      renderMarkdownContent(shell.id);
      unprocessedFound = true;
    }
  });
  
  checkCount++;
  
  // If we found unprocessed shells, schedule another check
  if (unprocessedFound || checkCount < 3) {
    setTimeout(checkForContentShells, 500);
  }
};

// Start checking after a short delay
setTimeout(checkForContentShells, 300);
