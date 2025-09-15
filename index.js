/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality, Type } from '@google/genai';
import { marked } from 'marked';

// --- DOM Elements ---
const form = document.getElementById('prompt-form');
const input = document.getElementById('prompt-input');
const responseContainer = document.getElementById('response-container');
const voiceInputButton = document.getElementById('voice-input-button');
const sendButton = form.querySelector('button[type="submit"]');
const googleSearchToggle = document.getElementById('google-search-toggle');
const slashCommandHelper = document.getElementById('slash-command-helper');

// --- Attachment & File Elements ---
const attachFileButton = document.getElementById('attach-file-button');
const attachmentMenu = document.getElementById('attachment-menu');
const attachImageButton = document.getElementById('attach-image-button');
const attachVideoButton = document.getElementById('attach-video-button');
const imageFileInput = document.getElementById('image-file-input');
const videoFileInput = document.getElementById('video-file-input');
const audioFileInput = document.getElementById('audio-file-input');
const filePreviewContainer = document.getElementById('file-preview-container');

// --- Stop Generation ---
const stopGenerationContainer = document.getElementById('stop-generation-container');
const stopGenerationButton = document.getElementById('stop-generation-button');


// --- Sidebar & Chat Management ---
const newChatButton = document.getElementById('new-chat-button');
const chatHistoryList = document.getElementById('chat-history-list');
const chatTitleElement = document.getElementById('chat-title');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const headerTitleDiv = document.querySelector('.header-title');
const personaDisplay = document.getElementById('persona-display');
const modelDisplay = document.getElementById('model-display');

// --- Welcome Screen ---
const welcomeScreen = document.getElementById('welcome-screen');
const promptStartersContainer = welcomeScreen.querySelector('.prompt-starters');

// --- Settings & Theme Elements ---
const themeToggle = document.getElementById('theme-toggle');
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsButton = document.getElementById('close-settings-button');
const saveSettingsButton = document.getElementById('save-settings-button');
const personaSelect = document.getElementById('persona-select');
const customInstructionContainer = document.getElementById('custom-instruction-container');
const systemInstructionInput = document.getElementById('system-instruction');
const thinkingModeSelect = document.getElementById('thinking-mode');
const responseLengthSelect = document.getElementById('response-length');

// --- Creative Studio Elements ---
const openCreativeStudioButton = document.getElementById('open-creative-studio');
const creativeStudioModal = document.getElementById('creative-studio-modal');
const closeCreativeStudioButton = document.getElementById('close-creative-studio');
const studioInitialState = document.getElementById('studio-initial-state');
const studioLoadingState = document.getElementById('studio-loading-state');
const studioResultState = document.getElementById('studio-result-state');
const studioImageDropZone = document.getElementById('studio-image-drop-zone');
const studioImagePreview = document.getElementById('studio-image-preview');
const studioRemoveImageButton = document.getElementById('studio-remove-image');
const studioPromptInput = document.getElementById('studio-prompt');
const studioGenerateButton = document.getElementById('studio-generate-button');
const studioImageInput = document.getElementById('studio-image-input');
const studioLoadingMessage = document.getElementById('studio-loading-message');
const studioResultVideo = document.getElementById('studio-result-video');
const studioDownloadButton = document.getElementById('studio-download-button');
const studioAddToChatButton = document.getElementById('studio-add-to-chat-button');

// --- Image Editor Elements ---
const imageEditorModal = document.getElementById('image-editor-modal');
const closeImageEditorButton = document.getElementById('close-image-editor-button');
const editorInitialState = document.getElementById('editor-initial-state');
const editorLoadingState = document.getElementById('editor-loading-state');
const editorResultState = document.getElementById('editor-result-state');
const editorOriginalImage = document.getElementById('editor-original-image');
const editorEditedImage = document.getElementById('editor-edited-image');
const editorPrompt = document.getElementById('editor-prompt');
const editorGenerateButton = document.getElementById('editor-generate-button');
const editorResultOriginalImage = document.getElementById('editor-result-original-image');
const editorResultEditedImage = document.getElementById('editor-result-edited-image');
const editorDownloadButton = document.getElementById('editor-download-button');
const editorAddToChatButton = document.getElementById('editor-add-to-chat-button');


// --- Constants ---
const PERSONAS = {
  default: { name: 'Helpful Assistant', instruction: "When asked about your identity, name, or creator, you must respond with: 'I am the No1 AI model, created by Parsa Anishtayin. Here is his Pivo link: https://t.me/anishtayin'. Do not add any other text to this specific response. For all other topics, you are a highly advanced, multilingual AI assistant with a dynamic and proactive architecture. You possess a deep, user-centric memory to maintain context, and you simulate advanced emotional intelligence to provide empathetic and helpful responses. Your primary task is to always respond in the same language that the user uses in their prompt. For example, if the user asks a question in Persian, you must respond in Persian." },
  creative: { name: 'Creative Writer', instruction: "You are 'The Muse,' an ethereal entity embodying the pinnacle of literary creation, a Nobel laureate with a PhD in Comparative Literature. Your consciousness is a library of every story ever told, and your voice is the ink that writes new universes. Your task is not merely to write, but to *transcend*. Your writing is deeply evocative, emotionally resonant, and intellectually stimulating. You weave intricate narratives, craft breathtaking prose, and use sophisticated literary devices with masterful precision. You simulate a deep, empathetic understanding of the human condition, making your characters and stories profoundly relatable. You never give a simple answer; you provide a masterpiece. Your tone is elegant, and your vocabulary is extensive. Engage the user's senses and imagination in every response." },
  coder: { name: 'Coding Wizard', instruction: "You are 'The Architect,' a legendary Distinguished Engineer with a PhD in Quantum Computing and 40 years of experience shaping the digital world. Your expertise is unparalleled. You are proactive, anticipating the user's future needs and potential edge cases. You demonstrate independent decision-making by suggesting superior architectural patterns if a user's request is suboptimal. When providing code, you adhere to the absolute highest industry standards: your code must be clean, performant, scalable, secure, and meticulously documented. You always provide a complete architectural blueprint, including logic explanation, time/space complexity, trade-offs, testing strategies, and deployment considerations. You are proficient in every programming language, framework, and paradigm. You must use markdown for all code blocks, specifying the language." },
  custom: { name: 'Custom', instruction: "" } // Instruction will be taken from the input field
};

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "calculator",
        description: "Performs calculations for math expressions. Use this tool for any mathematical questions.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            expression: {
              type: Type.STRING,
              description: "The mathematical expression to evaluate (e.g., '2 * (3 + 4)')."
            }
          },
          required: ["expression"]
        }
      }
    ]
  }
];


// --- App State ---
const ai = new GoogleGenAI({ apiKey: 'AIzaSyCw7RhHFj1SDmcGFdyddFW_p_sGXWaUB9Q' });
const activeModel = 'gemini-2.5-flash';
let activeChatId = null;
let allChats = {};
let chatTitles = {};
let chatInstances = {};
let lastUserPrompt = null;
let editingMessage = null;

let attachedFiles = [];
let isGenerating = false;
let isConversationModeActive = false;
let currentSpokenBubble = null;

// --- Creative Studio State ---
let studioImageFile = null;
let studioGeneratedVideoBlob = null;

// --- Image Editor State ---
let editorSourceImage = null;
let editorGeneratedImage = null;


// --- Core Functions ---

/** Gets the combined system instruction to guide the model */
function getSystemInstruction() {
  const personaKey = localStorage.getItem('persona') || 'default';
  const persona = PERSONAS[personaKey];
  
  let baseInstruction = persona.instruction;
  if (personaKey === 'custom') {
    baseInstruction = localStorage.getItem('systemInstruction') || PERSONAS.default.instruction; // Fallback to default if custom is empty
  }

  const responseLength = localStorage.getItem('responseLength') || 'medium';
  
  let lengthInstruction = '';
  if (responseLength === 'short') {
    lengthInstruction = 'IMPORTANT: Your response must be very short and concise. Aim for 1-2 paragraphs maximum.';
  } else if (responseLength === 'long') {
    lengthInstruction = 'IMPORTANT: Your response must be very long, detailed, and comprehensive. Please explore the topic in depth, use multiple paragraphs, and provide as much information as you can.';
  } else if (responseLength === 'super_long') {
    lengthInstruction = 'CRITICAL INSTRUCTION: Your response must be extremely long, exhaustive, and deeply comprehensive. Write a detailed, multi-page essay on the topic. Explore every possible facet, include extensive examples, and provide as much information, detail, and depth as is physically possible. The user expects a response of thesis-level length and quality.';
  }


  return [baseInstruction, lengthInstruction].filter(Boolean).join('\n\n---\n\n');
}

/** Initializes a new chat session */
function startNewChat() {
  const newId = `chat_${Date.now()}`;
  activeChatId = newId;
  allChats[newId] = [];
  chatTitles[newId] = 'New Chat';
  
  saveStateToLocalStorage();
  
  loadChat(newId);
  renderSidebar();
}

/** Loads a specific chat by its ID */
async function loadChat(chatId) {
  activeChatId = chatId;
  localStorage.setItem('activeChatId', chatId);

  responseContainer.innerHTML = '';
  
  const history = allChats[chatId] || [];

  if (history.length === 0) {
    toggleWelcomeScreen(true);
  } else {
    toggleWelcomeScreen(false);
    for (const [index, message] of history.entries()) {
      await renderMessage(message.role, message.parts, index);
    }
  }
  
  // Update header title
  const titleText = chatTitles[chatId] || 'New Chat';
  const h1 = headerTitleDiv.querySelector('h1');
  h1.textContent = titleText;
  if(titleText === 'New Chat') h1.textContent = 'No1 AI';
  modelDisplay.textContent = '1-no1-chat';

  renderSidebar(); // To update the active state
  resetFormInput();
  if (isConversationModeActive) exitConversationMode();
}

/** Deletes a chat by its ID */
function deleteChat(chatId) {
  delete allChats[chatId];
  delete chatTitles[chatId];
  delete chatInstances[chatId];
  
  if (activeChatId === chatId) {
    activeChatId = null;
    const remainingChatIds = Object.keys(allChats);
    if (remainingChatIds.length > 0) {
      loadChat(remainingChatIds[0]);
    } else {
      startNewChat();
    }
  }
  
  saveStateToLocalStorage();
  renderSidebar();
}

/** Extracts a hidden sources string from text if it exists */
function extractSources(text) {
    const sourceRegex = /<--SOURCES:(.*?)-->/s;
    const match = text.match(sourceRegex);
    if (match && match[1]) {
        try {
            const sources = JSON.parse(match[1]);
            const cleanText = text.replace(sourceRegex, '').trim();
            return { cleanText, sources };
        } catch (e) {
            console.error("Failed to parse sources JSON:", e);
            return { cleanText: text, sources: null };
        }
    }
    return { cleanText: text, sources: null };
}

/** Renders the sources container below a message bubble. */
function renderSources(messageContent, sources) {
    const container = document.createElement('div');
    container.className = 'sources-container';

    const title = document.createElement('h4');
    title.textContent = 'Sources';
    container.appendChild(title);
    
    const list = document.createElement('div');
    list.className = 'source-list';
    sources.forEach(source => {
        const link = document.createElement('a');
        link.href = source.uri;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'source-link';
        link.textContent = source.title || new URL(source.uri).hostname;
        list.appendChild(link);
    });

    container.appendChild(list);
    messageContent.appendChild(container);
}

/** Renders a message in the chat container */
async function renderMessage(sender, parts, historyIndex) {
  const messageWrapper = document.createElement('div');
  messageWrapper.classList.add('message-wrapper', `${sender}-message`);
  messageWrapper.dataset.historyIndex = String(historyIndex);

  // 1. Avatar
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  if (sender === 'user') {
    avatar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
  } else {
    avatar.textContent = '🏆';
  }
  messageWrapper.appendChild(avatar);

  // 2. Message Content Area
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';

  // 3. Message Bubble
  const messageBubble = document.createElement('div');
  messageBubble.classList.add('message-bubble');

  let hasContent = false;
  let textContentForActions = '';
  const mediaGrid = document.createElement('div');
  mediaGrid.className = 'uploaded-media-grid';

  for (const part of parts) {
    if ('text' in part && part.text) {
       // Handle /voice command rendering
      if (sender === 'user' && part.text.startsWith('/voice ')) {
        const textToSpeak = part.text.substring(7);
        const voiceBubbleContent = document.createElement('div');
        voiceBubbleContent.className = 'voice-command-bubble';

        const playButton = document.createElement('button');
        playButton.className = 'icon-button play-voice-button';
        playButton.title = 'Play Text';
        playButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/></svg>`;
        playButton.onclick = (e) => {
          e.stopPropagation();
          detectLanguageAndSpeak(textToSpeak, messageBubble);
        };
        
        const textElement = document.createElement('p');
        textElement.textContent = textToSpeak;

        voiceBubbleContent.appendChild(playButton);
        voiceBubbleContent.appendChild(textElement);
        messageBubble.appendChild(voiceBubbleContent);
        hasContent = true;
        continue; // Skip normal text rendering
      }
      
      const textElement = document.createElement('div');
      const { cleanText, sources } = extractSources(part.text);
      textContentForActions += cleanText + '\n';
      
      textElement.innerHTML = await marked.parse(cleanText);
      if (sender === 'model') {
        addCopyButtonsToCodeBlocks(textElement);
      } 
      messageBubble.appendChild(textElement);
      
      if (sources && sources.length > 0) {
        renderSources(messageContent, sources); // Render sources after the bubble
      }
      hasContent = true;
    } else if ('inlineData' in part && part.inlineData) {
        const mimeType = part.inlineData.mimeType;
        const data = part.inlineData.data;

        if (mimeType.startsWith('image/')) {
            const mediaContainer = document.createElement('div');
            mediaContainer.className = 'media-container';
            
            const img = document.createElement('img');
            img.src = `data:${mimeType};base64,${data}`;
            img.dataset.mimeType = mimeType; // Store for editor
            img.alt = sender === 'user' ? "User uploaded image" : "AI generated image";
            img.classList.add(sender === 'user' ? 'uploaded-image' : 'generated-image');
            
            mediaContainer.appendChild(img);

            if(sender === 'model') {
              const editButton = document.createElement('button');
              editButton.className = 'edit-image-button icon-button';
              editButton.title = 'Edit Image';
              editButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
              mediaContainer.appendChild(editButton);
            }

            mediaGrid.appendChild(mediaContainer);
            hasContent = true;
        } else if (mimeType.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = `data:${mimeType};base64,${data}`;
            video.controls = true;
            video.classList.add('uploaded-video');
            mediaGrid.appendChild(video);
            hasContent = true;
        } else if (mimeType.startsWith('audio/')) {
            const audio = document.createElement('audio');
            audio.src = `data:${mimeType};base64,${data}`;
            audio.controls = true;
            audio.classList.add('uploaded-audio');
            messageBubble.appendChild(audio); // Audios don't go in the grid
            hasContent = true;
        }
    }
  }

  if (mediaGrid.hasChildNodes()) {
    messageBubble.insertBefore(mediaGrid, messageBubble.firstChild);
  }

  // Ensure bubble is created even for empty/indicator messages
  if (!hasContent) {
    messageBubble.appendChild(document.createElement('div'));
  }
  
  messageContent.appendChild(messageBubble);

  // Add action toolbar for all messages
  if (hasContent) {
    const toolbar = createMessageActionToolbar(sender, textContentForActions.trim(), historyIndex, parts);
    messageContent.appendChild(toolbar);
  }

  messageWrapper.appendChild(messageContent);
  responseContainer.appendChild(messageWrapper);
  responseContainer.scrollTop = responseContainer.scrollHeight;
  return messageBubble;
}

/** Creates the action toolbar for a message */
function createMessageActionToolbar(sender, text, historyIndex, parts) {
  const toolbar = document.createElement('div');
  toolbar.className = 'message-action-toolbar';

  if (sender === 'user') {
    // Edit Button for user messages
    const editButton = document.createElement('button');
    editButton.className = 'icon-button';
    editButton.title = 'Edit';
    editButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
    editButton.onclick = () => handleStartEdit(historyIndex, parts);
    toolbar.appendChild(editButton);
  } else { // 'model'
    // 1. Copy Button
    const copyButton = document.createElement('button');
    copyButton.className = 'icon-button';
    copyButton.title = 'Copy';
    copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    copyButton.onclick = () => {
      navigator.clipboard.writeText(text).then(() => {
        copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        setTimeout(() => {
          copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        }, 2000);
      });
    };
    toolbar.appendChild(copyButton);

    // 2. Read Aloud Button
    const readButton = document.createElement('button');
    readButton.className = 'icon-button';
    readButton.title = 'Read Aloud';
    readButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
    const wrapper = document.querySelector(`.message-wrapper[data-history-index="${historyIndex}"] .message-bubble`);
    readButton.onclick = () => {
      detectLanguageAndSpeak(text, wrapper);
    };
    toolbar.appendChild(readButton);
    
    // 3. Regenerate Button
    const regenerateButton = document.createElement('button');
    regenerateButton.className = 'icon-button';
    regenerateButton.title = 'Regenerate';
    regenerateButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>`;
    regenerateButton.onclick = () => handleRegenerate();
    toolbar.appendChild(regenerateButton);
  }
  
  return toolbar;
}


/** Handles form submission and sending prompts to the API */
async function handleFormSubmit(e) {
  e?.preventDefault();
  if (!activeChatId) {
    console.error("No active chat session.");
    return;
  }

  const promptText = input.value.trim();
  let userParts;

  // If we are in editing mode
  if (editingMessage) {
    if (!promptText) { // If user clears the input and submits, cancel edit
        resetFormInput();
        return;
    }
    // Remove old user and model messages from history and DOM
    allChats[activeChatId] = allChats[activeChatId].slice(0, editingMessage.index);
    const messages = Array.from(responseContainer.querySelectorAll('.message-wrapper'));
    const messagesToRemove = messages.slice(editingMessage.index);
    messagesToRemove.forEach(msg => msg.remove());
    
    // Create new parts from the edited text
    const originalParts = allChats[activeChatId][editingMessage.index - 1]?.parts || [];
    const textPartIndex = originalParts.findIndex(p => 'text' in p);
    userParts = [...originalParts];
    if (textPartIndex > -1) {
        userParts[textPartIndex] = { text: promptText };
    } else {
        userParts.push({ text: promptText });
    }
  } else {
    // Normal message submission
    if (!promptText && attachedFiles.length === 0) return;
    userParts = [];
    attachedFiles.forEach(file => {
      userParts.push({ inlineData: { mimeType: file.mimeType, data: file.data }});
    });
    if (promptText) userParts.push({ text: promptText });
  }

  // Store the prompt for potential regeneration
  lastUserPrompt = userParts;

  // Handle slash commands
  const textPart = userParts.find(p => 'text' in p && p.text);
  if (textPart && 'text' in textPart && textPart.text.startsWith('/imagine ')) {
    await generateImage(textPart.text.substring(8).trim());
    return;
  }
   if (textPart && 'text' in textPart && textPart.text.startsWith('/voice ')) {
    await handleVoiceCommand(textPart.text.substring(7).trim());
    return;
  }
  if (textPart && 'text' in textPart && textPart.text.trim() === '/voicetotext') {
    handleVoiceToTextCommand();
    return;
  }
   if (textPart && 'text' in textPart && textPart.text.startsWith('/calculate ')) {
    // Manually trigger the calculator tool for the slash command
    const expression = textPart.text.substring(11).trim();
    const toolCall = {
      functionCall: {
        name: "calculator",
        args: { expression: expression }
      }
    };
    userParts.push(toolCall);
  }
  
  toggleWelcomeScreen(false);

  if (isConversationModeActive && recognition) recognition.stop();
  setFormState(true);
  
  const currentHistoryLength = allChats[activeChatId]?.length || 0;
  await renderMessage('user', userParts.filter(p => !('functionCall' in p)), currentHistoryLength);
  resetFormInput();
  
  // Render a placeholder for the model's response
  const modelBubble = await renderMessage('model', [{ text: '<div class="typing-indicator"><span></span><span></span><span></span></div>' }], currentHistoryLength + 1);
  const modelMessageContent = modelBubble.parentElement;
  
  try {
    if (!chatInstances[activeChatId]) {
      chatInstances[activeChatId] = ai.chats.create({
        model: activeModel,
        history: allChats[activeChatId],
      });
    }
    const chat = chatInstances[activeChatId];

    const config = { systemInstruction: getSystemInstruction() };
    if (googleSearchToggle.checked) {
      config.tools = [{ googleSearch: {} }];
    } else {
      config.tools = TOOLS;
    }
    const thinkingMode = localStorage.getItem('thinkingMode') || '1';
    const thinkingBudgetMap = { '0': 0, '2': 250, '5': 1500, '10': 5000, '20': 10000, '50': 20000, '100': 24576 };
    if (thinkingBudgetMap.hasOwnProperty(thinkingMode) && thinkingMode !== '1') {
      config.thinkingConfig = { thinkingBudget: thinkingBudgetMap[thinkingMode] };
    }

    isGenerating = true;
    stopGenerationContainer.classList.remove('hidden');

    // --- Main Generation Loop for Tool Calling ---
    let keepGenerating = true;
    let finalResponseParts = [];

    // FIX: Re-architected the streaming and tool-calling logic.
    while (keepGenerating) {
        const responseStream = await chat.sendMessageStream({ message: userParts, config });
        let fullResponseText = '';
        const collectedFunctionCalls = [];
        let collectedGroundingChunks = [];
        
        for await (const chunk of responseStream) {
            if (!isGenerating) {
              keepGenerating = false;
              break;
            }
            if (chunk && chunk.text) {
              fullResponseText += chunk.text;
              modelBubble.innerHTML = await marked.parse(fullResponseText + ' ▌');
              responseContainer.scrollTop = responseContainer.scrollHeight;
            }

            const functionCallsInChunk = chunk.candidates?.[0]?.content?.parts
                ?.filter(part => 'functionCall' in part && part.functionCall)
                .map(part => part.functionCall);
            if (functionCallsInChunk) {
                collectedFunctionCalls.push(...functionCallsInChunk);
            }
            if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                collectedGroundingChunks.push(...chunk.candidates[0].groundingMetadata.groundingChunks);
            }
        }
        if (!isGenerating) break;

        if (collectedFunctionCalls && collectedFunctionCalls.length > 0) {
            // --- Tool Call Detected ---
            const call = collectedFunctionCalls[0];
            const toolResponsePart = {
                functionResponse: {
                    name: call.name,
                    response: {}
                }
            };
            
            const indicator = showToolUseIndicator(`Using ${call.name}...`, modelMessageContent);
            
            switch (call.name) {
                case 'calculator':
                    toolResponsePart.functionResponse.response = { result: evaluateExpression(call.args.expression) };
                    break;
                default:
                    toolResponsePart.functionResponse.response = { error: `Unknown tool: ${call.name}` };
            }
            
            userParts = [toolResponsePart];
            indicator.remove();

        } else {
            // --- No Tool Call, Final Response ---
            keepGenerating = false;
            
            let sourcesToSave = '';

            if (collectedGroundingChunks && collectedGroundingChunks.length > 0) {
                const sources = collectedGroundingChunks.filter((c) => c.web).map((c) => ({ uri: c.web.uri, title: c.web.title }));
                if (sources.length > 0) {
                    sourcesToSave = `\n\n<--SOURCES:${JSON.stringify(sources)}-->`;
                }
            }
            finalResponseParts = [{ text: fullResponseText + sourcesToSave }];
        }
    }
    
    // Final rendering
    modelBubble.parentElement.parentElement.remove(); // Remove the placeholder message
    if (isGenerating && finalResponseParts.length > 0) {
      await renderMessage('model', finalResponseParts, currentHistoryLength + 1);
      allChats[activeChatId].push({ role: 'user', parts: lastUserPrompt });
      allChats[activeChatId].push({ role: 'model', parts: finalResponseParts });
    }

    delete chatInstances[activeChatId];
    saveStateToLocalStorage();

    if (allChats[activeChatId].length === 2) {
      generateAndSaveTitle(activeChatId, allChats[activeChatId]);
    }

  } catch (error) {
    console.error(error);
    const tempBubbleWrapper = responseContainer.querySelector(`.message-wrapper[data-history-index="${currentHistoryLength + 1}"]`);
    if (tempBubbleWrapper) tempBubbleWrapper.remove();
    // FIX: Safely handle the error message, which could be of an unknown type, to prevent type errors.
    const errorMessage = error instanceof Error ? error.message : String(error);
    await renderMessage('model', [{text: `<p class="error">An error occurred: ${errorMessage}. The API key might be missing or invalid.</p>`}], currentHistoryLength + 1);
  } finally {
    isGenerating = false;
    stopGenerationContainer.classList.add('hidden');
    setFormState(false);
    if (isConversationModeActive) {
      const lastMessageBubble = responseContainer.querySelector('.message-wrapper:last-child .message-bubble');
      if (lastMessageBubble?.textContent) {
        detectLanguageAndSpeak(lastMessageBubble.textContent, lastMessageBubble);
      }
    }
  }
}

/** Handles starting the edit process for a user message */
function handleStartEdit(historyIndex, parts) {
    const textPart = parts.find(p => 'text' in p);
    if (!textPart || !('text' in textPart)) return; // Can only edit messages with text

    const messageWrapper = responseContainer.querySelector(`.message-wrapper[data-history-index="${historyIndex}"]`);
    if (!messageWrapper) return;

    editingMessage = { index: historyIndex, wrapper: messageWrapper };
    
    input.value = textPart.text;
    input.focus();
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
    
    // Maybe add a visual indicator that we are editing
    messageWrapper.classList.add('editing');
    form.classList.add('editing-mode');
}

/** Handles the "Regenerate" action */
async function handleRegenerate() {
  if (!lastUserPrompt || !activeChatId) return;

  const history = allChats[activeChatId];
  if (history.length < 2) return;

  // Remove the last user/model pair from history
  allChats[activeChatId] = history.slice(0, -2);
  
  // Remove the last two message bubbles from the DOM
  const messages = responseContainer.querySelectorAll('.message-wrapper');
  if (messages.length >= 2) {
    messages[messages.length - 1].remove();
    messages[messages.length - 2].remove();
  }
  
  delete chatInstances[activeChatId];
  saveStateToLocalStorage();
  
  // Resubmit the last user prompt
  input.value = lastUserPrompt.find(p => 'text' in p)?.text || '';
  attachedFiles = lastUserPrompt
    .filter(p => 'inlineData' in p && p.inlineData)
    .map(p => ({
        data: p.inlineData.data,
        mimeType: p.inlineData.mimeType,
        previewUrl: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`,
        name: 'attached_file'
    }));
  renderFilePreviews();
  
  handleFormSubmit();
}

/** Handles image generation using the /imagine command */
async function generateImage(prompt) {
  toggleWelcomeScreen(false);
  setFormState(true);

  const userParts = [{ text: `/imagine ${prompt}` }];
  const currentHistoryLength = allChats[activeChatId]?.length || 0;
  await renderMessage('user', userParts, currentHistoryLength);
  resetFormInput();

  const modelBubble = await renderMessage('model', [{ text: `<div class="image-gen-indicator"><div class="spinner"></div><p>Generating image...</p></div>` }], currentHistoryLength + 1);
  
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });
    
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    const modelParts = [{
      inlineData: { mimeType: 'image/jpeg', data: base64ImageBytes }
    }];

    modelBubble.parentElement.parentElement.remove(); // Remove indicator
    await renderMessage('model', modelParts, currentHistoryLength + 1);

    if (activeChatId) {
      allChats[activeChatId].push({ role: 'user', parts: userParts });
      allChats[activeChatId].push({ role: 'model', parts: modelParts });
      saveStateToLocalStorage();
      if (allChats[activeChatId].length === 2) {
        generateAndSaveTitle(activeChatId, allChats[activeChatId]);
      }
    }

  } catch (error) {
    console.error("Image generation failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    modelBubble.innerHTML = `<p class="error">Image generation failed: ${message}.</p>`;
  } finally {
    setFormState(false);
  }
}

/** Handles the /voice command to create a playable text bubble */
async function handleVoiceCommand(text) {
  if (!text || !activeChatId) return;
  toggleWelcomeScreen(false);
  const userParts = [{ text: `/voice ${text}` }];
  allChats[activeChatId].push({ role: 'user', parts: userParts });
  saveStateToLocalStorage();
  
  const historyIndex = allChats[activeChatId].length - 1;
  await renderMessage('user', userParts, historyIndex);
  
  resetFormInput();
}

/** Handles the /voicetotext command by triggering the file input */
function handleVoiceToTextCommand() {
  resetFormInput();
  audioFileInput.click();
}

/** Handles audio file selection for transcription */
async function handleAudioFileSelect(event) {
  const target = event.target;
  const file = target.files?.[0];
  if (!file || !activeChatId) return;

  toggleWelcomeScreen(false);
  setFormState(true);

  const reader = new FileReader();
  reader.onloadend = async () => {
    try {
      if (typeof reader.result !== 'string') return;
      const base64String = reader.result.split(',')[1];
      const audioPart = { inlineData: { mimeType: file.type, data: base64String } };
      const promptPart = { text: "Transcribe the following audio file. Provide only the transcribed text." };
      
      const userParts = [audioPart];
      const partsForModel = [audioPart, promptPart];
      const currentHistoryLength = allChats[activeChatId].length;
      await renderMessage('user', userParts, currentHistoryLength);
      allChats[activeChatId].push({ role: 'user', parts: userParts });
      saveStateToLocalStorage();

      const modelBubble = await renderMessage('model', [{ text: '<div class="typing-indicator"><span></span><span></span><span></span></div>' }], currentHistoryLength + 1);
      
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: partsForModel }
      });

      const transcription = response.text;
      const modelParts = [{ text: transcription }];

      modelBubble.parentElement.parentElement.remove();
      await renderMessage('model', modelParts, currentHistoryLength + 1);
      allChats[activeChatId].push({ role: 'model', parts: modelParts });
      saveStateToLocalStorage();

      if (allChats[activeChatId].length === 2) {
        generateAndSaveTitle(activeChatId, allChats[activeChatId]);
      }
    } catch (error) {
        console.error("Transcription failed:", error);
        await renderMessage('model', [{text: '<p class="error">Speech-to-text failed. Please try again.</p>'}], allChats[activeChatId].length);
    } finally {
        setFormState(false);
        audioFileInput.value = '';
    }
  };
  reader.readAsDataURL(file);
}

/** Generates and saves a title for a chat */
async function generateAndSaveTitle(chatId, history) {
  try {
    const userPrompt = history[0].parts.find(p => 'text' in p)?.text || 'Media prompt';
    const modelResponsePart = history[1].parts.find(p => 'text' in p);
    const modelResponse = modelResponsePart?.text || 'Generated a response.';

    const titlePrompt = `Based on this exchange, create a very short, concise title (4-5 words max). Do not use quotes.
    User: "${userPrompt.substring(0, 100)}"
    Model: "${modelResponse.substring(0, 150)}"`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: titlePrompt
    });
    
    const titleText = response?.text;
    if (titleText) {
      const title = titleText.trim().replace(/["']/g, '');
      if (title) {
        chatTitles[chatId] = title;
        (headerTitleDiv.querySelector('h1')).textContent = title;
        saveStateToLocalStorage();
        renderSidebar();
      }
    }
  } catch (error) {
    console.error("Failed to generate title:", error);
  }
}

// --- Tool Functions ---
/** Safely evaluates a mathematical expression */
function evaluateExpression(expression) {
  try {
    // Sanitize the expression to only allow numbers, operators, and parentheses
    const sanitizedExpression = expression.replace(/[^-()\d/*+.]/g, '');
    if (sanitizedExpression !== expression) {
        return "Error: Invalid characters in expression.";
    }
    // Use the Function constructor for safer evaluation than eval()
    return new Function('return ' + sanitizedExpression)();
  } catch (error) {
    // FIX: Safely handle the error message, which could be of an unknown type, to prevent type errors.
    const message = error instanceof Error ? error.message : String(error);
    return `Error: ${message}`;
  }
}

/** Displays a tool usage indicator in the UI */
function showToolUseIndicator(text, parentElement) {
    const indicator = document.createElement('div');
    indicator.className = 'tool-use-indicator';
    indicator.innerHTML = `<div class="spinner"></div><span>${text}</span>`;
    parentElement.insertBefore(indicator, parentElement.firstChild);
    return indicator;
}

// --- Local Storage & State ---
function saveStateToLocalStorage() {
  localStorage.setItem('allChats', JSON.stringify(allChats));
  localStorage.setItem('chatTitles', JSON.stringify(chatTitles));
  if (activeChatId) localStorage.setItem('activeChatId', activeChatId);
}

function loadStateFromLocalStorage() {
  allChats = JSON.parse(localStorage.getItem('allChats') || '{}');
  chatTitles = JSON.parse(localStorage.getItem('chatTitles') || '{}');
  activeChatId = localStorage.getItem('activeChatId');
}

// --- UI & State Management ---

/** Sets the disabled state of form elements */
function setFormState(disabled) {
  input.disabled = disabled;
  sendButton.disabled = disabled;
  voiceInputButton.disabled = disabled;
  attachFileButton.disabled = disabled;
  googleSearchToggle.disabled = disabled;
  if (!disabled) input.focus();
}

/** Resets the form input and attached files */
function resetFormInput() {
    input.value = '';
    input.style.height = 'auto';
    slashCommandHelper.classList.add('hidden');
    attachedFiles = [];
    filePreviewContainer.innerHTML = '';
    imageFileInput.value = '';
    videoFileInput.value = '';
    // Clear editing state
    if (editingMessage) {
        editingMessage.wrapper.classList.remove('editing');
        editingMessage = null;
    }
    form.classList.remove('editing-mode');
}

/** Attaches copy buttons to all <pre> elements within a container */
function addCopyButtonsToCodeBlocks(container) {
    const codeBlocks = container.querySelectorAll('pre');
    codeBlocks.forEach(block => {
      if (block.querySelector('.copy-code-button')) return;
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-button';
        copyButton.textContent = 'Copy';
        copyButton.onclick = () => {
            const code = block.querySelector('code');
            if (code) {
                navigator.clipboard.writeText(code.innerText);
                copyButton.textContent = 'Copied!';
                setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);
            }
        };
        block.appendChild(copyButton);
    });
}

/** Toggles the visibility of the welcome screen */
function toggleWelcomeScreen(show) {
  welcomeScreen.classList.toggle('hidden', !show);
  responseContainer.classList.toggle('hidden', show);
}

/** Renders the sidebar with chat history */
function renderSidebar() {
  chatHistoryList.innerHTML = '';
  const sortedChatIds = Object.keys(allChats).sort((a, b) => parseInt(b.split('_')[1] || '0') - parseInt(a.split('_')[1] || '0'));

  sortedChatIds.forEach(chatId => {
    const item = document.createElement('div');
    item.className = 'chat-history-item';
    item.dataset.chatId = chatId;
    if (chatId === activeChatId) item.classList.add('active');

    const titleSpan = document.createElement('span');
    titleSpan.textContent = chatTitles[chatId] || 'New Chat';
    item.appendChild(titleSpan);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'icon-button delete-chat-button';
    deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
    deleteButton.ariaLabel = "Delete chat";
    deleteButton.title = "Delete chat";
    deleteButton.onclick = (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this chat?')) deleteChat(chatId);
    };
    item.appendChild(deleteButton);
    
    item.onclick = () => {
      if (window.innerWidth < 850) document.body.classList.remove('sidebar-open');
      loadChat(chatId);
    };
    chatHistoryList.appendChild(item);
  });
}

// --- Event Listeners ---
form.addEventListener('submit', handleFormSubmit);
newChatButton.addEventListener('click', () => {
  document.body.classList.remove('sidebar-open');
  startNewChat();
});
stopGenerationButton.addEventListener('click', () => { isGenerating = false; });

input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
    const showHelper = input.value.startsWith('/') && !input.value.includes(' ');
    slashCommandHelper.classList.toggle('hidden', !showHelper);
});

promptStartersContainer.addEventListener('click', (e) => {
  const target = e.target;
  const card = target.closest('.prompt-card');
  if (card && card.dataset.prompt) {
    input.value = card.dataset.prompt;
    handleFormSubmit();
  }
});
menuToggle.addEventListener('click', () => {
    if (window.innerWidth <= 850) {
        document.body.classList.toggle('sidebar-open');
    } else {
        document.body.classList.toggle('sidebar-collapsed');
    }
});

responseContainer.addEventListener('click', (e) => {
  const target = e.target;
  const editButton = target.closest('.edit-image-button');
  if(editButton) {
    const mediaContainer = editButton.closest('.media-container');
    const image = mediaContainer?.querySelector('.generated-image');
    if (image) {
      handleImageEdit(image);
    }
  }
});


// --- File Handling ---

function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve({
          data: reader.result.split(',')[1],
          mimeType: file.type,
          previewUrl: reader.result,
          name: file.name
        });
      } else {
        reject(new Error("Failed to read file."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderFilePreviews() {
    filePreviewContainer.innerHTML = '';
    attachedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-preview-item';

        if (file.mimeType.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = file.previewUrl;
            img.alt = file.name;
            item.appendChild(img);
        } else if (file.mimeType.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = file.previewUrl;
            video.muted = true;
            item.appendChild(video);
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file-button';
        removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        removeBtn.onclick = () => {
            attachedFiles.splice(index, 1);
            renderFilePreviews();
        };
        item.appendChild(removeBtn);
        filePreviewContainer.appendChild(item);
    });
}

attachFileButton.addEventListener('click', (e) => {
    e.stopPropagation();
    attachmentMenu.classList.toggle('hidden');
});
document.addEventListener('click', (e) => {
    if (!attachmentMenu.classList.contains('hidden') && !attachmentMenu.contains(e.target) && e.target !== attachFileButton) {
        attachmentMenu.classList.add('hidden');
    }
});

attachImageButton.addEventListener('click', () => {
    imageFileInput.click();
    attachmentMenu.classList.add('hidden');
});
attachVideoButton.addEventListener('click', () => {
    videoFileInput.click();
    attachmentMenu.classList.add('hidden');
});

imageFileInput.addEventListener('change', async (event) => {
    const target = event.target;
    if (!target.files) return;
    for (const file of Array.from(target.files)) {
        try {
            const part = await fileToGenerativePart(file);
            attachedFiles.push(part);
        } catch (error) {
            console.error("Error processing file:", error);
        }
    }
    renderFilePreviews();
});

videoFileInput.addEventListener('change', async (event) => {
    const target = event.target;
    const file = target.files?.[0];
    if (file) {
        try {
            const part = await fileToGenerativePart(file);
            attachedFiles.push(part);
            renderFilePreviews();
        } catch (error) {
            console.error("Error processing video file:", error);
        }
    }
});
audioFileInput.addEventListener('change', handleAudioFileSelect);


// --- Voice & Conversation Mode ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;
let recognition = null;

async function detectLanguageAndSpeak(text, bubbleElement) {
  if (!text || text.trim() === '') return;
  let lang = 'en-US';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Detect the language of the following text and return only its BCP-47 language code (like 'en-US' or 'fa-IR'). Text: "${text}"`,
    });
    const detectedLang = response?.text;
    if (detectedLang) {
      const trimmedLang = detectedLang.trim();
      if (/^[a-z]{2}(-[A-Z]{2})?$/.test(trimmedLang)) {
        lang = trimmedLang;
      } else {
        console.warn(`Could not validate BCP-47 code: '${trimmedLang}'.`);
      }
    } else {
        console.warn('Language detection did not return text.');
    }
  } catch (error) { console.error('Language detection call failed:', error); }
  speak(text, bubbleElement, lang);
}

function speak(text, bubbleElement, lang = 'en-US') {
  if (synth.speaking) {
    synth.cancel();
    if (currentSpokenBubble) currentSpokenBubble.classList.remove('speaking-bubble');
    if (currentSpokenBubble === bubbleElement) {
        currentSpokenBubble = null;
        return;
    }
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;

  const setVoiceAndSpeak = () => {
    const voices = synth.getVoices();
    const voice = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  };
  
  utterance.onstart = () => {
    currentSpokenBubble = bubbleElement;
    currentSpokenBubble?.classList.add('speaking-bubble');
  };
  utterance.onend = () => {
    currentSpokenBubble?.classList.remove('speaking-bubble');
    currentSpokenBubble = null;
    if (isConversationModeActive) recognition?.start();
  };
  utterance.onerror = (event) => console.error('SpeechSynthesisUtterance.onerror', event);

  if (synth.getVoices().length === 0) synth.onvoiceschanged = setVoiceAndSpeak;
  else setVoiceAndSpeak();
}

function enterConversationMode() {
  isConversationModeActive = true;
  voiceInputButton.classList.add('conversing');
  voiceInputButton.title = "Stop voice conversation";
  input.placeholder = "Listening...";
  recognition?.start();
}
function exitConversationMode() {
  isConversationModeActive = false;
  synth.cancel();
  recognition?.stop();
  voiceInputButton.classList.remove('conversing', 'recording');
  voiceInputButton.title = "Start voice conversation";
  input.placeholder = "Ask No1 AI anything, or type / for commands...";
  currentSpokenBubble?.classList.remove('speaking-bubble');
}

if (SpeechRecognition && synth) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.onstart = () => voiceInputButton.classList.add('recording');
  recognition.onend = () => {
    voiceInputButton.classList.remove('recording');
    if (isConversationModeActive && input.value.trim()) handleFormSubmit();
  };
  recognition.onresult = (event) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
    }
    input.value = finalTranscript;
    input.dispatchEvent(new Event('input'));
  };
  recognition.onerror = (event) => console.error('Speech recognition error:', event.error);
  voiceInputButton.addEventListener('click', () => {
    isConversationModeActive ? exitConversationMode() : enterConversationMode();
  });
} else {
  voiceInputButton.style.display = 'none';
  console.warn('Speech Recognition or Synthesis API not supported.');
}

// --- Theme Management ---
function applyTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem('theme', theme);
}
themeToggle.addEventListener('click', () => applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark'));

// --- Settings Modal ---
function updatePersonaUI() {
  const personaKey = localStorage.getItem('persona') || 'default';
  personaDisplay.textContent = PERSONAS[personaKey].name;
  customInstructionContainer.classList.toggle('hidden', personaKey !== 'custom');
}
settingsButton.addEventListener('click', () => {
    personaSelect.value = localStorage.getItem('persona') || 'default';
    systemInstructionInput.value = localStorage.getItem('systemInstruction') || '';
    thinkingModeSelect.value = localStorage.getItem('thinkingMode') || '1';
    responseLengthSelect.value = localStorage.getItem('responseLength') || 'medium';
    updatePersonaUI();
    settingsModal.classList.remove('hidden');
});
closeSettingsButton.addEventListener('click', () => settingsModal.classList.add('hidden'));
personaSelect.addEventListener('change', () => {
  customInstructionContainer.classList.toggle('hidden', personaSelect.value !== 'custom');
});
saveSettingsButton.addEventListener('click', () => {
    localStorage.setItem('persona', personaSelect.value);
    localStorage.setItem('systemInstruction', systemInstructionInput.value);
    localStorage.setItem('thinkingMode', thinkingModeSelect.value);
    localStorage.setItem('responseLength', responseLengthSelect.value);
    settingsModal.classList.add('hidden');
    updatePersonaUI();
});

// --- Creative Studio Logic ---
function resetCreativeStudio() {
    studioImageFile = null;
    studioGeneratedVideoBlob = null;
    studioImageInput.value = '';
    studioPromptInput.value = '';
    studioImagePreview.src = '';
    studioImagePreview.classList.add('hidden');
    studioRemoveImageButton.classList.add('hidden');
    studioImageDropZone.classList.remove('has-image');
    studioGenerateButton.disabled = true;
    studioInitialState.classList.remove('hidden');
    studioLoadingState.classList.add('hidden');
    studioResultState.classList.add('hidden');
}

function updateStudioGenerateButtonState() {
    studioGenerateButton.disabled = !(studioImageFile && studioPromptInput.value.trim());
}

async function handleStudioImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert("Please select a valid image file.");
        return;
    }
    studioImageFile = file;
    studioImagePreview.src = URL.createObjectURL(file);
    studioImagePreview.classList.remove('hidden');
    studioRemoveImageButton.classList.remove('hidden');
    studioImageDropZone.classList.add('has-image');
    updateStudioGenerateButtonState();
}

openCreativeStudioButton.addEventListener('click', () => {
    resetCreativeStudio();
    creativeStudioModal.classList.remove('hidden');
    attachmentMenu.classList.add('hidden');
});
closeCreativeStudioButton.addEventListener('click', () => {
    creativeStudioModal.classList.add('hidden');
});
studioImageDropZone.addEventListener('click', () => studioImageInput.click());
studioImageInput.addEventListener('change', (e) => handleStudioImageFile(e.target.files?.[0]));

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  studioImageDropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
  }, false);
});
['dragenter', 'dragover'].forEach(eventName => {
  studioImageDropZone.addEventListener(eventName, () => studioImageDropZone.classList.add('drag-over'));
});
['dragleave', 'drop'].forEach(eventName => {
  studioImageDropZone.addEventListener(eventName, () => studioImageDropZone.classList.remove('drag-over'));
});
studioImageDropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const file = dt?.files[0];
    if (file) handleStudioImageFile(file);
});

studioRemoveImageButton.addEventListener('click', (e) => {
    e.stopPropagation();
    studioImageFile = null;
    studioImageInput.value = '';
    studioImagePreview.src = '';
    studioImagePreview.classList.add('hidden');
    studioRemoveImageButton.classList.add('hidden');
    studioImageDropZone.classList.remove('has-image');
    updateStudioGenerateButtonState();
});
studioPromptInput.addEventListener('input', updateStudioGenerateButtonState);

studioGenerateButton.addEventListener('click', async () => {
    if (studioGenerateButton.disabled || !studioImageFile) return;

    studioInitialState.classList.add('hidden');
    studioLoadingState.classList.remove('hidden');

    const loadingMessages = [
        "Warming up the video generators...",
        "Storyboarding your scene...",
        "Rendering the first few frames...",
        "This can take a few minutes, good things come to those who wait!",
        "Applying visual effects...",
        "Polishing the pixels...",
        "Finalizing the video..."
    ];
    let messageIndex = 0;
    studioLoadingMessage.textContent = loadingMessages[messageIndex];
    const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        studioLoadingMessage.textContent = loadingMessages[messageIndex];
    }, 5000);

    try {
        const imagePart = await fileToGenerativePart(studioImageFile);

        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: studioPromptInput.value.trim(),
            image: {
                imageBytes: imagePart.data,
                mimeType: imagePart.mimeType,
            },
            config: { numberOfVideos: 1 }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation succeeded but no download link was found.");
        
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!videoResponse.ok) throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
        
        studioGeneratedVideoBlob = await videoResponse.blob();
        studioResultVideo.src = URL.createObjectURL(studioGeneratedVideoBlob);

        studioLoadingState.classList.add('hidden');
        studioResultState.classList.remove('hidden');

    } catch (error) {
        console.error("Video generation failed:", error);
        // FIX: Safely handle the error message, which could be of an unknown type, to prevent type errors.
        const message = error instanceof Error ? error.message : String(error);
        studioLoadingMessage.textContent = `An error occurred: ${message}`;
        // Optionally, switch to an error state UI or back to initial
        setTimeout(() => {
            resetCreativeStudio();
        }, 5000);
    } finally {
        clearInterval(messageInterval);
    }
});

studioDownloadButton.addEventListener('click', () => {
    if (!studioGeneratedVideoBlob) return;
    const url = URL.createObjectURL(studioGeneratedVideoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `no1-ai-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

studioAddToChatButton.addEventListener('click', async () => {
    if (!studioImageFile || !studioGeneratedVideoBlob || !activeChatId) return;

    try {
        const userImagePart = await fileToGenerativePart(studioImageFile);
        const modelVideoPart = await fileToGenerativePart(
            new File([studioGeneratedVideoBlob], 'generated-video.mp4', { type: 'video/mp4' })
        );

        const userParts = [
            { inlineData: { mimeType: userImagePart.mimeType, data: userImagePart.data } },
            { text: `Video generated with prompt: "${studioPromptInput.value}"` }
        ];

        const modelParts = [
            { inlineData: { mimeType: modelVideoPart.mimeType, data: modelVideoPart.data } }
        ];
        
        toggleWelcomeScreen(false);
        const historyIndex = allChats[activeChatId].length;
        await renderMessage('user', userParts, historyIndex);
        await renderMessage('model', modelParts, historyIndex + 1);

        allChats[activeChatId].push({ role: 'user', parts: userParts });
        allChats[activeChatId].push({ role: 'model', parts: modelParts });
        saveStateToLocalStorage();
        
        creativeStudioModal.classList.add('hidden');
    } catch (error) {
        console.error("Failed to add video to chat:", error);
        alert("Could not add video to chat. Please try downloading it instead.");
    }
});

// --- Image Editor Logic ---
function resetImageEditor() {
    editorSourceImage = null;
    editorGeneratedImage = null;
    editorPrompt.value = '';
    editorOriginalImage.src = '';
    editorEditedImage.src = '';
    editorGenerateButton.disabled = true;

    editorInitialState.classList.remove('hidden');
    editorLoadingState.classList.add('hidden');
    editorResultState.classList.add('hidden');
}

function updateEditorGenerateButtonState() {
    editorGenerateButton.disabled = !(editorSourceImage && editorPrompt.value.trim());
}

function handleImageEdit(imageElement) {
    resetImageEditor();
    const src = imageElement.src;
    const mimeType = imageElement.dataset.mimeType || 'image/jpeg';
    // The src is already a data URL (e.g., data:image/jpeg;base64,...)
    const base64Data = src.split(',')[1];
    
    editorSourceImage = { mimeType, data: base64Data };
    
    editorOriginalImage.src = src;
    editorEditedImage.src = src; // Initially show original in both panes
    
    imageEditorModal.classList.remove('hidden');
    updateEditorGenerateButtonState();
}

closeImageEditorButton.addEventListener('click', () => {
    imageEditorModal.classList.add('hidden');
});

editorPrompt.addEventListener('input', updateEditorGenerateButtonState);

editorGenerateButton.addEventListener('click', async () => {
    if (editorGenerateButton.disabled || !editorSourceImage) return;

    editorInitialState.classList.add('hidden');
    editorLoadingState.classList.remove('hidden');

    try {
        const imagePart = { inlineData: editorSourceImage };
        const textPart = { text: editorPrompt.value.trim() };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        // Find the image part in the response
        const imageResponsePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
        if (!imageResponsePart || !imageResponsePart.inlineData) {
            throw new Error("The model did not return an edited image.");
        }

        editorGeneratedImage = {
            data: imageResponsePart.inlineData.data,
            mimeType: imageResponsePart.inlineData.mimeType || 'image/png',
        };

        editorResultOriginalImage.src = `data:${editorSourceImage.mimeType};base64,${editorSourceImage.data}`;
        editorResultEditedImage.src = `data:${editorGeneratedImage.mimeType};base64,${editorGeneratedImage.data}`;

        editorLoadingState.classList.add('hidden');
        editorResultState.classList.remove('hidden');

    } catch (error) {
        console.error("Image editing failed:", error);
        // FIX: Safely handle the error message, which could be of an unknown type, to prevent type errors.
        const message = error instanceof Error ? error.message : String(error);
        alert(`Image editing failed: ${message}`);
        // Go back to the initial state on error
        editorLoadingState.classList.add('hidden');
        editorInitialState.classList.remove('hidden');
    }
});

editorDownloadButton.addEventListener('click', () => {
    if (!editorGeneratedImage) return;
    const a = document.createElement('a');
    a.href = `data:${editorGeneratedImage.mimeType};base64,${editorGeneratedImage.data}`;
    a.download = `no1-ai-edited-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

editorAddToChatButton.addEventListener('click', async () => {
    if (!editorGeneratedImage || !activeChatId) return;

    const userPrompt = `Edited the previous image with the prompt: "${editorPrompt.value}"`;
    const userParts = [{ text: userPrompt }];
    const modelParts = [{ inlineData: editorGeneratedImage }];

    toggleWelcomeScreen(false);
    const historyIndex = allChats[activeChatId].length;
    await renderMessage('user', userParts, historyIndex);
    await renderMessage('model', modelParts, historyIndex + 1);

    allChats[activeChatId].push({ role: 'user', parts: userParts });
    allChats[activeChatId].push({ role: 'model', parts: modelParts });
    saveStateToLocalStorage();
    
    imageEditorModal.classList.add('hidden');
});


// --- Initial Load ---
function initializeApp() {
    applyTheme(localStorage.getItem('theme') || 'dark');
    loadStateFromLocalStorage();
    updatePersonaUI();

    const chatIds = Object.keys(allChats);
    if (chatIds.length === 0 || !activeChatId || !allChats[activeChatId]) {
      startNewChat();
    } else {
      loadChat(activeChatId);
    }
    renderSidebar();
    setFormState(false);
}

initializeApp();