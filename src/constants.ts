import type { Transformation } from './types';

// Camera Angle Reference Icons
const CAMERA_CENTER_SVG = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e5e7eb' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2-2z'%3e%3c/path%3e%3ccircle cx='12' cy='13' r='4'%3e%3c/circle%3e%3c/svg%3e";
const CAMERA_OVERHEAD_SVG = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e5e7eb' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M12 15V3m0 12l-4-4m4 4l4-4'/%3e%3crect x='3' y='15' width='18' height='6' rx='2' ry='2'/%3e%3c/svg%3e";
const CAMERA_BACK_SVG = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e5e7eb' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M12 21V11l-4-4 1.5-3L12 7l2.5-3L16 7l-4 4'%3e%3c/path%3e%3cpath d='M16 7h2a2 2 0 0 1-2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2'%3e%3c/path%3e%3c/svg%3e";
const CAMERA_LEFT_SVG = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e5e7eb' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M3 9h6l3-3 3 3h6v12H3z'%3e%3c/path%3e%3cpath d='M9 3L7 9'%3e%3c/path%3e%3cpath d='M15 3l2 6'%3e%3c/path%3e%3c/svg%3e";
const CAMERA_RIGHT_SVG = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e5e7eb' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' transform='scale(-1, 1)'%3e%3cpath d='M3 9h6l3-3 3 3h6v12H3z'%3e%3c/path%3e%3cpath d='M9 3L7 9'%3e%3c/path%3e%3cpath d='M15 3l2 6'%3e%3c/path%3e%3c/svg%3e";

// Function Icons (SVG Path Content)
const ICON_STORYBOARD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v16M17 4v16M2 9h5M17 9h5M2 15h5M17 15h5"/></svg>`;
const ICON_EXTRACTION = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
const ICON_ZOOM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>`;
const ICON_STAGE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20M4 20v-5c0-2 2-4 4-4h8c2 0 4 2 4 4v5M12 11V3m-4 4l4-4 4 4"/></svg>`;
const ICON_PERFORMANCE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const ICON_MOCKUP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M2 12h20M12 2v20"/></svg>`;
const ICON_3D = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l9 4.5V17.5L12 22l-9-4.5V6.5L12 2z"/><path d="M12 22V12"/><path d="M21 6.5L12 12 3 6.5"/></svg>`;
const ICON_EMPTY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const ICON_CAMERA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2-2z"/><circle cx="12" cy="13" r="4"/></svg>`;
const ICON_FIGURE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const ICON_WIREFRAME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z"/><path d="M12 12l9-4.5M12 12v9M12 12L3 7.5"/></svg>`;
const ICON_VECTOR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l5 5"/></svg>`;
const ICON_POSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"/><path d="M6 10l6 2 6-2M12 12v5l-4 4M12 17l4 4"/></svg>`;
const ICON_EXPRESSION = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>`;
const ICON_LINEART = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;
const ICON_PALETTE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.5-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H19c2.2 0 4-1.8 4-4 0-5.5-4.5-10-10-10z"/></svg>`;
const ICON_PLUSHIE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M12 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14z"/><path d="M20 21l-2-2m-12 0l-2 2"/></svg>`;
const ICON_DIMENSION = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20M21 3l-6 6M3 21l6-6"/></svg>`;
const ICON_PROCESS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M4 12h16M12 4v16"/></svg>`;

export const TRANSFORMATIONS: Transformation[] = [
  {
    key: "storyboard",
    titleKey: "transformations.effects.storyboard.title",
    prompt: "User's scene description: '{{customPrompt}}'. Using this description, create a cohesive storyboard scene from the provided images. The FIRST image is the BACKGROUND. The next one to three images are CHARACTERS to place in the scene. The LAST image is the STYLE REFERENCE. Your task is to: 1. Integrate the characters into the background based on the scene description. 2. Ensure realistic scaling and positioning. 3. Redraw the ENTIRE scene (background + characters) to perfectly match the artistic style, color palette, and mood of the style reference image. The final output must be a single, stylistically unified image.",
    icon: ICON_STORYBOARD,
    descriptionKey: "transformations.effects.storyboard.description",
    isStoryboard: true,
    hasCustomPrompt: true,
    customPromptLabelKey: "transformations.effects.storyboard.customPromptLabel",
    customPromptPlaceholderKey: "transformations.effects.storyboard.customPromptPlaceholder",
    backgroundUploaderTitle: "transformations.effects.storyboard.backgroundUploaderTitle",
    backgroundUploaderDescription: "transformations.effects.storyboard.backgroundUploaderDescription",
    characterUploaderTitle: "transformations.effects.storyboard.characterUploaderTitle",
    characterUploaderDescription: "transformations.effects.storyboard.characterUploaderDescription",
    referenceUploaderTitle: "transformations.effects.storyboard.referenceUploaderTitle",
    referenceUploaderDescription: "transformations.effects.storyboard.referenceUploaderDescription",
  },
  {
    key: "boothExtraction",
    titleKey: "transformations.effects.boothExtraction.title",
    prompt: "Extract only the major structural components from the provided reference image. Output the result as a single wide image (approx 25:10 aspect ratio) containing all extracted components arranged separately in a grid/sprite sheet format. \n\n1. ANALYZE the image to automatically identify the main construction elements (backdrops, wall panels, stage platforms, standees, large lightboxes, 3D props). \n2. IGNORE and REMOVE ephemeral decorations including: all balloons, fresh flower arrangements, floral vines, small bouquets, and irrelevant tiny details like wires or small props. \n3. Extract only the large, fabricatable components. \n4. Additional User Instructions: '{{customPrompt}}'. \n\nRendering rules: \n- Do NOT combine modules in one canvas. Each module must be exported as a cleanly isolated object with transparent background, centered in its own frame. \n- Preserve 100% of original colors, textures, glow, lighting direction, material fidelity, proportions, and realism. \n- No redesign, no replacement, no color shifting, no smoothing, no extra stylizing. \n- NO environmental background. \n- NO grouping of modules. \n- Focus on major, fabricatable shapes only.",
    icon: ICON_EXTRACTION,
    descriptionKey: "transformations.effects.boothExtraction.description",
    hasCustomPrompt: true,
    customPromptLabelKey: "transformations.effects.boothExtraction.customPromptLabel",
    customPromptPlaceholderKey: "transformations.effects.boothExtraction.customPromptPlaceholder",
  },
  {
    key: "zoomObject",
    titleKey: "transformations.effects.zoomObject.title",
    prompt: "Redraw the image with the main 3D subject scaled to {{zoomLevel}}% of its current relative size. If the percentage is less than 100%, zoom out and seamlessly extend the background environment (outpainting) to fill the frame, creating a significantly wider and expansive scene around the subject. If the percentage is greater than 100%, zoom in on the subject. Maintain the original 3D style, lighting, and perspective. Additional user instructions: '{{customPrompt}}'.",
    icon: ICON_ZOOM,
    descriptionKey: "transformations.effects.zoomObject.description",
    hasCustomPrompt: true,
    isCustomPromptOptional: true,
    customPromptLabelKey: "transformations.effects.zoomObject.customPromptLabel",
    customPromptPlaceholderKey: "transformations.effects.zoomObject.customPromptPlaceholder",
    controls: [
      {
        key: 'zoomLevel',
        labelKey: 'transformations.effects.zoomObject.zoomLabel',
        min: 50,
        max: 150,
        defaultValue: 75,
        unit: '%'
      }
    ]
  },
  {
    key: "stageEffect",
    titleKey: "transformations.effects.stageEffect.title",
    prompt: "Take the stage effects, including lighting, hardware, and atmospheric elements, from the second reference image and seamlessly integrate them into the masked area of the first stage image. The user's specific instruction for the effect is: '{{customPrompt}}'. The effects should look natural and match the perspective and lighting of the stage.",
    icon: ICON_STAGE,
    descriptionKey: "transformations.effects.stageEffect.description",
    isMultiImage: true,
    hasMask: true,
    hasCustomPrompt: true,
    customPromptLabelKey: "transformations.effects.stageEffect.customPromptLabel",
    customPromptPlaceholderKey: "transformations.effects.stageEffect.customPromptPlaceholder",
    primaryUploaderTitle: "transformations.effects.stageEffect.uploader1Title",
    primaryUploaderDescription: "transformations.effects.stageEffect.uploader1Desc",
    secondaryUploaderTitle: "transformations.effects.stageEffect.uploader2Title",
    secondaryUploaderDescription: "transformations.effects.stageEffect.uploader2Desc",
  },
  {
    key: "eventPerformance",
    titleKey: "transformations.effects.eventPerformance.title",
    prompt: "Place the character or act from the second image into the masked area of the first stage image. The performance should be described as: '{{customPrompt}}'. It is crucial to render the person at a realistic scale within the masked area, ensuring their proportions are correct and balanced relative to the stage dimensions. Blend the character seamlessly into the stage with realistic lighting, shadows, and perspective to create a natural and convincing scene.",
    icon: ICON_PERFORMANCE,
    descriptionKey: "transformations.effects.eventPerformance.description",
    isMultiImage: true,
    hasCustomPrompt: true,
    hasMask: true,
    customPromptLabelKey: "transformations.effects.eventPerformance.customPromptLabel",
    customPromptPlaceholderKey: "transformations.effects.eventPerformance.customPromptPlaceholder",
    primaryUploaderTitle: "transformations.effects.eventPerformance.uploader1Title",
    primaryUploaderDescription: "transformations.effects.eventPerformance.uploader1Desc",
    secondaryUploaderTitle: "transformations.effects.eventPerformance.uploader2Title",
    secondaryUploaderDescription: "transformations.effects.eventPerformance.uploader2Desc",
  },
  {
    key: "productMockup",
    titleKey: "transformations.effects.productMockup.title",
    prompt: "Seamlessly integrate the product design from the second image into the masked area of the first image (the environment). The product should occupy approximately {{size}}% of the masked area. Additional instructions: '{{customPrompt}}'. Adjust the product design for perspective, lighting, and shadows to make it look realistic and naturally placed within the environment.",
    icon: ICON_MOCKUP,
    descriptionKey: "transformations.effects.productMockup.description",
    isMultiImage: true,
    hasMask: true,
    hasCustomPrompt: true,
    customPromptLabelKey: "transformations.effects.productMockup.customPromptLabel",
    customPromptPlaceholderKey: "transformations.effects.productMockup.customPromptPlaceholder",
    primaryUploaderTitle: "transformations.effects.productMockup.uploader1Title",
    primaryUploaderDescription: "transformations.effects.productMockup.uploader1Desc",
    secondaryUploaderTitle: "transformations.effects.productMockup.uploader2Title",
    secondaryUploaderDescription: "transformations.effects.productMockup.uploader2Desc",
    controls: [
      {
        key: 'size',
        labelKey: 'transformations.effects.productMockup.sizeLabel',
        min: 20,
        max: 80,
        defaultValue: 50,
        unit: '%'
      }
    ]
  },
  {
    key: "eventDesign3d",
    titleKey: "transformations.effects.eventDesign3d.title",
    prompt: "From the provided image, create a photorealistic 3D model of the event design described as: '{{customPrompt}}'. The model must be isolated and rendered on a neutral gray background.",
    icon: ICON_3D,
    descriptionKey: "transformations.effects.eventDesign3d.description",
    hasCustomPrompt: true,
    customPromptLabelKey: "transformations.effects.eventDesign3d.customPromptLabel",
    customPromptPlaceholderKey: "transformations.effects.eventDesign3d.customPromptPlaceholder",
  },
  {
    key: "roomEmpty",
    titleKey: "transformations.effects.roomEmpty.title",
    prompt: "Remove the following objects from the masked area of the room image: '{{customPrompt}}'. Leave behind a clean, empty space where the objects were. The walls, floor, and ceiling should be seamlessly repaired and inpainted to look natural. Maintain the original lighting and architectural details of the room.",
    icon: ICON_EMPTY,
    descriptionKey: "transformations.effects.roomEmpty.description",
    hasMask: true,
    hasCustomPrompt: true,
    customPromptLabelKey: "transformations.effects.roomEmpty.customPromptLabel",
    customPromptPlaceholderKey: "transformations.effects.roomEmpty.customPromptPlaceholder",
  },
  {
    key: "cameraAngle",
    titleKey: "transformations.effects.cameraAngle.title",
    icon: ICON_CAMERA,
    descriptionKey: "transformations.effects.cameraAngle.description",
    isPresetBased: true,
    hasCustomPrompt: true,
    isCustomPromptOptional: true,
    customPromptLabelKey: "transformations.effects.cameraAngle.customPromptLabel",
    customPromptPlaceholderKey: "transformations.effects.cameraAngle.customPromptPlaceholder",
    referenceUploaderTitle: "transformations.effects.cameraAngle.referenceUploaderTitle",
    referenceUploaderDescription: "transformations.effects.cameraAngle.referenceUploaderDescription",
    presets: [
      {
        key: 'frontView',
        labelKey: 'transformations.effects.cameraAngle.presets.frontView',
        prompt: 'Redraw the image from a direct, head-on, front-facing camera angle, centered on the main subject.',
        referenceImage: CAMERA_CENTER_SVG,
      },
      {
        key: 'backView',
        labelKey: 'transformations.effects.cameraAngle.presets.backView',
        prompt: 'Redraw the image from directly behind the main subject, showing their back.',
        referenceImage: CAMERA_BACK_SVG,
      },
      {
        key: 'topDownView',
        labelKey: 'transformations.effects.cameraAngle.presets.topDownView',
        prompt: "Redraw the image from a top-down, bird's-eye view, looking directly down at the scene.",
        referenceImage: CAMERA_OVERHEAD_SVG,
      },
      {
        key: 'leftSideView',
        labelKey: 'transformations.effects.cameraAngle.presets.leftSideView',
        prompt: 'Redraw the image from a side-on profile view, from the left side of the subject.',
        referenceImage: CAMERA_LEFT_SVG,
      },
      {
        key: 'rightSideView',
        labelKey: 'transformations.effects.cameraAngle.presets.rightSideView',
        prompt: 'Redraw the image from a side-on profile view, from the right side of the subject.',
        referenceImage: CAMERA_RIGHT_SVG,
      }
    ]
  },
  {
    key: "figurine",
    titleKey: "transformations.effects.figurine.title",
    prompt: "turn this photo into a character figure. Behind it, place a box with the character's image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. set the scene indoors if possible",
    icon: ICON_FIGURE,
    descriptionKey: "transformations.effects.figurine.description"
  },
  {
    key: "wireframe",
    titleKey: "transformations.effects.wireframe.title",
    prompt: "Analyze the 3D form of the main subject in this image. Generate a clean, technical wireframe or skeletal structure that outlines its geometric shape. The wireframe lines should have a thickness level of {{thickness}} (where 1 is thinnest and 20 is thickest). The output should be composed of these interconnected lines on a plain background, revealing the underlying 3D mesh.",
    icon: ICON_WIREFRAME,
    descriptionKey: "transformations.effects.wireframe.description",
    controls: [
      {
        key: 'thickness',
        labelKey: 'transformations.effects.wireframe.thicknessLabel',
        min: 1,
        max: 20,
        defaultValue: 5,
        unit: ''
      }
    ]
  },
  {
    key: "vectorFrom3d",
    titleKey: "transformations.effects.vectorFrom3d.title",
    prompt: "Transform the first 3D-style image into a clean and sharp vector illustration, perfectly matching the artistic style, color palette, and line work of the second reference image. The final output must be a vector illustration of the first image in the style of the second.",
    icon: ICON_VECTOR,
    descriptionKey: "transformations.effects.vectorFrom3d.description",
    isMultiImage: true,
    primaryUploaderTitle: "transformations.effects.vectorFrom3d.uploader1Title",
    primaryUploaderDescription: "transformations.effects.vectorFrom3d.uploader1Desc",
    secondaryUploaderTitle: "transformations.effects.vectorFrom3d.uploader2Title",
    secondaryUploaderDescription: "transformations.effects.vectorFrom3d.uploader2Desc",
  },
  {
    key: "pose",
    titleKey: "transformations.effects.pose.title",
    prompt: "Apply the pose from the second image to the character in the first image. Render as a professional studio photograph.",
    icon: ICON_POSE,
    descriptionKey: "transformations.effects.pose.description",
    isMultiImage: true,
    primaryUploaderTitle: "transformations.effects.pose.uploader1Title",
    primaryUploaderDescription: "transformations.effects.pose.uploader1Desc",
    secondaryUploaderTitle: "transformations.effects.pose.uploader2Title",
    secondaryUploaderDescription: "transformations.effects.pose.uploader2Desc",
  },
  {
    key: "expressionReference",
    titleKey: "transformations.effects.expressionReference.title",
    prompt: "Precisely transfer the facial expression from the second reference person onto the person in the first image. Maintain all facial features, identity, and skin texture of the first person, but adjust the muscle structure, eyes, and mouth to mirror the specific emotion (e.g., intense joy, subtle smirk, shock) shown in the second image. The final result should look like a natural studio photograph of the first person displaying the second person's expression.",
    icon: ICON_EXPRESSION,
    descriptionKey: "transformations.effects.expressionReference.description",
    isMultiImage: true,
    primaryUploaderTitle: "transformations.effects.expressionReference.uploader1Title",
    primaryUploaderDescription: "transformations.effects.expressionReference.uploader1Desc",
    secondaryUploaderTitle: "transformations.effects.expressionReference.uploader2Title",
    secondaryUploaderDescription: "transformations.effects.expressionReference.uploader2Desc",
  },
  {
    key: "lineArt",
    titleKey: "transformations.effects.lineArt.title",
    prompt: "Turn the image into a clean, hand-drawn line art sketch.",
    icon: ICON_LINEART,
    descriptionKey: "transformations.effects.lineArt.description"
  },
  {
    key: "colorPalette",
    titleKey: "transformations.effects.colorPalette.title",
    prompt: "Turn this image into a clean, hand-drawn line art sketch.",
    stepTwoPrompt: "Color the line art using the colors from the second image.",
    icon: ICON_PALETTE,
    descriptionKey: "transformations.effects.colorPalette.description",
    isMultiImage: true,
    isTwoStep: true,
    primaryUploaderTitle: "transformations.effects.colorPalette.uploader1Title",
    primaryUploaderDescription: "transformations.effects.colorPalette.uploader1Desc",
    secondaryUploaderTitle: "transformations.effects.colorPalette.uploader2Title",
    secondaryUploaderDescription: "transformations.effects.colorPalette.uploader2Desc",
  },
  {
    key: "plushie",
    titleKey: "transformations.effects.plushie.title",
    prompt: "Turn the person in this photo into a cute, soft plushie doll.",
    icon: ICON_PLUSHIE,
    descriptionKey: "transformations.effects.plushie.description"
  },
  {
    key: "twoDToThreeD",
    titleKey: "transformations.effects.twoDToThreeD.title",
    prompt: "Convert the first image (2D artwork) into a hyper-realistic 3D model. Use the second image as a direct reference for all surface materials and textures. Apply the textures from the second image onto the 3D forms of the first image. Emphasize a strong sense of depth and volume, making the forms pop out with sharp, well-defined geometric edges. The lighting should create deep shadows that enhance the 3D relief, and the surface materials must be directly inspired by the second image, looking incredibly realistic and tangible.",
    icon: ICON_DIMENSION,
    descriptionKey: "transformations.effects.twoDToThreeD.description",
    isMultiImage: true,
    primaryUploaderTitle: "transformations.effects.twoDToThreeD.uploader1Title",
    primaryUploaderDescription: "transformations.effects.twoDToThreeD.uploader1Desc",
    secondaryUploaderTitle: "transformations.effects.twoDToThreeD.uploader2Title",
    secondaryUploaderDescription: "transformations.effects.twoDToThreeD.uploader2Desc",
  },
  {
    key: "paintingProcess",
    titleKey: "transformations.effects.paintingProcess.title",
    prompt: "Generate a 4-panel grid showing the artistic process of creating this image, from sketch to final render.",
    icon: ICON_PROCESS,
    descriptionKey: "transformations.effects.paintingProcess.description"
  }
];
