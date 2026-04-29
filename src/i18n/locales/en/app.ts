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
    // ─── Edit tab (Gemini) ──────────────────────────────────────────
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
      framesHint: "Frames mode: image 1 = start frame (required), image 2 = end frame (optional).",
      lpWatermark: "Note: Lower Priority models produce videos with a watermark."
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
