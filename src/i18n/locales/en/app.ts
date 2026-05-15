export default {
  app: {
    title: "Alpha Studio - AI Training Hub",
    history: "History",
    back: "Back",
    backToHome: "Exit Workspace",
    workspace: "Workspace",
    chooseAnotherEffect: "Select Tools",
    generateImage: "Generate",
    generating: "Processing...",
    result: "Result",
    yourImageWillAppear: "Output will appear here.",
    aspectRatio: "Aspect Ratio",
    chooseYourShot: "Choose shot",
    regenerate: "Try Again",
    createVideo: "Render Video",
    logout: "Logout",
    hero: {
      title: "Transform Your Creative Vision with AI",
      subtitle: "Powerful AI tools for event design, 3D visualization, and creative production",
      startStudio: "Open Studio",
      viewWorkflow: "View Workflow"
    },
    quickActions: "Quick Actions",
    actions: {
      studio: "AI Studio",
      studioDesc: "Transform images with AI tools",
      workflow: "Workflow",
      workflowDesc: "Manage projects and documents",
      server: "AI Server",
      serverDesc: "Connect to cloud GPU servers",
      courses: "Courses",
      coursesDesc: "Learn AI tools and techniques"
    },
    featuredStudents: "Featured Students",
    partners: "Partner Network",
    viewAll: "View All",
    error: {
      uploadAndSelect: "Please select an image and tool.",
      uploadOne: "Upload required.",
      uploadBoth: "Both images needed.",
      fillAllFields: "Information required.",
      enterPrompt: "Instructions required.",
      unknown: "Error occurred.",
      useAsInputFailed: "Failed to reload image.",
      selectOneToAnimate: "Select to animate.",
      storyboardInputs: "Missing background or style."
    },
    loading: {
      default: "AI is thinking...",
      wait: "Connecting to GPU cloud...",
      step1: "Processing Step 1: Drafting...",
      step2: "Processing Step 2: Finalizing..."
    },
    theme: {
      switchToLight: "Light Mode",
      switchToDark: "Dark Mode"
    }
  },
  history: {
    title: "Creation Log",
    empty: "No creations in this session.",
    use: "Use",
    save: "Save",
    lineArt: "Line Art",
    finalResult: "Final Result"
  },
  imageEditor: {
    upload: "Upload Image",
    dragAndDrop: "or drag & drop here",
    drawMask: "Draw Mask",
    brushSize: "Brush Size",
    undo: "Undo",
    clearMask: "Clear Mask",
    maskPanelInfo: "Paint over the area you want the AI to change (Inpainting).",
    noImage: "No image uploaded"
  },
  studio: {
    title: "AI Studio",
    subtitle: "Generate images and videos with Google Nano Banana and Veo",
    generate: "Generate",
    generating: "Generating...",
    cancel: "Cancel",
    progressLog: "Progress",
    result: "Result",
    resultPlaceholder: "Your result will appear here",
    download: "Download",
    downloadHQ: {
      menuLabel: "Choose quality",
      processing: "Downloading at higher quality…",
      confirmCostTitle: "Confirm credit charge",
      confirmCostBody: "Downloading {{quality}} {{type}} will cost {{cost}} credits. Continue?",
      successInfo: "Downloaded at {{quality}}",
      labelImage1k: "1K (default, fast)",
      labelImage2k: "2K (~30s)",
      labelImage4k: "4K (5 credits, ~60s)",
      labelVideo270p: "270p (animated GIF)",
      labelVideo720p: "720p (default, fast)",
      labelVideo1080p: "1080p (~60s)",
      labelVideo4k: "4K (50 credits, ~2 min)",
      insufficientBalance: "Insufficient balance ({{balance}}/{{cost}} credits)",
    },
    useAsInput: "Use as Input",
    clearHistory: "Clear History",
    noHistory: "No history yet",
    newGeneration: "New generation",
    promptLabel: "Prompt",
    promptPlaceholder: "Describe the image or video you want (English works best)...",
    promptRequired: "Please enter a prompt",
    loginRequired: "Sign in to use AI tools",
    loginRequiredDesc: "You need to sign in to use AI Studio",
    unknownError: "An unknown error occurred",
    tabs: {
      image: "Image",
      video: "Video",
      edit: "Edit"
    },
    hub: {
      title: "AI Studio Toolkit",
      subtitle: "Pick the tool you want to use",
      open: "Open",
      backToStudio: "Back to Studio",
      cards: {
        generate: {
          title: "Generate Image & Video",
          desc: "Create images and videos with Google Nano Banana and Veo"
        },
        edit: {
          title: "Edit Image",
          desc: "Transform, compose, mask and remix images with Gemini"
        },
        vocab: {
          title: "VocabFlip",
          desc: "Learn vocabulary with the integrated flashcard app"
        },
        interior: {
          title: "Interior Design",
          desc: "Interactive cabinet & interior layout tool"
        }
      }
    },
    // ─── Edit tab (Gemini) ──────────────────────────────────────────
    interior: {
      title: "Interior Design AI",
      subtitle: "AI-assisted cabinet model, chat, versions, and rollback",
      loginTitle: "Sign in to use Interior Design AI",
      loginDesc: "Projects, chat history, reference images, and model versions are stored in your account.",
      signIn: "Sign In",
      tabs: { projects: "Projects", preview: "Preview", chat: "Chat" },
      balance: "Balance",
      unlimited: "Unlimited",
      newProject: "New project",
      newProjectName: "New interior project",
      projects: "Projects",
      noProjects: "No interior projects yet.",
      noProjectSelected: "No project selected",
      emptyState: "Create a project to start designing with AI.",
      createFirst: "Create or select a project first.",
      loading: "Loading...",
      chat: "AI chat",
      creditNote: "Each AI call costs 1 credit.",
      creditNote2Step: "Two-step confirm is ON: each request costs 2 credits (1 analyze + 1 apply).",
      creditNoteFirstMessage: "The first request of a project always uses two-step (2 credits). Subsequent requests cost 1 credit unless you enable confirmation in settings.",
      twoStep: {
        label: "Confirm before applying",
        desc: "AI analyzes and proposes first, you review then click apply. Costs 1 extra credit per request."
      },
      settings: {
        title: "Interior AI settings",
        close: "Close",
        lockedDuringProposal: "A proposal is awaiting confirmation — settings are locked until you apply or cancel."
      },
      proposal: {
        title: "AI proposal",
        applyHint: "Read carefully before applying. Click apply to generate the model JSON (+1 credit).",
        apply: "Apply (+1 credit)",
        cancel: "Cancel / Refine prompt",
        pendingBanner: "Waiting for you to confirm the proposal in the dialog...",
        observation: "Image observation",
        understanding: "Understanding",
        proposedChanges: "Proposed changes (edit if needed)",
        proposedChangesHint: "One change per line. You can add/remove/edit before applying.",
        questions: "Clarifying questions",
        answerNotePlaceholder: "Add more details (optional)...",
        generalNote: "Additional notes (optional)",
        generalNotePlaceholder: "e.g. preferred materials, budget, technical constraints..."
      },
      promptLabel: "Design request",
      promptPlaceholder: "Describe the cabinet or room change you want...",
      refImage: "Add reference image",
      refImageCount: "{n}/{max} images selected — click to add more",
      clearRef: "Remove reference image",
      restoredRef: "Image restored from previous version",
      restoredBadge: "Old",
      pasteHint: "Tip: paste an image with Ctrl+V right into the chat.",
      send: "Send to AI",
      sendProposal: "Send for analysis",
      sending: "Processing...",
      modelLabel: "AI model",
      modelDefault: "default",
      tokens: "{n} tokens",
      versions: "Versions",
      current: "Current",
      previewing: "Previewing",
      backToCurrent: "Back to current",
      rollback: "Rollback",
      rollbackTitle: "Rollback version",
      rollbackMessage: "Go back to {{version}}? Chat history will shrink accordingly. Newer versions stay until you send a new request (they'll be discarded then).",
      rollbackConfirm: "Rollback",
      delete: "Delete",
      deleteTitle: "Delete project",
      deleteMessage: "Delete \"{{name}}\"?",
      deleteConfirm: "Delete",
      errors: {
        loadFailed: "Could not load interior projects.",
        createFailed: "Could not create project.",
        deleteFailed: "Could not delete project.",
        sendFailed: "Could not send request.",
        rollbackFailed: "Could not rollback version.",
        emptyPrompt: "Enter a design request first.",
        noCredit: "You need at least 1 credit to call AI."
      }
    },
    selectTransformation: "Select Transformation",
    selectPreset: "Select Preset",
    customPrompt: "Custom Prompt",
    enterPrompt: "Enter your instructions...",
    dailyLimitReached: "Daily free limit reached",
    dailyLimitDesc: "You've used your 3 free uses today. Come back tomorrow!",
    usageCounter: "Used {{used}}/{{limit}} today (Edit tab)",
    step1Failed: "Step 1 failed",
    presetRequired: "Please select a preset",
    secondImageRequired: "Please upload a second image",
    minImagesRequired: "Please upload at least 2 images",
    newTransformation: "New Tool",
    model: {
      label: "AI Model",
      imagen4: { name: "Imagen 4", desc: "Highest quality, photorealistic (default)" },
      banana2: { name: "Nano Banana 2", desc: "Strong style & concept exploration" },
      bananaPro: { name: "Nano Banana Pro", desc: "Premium realism & material" },
      veoT2v: { name: "Veo 3.1", desc: "Text → Video" },
      veoR2v: { name: "Veo 3.1 R2V", desc: "Image → Video" },
      veoFast: { name: "Veo 3.1 - Fast", desc: "Balanced speed and quality" },
      veoQuality: { name: "Veo 3.1 - Quality", desc: "Highest quality, slower" },
      veoLite: { name: "Veo 3.1 - Lite", desc: "Fast and efficient" },
      veoFastLp: { name: "Veo 3.1 - Fast [Lower Priority]", desc: "Saves quota, slightly slower" },
      veoLiteLp: { name: "Veo 3.1 - Lite [Lower Priority]", desc: "Maximum quota savings" },
      // Gemini SDK (Edit tab)
      flashName: "Gemini 2.5 Flash Image",
      flashDesc: "Faster, uses 1 free use",
      proName: "Gemini 3 Pro Image",
      proDesc: "Higher quality, uses 3 free uses"
    },
    aspect: {
      label: "Aspect ratio",
      square: "Square 1:1",
      landscape: "Landscape 16:9",
      portrait: "Portrait 9:16",
      landscape43: "Landscape 4:3",
      portrait34: "Portrait 3:4"
    },
    count: {
      label: "Number of images"
    },
    refImage: {
      label: "Reference image",
      optional: "Optional",
      required: "Required",
      upload: "Add reference image",
      replace: "Replace",
      clear: "Clear",
      hint: "Drop or click to select a file",
      full: "Image limit reached",
      notAllowed: "This mode does not accept reference images",
      startFrame: "Start frame",
      endFrame: "End frame"
    },
    video: {
      modeT2v: "Text → Video",
      modeR2v: "Image → Video",
      waitingTitle: "Generating video...",
      waitingMsg: "This may take 1-3 minutes. Please keep this tab open.",
      subtype: {
        standard: "Standard",
        frames: "Frames",
        ingredients: "Ingredients"
      },
      framesHint: "Frames mode: image 1 = start frame (required), image 2 = end frame (optional)."
    },
    progress: {
      starting: "Starting...",
    },
    credits: {
      note: "Generating will use 0 credits",
    },
    log: {
      uploadingRef: "Uploading {n} reference image(s)...",
      uploadingRefN: "Uploading reference image {i}/{n}...",
      refUploaded: "Reference image(s) uploaded.",
      pastingRef: "Pasting reference image {i}/{n} into model...",
      cancelling: "Cancelling...",
      sendingRequest: "Sending generation request...",
      generating: "Processing: {pct}%",
      retrying: "Flow rejected the result ({error}). Retrying {attempt}/{total}...",
      done: "Done!",
      failed: "Generation failed.",
    },
    save: {
      cta: "Save to library",
      saving: "Saving...",
      saved: "Saved",
      failed: "Save failed"
    },
    usage: {
      imageRemaining: "{{remaining}}/{{limit}} image uses left today",
      videoRemaining: "{{remaining}}/{{limit}} video uses left today",
      unlimited: "Unlimited (admin/mod)",
      imageLimitReached: "You've used all {{limit}} image generations today.",
      videoLimitReached: "You've used all {{limit}} video generations today.",
      cooldownMsg: "Come back tomorrow!"
    },
    mask: {
      comingSoon: "Coming soon"
    },
    error: {
      noServer: "No flow server available. Contact admin.",
      agentFailed: "Flow agent is unavailable. Try again later.",
      r2vNeedImage: "Image → Video mode requires a reference image.",
      framesNeedStart: "Frames mode requires at least 1 reference image (start frame).",
      downloadFailed: "Couldn't download the file"
    },
    history: {
      title: "History",
      subtitle: "Your recent images and videos. Files expire after 48h unless saved.",
      filter: { all: "All", image: "Image", video: "Video" },
      refresh: "Refresh",
      loading: "Loading...",
      empty: "No generations yet.",
      loginRequired: "Sign in to view your generation history.",
      preview: "Preview",
      openPreview: "Open preview",
      id: "ID",
      project: "Project",
      expires: "Expires",
      expired: "Expired",
      expiresInHours: "in {n}h",
      expiresInDays: "in {n}d"
    }
  }
};
