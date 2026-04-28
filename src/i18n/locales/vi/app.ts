export default {
  app: {
    title: "Alpha Studio - Học viện AI",
    history: "Lịch sử",
    back: "Quay lại",
    backToHome: "Thoát Workspace",
    workspace: "Workspace",
    chooseAnotherEffect: "Chọn công cụ",
    generateImage: "Tạo ảnh",
    generating: "Đang xử lý...",
    result: "Kết quả",
    yourImageWillAppear: "Kết quả sẽ xuất hiện ở đây.",
    aspectRatio: "Tỷ lệ khung hình",
    chooseYourShot: "Chọn góc chụp",
    regenerate: "Thử lại",
    createVideo: "Render Video",
    logout: "Đăng xuất",
    hero: {
      title: "Biến đổi tầm nhìn sáng tạo của bạn với AI",
      subtitle: "Công cụ AI mạnh mẽ cho thiết kế sự kiện, hình ảnh 3D và sản xuất sáng tạo",
      startStudio: "Mở Studio",
      viewWorkflow: "Xem Workflow"
    },
    quickActions: "Thao tác nhanh",
    actions: {
      studio: "AI Studio",
      studioDesc: "Biến đổi hình ảnh với công cụ AI",
      workflow: "Workflow",
      workflowDesc: "Quản lý dự án và tài liệu",
      server: "AI Server",
      serverDesc: "Kết nối máy chủ GPU cloud",
      courses: "Khóa học",
      coursesDesc: "Học công cụ và kỹ thuật AI"
    },
    featuredStudents: "Học viên tiêu biểu",
    partners: "Mạng lưới đối tác",
    viewAll: "Xem tất cả",
    error: {
      uploadAndSelect: "Vui lòng chọn ảnh và công cụ.",
      uploadOne: "Cần tải ảnh lên.",
      uploadBoth: "Cần cả hai ảnh.",
      fillAllFields: "Cần điền thông tin.",
      enterPrompt: "Cần nhập hướng dẫn.",
      unknown: "Đã xảy ra lỗi.",
      useAsInputFailed: "Không thể tải lại ảnh.",
      selectOneToAnimate: "Chọn để tạo animation.",
      storyboardInputs: "Thiếu bối cảnh hoặc phong cách."
    },
    loading: {
      default: "AI đang xử lý...",
      wait: "Đang kết nối GPU cloud...",
      step1: "Xử lý Bước 1: Tạo bản nháp...",
      step2: "Xử lý Bước 2: Hoàn thiện..."
    },
    theme: {
      switchToLight: "Chế độ sáng",
      switchToDark: "Chế độ tối"
    }
  },
  history: {
    title: "Nhật ký sáng tạo",
    empty: "Chưa có tác phẩm trong phiên này.",
    use: "Sử dụng",
    save: "Lưu",
    lineArt: "Bản vẽ nét",
    finalResult: "Kết quả cuối"
  },
  imageEditor: {
    upload: "Tải ảnh lên",
    dragAndDrop: "hoặc kéo thả vào đây",
    drawMask: "Vẽ Mask",
    brushSize: "Kích thước cọ",
    undo: "Hoàn tác",
    clearMask: "Xóa Mask",
    maskPanelInfo: "Tô lên vùng bạn muốn AI thay đổi (Inpainting).",
    noImage: "Chưa tải ảnh"
  },
  studio: {
    title: "AI Studio",
    subtitle: "Tạo ảnh và video với Google Nano Banana và Veo",
    generate: "Tạo",
    generating: "Đang tạo...",
    cancel: "Hủy",
    progressLog: "Tiến trình",
    result: "Kết quả",
    resultPlaceholder: "Kết quả sẽ xuất hiện ở đây",
    download: "Tải xuống",
    useAsInput: "Dùng làm đầu vào",
    history: "Lịch sử",
    clearHistory: "Xóa lịch sử",
    noHistory: "Chưa có lịch sử",
    newGeneration: "Tạo mới",
    promptLabel: "Mô tả",
    promptPlaceholder: "Mô tả hình ảnh hoặc video bạn muốn tạo (tiếng Anh cho kết quả tốt nhất)...",
    promptRequired: "Vui lòng nhập mô tả",
    loginRequired: "Đăng nhập để sử dụng công cụ AI",
    loginRequiredDesc: "Bạn cần đăng nhập để sử dụng AI Studio",
    unknownError: "Đã xảy ra lỗi không xác định",
    tabs: {
      image: "Ảnh",
      video: "Video",
      edit: "Chỉnh sửa"
    },
    // ─── Edit tab (Gemini) ──────────────────────────────────────────
    selectTransformation: "Chọn hiệu ứng",
    selectPreset: "Chọn Preset",
    customPrompt: "Prompt tùy chỉnh",
    enterPrompt: "Nhập hướng dẫn của bạn...",
    dailyLimitReached: "Hết lượt miễn phí hôm nay",
    dailyLimitDesc: "Bạn đã dùng hết 3 lần miễn phí hôm nay. Quay lại vào ngày mai!",
    usageCounter: "Đã dùng {{used}}/{{limit}} lần hôm nay (Edit tab)",
    step1Failed: "Bước 1 thất bại",
    presetRequired: "Vui lòng chọn preset",
    secondImageRequired: "Vui lòng tải ảnh thứ hai",
    minImagesRequired: "Vui lòng tải ít nhất 2 ảnh",
    newTransformation: "Công cụ mới",
    model: {
      label: "Model AI",
      imagen4: { name: "Imagen 4", desc: "Chất lượng cao, photorealistic (mặc định)" },
      banana2: { name: "Nano Banana 2", desc: "Style & concept mạnh" },
      bananaPro: { name: "Nano Banana Pro", desc: "Realism & material cao cấp" },
      veoT2v: { name: "Veo 3.1", desc: "Text → Video" },
      veoR2v: { name: "Veo 3.1 R2V", desc: "Ảnh → Video" },
      veoFast: { name: "Veo 3.1 - Fast", desc: "Cân bằng tốc độ và chất lượng" },
      veoQuality: { name: "Veo 3.1 - Quality", desc: "Chất lượng cao nhất, chậm hơn" },
      veoLite: { name: "Veo 3.1 - Lite", desc: "Nhanh, tiết kiệm" },
      veoFastLp: { name: "Veo 3.1 - Fast [Lower Priority]", desc: "Tiết kiệm quota, chậm hơn 1 chút" },
      veoLiteLp: { name: "Veo 3.1 - Lite [Lower Priority]", desc: "Tiết kiệm quota tối đa" },
      // Gemini SDK (Edit tab)
      flashName: "Gemini 2.5 Flash Image",
      flashDesc: "Nhanh hơn, tiết kiệm lượt dùng",
      proName: "Gemini 3 Pro Image",
      proDesc: "Chất lượng cao hơn, tốn 3 lượt"
    },
    aspect: {
      label: "Tỷ lệ",
      square: "Vuông 1:1",
      landscape: "Ngang 16:9",
      portrait: "Dọc 9:16",
      landscape43: "Ngang 4:3",
      portrait34: "Dọc 3:4"
    },
    count: {
      label: "Số ảnh"
    },
    refImage: {
      label: "Ảnh tham chiếu",
      optional: "Tùy chọn",
      required: "Bắt buộc",
      upload: "Thêm ảnh tham chiếu",
      replace: "Thay ảnh khác",
      clear: "Xóa ảnh",
      hint: "Kéo thả hoặc bấm để chọn file",
      full: "Đã đạt giới hạn ảnh",
      notAllowed: "Chế độ này không nhận ảnh tham chiếu",
      startFrame: "Frame bắt đầu",
      endFrame: "Frame kết thúc"
    },
    video: {
      modeT2v: "Text → Video",
      modeR2v: "Ảnh → Video",
      waitingTitle: "Đang tạo video...",
      waitingMsg: "Có thể mất 1-3 phút. Vui lòng không đóng tab.",
      subtype: {
        standard: "Chuẩn",
        frames: "Frames",
        ingredients: "Thành phần"
      },
      framesHint: "Frames mode: ảnh 1 = frame bắt đầu (bắt buộc), ảnh 2 = frame kết thúc (tùy chọn).",
      lpWatermark: "Lưu ý: model Lower Priority sẽ tạo video có watermark."
    },
    progress: {
      starting: "Đang khởi động...",
    },
    credits: {
      note: "Mỗi lần tạo dùng 0 tín dụng",
    },
    log: {
      uploadingRef: "Đang tải {n} ảnh tham chiếu lên...",
      uploadingRefN: "Đang tải ảnh tham chiếu {i}/{n}...",
      refUploaded: "Đã tải ảnh lên xong.",
      pastingRef: "Đang gắn ảnh tham chiếu {i}/{n} vào model...",
      cancelling: "Đang hủy...",
      sendingRequest: "Đang gửi yêu cầu tạo ảnh...",
      generating: "Đang xử lý: {pct}%",
      retrying: "Flow từ chối kết quả ({error}). Đang thử lại {attempt}/{total}...",
      done: "Hoàn tất!",
      failed: "Lỗi khi tạo ảnh.",
    },
    save: {
      cta: "Lưu vào thư viện",
      saving: "Đang lưu...",
      saved: "Đã lưu",
      failed: "Lưu thất bại"
    },
    usage: {
      imageRemaining: "Còn {{remaining}}/{{limit}} lượt ảnh hôm nay",
      videoRemaining: "Còn {{remaining}}/{{limit}} lượt video hôm nay",
      unlimited: "Không giới hạn (admin/mod)",
      imageLimitReached: "Bạn đã dùng hết {{limit}} lượt ảnh hôm nay.",
      videoLimitReached: "Bạn đã dùng hết {{limit}} lượt video hôm nay.",
      cooldownMsg: "Quay lại vào ngày mai!"
    },
    mask: {
      comingSoon: "Sắp có"
    },
    error: {
      noServer: "Không có flow server khả dụng. Liên hệ admin.",
      agentFailed: "Flow agent đang gặp sự cố. Thử lại sau.",
      r2vNeedImage: "Chế độ Ảnh → Video cần ảnh tham chiếu.",
      framesNeedStart: "Chế độ Frames cần ít nhất 1 ảnh (Frame bắt đầu).",
      downloadFailed: "Không tải được file"
    },
    history: {
      title: "Lịch sử",
      subtitle: "Ảnh và video bạn đã tạo gần đây. File hết hạn sau 48 giờ nếu chưa lưu.",
      filter: { all: "Tất cả", image: "Ảnh", video: "Video" },
      refresh: "Làm mới",
      loading: "Đang tải...",
      empty: "Chưa có lượt tạo nào.",
      preview: "Xem",
      openPreview: "Mở xem trước",
      id: "ID",
      project: "Project",
      expires: "Hết hạn",
      expired: "Đã hết hạn",
      expiresInHours: "còn {n}h",
      expiresInDays: "còn {n}d"
    }
  }
};
