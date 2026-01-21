export default {
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
  }
};
