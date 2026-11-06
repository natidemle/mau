export type ServiceAction =
  | "meal-scan"
  | "library-search"
  | "clearance-details"
  | "id-card-request";

export type Service = {
  id: string;
  category: string;
  title: string;
  description: string;
  status: string;
  statusTone: "green" | "amber" | "blue";
  actionLabel: string;
  action: ServiceAction;
  icon: "meal" | "book" | "check" | "card";
  iconTone: "orange" | "purple" | "green" | "blue";
};

export type DashboardData = {
  student: {
    name: string;
    initials: string;
    id: string;
    department: string;
    campus: string;
    year: string;
  };
  stats: {
    gpa: string;
    credits: number;
    totalCredits: number;
    books: number;
    clearance: number;
  };
  services: Service[];
  schedule: {
    time: string;
    title: string;
    detail: string;
    tone: "purple" | "blue" | "orange";
  }[];
};

export const dashboardData: DashboardData = {
  student: {
    name: "Natnael Demle",
    initials: "ND",
    id: "MAU/1234/14",
    department: "Software Engineering",
    campus: "Tulu Awulia",
    year: "3rd Year",
  },
  stats: {
    gpa: "3.78",
    credits: 84,
    totalCredits: 126,
    books: 2,
    clearance: 75,
  },
  services: [
    {
      id: "cafeteria",
      category: "CAMPUS LIFE",
      title: "Cafeteria service",
      description: "Your meal plan is ready. Scan your student QR at the counter.",
      status: "Meal available",
      statusTone: "green",
      actionLabel: "Open meal pass",
      action: "meal-scan",
      icon: "meal",
      iconTone: "orange",
    },
    {
      id: "library",
      category: "LEARNING",
      title: "Library",
      description: "Keep track of borrowed books and explore the campus catalogue.",
      status: "2 books borrowed",
      statusTone: "blue",
      actionLabel: "Explore catalogue",
      action: "library-search",
      icon: "book",
      iconTone: "purple",
    },
    {
      id: "clearance",
      category: "STUDENT RECORDS",
      title: "Digital clearance",
      description: "Your clearance is moving along. Finance is the next step.",
      status: "In progress",
      statusTone: "amber",
      actionLabel: "View progress",
      action: "clearance-details",
      icon: "check",
      iconTone: "green",
    },
    {
      id: "id-card",
      category: "STUDENT RECORDS",
      title: "Student ID card",
      description: "Request a replacement or check the status of your student card.",
      status: "Processing",
      statusTone: "blue",
      actionLabel: "Check request",
      action: "id-card-request",
      icon: "card",
      iconTone: "blue",
    },
  ],
  schedule: [
    {
      time: "09:00",
      title: "Software Design",
      detail: "Room B-204 · Dr. Hana Tadesse",
      tone: "purple",
    },
    {
      time: "11:00",
      title: "Database Systems",
      detail: "ICT Building · Lab 3",
      tone: "blue",
    },
    {
      time: "14:00",
      title: "Project advising",
      detail: "Engineering Block · Office 12",
      tone: "orange",
    },
  ],
};
