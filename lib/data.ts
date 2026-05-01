// Static placeholder data for the NTVC public website.
// Backend will eventually replace these structures via API.

export type Course = {
  name: string;
  levels: string;
};

export type Department = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string; // emoji placeholder
  image: string;
  courses: Course[];
};

export const departments: Department[] = [
  {
    slug: "agriculture",
    name: "Agriculture",
    tagline: "Feeding the nation, sustaining the land",
    description:
      "Hands-on training in sustainable farming, livestock production, dairy management and aquaculture geared for Kenya's agricultural future.",
    icon: "🌾",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    courses: [
      { name: "Sustainable Agriculture", levels: "Level 3, 4, 5, 6" },
      { name: "Agricultural Extension", levels: "Level 5 & 6" },
      { name: "General Agriculture", levels: "Level 4" },
      { name: "Animal Production", levels: "Level 4, 5, 6" },
      { name: "Animal Health and Production", levels: "Level 5, 6" },
      { name: "Aquaculture", levels: "Level 3, 4, 5" },
      { name: "Dairy Farm Management", levels: "Level 5, 6" },
      { name: "Dairy Plant Management", levels: "Level 5, 6" },
      { name: "Dairy Plant Technology", levels: "Level 4, 5" },
      { name: "Livestock Feed Production", levels: "Level 4" },
      { name: "Poultry Kienyeji Production", levels: "Level 3, 4" },
      { name: "Poultry Layer Production", levels: "Level 3, 4" },
      { name: "Poultry Broiler Production", levels: "Level 3, 4" },
    ],
  },
  {
    slug: "mechanical-engineering",
    name: "Mechanical Engineering",
    tagline: "Driving Kenya's automotive future",
    description:
      "Practical skills in motor vehicle, motorcycle and panel beating trades — equipping students for thriving careers in the automotive sector.",
    icon: "🔧",
    image:
      "https://images.unsplash.com/photo-1632823471565-1ecdf5c6da77?auto=format&fit=crop&w=1200&q=80",
    courses: [
      { name: "Automotive Technician", levels: "Level 5, 6" },
      { name: "Motor Cycle Mechanics", levels: "Level 3, 4" },
      { name: "Motor Vehicle Electrics", levels: "Level 3, 4" },
      { name: "Motor Vehicle Mechanics", levels: "Level 3, 4" },
      { name: "Panel Beating", levels: "Level 3" },
    ],
  },
  {
    slug: "applied-sciences",
    name: "Applied Sciences",
    tagline: "Where science meets industry",
    description:
      "From food technology and baking to laboratory science — graduates emerge ready for the food, health and research industries.",
    icon: "🧪",
    image:
      "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?auto=format&fit=crop&w=1200&q=80",
    courses: [
      { name: "Baking", levels: "Level 3, 4" },
      { name: "Baking Technology", levels: "Level 5, 6" },
      { name: "Food Technology", levels: "Level 5, 6" },
      { name: "Meat Product Processing", levels: "Level 4" },
      { name: "Science Laboratory Technology", levels: "Level 5, 6" },
    ],
  },
  {
    slug: "building-civil-engineering",
    name: "Building & Civil Engineering",
    tagline: "Building tomorrow, today",
    description:
      "Master the trades that build a nation — from masonry and carpentry to interior design and modern building technology.",
    icon: "🏗️",
    image:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
    courses: [
      { name: "Building Technology", levels: "Level 5 & 6" },
      { name: "Carpentry and Joinery", levels: "Level 3, 4, 5" },
      { name: "Plumbing", levels: "Level 3, 4, 5" },
      { name: "Masonry", levels: "Level 3, 4" },
      { name: "Painting and Decoration", levels: "Level 3" },
      { name: "Gypsum Installation", levels: "Level 3" },
      { name: "Interior Design", levels: "Level 4, 5, 6" },
      { name: "Steel Fixing", levels: "Level 3" },
      { name: "Tiling", levels: "Level 3" },
    ],
  },
  {
    slug: "social-sciences",
    name: "Social Sciences",
    tagline: "Caring careers that change communities",
    description:
      "Train as a community health worker, social worker or care professional and serve where the need is greatest.",
    icon: "🤝",
    image:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
    courses: [
      { name: "Caregiving", levels: "Level 4" },
      { name: "Child Protection", levels: "Level 5F, 6F" },
      { name: "Community-Based Services", levels: "Level 4" },
      { name: "Community Health", levels: "Level 5, 6" },
      { name: "Health Systems Support (HSS)", levels: "Level 5" },
      { name: "Health Systems Support Management (HSSM)", levels: "Level 6" },
      { name: "Healthcare Support Services", levels: "Level 5" },
      { name: "Home Based Care", levels: "Level 3" },
      { name: "Social Work", levels: "Level 5, 6" },
    ],
  },
  {
    slug: "business",
    name: "Business",
    tagline: "Lead. Manage. Succeed.",
    description:
      "Future-ready business courses in HR, procurement, project management and storekeeping — designed for the modern workplace.",
    icon: "💼",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    courses: [
      { name: "Human Resource", levels: "Level 5, 6" },
      { name: "Storekeeping", levels: "Level 4" },
      { name: "Procurement Management", levels: "Level 5, 6" },
      { name: "Project Management", levels: "Level 5, 6" },
    ],
  },
  {
    slug: "cosmetology-fashion",
    name: "Cosmetology & Fashion",
    tagline: "Crafting beauty, designing identity",
    description:
      "Creative, hands-on training in fashion design, cosmetology and leather technology — turning talent into a livelihood.",
    icon: "✂️",
    image:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
    courses: [
      { name: "Cosmetology", levels: "Level 3, 4, 5, 6" },
      { name: "Fashion Design", levels: "Level 3, 4, 5, 6" },
      { name: "Leather Goods Production", levels: "Level 5" },
      { name: "Leather Processing (Tanning)", levels: "Level 5" },
      { name: "Leather Technology", levels: "Level 6" },
    ],
  },
  {
    slug: "electrical-electronics",
    name: "Electrical & Electronics Engineering",
    tagline: "Powering Kenya's tomorrow",
    description:
      "Build the skills that power the nation — from solar PV and refrigeration to advanced electronics and electrotechnical engineering.",
    icon: "⚡",
    image:
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80",
    courses: [
      { name: "Electrical Engineering", levels: "Level 5, 6" },
      { name: "Electrical Installation", levels: "Level 3, 4" },
      { name: "Solar PV System Installation", levels: "Level 3, 4, 5" },
      { name: "Refrigeration and Air Conditioning", levels: "Level 4, 5, 6" },
      { name: "Electronics Engineering", levels: "Level 5, 6" },
      { name: "Electronics Technology", levels: "Level 3, 4" },
      { name: "Electrotechnical Engineering", levels: "Level 5, 6" },
    ],
  },
  {
    slug: "computing-informatics",
    name: "Computing & Informatics",
    tagline: "Code the future you want",
    description:
      "From basic computer operations to ICT technician training — a launchpad into Kenya's booming digital economy.",
    icon: "💻",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    courses: [
      { name: "Computer Operations", levels: "Level 3" },
      { name: "ICT Operator", levels: "Level 4" },
      { name: "ICT Technician", levels: "Level 5, 6" },
    ],
  },
];

export type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: "News" | "Event" | "Announcement";
  image: string;
};

export const newsItems: NewsItem[] = [
  {
    id: "1",
    title: "September 2025 Intake Now Open",
    excerpt:
      "Applications for the September intake are open across all nine departments. Apply early for guaranteed placement and HELB support.",
    date: "Aug 12, 2025",
    category: "Announcement",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "2",
    title: "Annual Skills Showcase & Career Fair",
    excerpt:
      "NTVC hosts industry partners for a two-day skills exhibition featuring student innovations, live trade demos and on-the-spot job interviews.",
    date: "Sep 24, 2025",
    category: "Event",
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "3",
    title: "Solar PV Lab Officially Commissioned",
    excerpt:
      "Our new solar installation lab — funded in partnership with the County Government — is now operational, doubling our renewable energy capacity.",
    date: "Jul 30, 2025",
    category: "News",
    image:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "4",
    title: "NTVC Students Win Regional Innovation Award",
    excerpt:
      "A team from the Computing & Informatics department took home top honours at the Northern Kenya TVET Innovation Challenge.",
    date: "Jul 14, 2025",
    category: "News",
    image:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
  },
];

export type Testimonial = {
  name: string;
  course: string;
  year: string;
  quote: string;
  avatar: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Halima Adan",
    course: "Fashion Design, Level 6",
    year: "Class of 2024",
    quote:
      "NTVC didn't just teach me a trade — it gave me the confidence to start my own tailoring business. Today I employ four people from my village.",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Galgalo Wario",
    course: "Solar PV Installation, Level 5",
    year: "Class of 2023",
    quote:
      "The hands-on training was world-class. I now run a solar installation company that has electrified over 200 homes in Marsabit County.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Fatuma Boru",
    course: "Community Health, Level 6",
    year: "Class of 2024",
    quote:
      "I came to NTVC with a dream of serving my community. Today I work as a community health officer and I owe it all to the staff who believed in me.",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
  },
];

export type GalleryImage = {
  src: string;
  caption: string;
  category: "Campus" | "Workshops" | "Events" | "Students";
};

export const galleryImages: GalleryImage[] = [
  { src: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80", caption: "Main campus building", category: "Campus" },
  { src: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80", caption: "Electrical workshop in session", category: "Workshops" },
  { src: "https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?auto=format&fit=crop&w=1200&q=80", caption: "Carpentry trainees", category: "Workshops" },
  { src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80", caption: "Graduation day", category: "Events" },
  { src: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=1200&q=80", caption: "Library and study hall", category: "Campus" },
  { src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80", caption: "Group project session", category: "Students" },
  { src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80", caption: "Computer lab", category: "Workshops" },
  { src: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80", caption: "Sports day", category: "Events" },
  { src: "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=1200&q=80", caption: "Welding practical", category: "Workshops" },
  { src: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80", caption: "Cosmetology training", category: "Workshops" },
  { src: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=1200&q=80", caption: "Cultural day", category: "Events" },
  { src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80", caption: "Student leaders", category: "Students" },
];

export type Resource = {
  title: string;
  description: string;
  type: "PDF" | "DOCX" | "ZIP";
  size: string;
  category: "Prospectus" | "Forms" | "Timetables" | "Policies";
};

export const resources: Resource[] = [
  { title: "NTVC Prospectus 2025/2026", description: "Complete college prospectus including programs, fees, and admission procedures.", type: "PDF", size: "4.2 MB", category: "Prospectus" },
  { title: "Application Form (Septemper Intake)", description: "Official application form for the September intake — all departments.", type: "PDF", size: "320 KB", category: "Forms" },
  { title: "HELB Loan Application Guide", description: "Step-by-step guide on applying for HELB funding as a TVET student.", type: "PDF", size: "1.1 MB", category: "Forms" },
  { title: "Term 1 Master Timetable", description: "Class timetable for all Level 3–6 programs, Term 1.", type: "PDF", size: "780 KB", category: "Timetables" },
  { title: "Examination Schedule", description: "End-of-term examination schedule for all departments.", type: "PDF", size: "510 KB", category: "Timetables" },
  { title: "Student Handbook & Code of Conduct", description: "Rules, regulations and student rights at NTVC.", type: "PDF", size: "2.3 MB", category: "Policies" },
  { title: "Fee Structure 2025/2026", description: "Detailed fee breakdown by program and level.", type: "PDF", size: "240 KB", category: "Prospectus" },
  { title: "Hostel Application Form", description: "Form for on-campus accommodation requests.", type: "DOCX", size: "65 KB", category: "Forms" },
];

export const stats = [
  { value: "9", label: "Departments" },
  { value: "60+", label: "Accredited Courses" },
  { value: "1,200+", label: "Students Trained" },
  { value: "85%", label: "Graduate Employment" },
];

export const collegeInfo = {
  name: "North Horr Technical and Vocational College",
  shortName: "NTVC",
  tagline: "Igniting a brighter future",
  motto: "Skill. Innovation. Service.",
  location: "North Horr Sub-County, Marsabit, Kenya",
  poBox: "P.O. Box 12, North Horr",
  phone: "+254 700 000 000",
  email: "info@ntvc.ac.ke",
  admissionsEmail: "admissions@ntvc.ac.ke",
  socials: {
    facebook: "https://facebook.com/ntvckenya",
    twitter: "https://twitter.com/ntvckenya",
    instagram: "https://instagram.com/ntvckenya",
    youtube: "https://youtube.com/@ntvckenya",
    linkedin: "https://linkedin.com/school/ntvc",
  },
};
