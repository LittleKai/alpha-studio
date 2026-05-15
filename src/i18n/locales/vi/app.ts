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
    downloadHQ: {
      menuLabel: "Chọn chất lượng",
      processing: "Đang tải chất lượng cao…",
      confirmCostTitle: "Xác nhận tốn credit",
      confirmCostBody: "Tải {{quality}} {{type}} sẽ tốn {{cost}} credit. Tiếp tục?",
      successInfo: "Đã tải {{quality}}",
      labelImage1k: "1K (mặc định, nhanh)",
      labelImage2k: "2K (~30s)",
      labelImage4k: "4K (5 credit, ~60s)",
      labelVideo270p: "270p (animated GIF)",
      labelVideo720p: "720p (mặc định, nhanh)",
      labelVideo1080p: "1080p (~60s)",
      labelVideo4k: "4K (50 credit, ~2 phút)",
      insufficientBalance: "Số dư không đủ ({{balance}}/{{cost}} credit)",
    },
    useAsInput: "Dùng làm đầu vào",
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
    hub: {
      title: "Bộ công cụ AI Studio",
      subtitle: "Chọn công cụ bạn muốn dùng",
      open: "Mở",
      backToStudio: "Quay lại Studio",
      cards: {
        generate: {
          title: "Tạo ảnh & video",
          desc: "Sinh ảnh và video bằng Google Nano Banana và Veo"
        },
        edit: {
          title: "Chỉnh sửa ảnh",
          desc: "Biến đổi, ghép, vẽ mặt nạ và remix ảnh bằng Gemini"
        },
        vocab: {
          title: "VocabFlip",
          desc: "Học từ vựng bằng flashcard tích hợp"
        },
        interior: {
          title: "Thiết kế nội thất",
          desc: "Công cụ vẽ tủ & nội thất tương tác"
        }
      }
    },
    // ─── Edit tab (Gemini) ──────────────────────────────────────────
    interior: {
      title: "Thiết kế nội thất AI",
      subtitle: "Chat AI, lưu model, quản lý phiên bản và khôi phục",
      loginTitle: "Đăng nhập để dùng Thiết kế nội thất AI",
      loginDesc: "Dự án, lịch sử chat, ảnh tham chiếu và phiên bản model sẽ được lưu vào tài khoản của bạn.",
      signIn: "Đăng nhập",
      tabs: { projects: "Dự án", preview: "Bản vẽ", chat: "Chat" },
      balance: "Số dư",
      unlimited: "Không giới hạn",
      newProject: "Dự án mới",
      newProjectName: "Dự án nội thất mới",
      projects: "Dự án",
      noProjects: "Chưa có dự án nội thất.",
      noProjectSelected: "Chưa chọn dự án",
      emptyState: "Tạo dự án để bắt đầu thiết kế bằng AI.",
      createFirst: "Hãy tạo hoặc chọn một dự án trước.",
      loading: "Đang tải...",
      chat: "Chat AI",
      creditNote: "Mỗi lần gọi AI tốn 1 credit.",
      creditNote2Step: "Đang bật xác nhận 2 bước: mỗi yêu cầu tốn 2 credit (1 phân tích + 1 áp dụng).",
      creditNoteFirstMessage: "Yêu cầu đầu tiên của dự án sẽ tự động dùng 2 bước (2 credit). Các lần sau chỉ 1 credit nếu bạn không bật xác nhận trong cài đặt.",
      twoStep: {
        label: "Xác nhận trước khi áp dụng",
        desc: "AI phân tích ảnh và đề xuất trước, bạn xem rồi mới bấm áp dụng. Tốn thêm 1 credit/lần."
      },
      settings: {
        title: "Cài đặt Interior AI",
        close: "Đóng",
        lockedDuringProposal: "Đang có đề xuất chờ xác nhận — không thể đổi cài đặt cho đến khi áp dụng hoặc hủy."
      },
      proposal: {
        title: "Đề xuất từ AI",
        applyHint: "Đọc kỹ trước khi áp dụng. Bấm áp dụng để AI sinh model JSON (+1 credit).",
        apply: "Áp dụng (+1 credit)",
        cancel: "Hủy / Sửa prompt",
        pendingBanner: "Đang chờ bạn xác nhận đề xuất trong dialog...",
        observation: "Quan sát ảnh",
        understanding: "Hiểu yêu cầu",
        proposedChanges: "Đề xuất thay đổi (chỉnh sửa nếu cần)",
        proposedChangesHint: "Mỗi dòng là một thay đổi. Bạn có thể thêm/xóa/chỉnh trước khi áp dụng.",
        questions: "Câu hỏi xác nhận",
        answerNotePlaceholder: "Bổ sung thêm (tuỳ chọn)...",
        generalNote: "Ghi chú thêm (tuỳ chọn)",
        generalNotePlaceholder: "Ví dụ: vật liệu ưa thích, ngân sách, hạn chế kỹ thuật..."
      },
      promptLabel: "Yêu cầu thiết kế",
      promptPlaceholder: "Mô tả tủ hoặc thay đổi nội thất bạn muốn...",
      refImage: "Thêm ảnh tham chiếu",
      refImageCount: "Đã chọn {n}/{max} ảnh — bấm để thêm",
      clearRef: "Xóa ảnh tham chiếu",
      restoredRef: "Ảnh khôi phục từ phiên bản trước",
      restoredBadge: "Cũ",
      pasteHint: "Mẹo: Ctrl+V để dán ảnh trực tiếp vào ô chat.",
      send: "Gửi AI",
      sendProposal: "Gửi AI phân tích",
      sending: "Đang xử lý...",
      modelLabel: "Model AI",
      modelDefault: "mặc định",
      tokens: "{n} tokens",
      versions: "Phiên bản",
      current: "Hiện tại",
      previewing: "Đang xem",
      backToCurrent: "Về bản hiện tại",
      rollback: "Khôi phục",
      rollbackTitle: "Khôi phục phiên bản",
      rollbackMessage: "Quay về {{version}}? Lịch sử chat sẽ giảm theo. Các phiên bản mới hơn vẫn được giữ cho đến khi bạn gửi yêu cầu mới (lúc đó sẽ bị xóa).",
      rollbackConfirm: "Khôi phục",
      delete: "Xóa",
      deleteTitle: "Xóa dự án",
      deleteMessage: "Xóa \"{{name}}\"?",
      deleteConfirm: "Xóa",
      errors: {
        loadFailed: "Không thể tải dự án nội thất.",
        createFailed: "Không thể tạo dự án.",
        deleteFailed: "Không thể xóa dự án.",
        sendFailed: "Không thể gửi yêu cầu.",
        rollbackFailed: "Không thể khôi phục phiên bản.",
        emptyPrompt: "Hãy nhập yêu cầu thiết kế trước.",
        noCredit: "Bạn cần ít nhất 1 credit để gọi AI."
      }
    },
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
      framesHint: "Frames mode: ảnh 1 = frame bắt đầu (bắt buộc), ảnh 2 = frame kết thúc (tùy chọn)."
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
      loginRequired: "Đăng nhập để xem lịch sử tạo của bạn.",
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
