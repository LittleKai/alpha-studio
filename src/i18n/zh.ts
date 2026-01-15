export default {
  app: {
    title: "Alpha Studio - AI 培训生态系统",
    history: "历史记录",
    back: "返回",
    backToHome: "退出工作区",
    workspace: "工作区",
    chooseAnotherEffect: "选择其他工具",
    generateImage: "生成图片",
    generating: "处理中...",
    result: "结果",
    yourImageWillAppear: "结果将显示在这里。",
    aspectRatio: "比例",
    chooseYourShot: "选择图片",
    regenerate: "重新生成",
    createVideo: "创建视频",
    error: {
      uploadAndSelect: "请上传图片并选择工具。",
      uploadOne: "需要上传图片。",
      uploadBoth: "需要上传两张图片。",
      fillAllFields: "请填写所有信息。",
      enterPrompt: "请输入描述。",
      unknown: "发生错误。",
      useAsInputFailed: "无法重新加载图片。",
      selectOneToAnimate: "选择要制作动画的图片。",
      storyboardInputs: "缺少背景或参考图。",
    },
    loading: {
      default: "AI 正在思考...",
      wait: "正在连接 GPU 云...",
      step1: "处理步骤 1：草稿...",
      step2: "处理步骤 2：最终确定..."
    },
    theme: {
      switchToLight: "亮色模式",
      switchToDark: "暗色模式"
    }
  },
  history: {
    title: "创作日志",
    empty: "本次会话没有创作记录。",
    use: "使用",
    save: "保存",
    lineArt: "线稿",
    finalResult: "最终结果"
  },
  imageEditor: {
    upload: "上传图片",
    dragAndDrop: "或拖放到此处",
    drawMask: "绘制遮罩 (Mask)",
    brushSize: "笔刷大小",
    undo: "撤销",
    clearMask: "清除遮罩",
    maskPanelInfo: "涂抹您希望 AI 修改的区域 (Inpainting)。"
  },
  resultDisplay: {
    actions: {
      download: "下载",
      useAsInput: "继续编辑",
      savedToWorkflow: "已保存到 Alpha Connect！"
    }
  },
  transformations: {
    effects: {
      storyboard: {
        title: "故事板 (Storyboard)",
        description: "结合背景、角色和风格来创建完整的场景。",
        customPromptLabel: "场景描述 (Prompt)",
        customPromptPlaceholder: "例如：海滩上的豪华晚宴...",
        backgroundUploaderTitle: "背景图片",
        backgroundUploaderDescription: "舞台或场地空间",
        characterUploaderTitle: "角色图片",
        characterUploaderDescription: "演员或道具 (最多 3 个)",
        referenceUploaderTitle: "风格参考",
        referenceUploaderDescription: "颜色和氛围参考"
      },
      boothExtraction: {
        title: "展位提取",
        description: "自动将结构模块（背景板、立牌、柜台）提取为平面精灵图。",
        customPromptLabel: "技术说明",
        customPromptPlaceholder: "例如：只提取铁架和 LED 屏幕..."
      },
      zoomObject: {
        title: "3D 缩放",
        description: "调整物体大小并自动填充周围空间 (Outpainting)。",
        zoomLabel: "缩放级别",
        customPromptLabel: "背景要求",
        customPromptPlaceholder: "描述缩放时的周围环境..."
      },
      stageEffect: {
        title: "舞台特效 (VFX)",
        description: "在舞台指定区域添加灯光、烟火、激光或烟雾效果。",
        customPromptLabel: "特效描述",
        customPromptPlaceholder: "例如：绿色激光从顶部扫描...",
        uploader1Title: "原始舞台",
        uploader1Desc: "需要特效的舞台图片",
        uploader2Title: "特效样本",
        uploader2Desc: "灯光/烟火参考"
      },
      eventPerformance: {
        title: "活动表演",
        description: "将歌手、舞团或礼仪小姐合成到场景中，保持正确的身体比例。",
        customPromptLabel: "表演详情",
        customPromptPlaceholder: "例如：5 人穿着传统服装的舞团...",
        uploader1Title: "背景图片",
        uploader1Desc: "舞台或空旷区域",
        uploader2Title: "人员图片",
        uploader2Desc: "要合成的人员"
      },
      productMockup: {
        title: "产品样机",
        description: "将产品或 Logo 放入具有自然光影的真实空间中。",
        customPromptLabel: "样机要求",
        customPromptPlaceholder: "描述放置角度和表面材质...",
        sizeLabel: "产品尺寸",
        uploader1Title: "环境图片",
        uploader1Desc: "陈列室、大厅或货架",
        uploader2Title: "设计图片",
        uploader2Desc: "产品文件 or Logo"
      },
      eventDesign3d: {
        title: "3D 透视设计",
        description: "将概念草图转化为逼真的 3D 渲染图。",
        customPromptLabel: "材质描述",
        customPromptPlaceholder: "例如：玻璃表面，主色调为紫色霓虹灯..."
      },
      roomEmpty: {
        title: "清理房间 (Clean)",
        description: "移除旧家具、垃圾或人员，获得干净的空房间。",
        customPromptLabel: "移除对象",
        customPromptPlaceholder: "例如：移除所有旧桌椅，保留地板..."
      },
      cameraAngle: {
        title: "相机角度",
        description: "将图片视角更改为标准角度（俯视、侧视、正视）。",
        customPromptLabel: "角度描述",
        customPromptPlaceholder: "例如：低角度仰视以展现宏伟感...",
        referenceUploaderTitle: "角度参考",
        referenceUploaderDescription: "为 AI 提供相机姿态建议",
        presets: {
          frontView: "正视图 (Front)",
          backView: "后视图 (Back)",
          topDownView: "俯视图 (Top)",
          leftSideView: "左侧视图 (Left)",
          rightSideView: "右侧视图 (Right)"
        }
      },
      figurine: {
        title: "手办制作",
        description: "将角色或吉祥物变成盒子里的玩具模型。"
      },
      wireframe: {
        title: "线框网格",
        description: "将物体转换为技术 3D 网格模型。",
        thicknessLabel: "线条粗细"
      },
      vectorFrom3d: {
        title: "矢量化 (2D)",
        description: "将复杂的 3D 渲染图转换为平面矢量插图。",
        uploader1Title: "原始 3D 图片",
        uploader1Desc: "需要转换的物体",
        uploader2Title: "风格样本",
        uploader2Desc: "所需的矢量风格"
      },
      pose: {
        title: "姿势匹配 (Pose)",
        description: "将参考图片中的姿势应用到目标角色上。",
        uploader1Title: "原始角色",
        uploader1Desc: "需要改变姿势的人",
        uploader2Title: "姿势参考",
        uploader2Desc: "想要模仿的姿势"
      },
      expressionReference: {
        title: "面部表情",
        description: "根据参考面孔更改情绪（快乐、悲伤、酷）。",
        uploader1Title: "原始图片",
        uploader1Desc: "需要更改表情的人",
        uploader2Title: "情绪参考",
        uploader2Desc: "具有所需表情的面孔"
      },
      lineArt: {
        title: "线稿 (Line Art)",
        description: "将图片转换为专业的清晰线稿。"
      },
      colorPalette: {
        title: "自动上色",
        description: "根据另一张图片的调色板为线稿上色。",
        uploader1Title: "线稿",
        uploader1Desc: "黑白草图",
        uploader2Title: "颜色样本",
        uploader2Desc: "具有所需颜色的图片"
      },
      plushie: {
        title: "毛绒玩具",
        description: "将任何物体或人变成可爱的毛绒玩具。"
      },
      twoDToThreeD: {
        title: "2D 转 3D",
        description: "为 Logo 或 2D 绘图挤出 3D 深度并赋予逼真的材质。",
        uploader1Title: "平面 2D 图片",
        uploader1Desc: "Logo 或绘图",
        uploader2Title: "材质参考",
        uploader2Desc: "表面 (金属, 塑料, 皮革...)"
      },
      paintingProcess: {
        title: "设计流程",
        description: "创建一个 4 步序列，展示从草图到最终作品的艺术过程。"
      }
    }
  },
  server: {
    connectTitle: "AI 服务器云",
    connectSubtitle: "连接到高性能远程 GPU 以运行本地 AI 软件。",
    btnConnect: "开始远程会话",
    statusOnline: "在线",
    statusBusy: "忙碌",
    syncSuccess: "文件已同步到 Alpha Connect！",
    billing: {
      balance: "钱包余额",
      costPerHour: "币 / 小时",
      topUp: "充值",
      insufficient: "余额不足。请充值！",
      confirm: "确认租赁"
    }
  },
  workflow: {
    title: "Alpha Connect",
    subtitle: "集中式文档中心",
    login: {
      title: "员工访问",
      email: "员工 ID / 邮箱",
      password: "安全密钥",
      btn: "访问 Connect 中心",
      hint: "使用任意凭据进入"
    },
    dashboard: {
      upload: "上传资产",
      createProject: "新建项目",
      create: "Studio AI",
      search: "查找资产...",
      filter: "部门筛选",
      noFiles: "未找到文件。",
      table: {
        name: "文件 / 项目名称",
        dept: "部门",
        date: "日期",
        status: "状态",
        action: "操作"
      },
      status: {
        pending: "等待",
        approved: "完成",
        rejected: "失败"
      },
      project: {
        modalTitle: "初始化新项目",
        nameLabel: "项目名称",
        deptLabel: "主导部门",
        descLabel: "需求",
        createBtn: "创建项目",
        success: "新项目初始化成功！",
        hubTitle: "项目中心",
        management: "项目管理",
        tabs: {
          overview: "概览",
          team: "团队 & 角色",
          files: "文档 & 文件",
          finance: "财务 (Coins)",
          chat: "讨论",
          tasks: "任务"
        },
        finance: {
          budget: "Coin 预算",
          expenses: "已支出",
          remaining: "剩余",
          addExpense: "添加支出",
          expenseName: "支出名称",
          amount: "金额",
          date: "日期",
          profit: "预计利润"
        },
        package: {
          btn: "打包 & 移交",
          confirm: "确认打包项目？",
          desc: "项目将被标记为完成。文件归档且财务报告锁定。",
          success: "项目打包成功！"
        },
        chat: {
          placeholder: "输入消息...",
          send: "发送"
        },
        tasks: {
          title: "任务列表",
          addTask: "添加任务",
          noTasks: "暂无任务。",
          status: {
            todo: "待办",
            in_progress: "进行中",
            done: "完成"
          },
          modal: {
            title: "分配新任务",
            titleLabel: "任务名称",
            assigneeLabel: "受让人",
            dueDateLabel: "截止日期",
            fileLabel: "附件 (可选)",
            submit: "分配"
          },
          assigned: "任务已分配"
        }
      }
    },
    depts: {
      all: "所有资产",
      event_planner: "活动策划",
      creative: "创意团队",
      operation: "运营团队"
    },
    jobs: {
      title: "自由职业中心",
      subtitle: "来自 Alpha 合作伙伴的真实项目",
      apply: "立即申请",
      budget: "预算",
      posted: "发布于",
      deadline: "截止日期",
      applicants: "申请人"
    },
    wallet: {
      title: "信用钱包",
      balance: "当前余额",
      buy: "购买积分",
      withdraw: "提现",
      withdrawDesc: "余额 > 1000 时可将 Coin 兑换为现金。",
      withdrawBtn: "申请提现",
      withdrawMin: "最少需要 1000 Coins",
      history: "交易历史",
      packages: {
        starter: "入门包",
        pro: "专业包",
        biz: "企业包"
      },
      benefits: {
        server: "租赁 GPU 服务器",
        course: "高级课程",
        job: "承接自由职业工作"
      },
      popular: "最受欢迎",
      success: "充值成功！",
      withdrawSuccess: "提现申请已发送！"
    },
    partners: {
      title: "合作伙伴网络",
      subtitle: "顶级代理商和供应商",
      register: "注册合作伙伴",
      tabs: {
        agency: "活动代理商",
        supplier: "供应商"
      },
      contact: "联系",
      website: "网站",
      verified: "已验证",
      form: {
        title: "网络注册",
        companyName: "公司名称",
        type: "类型",
        location: "地点",
        phone: "热线",
        email: "联系邮箱",
        website: "网站 / 作品集",
        desc: "能力介绍",
        submit: "提交",
        success: "注册已发送！我们会尽快联系您。"
      },
      details: {
        about: "关于",
        services: "服务",
        projects: "重点项目",
        connect: "连接"
      }
    },
    profile: {
      title: "学员档案",
      edit: "编辑",
      save: "保存更改",
      cancel: "取消",
      name: "全名",
      role: "角色 / 职称",
      bio: "简介",
      skills: "技能 (逗号分隔)",
      portfolio: "作品集链接",
      contact: "联系信息",
      gallery: "精选作品",
      hire: "聘用人才"
    },
    automation: {
      title: "自动化",
      create: "新工作流",
      active: "开启",
      inactive: "关闭",
      triggers: {
        file_upload: "文件上传时",
        status_approved: "审核通过时",
        status_rejected: "审核拒绝时"
      },
      actions: {
        send_email: "发送邮件",
        send_telegram: "发送 Telegram",
        send_whatsapp: "发送 WhatsApp"
      },
      targetPlaceholder: "输入邮箱或群组 ID...",
      lastRun: "最后运行"
    },
    affiliate: {
      title: "联盟计划",
      subtitle: "推荐朋友，赚取无限积分",
      totalEarned: "总收益",
      pending: "待处理",
      referrals: "推荐人数",
      clicks: "点击数",
      copyLink: "复制链接",
      copied: "已复制！",
      commission: "佣金",
      program: "计划",
      history: "历史"
    },
    creative: {
      title: "创意资产",
      subtitle: "分享提示词和工作流。每贡献一次赚取 100 Coin！",
      create: "贡献",
      prompts: "示例提示词",
      workflows: "工作流",
      form: {
        title: "新资产",
        assetTitle: "标题",
        type: "类型",
        content: "内容 (提示词文本或 JSON)",
        tags: "标签",
        submit: "提交并赚取 100 Coin"
      },
      success: "已提交！您获得了 100 Coin。"
    },
    resources: {
      title: "资源中心",
      subtitle: "分享文件和数据。每上传一次赚取 300 Coin！",
      upload: "分享资源",
      types: {
        project_file: "项目文件 (SKP, Blend)",
        design_asset: "设计资产 (PSD, AI)",
        industry_data: "行业数据",
        template: "模板"
      },
      form: {
        title: "上传资源",
        name: "资源名称",
        type: "类型",
        desc: "描述",
        format: "文件格式",
        submit: "上传并赚取 300 Coin"
      },
      success: "上传成功！您获得了 300 Coin。"
    },
    collaboration: {
      title: "项目聊天",
      team: "团队成员",
      addMember: "添加成员",
      removeMember: "移除",
      chat: "聊天",
      placeholder: "输入消息...",
      send: "发送",
      noMembers: "暂无成员。",
      joined: "加入了项目。",
      removed: "离开了项目。",
      feeNotice: "添加外部成员需花费 50 积分。继续？",
      freeNotice: "添加 Alpha 学员 (免费)。",
      insufficient: "余额不足以添加外部成员 (需 50 积分)。"
    }
  },
  landing: {
    nav: {
      features: "AI 学院",
      showcase: "资产",
      utilities: "工具",
      connect: "连接",
      about: "关于",
    },
    cta: {
      launch: "启动 Studio",
      startCreating: "立即注册",
      learnMore: "教学大纲"
    },
    hero: {
      title1: "AI 培训",
      title2: "现代活动策划",
      subtitle: "AI 驱动的活动制作终极生态系统。培训、工具和云计算集于一身。",
    },
    features: {
      title: "学习路径",
      subtitle: "选择您的专业并开始创作。",
      tryNow: "打开工具",
    },
    course: {
      intro: "课程介绍",
      syllabus: "教学大纲",
      overview: "概览",
      whatYouLearn: "你将学到什么",
      point1: "掌握最新的 AI 生成工具",
      point2: "将 AI 应用于实际生产流程",
      point3: "设计时间优化高达 80%",
      startLearning: "开始学习",
      enrollNow: "立即注册",
      minPerLesson: "分钟/课",
      lessons: "课程",
      progress: "进度",
      continue: "继续",
      viewCourse: "详情",
      hours: "小时",
      duration: "时长",
      level: "等级",
      beginner: "初级"
    },
    showcase: {
      title: "精选学员",
      subtitle: "顶尖人才和职业机会。",
      pro: "Pro 学员",
      hired: "已录用",
      cta: "成为 Pro 会员"
    },
    partners: {
      title: "合作伙伴网络",
      subtitle: "与顶级代理商和供应商合作。",
      join: "注册合作伙伴"
    }
  }
};
