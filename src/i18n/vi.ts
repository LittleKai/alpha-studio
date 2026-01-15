export default {
  app: {
    title: "Alpha Studio AI",
    history: "Lịch sử sáng tạo",
    back: "Quay lại",
    backToHome: "Thoát Studio",
    workspace: "Phòng Lab",
    chooseAnotherEffect: "Đổi công cụ",
    generateImage: "Bắt đầu tạo (Generate)",
    generating: "AI đang Render...",
    result: "Tác phẩm hoàn thiện",
    yourImageWillAppear: "Kết quả Render sẽ xuất hiện tại đây.",
    aspectRatio: "Tỷ lệ khung hình",
    chooseYourShot: "Chọn Source ảnh",
    regenerate: "Tạo phương án khác",
    createVideo: "Dựng Video AI",
    error: {
      title: "Thông báo lỗi",
      uploadAndSelect: "Vui lòng tải ảnh và chọn tính năng.",
      uploadOne: "Bạn chưa tải ảnh lên.",
      uploadBoth: "Vui lòng tải đủ 2 ảnh (Gốc & Tham chiếu).",
      fillAllFields: "Vui lòng nhập đầy đủ thông tin yêu cầu.",
      enterPrompt: "Vui lòng nhập Prompt mô tả ý tưởng.",
      unknown: "Máy chủ đang bận, vui lòng thử lại sau.",
      useAsInputFailed: "Lỗi khi chuyển ảnh vào Lab.",
      selectOneToAnimate: "Chọn ảnh để tạo chuyển động.",
      storyboardInputs: "Cần đủ bối cảnh, nhân vật và phong cách.",
    },
    loading: {
      default: "Alpha AI đang phân tích dữ liệu...",
      wait: "Đang huy động tài nguyên GPU Cloud...",
      step1: "Đang xử lý bước 1: Tạo bản thảo...",
      step2: "Đang xử lý bước 2: Hoàn thiện chi tiết..."
    },
    theme: {
      switchToLight: "Chế độ sáng",
      switchToDark: "Chế độ tối"
    }
  },
  history: {
    title: "Nhật ký sáng tạo",
    empty: "Bạn chưa có tác phẩm nào trong phiên này.",
    use: "Sử dụng",
    save: "Lưu máy",
    lineArt: "Bản vẽ nét",
    finalResult: "Kết quả cuối"
  },
  imageEditor: {
    upload: "Tải ảnh",
    dragAndDrop: "hoặc thả ảnh vào đây",
    drawMask: "Vẽ vùng chọn (Mask)",
    brushSize: "Cỡ cọ",
    undo: "Hoàn tác",
    clearMask: "Xóa vùng chọn",
    maskPanelInfo: "Tô màu lên vùng bạn muốn AI thay đổi (Inpainting)."
  },
  resultDisplay: {
    actions: {
      download: "Tải xuống",
      useAsInput: "Chỉnh sửa tiếp",
      savedToWorkflow: "Đã lưu vào Alpha Connect!"
    }
  },
  transformations: {
    effects: {
      storyboard: {
        title: "Kịch bản (Storyboard)",
        description: "Phối hợp bối cảnh, nhân vật và phong cách để tạo Storyboard sự kiện chuyên nghiệp.",
        customPromptLabel: "Mô tả kịch bản phân cảnh (Prompt)",
        customPromptPlaceholder: "Ví dụ: MC bước ra từ màn hình LED giữa làn khói ảo ảnh...",
        backgroundUploaderTitle: "Ảnh bối cảnh",
        backgroundUploaderDescription: "Không gian sân khấu/sảnh",
        characterUploaderTitle: "Ảnh nhân sự",
        characterUploaderDescription: "Diễn viên hoặc Props (Tối đa 3)",
        referenceUploaderTitle: "Ảnh phong cách (Style)",
        referenceUploaderDescription: "Tham chiếu màu sắc & mood"
      },
      boothExtraction: {
        title: "Bóc tách Module",
        description: "Tự động tách các thành phần thi công (Backdrop, Standee, Quầy kệ) sang dạng sprite phẳng.",
        customPromptLabel: "Ghi chú kỹ thuật",
        customPromptPlaceholder: "Ví dụ: Chỉ bóc tách phần khung sắt và màn hình LED..."
      },
      zoomObject: {
        title: "Thu phóng 3D",
        description: "Thay đổi kích thước vật thể và tự động bù đắp không gian xung quanh (Outpainting).",
        zoomLabel: "Tỷ lệ thu phóng",
        customPromptLabel: "Yêu cầu bối cảnh",
        customPromptPlaceholder: "Mô tả thêm về môi trường xung quanh khi thu nhỏ..."
      },
      stageEffect: {
        title: "VFX Sân khấu",
        description: "Thêm hiệu ứng ánh sáng, pháo hoa, laser hoặc khói vào vùng chọn trên sân khấu.",
        customPromptLabel: "Mô tả hiệu ứng VFX",
        customPromptPlaceholder: "Ví dụ: Chùm laser xanh lá quét từ trên xuống...",
        uploader1Title: "Sân khấu gốc",
        uploader1Desc: "Ảnh sân khấu cần thêm hiệu ứng",
        uploader2Title: "Mẫu hiệu ứng",
        uploader2Desc: "Ảnh có hiệu ứng bạn muốn học tập"
      },
      eventPerformance: {
        title: "Nhân sự biểu diễn",
        description: "Ghép ca sĩ, nhóm múa hoặc PG vào bối cảnh với tỷ lệ cơ thể chuẩn xác.",
        customPromptLabel: "Chi tiết màn trình diễn",
        customPromptPlaceholder: "Ví dụ: Nhóm múa 5 người mặc trang phục truyền thống...",
        uploader1Title: "Ảnh bối cảnh",
        uploader1Desc: "Sân khấu hoặc khu vực trống",
        uploader2Title: "Ảnh nhân sự",
        uploader2Desc: "Người cần ghép vào"
      },
      productMockup: {
        title: "Phối cảnh sản phẩm",
        description: "Đặt sản phẩm hoặc logo vào không gian thực tế với ánh sáng và bóng đổ tự nhiên.",
        customPromptLabel: "Yêu cầu Mockup",
        customPromptPlaceholder: "Mô tả góc đặt và chất liệu bề mặt...",
        sizeLabel: "Kích thước sản phẩm",
        uploader1Title: "Ảnh môi trường",
        uploader1Desc: "Showroom, sảnh hoặc kệ trưng bày",
        uploader2Title: "Ảnh thiết kế",
        uploader2Desc: "File sản phẩm hoặc Logo"
      },
      eventDesign3d: {
        title: "Dựng phối cảnh 3D",
        description: "Chuyển đổi phác thảo ý tưởng thành hình ảnh render 3D chân thực.",
        customPromptLabel: "Mô tả chất liệu",
        customPromptPlaceholder: "Ví dụ: Bề mặt gương kính, ánh sáng neon tím chủ đạo..."
      },
      roomEmpty: {
        title: "Dọn mặt bằng (Clean)",
        description: "Xóa bỏ vật dụng cũ, rác hoặc người để lấy mặt bằng trống sạch sẽ.",
        customPromptLabel: "Đối tượng xóa",
        customPromptPlaceholder: "Ví dụ: Xóa toàn bộ bàn ghế cũ, giữ lại thảm sàn..."
      },
      cameraAngle: {
        title: "Góc quay Camera",
        description: "Thay đổi góc nhìn của ảnh sang các góc chụp tiêu chuẩn (Top-down, Profile, Front).",
        customPromptLabel: "Mô tả góc nhìn",
        customPromptPlaceholder: "Ví dụ: Góc nhìn từ dưới lên tạo vẻ hùng vĩ...",
        referenceUploaderTitle: "Ảnh góc mẫu",
        referenceUploaderDescription: "Gợi ý tư thế camera cho AI",
        presets: {
          frontView: "Góc trực diện",
          backView: "Góc phía sau",
          topDownView: "Góc từ trên cao",
          leftSideView: "Cạnh bên trái",
          rightSideView: "Cạnh bên phải"
        }
      },
      figurine: {
        title: "Chế tác Figurine",
        description: "Biến nhân vật hoặc mascot thành mô hình đồ chơi đặt trong hộp (Toy Box)."
      },
      wireframe: {
        title: "Lưới Wireframe",
        description: "Chuyển đổi vật thể thành mô hình lưới mesh kỹ thuật 3D.",
        thicknessLabel: "Độ dày nét lưới"
      },
      vectorFrom3d: {
        title: "Vector hóa (2D)",
        description: "Chuyển ảnh render 3D phức tạp thành minh họa phẳng chuẩn Vector.",
        uploader1Title: "Ảnh 3D gốc",
        uploader1Desc: "Vật thể cần chuyển đổi",
        uploader2Title: "Phong cách mẫu",
        uploader2Desc: "Kiểu nét vẽ Vector bạn thích"
      },
      pose: {
        title: "Chỉnh dáng (Pose)",
        description: "Áp dụng tư thế đứng/ngồi từ ảnh mẫu vào nhân vật mục tiêu.",
        uploader1Title: "Nhân vật gốc",
        uploader1Desc: "Người cần thay đổi tư thế",
        uploader2Title: "Dáng mẫu",
        uploader2Desc: "Tư thế muốn bắt chước"
      },
      expressionReference: {
        title: "Biểu cảm khuôn mặt",
        description: "Thay đổi cảm xúc (vui, buồn, ngầu) dựa trên gương mặt tham chiếu.",
        uploader1Title: "Ảnh gốc",
        uploader1Desc: "Người cần chỉnh biểu cảm",
        uploader2Title: "Cảm xúc mẫu",
        uploader2Desc: "Gương mặt có biểu cảm mong muốn"
      },
      lineArt: {
        title: "Nét vẽ (Line Art)",
        description: "Chuyển ảnh thành bản vẽ nét thanh mảnh, chuyên nghiệp."
      },
      colorPalette: {
        title: "Phối màu tự động",
        description: "Tô màu cho bản vẽ nét dựa trên bảng màu của một ảnh khác.",
        uploader1Title: "Bản vẽ nét",
        uploader1Desc: "Ảnh nét đen trắng",
        uploader2Title: "Mẫu màu",
        uploader2Desc: "Ảnh có bộ màu sắc bạn thích"
      },
      plushie: {
        title: "Thú bông (Plushie)",
        description: "Biến mọi vật thể hoặc người thành búp bê nhồi bông cực kỳ dễ thương."
      },
      twoDToThreeD: {
        title: "Tạo khối 3D",
        description: "Nổi khối 3D cho logo hoặc tranh vẽ 2D bằng chất liệu thực tế.",
        uploader1Title: "Ảnh 2D phẳng",
        uploader1Desc: "Logo hoặc hình vẽ",
        uploader2Title: "Chất liệu mẫu",
        uploader2Desc: "Bề mặt (Kim loại, Nhựa, Da...)"
      },
      paintingProcess: {
        title: "Quy trình thiết kế",
        description: "Tạo chuỗi 4 bước từ phác thảo đến hoàn thiện tác phẩm."
      }
    }
  },
  server: {
    connectTitle: "AI Server Cloud",
    connectSubtitle: "Kết nối với máy chủ GPU hiệu suất cao để chạy các phần mềm AI nặng.",
    btnConnect: "Bắt đầu phiên làm việc",
    statusOnline: "Trực tuyến",
    statusBusy: "Đang bận",
    syncSuccess: "Đã đồng bộ file về Alpha Connect thành công!",
    billing: {
      balance: "Số dư ví",
      costPerHour: "Coin / giờ",
      topUp: "Nạp Coin",
      insufficient: "Số dư không đủ. Vui lòng nạp thêm!",
      confirm: "Xác nhận thuê"
    }
  },
  workflow: {
    title: "Alpha Connect",
    subtitle: "Trung tâm quản lý tài liệu tập trung",
    login: {
      title: "Đăng nhập nhân sự",
      email: "Mã nhân viên / Email",
      password: "Mã bảo mật",
      btn: "Truy cập Alpha Connect",
      hint: "Nhập thông tin bất kỳ để trải nghiệm"
    },
    dashboard: {
      upload: "Tải lên file",
      createProject: "Tạo Dự Án",
      create: "Studio AI",
      search: "Tìm tài liệu...",
      filter: "Lọc phòng ban",
      noFiles: "Chưa có tài liệu.",
      table: {
        name: "Tên tài liệu / Dự án",
        dept: "Phòng ban",
        date: "Ngày tạo",
        status: "Trạng thái",
        action: "Thao tác"
      },
      status: {
        pending: "Chờ",
        approved: "Xong",
        rejected: "Lỗi"
      },
      project: {
        modalTitle: "Khởi tạo Dự Án Mới",
        nameLabel: "Tên Dự Án",
        deptLabel: "Phụ trách chính",
        descLabel: "Mô tả yêu cầu",
        createBtn: "Tạo Dự Án Ngay",
        success: "Dự án mới đã được khởi tạo thành công!",
        hubTitle: "Project Hub",
        management: "Quản lý Dự án",
        tabs: {
          overview: "Tổng quan",
          team: "Nhân sự & Vai trò",
          files: "Tài liệu & Files",
          finance: "Tài chính (Coins)",
          chat: "Thảo luận",
          tasks: "Nhiệm vụ"
        },
        finance: {
          budget: "Ngân sách Coin",
          expenses: "Đã chi tiêu",
          remaining: "Còn lại",
          addExpense: "Thêm khoản chi",
          expenseName: "Tên khoản chi",
          amount: "Số Coins",
          date: "Ngày chi",
          profit: "Số dư Coins dự kiến"
        },
        package: {
          btn: "Đóng gói & Bàn giao",
          confirm: "Xác nhận đóng gói dự án?",
          desc: "Dự án sẽ chuyển sang trạng thái 'Hoàn thành'. Toàn bộ file sẽ được lưu trữ và báo cáo tài chính sẽ được chốt.",
          success: "Dự án đã được đóng gói thành công!"
        },
        chat: {
          placeholder: "Nhập tin nhắn...",
          send: "Gửi"
        },
        tasks: {
          title: "Danh sách công việc",
          addTask: "Thêm nhiệm vụ",
          noTasks: "Chưa có nhiệm vụ nào.",
          status: {
            todo: "Cần làm",
            in_progress: "Đang làm",
            done: "Hoàn thành"
          },
          modal: {
            title: "Giao việc mới",
            titleLabel: "Tên công việc",
            assigneeLabel: "Người thực hiện",
            dueDateLabel: "Hạn chót",
            fileLabel: "File đính kèm (Tùy chọn)",
            submit: "Giao việc"
          },
          assigned: "Đã giao việc"
        }
      }
    },
    depts: {
      all: "Tất cả tài liệu",
      event_planner: "Event Planner",
      creative: "Team Creative",
      operation: "Team Operation"
    },
    jobs: {
      title: "Sàn việc làm Freelancer",
      subtitle: "Nhận dự án thực tế từ đối tác của Alpha",
      apply: "Ứng tuyển ngay",
      budget: "Ngân sách",
      posted: "Đăng ngày",
      deadline: "Hạn chót",
      applicants: "người ứng tuyển"
    },
    wallet: {
      title: "Ví Credit",
      balance: "Số dư hiện tại",
      buy: "Nạp Credit",
      withdraw: "Quy đổi tiền mặt",
      withdrawDesc: "Quy đổi Coin thành tiền mặt khi đạt trên 1000 Coin.",
      withdrawBtn: "Yêu cầu rút tiền",
      withdrawMin: "Cần tối thiểu 1000 Coin",
      history: "Lịch sử giao dịch",
      packages: {
        starter: "Gói Cơ Bản",
        pro: "Gói Chuyên Nghiệp",
        biz: "Gói Doanh Nghiệp"
      },
      benefits: {
        server: "Thuê máy chủ GPU",
        course: "Học Online nâng cao",
        job: "Nhận Job Freelance"
      },
      popular: "Phổ biến nhất",
      success: "Nạp thành công!",
      withdrawSuccess: "Yêu cầu rút tiền đã được gửi!"
    },
    partners: {
      title: "Đối tác liên kết",
      subtitle: "Mạng lưới Agency & Supplier uy tín",
      register: "Đăng ký đối tác",
      tabs: {
        agency: "Agency Sự kiện",
        supplier: "Nhà cung cấp (Supplier)"
      },
      contact: "Liên hệ",
      website: "Website",
      verified: "Đã xác thực",
      form: {
        title: "Đăng ký tham gia mạng lưới",
        companyName: "Tên công ty / Đơn vị",
        type: "Loại hình",
        location: "Khu vực (Tỉnh/TP)",
        phone: "Hotline",
        email: "Email liên hệ",
        website: "Website / Portfolio URL",
        desc: "Giới thiệu năng lực",
        submit: "Gửi đăng ký",
        success: "Gửi đăng ký thành công! Alpha sẽ liên hệ sớm."
      },
      details: {
        about: "Giới thiệu chung",
        services: "Dịch vụ & Thế mạnh",
        projects: "Dự án tiêu biểu",
        connect: "Liên hệ hợp tác"
      }
    },
    profile: {
      title: "Hồ sơ học viên",
      edit: "Chỉnh sửa",
      save: "Lưu thay đổi",
      cancel: "Hủy",
      name: "Họ và tên",
      role: "Vị trí / Chức danh",
      bio: "Giới thiệu bản thân",
      skills: "Kỹ năng (ngăn cách bằng dấu phẩy)",
      portfolio: "Portfolio Link",
      contact: "Thông tin liên hệ",
      gallery: "Tác phẩm tiêu biểu",
      hire: "Tuyển dụng"
    },
    automation: {
      title: "Tự động hóa (Automation)",
      create: "Tạo quy trình mới",
      active: "Đang bật",
      inactive: "Đã tắt",
      triggers: {
        file_upload: "Khi có file mới được tải lên",
        status_approved: "Khi tài liệu được duyệt (Approved)",
        status_rejected: "Khi tài liệu bị từ chối (Rejected)"
      },
      actions: {
        send_email: "Gửi Email thông báo",
        send_telegram: "Gửi tin nhắn Telegram",
        send_whatsapp: "Gửi tin nhắn WhatsApp"
      },
      targetPlaceholder: "Nhập Email hoặc ID nhóm chat...",
      lastRun: "Chạy lần cuối"
    },
    affiliate: {
      title: "Tiếp thị liên kết (Affiliate)",
      subtitle: "Giới thiệu bạn bè, nhận Credit không giới hạn",
      totalEarned: "Tổng thu nhập",
      pending: "Đang chờ duyệt",
      referrals: "Lượt giới thiệu",
      clicks: "Lượt click",
      copyLink: "Sao chép Link",
      copied: "Đã chép!",
      commission: "Hoa hồng",
      program: "Chương trình",
      history: "Lịch sử giới thiệu"
    },
    creative: {
      title: "Kho dữ liệu sáng tạo",
      subtitle: "Chia sẻ Prompt & Workflow chuyên sâu ngành sự kiện. Nhận 100 Coin mỗi đóng góp!",
      create: "Đóng góp dữ liệu",
      prompts: "Prompts mẫu",
      workflows: "Quy trình (Workflow)",
      form: {
        title: "Tạo dữ liệu mới",
        assetTitle: "Tiêu đề Prompt/Workflow",
        type: "Loại dữ liệu",
        content: "Nội dung chi tiết (Prompt Text hoặc Node JSON)",
        tags: "Tags (ví dụ: stage, lighting, futuristic)",
        submit: "Gửi & Nhận 100 Coin"
      },
      success: "Đã gửi thành công! Bạn nhận được 100 Coin."
    },
    resources: {
      title: "Kho Tài Nguyên",
      subtitle: "Chia sẻ file thiết kế, dự án và dữ liệu chuyên ngành. Nhận 300 Coin mỗi đóng góp!",
      upload: "Chia sẻ tài nguyên",
      types: {
        project_file: "File Dự Án (SketchUp, Blender)",
        design_asset: "Tài nguyên Thiết kế (PSD, AI)",
        industry_data: "Dữ liệu Ngành (Data, Excel)",
        template: "Mẫu (Template)"
      },
      form: {
        title: "Upload tài nguyên mới",
        name: "Tên tài nguyên",
        type: "Loại tài nguyên",
        desc: "Mô tả chi tiết",
        format: "Định dạng file",
        submit: "Upload & Nhận 300 Coin"
      },
      success: "Upload thành công! Bạn đã nhận được 300 Coin."
    },
    collaboration: {
      title: "Giao tiếp dự án",
      team: "Thành viên tham gia",
      addMember: "Thêm thành viên",
      removeMember: "Xóa khỏi dự án",
      chat: "Trao đổi",
      placeholder: "Nhập tin nhắn...",
      send: "Gửi",
      noMembers: "Chưa có thành viên nào.",
      joined: "đã tham gia dự án.",
      removed: "đã rời dự án.",
      feeNotice: "Bạn đang thêm thành viên ngoài hệ thống. Phí kết nối là 50 Credit. Bạn có muốn tiếp tục?",
      freeNotice: "Thêm thành viên học viên Alpha (Miễn phí).",
      insufficient: "Số dư không đủ để thêm thành viên ngoài (Cần 50 Credit)."
    }
  },
  landing: {
    nav: {
      features: "Học viện AI",
      showcase: "Thư viện",
      utilities: "Công cụ",
      connect: "Kết nối",
      about: "Giới thiệu",
    },
    cta: {
      launch: "Mở Studio",
      startCreating: "Đăng ký học",
      learnMore: "Xem lộ trình"
    },
    hero: {
      title1: "Đào tạo AI cho",
      title2: "Ngành Sự Kiện",
      subtitle: "Hệ sinh thái toàn diện dành cho Event Designer & Planner. Kết hợp đào tạo, công cụ AI và tài nguyên GPU Cloud.",
    },
    features: {
      title: "Lộ trình học tập",
      subtitle: "Chọn chuyên ngành phù hợp và bắt đầu hành trình của bạn.",
      tryNow: "Mở công cụ",
    },
    course: {
      intro: "Giới thiệu",
      syllabus: "Nội dung",
      overview: "Tổng quan",
      whatYouLearn: "Bạn sẽ học được gì",
      point1: "Làm chủ công cụ AI tạo sinh mới nhất",
      point2: "Ứng dụng AI vào quy trình sản xuất thực tế",
      point3: "Tối ưu 80% thời gian thiết kế concept",
      startLearning: "Vào học trực tuyến",
      enrollNow: "Đăng ký khóa học",
      minPerLesson: "phút/bài",
      lessons: "bài học",
      progress: "Tiến độ",
      continue: "Học tiếp",
      viewCourse: "Chi tiết",
      hours: "giờ",
      duration: "Thời lượng",
      level: "Trình độ",
      beginner: "Cơ bản"
    },
    showcase: {
      title: "Gương mặt tiêu biểu",
      subtitle: "Cộng đồng học viên xuất sắc và cơ hội nghề nghiệp.",
      pro: "Học viên Pro",
      hired: "Đã được tuyển",
      cta: "Trở thành Pro Member"
    },
    partners: {
      title: "Mạng lưới đối tác",
      subtitle: "Hợp tác với các Agency và Nhà cung cấp hàng đầu.",
      join: "Đăng ký đối tác"
    }
  }
};
