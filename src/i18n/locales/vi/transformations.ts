export default {
  transformations: {
    effects: {
      storyboard: {
        title: "Storyboard",
        description: "Kết hợp bối cảnh, nhân vật và phong cách để tạo cảnh hoàn chỉnh.",
        customPromptLabel: "Mô tả cảnh (Prompt)",
        customPromptPlaceholder: "Ví dụ: Tiệc gala sang trọng trên bãi biển...",
        backgroundUploaderTitle: "Ảnh nền",
        backgroundUploaderDescription: "Sân khấu hoặc không gian",
        characterUploaderTitle: "Ảnh nhân vật",
        characterUploaderDescription: "Diễn viên hoặc Props (Tối đa 3)",
        referenceUploaderTitle: "Tham chiếu phong cách",
        referenceUploaderDescription: "Tham chiếu màu sắc & không khí"
      },
      boothExtraction: {
        title: "Trích xuất Booth",
        description: "Tự động trích xuất các module cấu trúc (Backdrop, Standee, Counter) thành sprite phẳng.",
        customPromptLabel: "Ghi chú kỹ thuật",
        customPromptPlaceholder: "Ví dụ: Chỉ trích xuất khung sắt và màn LED..."
      },
      zoomObject: {
        title: "Zoom 3D",
        description: "Thay đổi kích thước đối tượng và tự động điền không gian xung quanh (Outpainting).",
        zoomLabel: "Mức Zoom",
        customPromptLabel: "Yêu cầu bối cảnh",
        customPromptPlaceholder: "Mô tả môi trường khi zoom ra..."
      },
      stageEffect: {
        title: "VFX Sân khấu",
        description: "Thêm hiệu ứng ánh sáng, pháo hoa, laser hoặc khói vào vùng sân khấu cụ thể.",
        customPromptLabel: "Mô tả VFX",
        customPromptPlaceholder: "Ví dụ: Laser xanh quét từ trên xuống...",
        uploader1Title: "Sân khấu gốc",
        uploader1Desc: "Sân khấu cần thêm hiệu ứng",
        uploader2Title: "Mẫu hiệu ứng",
        uploader2Desc: "Tham chiếu cho ánh sáng/pháo hoa"
      },
      eventPerformance: {
        title: "Biểu diễn sự kiện",
        description: "Ghép ca sĩ, nhóm nhảy hoặc PG vào cảnh với tỷ lệ cơ thể đúng.",
        customPromptLabel: "Chi tiết biểu diễn",
        customPromptPlaceholder: "Ví dụ: Nhóm nhảy 5 người mặc trang phục truyền thống...",
        uploader1Title: "Ảnh nền",
        uploader1Desc: "Sân khấu hoặc vùng trống",
        uploader2Title: "Ảnh nhân sự",
        uploader2Desc: "Người cần ghép"
      },
      productMockup: {
        title: "Mockup sản phẩm",
        description: "Đặt sản phẩm hoặc logo vào không gian thực với ánh sáng và bóng tự nhiên.",
        customPromptLabel: "Yêu cầu Mockup",
        customPromptPlaceholder: "Mô tả góc và chất liệu bề mặt...",
        sizeLabel: "Kích thước sản phẩm",
        uploader1Title: "Ảnh môi trường",
        uploader1Desc: "Showroom, sảnh hoặc kệ",
        uploader2Title: "Ảnh thiết kế",
        uploader2Desc: "File sản phẩm hoặc Logo"
      },
      eventDesign3d: {
        title: "Phối cảnh 3D",
        description: "Chuyển đổi bản phác thảo thành render 3D chân thực.",
        customPromptLabel: "Mô tả chất liệu",
        customPromptPlaceholder: "Ví dụ: Bề mặt kính, ánh sáng neon tím chủ đạo..."
      },
      roomEmpty: {
        title: "Dọn phòng",
        description: "Xóa nội thất cũ, rác hoặc người để có không gian trống sạch.",
        customPromptLabel: "Mục tiêu xóa",
        customPromptPlaceholder: "Ví dụ: Xóa tất cả bàn ghế cũ, giữ lại sàn..."
      },
      cameraAngle: {
        title: "Góc Camera",
        description: "Thay đổi góc nhìn ảnh sang các góc tiêu chuẩn (Từ trên, Ngang, Chính diện).",
        customPromptLabel: "Mô tả góc nhìn",
        customPromptPlaceholder: "Ví dụ: Góc thấp nhìn lên tạo vẻ hùng vĩ...",
        referenceUploaderTitle: "Tham chiếu góc",
        referenceUploaderDescription: "Gợi ý tư thế camera cho AI",
        presets: {
          frontView: "Chính diện",
          backView: "Phía sau",
          topDownView: "Từ trên xuống",
          leftSideView: "Bên trái",
          rightSideView: "Bên phải"
        }
      },
      figurine: {
        title: "Làm Figurine",
        description: "Biến nhân vật hoặc mascot thành mô hình đồ chơi trong hộp."
      },
      wireframe: {
        title: "Lưới Wireframe",
        description: "Chuyển đổi đối tượng thành mô hình lưới 3D kỹ thuật.",
        thicknessLabel: "Độ dày nét"
      },
      vectorFrom3d: {
        title: "Vector hóa (2D)",
        description: "Chuyển đổi render 3D phức tạp thành minh họa Vector phẳng.",
        uploader1Title: "Ảnh 3D gốc",
        uploader1Desc: "Đối tượng cần chuyển đổi",
        uploader2Title: "Mẫu phong cách",
        uploader2Desc: "Phong cách Vector mong muốn"
      },
      pose: {
        title: "Khớp tư thế",
        description: "Áp dụng tư thế từ ảnh tham chiếu vào nhân vật mục tiêu.",
        uploader1Title: "Nhân vật gốc",
        uploader1Desc: "Người cần thay đổi tư thế",
        uploader2Title: "Tham chiếu tư thế",
        uploader2Desc: "Tư thế mong muốn bắt chước"
      },
      expressionReference: {
        title: "Biểu cảm khuôn mặt",
        description: "Thay đổi cảm xúc (vui, buồn, ngầu) dựa trên khuôn mặt tham chiếu.",
        uploader1Title: "Ảnh gốc",
        uploader1Desc: "Người cần thay đổi biểu cảm",
        uploader2Title: "Tham chiếu cảm xúc",
        uploader2Desc: "Khuôn mặt với biểu cảm mong muốn"
      },
      lineArt: {
        title: "Nét vẽ",
        description: "Chuyển đổi ảnh thành bản vẽ nét chuyên nghiệp, sạch sẽ."
      },
      colorPalette: {
        title: "Tô màu tự động",
        description: "Tô màu cho bản vẽ nét dựa trên bảng màu của ảnh khác.",
        uploader1Title: "Bản vẽ nét",
        uploader1Desc: "Bản phác thảo đen trắng",
        uploader2Title: "Mẫu màu",
        uploader2Desc: "Ảnh có màu sắc mong muốn"
      },
      plushie: {
        title: "Làm thú bông",
        description: "Biến bất kỳ đối tượng hoặc người nào thành thú bông mềm dễ thương."
      },
      twoDToThreeD: {
        title: "2D sang 3D",
        description: "Tạo độ sâu 3D cho logo hoặc bản vẽ 2D với chất liệu chân thực.",
        uploader1Title: "Ảnh 2D phẳng",
        uploader1Desc: "Logo hoặc bản vẽ",
        uploader2Title: "Tham chiếu chất liệu",
        uploader2Desc: "Bề mặt (Kim loại, Nhựa, Da...)"
      },
      paintingProcess: {
        title: "Quy trình thiết kế",
        description: "Tạo chuỗi 4 bước từ phác thảo đến tác phẩm hoàn chỉnh."
      }
    }
  }
};
