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
      storyboardInputs: "Missing background or style.",
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
    selectTransformation: "Select Transformation",
    selectPreset: "Select Preset",
    customPrompt: "Custom Prompt",
    optional: "Optional",
    enterPrompt: "Enter your instructions...",
    uploadImages: "Upload Images",
    generate: "Generate",
    generating: "Generating...",
    result: "Result",
    resultPlaceholder: "Your result will appear here",
    download: "Download",
    useAsInput: "Use as Input",
    history: "History",
    clearHistory: "Clear History",
    noHistory: "No history yet",
    promptRequired: "Please enter a prompt",
    presetRequired: "Please select a preset",
    secondImageRequired: "Please upload a second image",
    minImagesRequired: "Please upload at least 2 images",
    step1Failed: "Step 1 failed",
    unknownError: "An unknown error occurred"
  },
  login: {
    subtitle: "Sign in to continue",
    registerSubtitle: "Create your account",
    button: "Sign In",
    email: "Email",
    emailPlaceholder: "Enter your email",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Re-enter your password",
    name: "Full Name",
    namePlaceholder: "Enter your name",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    signIn: "Sign In",
    signingIn: "Signing in...",
    register: "Create Account",
    registering: "Creating account...",
    orContinueWith: "or continue with",
    noAccount: "Don't have an account? Register",
    hasAccount: "Already have an account? Sign in",
    logout: "Sign Out",
    demoCredentials: "Demo credentials:",
    error: {
      emailRequired: "Please enter your email",
      passwordRequired: "Please enter your password",
      nameRequired: "Please enter your name",
      passwordLength: "Password must be at least 6 characters",
      passwordMismatch: "Passwords do not match",
      network: "Network error. Please try again.",
      invalid: "Invalid email or password"
    }
  },
  server: {
    title: "AI Server Connect",
    subtitle: "Connect to high-performance GPU servers",
    loading: "Loading servers...",
    online: "Online",
    busy: "Busy",
    offline: "Offline",
    connect: "Connect",
    connecting: "Connecting...",
    connected: "Connected",
    connectedTo: "Connected to",
    disconnect: "Disconnect",
    unavailable: "Unavailable",
    perHour: "hour",
    infoTitle: "About AI Servers",
    infoDescription: "AI servers provide high-performance GPU computing for your AI tasks. Choose a server based on your needs and budget."
  },
  imagePreview: {
    download: "Download",
    close: "Close"
  },
  student: {
    hired: "Hired",
    skills: "Skills",
    portfolio: "Portfolio",
    about: "About",
    featuredWork: "Featured Work"
  },
  partner: {
    register: "Register as Partner",
    companyName: "Company Name",
    type: "Partner Type",
    agency: "Agency",
    supplier: "Supplier",
    email: "Email",
    phone: "Phone",
    website: "Website",
    location: "Location",
    description: "Description",
    specialties: "Specialties",
    about: "About",
    projects: "Projects",
    contact: "Contact",
    save: "Save",
    required: "This field is required",
    invalidEmail: "Invalid email address",
    selectSpecialty: "Please select at least one specialty",
    cancel: "Cancel",
    submit: "Submit"
  },
  course: {
    by: "by",
    modules: "Modules",
    lessons: "Lessons",
    duration: "Duration",
    description: "Description",
    curriculum: "Curriculum",
    enroll: "Enroll Now"
  },
  resultDisplay: {
    actions: {
      download: "Download",
      useAsInput: "Continue Editing",
      savedToWorkflow: "Saved to Alpha Connect!"
    }
  },
  transformations: {
    effects: {
      storyboard: {
        title: "Storyboard",
        description: "Combine background, characters, and style to create a complete scene.",
        customPromptLabel: "Scene Description (Prompt)",
        customPromptPlaceholder: "e.g., A luxury gala dinner on the beach...",
        backgroundUploaderTitle: "Background Image",
        backgroundUploaderDescription: "Stage or venue space",
        characterUploaderTitle: "Character Images",
        characterUploaderDescription: "Actors or Props (Max 3)",
        referenceUploaderTitle: "Style Reference",
        referenceUploaderDescription: "Color & mood reference"
      },
      boothExtraction: {
        title: "Booth Extraction",
        description: "Automatically extract structural modules (Backdrop, Standee, Counter) into flat sprites.",
        customPromptLabel: "Technical Notes",
        customPromptPlaceholder: "e.g., Extract only the iron frame and LED screen..."
      },
      zoomObject: {
        title: "3D Zoom",
        description: "Resize object and automatically fill surrounding space (Outpainting).",
        zoomLabel: "Zoom Level",
        customPromptLabel: "Context Request",
        customPromptPlaceholder: "Describe the environment when zooming out..."
      },
      stageEffect: {
        title: "Stage VFX",
        description: "Add lighting, fireworks, lasers, or smoke effects to specific stage areas.",
        customPromptLabel: "VFX Description",
        customPromptPlaceholder: "e.g., Green lasers scanning from top...",
        uploader1Title: "Original Stage",
        uploader1Desc: "Stage needing effects",
        uploader2Title: "Effect Sample",
        uploader2Desc: "Reference for lighting/fireworks"
      },
      eventPerformance: {
        title: "Event Performance",
        description: "Composite singers, dance groups, or PGs into the scene with correct body proportions.",
        customPromptLabel: "Performance Details",
        customPromptPlaceholder: "e.g., A dance group of 5 in traditional costumes...",
        uploader1Title: "Background Image",
        uploader1Desc: "Stage or empty area",
        uploader2Title: "Personnel Image",
        uploader2Desc: "Person to composite"
      },
      productMockup: {
        title: "Product Mockup",
        description: "Place product or logo into real space with natural lighting and shadows.",
        customPromptLabel: "Mockup Request",
        customPromptPlaceholder: "Describe angle and surface material...",
        sizeLabel: "Product Size",
        uploader1Title: "Environment Image",
        uploader1Desc: "Showroom, hall, or shelf",
        uploader2Title: "Design Image",
        uploader2Desc: "Product file or Logo"
      },
      eventDesign3d: {
        title: "3D Perspective",
        description: "Convert concept sketches into realistic 3D renders.",
        customPromptLabel: "Material Description",
        customPromptPlaceholder: "e.g., Glass surface, main purple neon lighting..."
      },
      roomEmpty: {
        title: "Clean Room",
        description: "Remove old furniture, trash, or people to get a clean empty space.",
        customPromptLabel: "Removal Target",
        customPromptPlaceholder: "e.g., Remove all old tables/chairs, keep the floor..."
      },
      cameraAngle: {
        title: "Camera Angle",
        description: "Change the image perspective to standard angles (Top-down, Profile, Front).",
        customPromptLabel: "Angle Description",
        customPromptPlaceholder: "e.g., Low angle looking up for grandeur...",
        referenceUploaderTitle: "Angle Reference",
        referenceUploaderDescription: "Suggest camera pose for AI",
        presets: {
          frontView: "Front View",
          backView: "Back View",
          topDownView: "Top-down View",
          leftSideView: "Left Side View",
          rightSideView: "Right Side View"
        }
      },
      figurine: {
        title: "Figurine Maker",
        description: "Turn characters or mascots into toy models in a box."
      },
      wireframe: {
        title: "Wireframe Mesh",
        description: "Convert object into technical 3D mesh model.",
        thicknessLabel: "Line Thickness"
      },
      vectorFrom3d: {
        title: "Vectorize (2D)",
        description: "Convert complex 3D renders into flat Vector illustrations.",
        uploader1Title: "Original 3D Image",
        uploader1Desc: "Object to convert",
        uploader2Title: "Style Sample",
        uploader2Desc: "Desired Vector style"
      },
      pose: {
        title: "Pose Match",
        description: "Apply pose from a reference image to the target character.",
        uploader1Title: "Original Character",
        uploader1Desc: "Person needing pose change",
        uploader2Title: "Pose Reference",
        uploader2Desc: "Desired pose to mimic"
      },
      expressionReference: {
        title: "Facial Expression",
        description: "Change emotions (happy, sad, cool) based on reference face.",
        uploader1Title: "Original Image",
        uploader1Desc: "Person needing expression change",
        uploader2Title: "Emotion Reference",
        uploader2Desc: "Face with desired expression"
      },
      lineArt: {
        title: "Line Art",
        description: "Convert image into professional clean line drawings."
      },
      colorPalette: {
        title: "Auto Color",
        description: "Colorize line art based on the color palette of another image.",
        uploader1Title: "Line Art",
        uploader1Desc: "Black and white sketch",
        uploader2Title: "Color Sample",
        uploader2Desc: "Image with desired colors"
      },
      plushie: {
        title: "Plushie Maker",
        description: "Turn any object or person into a cute soft plush toy."
      },
      twoDToThreeD: {
        title: "2D to 3D",
        description: "Extrude 3D depth for logos or 2D drawings with realistic materials.",
        uploader1Title: "Flat 2D Image",
        uploader1Desc: "Logo or drawing",
        uploader2Title: "Material Reference",
        uploader2Desc: "Surface (Metal, Plastic, Leather...)"
      },
      paintingProcess: {
        title: "Design Process",
        description: "Create a 4-step sequence from sketch to final artwork."
      }
    }
  },
  workflow: {
    title: "Workflow Dashboard",
    subtitle: "Manage projects, documents, and team",
    search: "Search...",
    progress: "Progress",
    budget: "Budget",
    spent: "Spent",
    deadline: "Deadline",
    team: "Team",
    teamMembers: "Team Members",
    external: "External",
    description: "Description",
    tasks: "Tasks",
    addMember: "Add Member",
    tab: {
      projects: "Projects",
      documents: "Documents",
      team: "Team"
    },
    dept: {
      all: "All Departments",
      eventPlanner: "Event Planner",
      eventplanner: "Event Planner",
      creative: "Creative",
      operation: "Operation"
    },
    status: {
      planning: "Planning",
      active: "Active",
      completed: "Completed",
      archived: "Archived",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected"
    },
    login: {
      title: "Staff Access",
      email: "Staff ID / Email",
      password: "Security Key",
      btn: "Access Connect Hub",
      hint: "Use any credentials to enter"
    },
    dashboard: {
      upload: "Upload Asset",
      createProject: "New Project",
      create: "Studio AI",
      search: "Find assets...",
      filter: "Dept Filter",
      noFiles: "No files found.",
      table: {
        name: "File / Project Name",
        dept: "Dept",
        date: "Date",
        status: "Status",
        action: "Opt"
      },
      status: {
        pending: "Wait",
        approved: "Done",
        rejected: "Fail"
      },
      project: {
        modalTitle: "Initialize New Project",
        nameLabel: "Project Name",
        deptLabel: "Lead Dept",
        descLabel: "Requirements",
        createBtn: "Create Project",
        success: "New project initialized successfully!",
        hubTitle: "Project Hub",
        management: "Project Management",
        tabs: {
          overview: "Overview",
          team: "Team & Roles",
          files: "Docs & Files",
          finance: "Finance (Coins)",
          chat: "Discussion",
          tasks: "Tasks"
        },
        finance: {
          budget: "Coin Budget",
          expenses: "Spent",
          remaining: "Remaining",
          addExpense: "Add Expense",
          expenseName: "Expense Name",
          amount: "Amount",
          date: "Date",
          profit: "Est. Profit"
        },
        package: {
          btn: "Package & Handover",
          confirm: "Confirm project packaging?",
          desc: "Project will be marked completed. Files archived and finance report locked.",
          success: "Project packaged successfully!"
        },
        chat: {
          placeholder: "Type message...",
          send: "Send"
        },
        tasks: {
          title: "Task List",
          addTask: "Add Task",
          noTasks: "No tasks yet.",
          status: {
            todo: "To Do",
            in_progress: "In Progress",
            done: "Done"
          },
          modal: {
            title: "Assign New Task",
            titleLabel: "Task Name",
            assigneeLabel: "Assignee",
            dueDateLabel: "Due Date",
            fileLabel: "Attachment (Optional)",
            submit: "Assign"
          },
          assigned: "Task assigned"
        }
      }
    },
    depts: {
      all: "All Assets",
      event_planner: "Event Planner",
      creative: "Creative Team",
      operation: "Operation Team"
    },
    jobs: {
      title: "Freelance Hub",
      subtitle: "Real projects from Alpha partners",
      apply: "Apply Now",
      budget: "Budget",
      posted: "Posted",
      deadline: "Deadline",
      applicants: "applicants"
    },
    wallet: {
      title: "Credit Wallet",
      balance: "Current Balance",
      buy: "Buy Credits",
      withdraw: "Cash Out",
      withdrawDesc: "Convert Coins to cash when balance > 1000.",
      withdrawBtn: "Request Withdrawal",
      withdrawMin: "Minimum 1000 Coins required",
      history: "Transaction History",
      packages: {
        starter: "Starter Pack",
        pro: "Pro Pack",
        biz: "Business Pack"
      },
      benefits: {
        server: "Rent GPU Server",
        course: "Advanced Courses",
        job: "Take Freelance Jobs"
      },
      popular: "Most Popular",
      success: "Top-up successful!",
      withdrawSuccess: "Withdrawal request sent!"
    },
    partners: {
      title: "Partner Network",
      subtitle: "Top Agencies & Suppliers",
      register: "Register Partner",
      tabs: {
        agency: "Event Agency",
        supplier: "Supplier"
      },
      contact: "Contact",
      website: "Website",
      verified: "Verified",
      form: {
        title: "Network Registration",
        companyName: "Company Name",
        type: "Type",
        location: "Location",
        phone: "Hotline",
        email: "Contact Email",
        website: "Website / Portfolio",
        desc: "Capabilities",
        submit: "Submit",
        success: "Registration sent! We will contact you soon."
      },
      details: {
        about: "About",
        services: "Services",
        projects: "Key Projects",
        connect: "Connect"
      }
    },
    profile: {
      title: "Student Profile",
      edit: "Edit",
      save: "Save Changes",
      cancel: "Cancel",
      name: "Full Name",
      role: "Role / Title",
      bio: "Bio",
      skills: "Skills (comma separated)",
      portfolio: "Portfolio Link",
      contact: "Contact Info",
      gallery: "Featured Work",
      hire: "Hire Talent"
    },
    automation: {
      title: "Automation",
      create: "New Workflow",
      active: "On",
      inactive: "Off",
      triggers: {
        file_upload: "On File Upload",
        status_approved: "On Approved",
        status_rejected: "On Rejected"
      },
      actions: {
        send_email: "Send Email",
        send_telegram: "Send Telegram",
        send_whatsapp: "Send WhatsApp"
      },
      targetPlaceholder: "Enter Email or Group ID...",
      lastRun: "Last Run"
    },
    affiliate: {
      title: "Affiliate Program",
      subtitle: "Refer friends, earn unlimited credits",
      totalEarned: "Total Earned",
      pending: "Pending",
      referrals: "Referrals",
      clicks: "Clicks",
      copyLink: "Copy Link",
      copied: "Copied!",
      commission: "Commission",
      program: "Program",
      history: "History"
    },
    creative: {
      title: "Creative Assets",
      subtitle: "Share Prompts & Workflows. Earn 100 Coins per contribution!",
      create: "Contribute",
      prompts: "Sample Prompts",
      workflows: "Workflows",
      form: {
        title: "New Asset",
        assetTitle: "Title",
        type: "Type",
        content: "Content (Prompt or JSON)",
        tags: "Tags",
        submit: "Submit & Earn 100 Coins"
      },
      success: "Submitted! You earned 100 Coins."
    },
    resources: {
      title: "Resource Hub",
      subtitle: "Share files & data. Earn 300 Coins per upload!",
      upload: "Share Resource",
      types: {
        project_file: "Project File (SKP, Blend)",
        design_asset: "Design Asset (PSD, AI)",
        industry_data: "Industry Data",
        template: "Template"
      },
      form: {
        title: "Upload Resource",
        name: "Resource Name",
        type: "Type",
        desc: "Description",
        format: "File Format",
        submit: "Upload & Earn 300 Coins"
      },
      success: "Upload successful! You earned 300 Coins."
    },
    collaboration: {
      title: "Project Chat",
      team: "Team Members",
      addMember: "Add Member",
      removeMember: "Remove",
      chat: "Chat",
      placeholder: "Type message...",
      send: "Send",
      noMembers: "No members yet.",
      joined: "joined the project.",
      removed: "left the project.",
      feeNotice: "Adding external member costs 50 Credits. Continue?",
      freeNotice: "Adding Alpha Student (Free).",
      insufficient: "Insufficient balance for external member (50 Credits needed)."
    }
  },
  landing: {
    nav: {
      features: "AI Academy",
      showcase: "Assets",
      utilities: "Tools",
      connect: "Alpha Connect",
      about: "About",
      academy: "Academy",
      aiCloud: "AI Cloud Server",
      enterStudio: "Enter AI Studio"
    },
    cta: {
      launch: "Launch Studio",
      startCreating: "Enroll Now",
      learnMore: "Syllabus"
    },
    hero: {
      badge: "#1 AI Event Training Platform",
      title1: "UNLEASH",
      title2: "AI POWER",
      subtitle: "Comprehensive AI learning and working ecosystem for Event Designers & Creative Staff. Integrated with high-performance RTX 4090 GPU servers.",
      exploreStudio: "EXPLORE STUDIO",
      gpuServer: "GPU SERVER"
    },
    courses: {
      title: "Training Programs",
      subtitle: "In-depth learning path from Concept to Execution for the Event industry.",
      viewAll: "View all courses"
    },
    features: {
      title: "Unlimited connection with",
      highlight: "Alpha Connect",
      description: "Sync data directly between AI Studio and centralized management system. Submit design files, manage digital assets and connect with Alpha community in one tap.",
      item1: "Centralized design file management",
      item2: "Staff and client communication",
      item3: "High-performance GPU server sync",
      item4: "Exclusive prompt library",
      cta: "OPEN ALPHA CONNECT"
    },
    course: {
      intro: "Course Intro",
      syllabus: "Syllabus",
      overview: "Overview",
      whatYouLearn: "What you'll learn",
      point1: "Master latest AI generative tools",
      point2: "Apply AI to real production workflows",
      point3: "Optimize design time up to 80%",
      startLearning: "Start Learning",
      enrollNow: "Enroll Now",
      minPerLesson: "min/lesson",
      lessons: "Lessons",
      progress: "Progress",
      continue: "Resume",
      viewCourse: "Details",
      hours: "Hours",
      duration: "Duration",
      level: "Level",
      beginner: "Beginner"
    },
    showcase: {
      title: "Featured Students",
      subtitle: "Top talent and career opportunities.",
      pro: "Pro Student",
      hired: "Hired",
      cta: "Become a Pro Member"
    },
    partners: {
      title: "Strategic Partners",
      subtitle: "We connect you with top Agencies & Suppliers. Get real job opportunities right after completing the course.",
      join: "Join Partner Network"
    },
    footer: {
      copyright: "PROFESSIONAL AI TRAINING PLATFORM. ALL RIGHTS RESERVED."
    }
  },
  admin: {
    courses: {
      title: "Course Management",
      subtitle: "Manage training courses and content",
      createNew: "Create New Course",
      editCourse: "Edit Course",
      deleteCourse: "Delete Course",
      publish: "Publish",
      unpublish: "Unpublish",
      archive: "Archive",
      edit: "Edit",
      draft: "Draft",
      published: "Published",
      archived: "Archived",
      free: "Free",
      lessons: "lessons",
      noDescription: "No description",
      accessDenied: "Access denied. Admin only.",
      dismiss: "Dismiss",
      noCourses: "No courses found",
      createFirst: "Create Your First Course",
      searchPlaceholder: "Search courses...",
      allCategories: "All Categories",
      allStatus: "All Status",
      sortNewest: "Newest First",
      sortOldest: "Oldest First",
      sortPopular: "Most Popular",
      sortRating: "Highest Rated",
      sortPriceHigh: "Price: High to Low",
      sortPriceLow: "Price: Low to High",
      deleteConfirmTitle: "Delete Course?",
      deleteConfirmMessage: "This action cannot be undone. Are you sure you want to delete this course?",
      categories: {
        aiBasic: "AI Basic",
        aiAdvanced: "AI Advanced",
        aiStudio: "AI Studio",
        aiCreative: "AI Creative"
      },
      levels: {
        beginner: "Beginner",
        intermediate: "Intermediate",
        advanced: "Advanced"
      },
      stats: {
        totalCourses: "Total Courses",
        publishedCourses: "Published",
        totalEnrollments: "Total Enrollments",
        averageRating: "Avg Rating"
      },
      form: {
        basicInfo: "Basic Information",
        content: "Content",
        pricing: "Pricing",
        modules: "Modules",
        title: "Title",
        titlePlaceholder: "Enter course title...",
        description: "Description",
        descriptionPlaceholder: "Enter course description...",
        category: "Category",
        level: "Level",
        thumbnail: "Thumbnail URL",
        thumbnailPlaceholder: "https://example.com/image.jpg",
        duration: "Duration (hours)",
        instructor: "Instructor",
        instructorName: "Name",
        instructorAvatar: "Avatar URL",
        instructorBio: "Bio",
        tags: "Tags",
        addTag: "Add tag...",
        add: "Add",
        prerequisites: "Prerequisites",
        addPrerequisite: "Add prerequisite...",
        learningOutcomes: "Learning Outcomes",
        addOutcome: "Add Outcome",
        price: "Price (VND)",
        discount: "Discount (%)",
        pricePreview: "Final Price Preview",
        saveDraft: "Save as Draft",
        publishCourse: "Publish Course",
        saving: "Saving...",
        cancel: "Cancel",
        addModule: "Add Module",
        addLesson: "Add Lesson",
        noModules: "No modules yet",
        addFirstModule: "Add Your First Module",
        moduleTitleVi: "Module title (Vietnamese)",
        moduleTitleEn: "Module title (English)",
        lessonTitleVi: "Lesson title (Vietnamese)",
        lessonTitleEn: "Lesson title (English)",
        contentUrl: "Content URL",
        lessonTypes: {
          video: "Video",
          text: "Text",
          quiz: "Quiz",
          assignment: "Assignment"
        },
        errors: {
          titleRequired: "Title in both languages is required",
          categoryRequired: "Category is required"
        }
      },
      messages: {
        createSuccess: "Course created successfully!",
        updateSuccess: "Course updated successfully!",
        deleteSuccess: "Course deleted successfully!",
        publishSuccess: "Course published successfully!"
      }
    }
  }
};
