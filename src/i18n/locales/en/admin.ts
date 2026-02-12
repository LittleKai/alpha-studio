export default {
  admin: {
    management: {
      title: "Admin Management",
      subtitle: "Manage articles, services and transactions"
    },
    tabs: {
      about: "About Management",
      services: "Services Management",
      transactions: "Transaction Management",
      users: "User Management",
      transactionsList: "Transactions",
      webhooks: "Webhook Logs"
    },
    articles: {
      title: "Title",
      excerpt: "Excerpt",
      content: "Content",
      thumbnail: "Thumbnail URL",
      order: "Order",
      featured: "Featured",
      tags: "Tags",
      addTag: "Add tag...",
      vietnamese: "Vietnamese",
      english: "English",
      titlePlaceholder: "Enter title...",
      excerptPlaceholder: "Enter short summary...",
      contentPlaceholder: "Enter full content...",
      create: "Create Article",
      edit: "Edit Article",
      editBtn: "Edit",
      update: "Update",
      delete: "Delete",
      publish: "Publish",
      unpublish: "Unpublish",
      cancel: "Cancel",
      saving: "Saving...",
      loading: "Loading...",
      searchPlaceholder: "Search articles...",
      allStatus: "All Status",
      noArticles: "No articles yet",
      noExcerpt: "No excerpt",
      createFirst: "Create Your First Article",
      deleteConfirm: "Are you sure you want to delete this article?",
      status: {
        draft: "Draft",
        published: "Published",
        archived: "Archived"
      },
      errors: {
        titleRequired: "Title in both Vietnamese and English is required"
      }
    },
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
        price: "Price (Credits)",
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
    },
    partners: {
      title: "Partner Management",
      createPartner: "Create Partner",
      editPartner: "Edit Partner",
      noPartners: "No partners found",
      createFirst: "Create your first partner",
      searchPlaceholder: "Search partners...",
      allTypes: "All Types",
      allStatuses: "All Statuses",
      featured: "Featured",
      noDescription: "No description",
      stats: {
        total: "Total Partners",
        published: "Published",
        draft: "Drafts",
        featured: "Featured"
      },
      types: {
        technology: "Technology",
        education: "Education",
        enterprise: "Enterprise",
        startup: "Startup",
        government: "Government",
        other: "Other"
      },
      status: {
        draft: "Draft",
        published: "Published",
        archived: "Archived"
      },
      sort: {
        newest: "Newest First",
        oldest: "Oldest First",
        nameAZ: "Name A-Z",
        nameZA: "Name Z-A",
        order: "Display Order"
      },
      edit: "Edit",
      publish: "Publish",
      unpublish: "Unpublish",
      form: {
        companyName: "Company Name",
        companyNamePlaceholder: "Enter company name",
        description: "Description",
        descriptionPlaceholder: "Enter partner description...",
        partnerType: "Partner Type",
        logo: "Logo URL",
        website: "Website",
        email: "Email",
        phone: "Phone",
        address: "Address",
        addressPlaceholder: "Enter address",
        order: "Display Order",
        featured: "Featured Partner",
        cancel: "Cancel",
        saveDraft: "Save as Draft",
        publish: "Publish",
        saving: "Saving...",
        errors: {
          nameRequired: "Company name is required"
        }
      },
      deleteConfirm: {
        title: "Delete Partner",
        message: "Are you sure you want to delete this partner? This action cannot be undone.",
        cancel: "Cancel",
        confirm: "Delete"
      },
      pagination: {
        prev: "Previous",
        next: "Next"
      }
    },
    jobs: {
      title: "Job Management",
      createJob: "Create Job",
      editJob: "Edit Job",
      noJobs: "No jobs found",
      createFirst: "Create your first job posting",
      searchPlaceholder: "Search jobs...",
      allCategories: "All Categories",
      allTypes: "All Types",
      allStatuses: "All Statuses",
      untitled: "Untitled",
      noDescription: "No description",
      salaryNegotiable: "Negotiable",
      upTo: "Up to",
      applications: "applications",
      skills: "skills",
      stats: {
        total: "Total Jobs",
        published: "Published",
        closed: "Closed",
        applications: "Applications"
      },
      categories: {
        engineering: "Engineering",
        design: "Design",
        marketing: "Marketing",
        operations: "Operations",
        hr: "Human Resources",
        finance: "Finance",
        other: "Other"
      },
      types: {
        fullTime: "Full-time",
        partTime: "Part-time",
        contract: "Contract",
        internship: "Internship",
        remote: "Remote"
      },
      levels: {
        entry: "Entry Level",
        junior: "Junior",
        mid: "Mid-level",
        senior: "Senior",
        lead: "Lead"
      },
      status: {
        draft: "Draft",
        published: "Published",
        closed: "Closed"
      },
      sort: {
        newest: "Newest First",
        oldest: "Oldest First",
        mostApplied: "Most Applied"
      },
      edit: "Edit",
      publish: "Publish",
      close: "Close",
      form: {
        title: "Job Title",
        titlePlaceholder: "Enter job title",
        description: "Description",
        descriptionPlaceholder: "Enter job description...",
        requirements: "Requirements",
        requirementsPlaceholder: "Enter job requirements...",
        category: "Category",
        jobType: "Job Type",
        experienceLevel: "Experience Level",
        location: "Location",
        locationPlaceholder: "e.g., Ho Chi Minh City, Remote",
        salary: "Salary Range",
        negotiable: "Negotiable",
        skills: "Required Skills",
        skillsPlaceholder: "Type skill and press Enter",
        addSkill: "Add",
        deadline: "Application Deadline",
        cancel: "Cancel",
        saveDraft: "Save as Draft",
        publish: "Publish",
        saving: "Saving...",
        errors: {
          titleRequired: "Title in both languages is required"
        }
      },
      deleteConfirm: {
        title: "Delete Job",
        message: "Are you sure you want to delete this job? This action cannot be undone.",
        cancel: "Cancel",
        confirm: "Delete"
      },
      pagination: {
        prev: "Previous",
        next: "Next"
      }
    },
    accessDenied: "Access Denied",
    backToHome: "Back to Home",
    dismiss: "Dismiss"
  }
};
