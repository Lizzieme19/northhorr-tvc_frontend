// Static placeholder data for the North Horr TVC public website.
// Backend will eventually replace these structures via API.
export const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=80",
    title: "Igniting a Brighter Future Through Skill",
    description: "North Horr Technical and Vocational College offers accredited TVET programmes that empower learners with practical skills for employment and entrepreneurship.",
    buttonText: "Explore Courses",
    buttonLink: "/courses",
  },
  {
    image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=2000&q=80",
    title: "Hands-on Practical Learning",
    description: "Modern workshops and experienced instructors prepare students for real-world careers.",
    buttonText: "Our Departments",
    buttonLink: "/courses",
  },
  {
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=2000&q=80",
    title: "Empowering Northern Kenya",
    description: "Producing competent graduates equipped to transform communities through technical excellence.",
    buttonText: "Apply Today",
    buttonLink: "/application",
  }
]
export const campusGallery = [
  {
    image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80",
    alt: "Campus Gate",
  },
  {
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
    alt: "Library",
  },
  {
    image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80",
    alt: "Workshop",
  },
  {
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
    alt: "Graduation",
  },
]

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
  hod: {
    name: string;
    title: string;
    image: string;
  };
  overview: string;
  highlights: string[];
  careers: string[];
  gallery: string[];

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

    overview: "The Department of Agriculture at North Horr Technical and Vocational College offers comprehensive training in sustainable farming, livestock production, dairy management, and aquaculture. Our programs are designed to equip students with practical skills and knowledge to meet the growing demands of Kenya's agricultural sector.",
    hod: {
      name: "Dr. John Mwangi",
      title: "Head of Department",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
    },
    highlights: [
      "Hands-on training in sustainable farming practices",
      "Practical skills in livestock production and management",
      "Dairy farm management and dairy plant technology",
      "Aquaculture and fish farming techniques",
      "Agricultural extension and community development",
      "Modern equipment and facilities for practical learning"
    ],
    careers: [
      "Agricultural Officer",
      "Dairy Farm Manager",
      "Livestock Production Manager",
      "Aquaculture Specialist",
      "Agricultural Extension Officer",
      "Farm Manager",
      "Agricultural Consultant",
      "Dairy Plant Operator",
      "Aquaculture Technician",
      "Agricultural Research Assistant"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
    ],
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
    overview: "The Department of Mechanical Engineering at North Horr Technical and Vocational College offers comprehensive training in motor vehicle, motorcycle, and panel beating trades. Our programs are designed to equip students with practical skills and knowledge to meet the growing demands of Kenya's automotive sector.",
    hod: {
      name: "Mr. James Mwangi",
      title: "Head of Department",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
    },
    highlights: [
      "Hands-on training in motor vehicle maintenance and repair",
      "Practical skills in motorcycle mechanics",
      "Panel beating and body repair techniques",
      "Modern equipment and facilities for practical learning"
    ],
    careers: [
      "Automotive Technician",
      "Motorcycle Mechanic",
      "Panel Beater",
      "Vehicle Maintenance Supervisor"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1632823471565-1ecdf5c6da77?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1632823471565-1ecdf5c6da77?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1632823471565-1ecdf5c6da77?auto=format&fit=crop&w=1200&q=80"
    ],
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
    overview: "The Department of Applied Sciences at North Horr Technical and Vocational College offers comprehensive training in food technology, baking, meat processing, and laboratory sciences. Our programs are designed to equip students with practical skills and knowledge to meet the demands of the food, health, and research industries.",
    hod: {
      name: "Dr. Sarah Kimani",
      title: "Head of Department",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
    },
    highlights: [
      "Hands-on training in food technology and baking",
      "Practical skills in meat processing",
      "Laboratory science and analysis techniques",
      "Modern equipment and facilities for practical learning"
    ],
    careers: [
      "Food Technologist",
      "Baker/Baking Technologist",
      "Meat Processing Technician",
      "Laboratory Technician"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?auto=format&fit=crop&w=1200&q=80"
    ],
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
      "/images/department/building-civil-engineering/bce.jpg",
    overview: "The Department of Building & Civil Engineering at North Horr Technical and Vocational College offers comprehensive training in construction trades and building technology. Our programs prepare students for careers in construction, masonry, carpentry, plumbing, and interior design.",
    hod: {
      name: "Mr. John Mwangi",
      title: "Head of Department",
      image: "/images/departments/Building-civil/building.jpg"
    },
    highlights: [
      "Hands-on training in modern construction techniques",
      "State-of-the-art workshops and laboratories",
      "Industry partnerships with leading construction companies",
      "Career opportunities in construction, masonry, and interior design"
    ],
    careers: [
      "Construction Technician",
      "Carpenter/Joiner",
      "Plumber",
      "Mason",
      "Interior Designer",
      "Building Inspector"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80"
    ],
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
    overview: "The Department of Social Sciences at North Horr Technical and Vocational College offers training in community health, social work, and caregiving. Our programs prepare students for careers in healthcare, social services, and community development.",
    hod: {
      name: "Ms. Jane Wanjiku",
      title: "Head of Department",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
    },
    highlights: [
      "Training in community health and social work",
      "Hands-on experience in healthcare settings",
      "Career opportunities in healthcare, social services, and community development",
      "Partnerships with healthcare facilities and NGOs"
    ],
    careers: [
      "Community Health Worker",
      "Social Worker",
      "Caregiver",
      "Child Protection Officer",
      "Community Health Officer",
      "Health Systems Support Worker",
      "Health Systems Support Manager",
      "Healthcare Support Worker",
      "Home Based Care Worker",
      "Social Work Practitioner"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
    ],
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
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
    overview: "The Department of Business at North Horr Technical and Vocational College offers training in human resources, procurement, project management, and storekeeping. Our programs prepare students for careers in business administration, operations management, and supply chain management.",
    hod: {
      name: "Mr. John Mwangi",
      title: "Head of Department",
      image: "/images/departments/Business/biz.jpg"
    },
    highlights: [
      "Training in human resources, procurement, project management, and storekeeping",
      "Hands-on experience in business operations",
      "Career opportunities in business administration, operations management, and supply chain management",
      "Partnerships with businesses and organizations"
    ],
    careers: [
      "Business Administrator",
      "Operations Manager",
      "Supply Chain Manager",
      "Project Coordinator",
      "Storekeeper",
      "Procurement Officer",
      "Human Resources Manager"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80"
    ],
    courses: [
      { name: "Human Resource", levels: "Level 5, 6" },
      { name: "Storekeeping", levels: "Level 4" },
      { name: "Procurement Management", levels: "Level 5, 6" },
      { name: "Project Management", levels: "Level 5, 6" },
    ],
  },
  {
    slug: "cosmetology",
    name: "Cosmetology",
    tagline: "Creating beauty, building confidence",
    description:
      "Professional training in hair styling, makeup artistry, skincare and beauty therapy — launching careers in the booming beauty industry.",
    icon: "💇",
    image:
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80",
    overview: "The Department of Cosmetology at North Horr Technical and Vocational College offers comprehensive training in hair styling, makeup artistry, skincare, and beauty therapy. Our programs prepare students for successful careers in the beauty and wellness industry.",
    hod: {
      name: "Ms. Jane Wanjiku",
      title: "Head of Department",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
    },
    highlights: [
      "Hands-on training in hair styling and beauty therapy",
      "Professional makeup artistry and skincare techniques",
      "Modern beauty salon equipment and facilities",
      "Industry partnerships with leading beauty brands"
    ],
    careers: [
      "Cosmetologist",
      "Hair Stylist",
      "Makeup Artist",
      "Beauty Therapist",
      "Salon Manager",
      "Skincare Specialist"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1200&q=80"
    ],
    courses: [
      { name: "Cosmetology", levels: "Level 3, 4, 5, 6" },
    ],
  },
  {
    slug: "fashion-design",
    name: "Fashion Design",
    tagline: "Design your future, wear your dreams",
    description:
      "Creative training in fashion design, garment construction and leather technology — transforming artistic talent into sustainable careers.",
    icon: "👗",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
    overview: "The Department of Fashion Design at North Horr Technical and Vocational College offers training in fashion design, garment construction, and leather technology. Our programs prepare students for careers in fashion design, garment production, and leather goods manufacturing.",
    hod: {
      name: "Ms. Aisha Hassan",
      title: "Head of Department",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
    },
    highlights: [
      "Hands-on training in fashion design and garment construction",
      "Leather technology and goods production skills",
      "Modern sewing and design equipment",
      "Industry partnerships with fashion houses and leather manufacturers"
    ],
    careers: [
      "Fashion Designer",
      "Garment Maker",
      "Leather Goods Producer",
      "Leather Processor",
      "Leather Technology Specialist",
      "Fashion Entrepreneur"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80"
    ],
    courses: [
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
      "/images/department/electrical-electronics/electrical.jpg",
    overview: "The Department of Electrical & Electronics Engineering at North Horr Technical and Vocational College offers training in electrical engineering, electrical installation, solar PV system installation, refrigeration and air conditioning, electronics engineering, electronics technology, and electrotechnical engineering. Our programs prepare students for careers in electrical and electronics engineering.",
    hod: {
      name: "Mr. Peter Njoroge",
      title: "Head of Department",
      image: "/images/department/electrical-electronics/electrical.jpg"
    },
    highlights: [
      "Training in electrical engineering, electrical installation, solar PV system installation, refrigeration and air conditioning, electronics engineering, electronics technology, and electrotechnical engineering",
      "Hands-on experience in electrical and electronics engineering",
      "Career opportunities in electrical and electronics engineering",
      "Partnerships with electrical and electronics industries"
    ],
    careers: [
      "Electrical Engineer",
      "Electrical Installation Technician",
      "Solar PV System Installer",
      "Refrigeration and Air Conditioning Technician",
      "Electronics Engineer",
      "Electronics Technician",
      "Electrotechnical Engineer"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80"
    ],
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
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
    overview: "The Department of Computing & Informatics at North Horr Technical and Vocational College offers training in computer operations, ICT operator, and ICT technician. Our programs prepare students for careers in computing and informatics.",
    hod: {
      name: "Mr. James Mwangi",
      title: "Head of Department",
      image: "/images/departments/ICT/ICT.jpg"
    },
    highlights: [
      "Training in computer operations, ICT operator, and ICT technician",
      "Hands-on experience in computing and informatics",
      "Career opportunities in computing and informatics",
      "Partnerships with computing and informatics industries"
    ],
    careers: [
      "Computer Operator",
      "ICT Operator",
      "ICT Technician"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80"
    ],
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
      "North Horr TVC hosts industry partners for a two-day skills exhibition featuring student innovations, live trade demos and on-the-spot job interviews.",
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
    title: "North Horr TVC Students Win Regional Innovation Award",
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
      "North Horr TVC didn't just teach me a trade — it gave me the confidence to start my own tailoring business. Today I employ four people from my village.",
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
      "I came to North Horr TVC with a dream of serving my community. Today I work as a community health officer and I owe it all to the staff who believed in me.",
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
  { title: "North Horr TVC Prospectus 2025/2026", description: "Complete college prospectus including programs, fees, and admission procedures.", type: "PDF", size: "4.2 MB", category: "Prospectus" },
  { title: "Application Form (Septemper Intake)", description: "Official application form for the September intake — all departments.", type: "PDF", size: "320 KB", category: "Forms" },
  { title: "HELB Loan Application Guide", description: "Step-by-step guide on applying for HELB funding as a TVET student.", type: "PDF", size: "1.1 MB", category: "Forms" },
  { title: "Term 1 Master Timetable", description: "Class timetable for all Level 3–6 programs, Term 1.", type: "PDF", size: "780 KB", category: "Timetables" },
  { title: "Examination Schedule", description: "End-of-term examination schedule for all departments.", type: "PDF", size: "510 KB", category: "Timetables" },
  { title: "Student Handbook & Code of Conduct", description: "Rules, regulations and student rights at North Horr TVC.", type: "PDF", size: "2.3 MB", category: "Policies" },
  { title: "Fee Structure 2025/2026", description: "Detailed fee breakdown by program and level.", type: "PDF", size: "240 KB", category: "Prospectus" },
  { title: "Hostel Application Form", description: "Form for on-campus accommodation requests.", type: "DOCX", size: "65 KB", category: "Forms" },
];

export const stats = [
  { value: "10", label: "Departments" },
  { value: "60+", label: "Accredited Courses" },
  { value: "1,200+", label: "Students Trained" },
  { value: "85%", label: "Graduate Employment" },
];

export const collegeInfo = {
  name: "North Horr Technical and Vocational College",
  shortName: "North Horr TVC",
  tagline: "Igniting a brighter future",
  motto: "Skill. Innovation. Service.",
  location: "North Horr Sub-County, Marsabit, Kenya",
  poBox: "P.O. Box 200-60500, Marsabit",
  phone: "0714634023",
  email: "northhorrtvc@gmail.com",


  /* admissionsEmail: "admissions@ntvc.ac.ke", */
  socials: {
    facebook: "https://facebook.com/ntvckenya",
    twitter: "https://twitter.com/ntvckenya",
    instagram: "https://instagram.com/ntvckenya",
    youtube: "https://youtube.com/@ntvckenya",
    linkedin: "https://linkedin.com/school/ntvc",
  },
};

export type StaffMember = {
  name: string;
  title: string;
  department: string;
  image: string;
  phone?: string;
  email?: string;
  description: string;
  quote?: string;
};

export const staffMembers: StaffMember[] = [
  {
    name: "Mr. Masinde J. Kephas",
    title: "Dean of Students",
    department: "Office of the Dean of Students",
    image: "/images/staff/dean.jpg",
    description: "Welcome to the Office of the Dean of Students at North Horr Technical and Vocational College. Our office is committed to promoting the welfare, discipline, and holistic development of all trainees. We provide guidance and support to students throughout their training, coordinate student leadership and co-curricular activities, and serve as a link between trainees and the college administration. We strive to create a safe, inclusive, and conducive learning environment that fosters academic excellence, personal growth, and responsible citizenship. The Dean of Students' Office remains dedicated to ensuring that every trainee has the support and opportunities needed to succeed both within and beyond the college.",
  },
  {
    name: "Sabdio D. Wario",
    title: "Registrar",
    department: "Office of the Registrar",
    image: "/images/staff/registrar.jpg",
    phone: "0798776299",
    email: "wsabdio@gmail.com",
    description: "The Registrar is a key member of the management team at North Horr Technical and Vocational College (TVC), responsible for overseeing academic and student administration services. The office coordinates student admissions, registration, examinations, records management, certification, graduation processes, and scholarship administration, ensuring efficiency, accuracy, and adherence to institutional policies. Working closely with students, staff, regulatory agencies, and other stakeholders, the Registrar ensures compliance with the requirements of the Ministry of Education, the Technical and Vocational Education and Training Authority (TVETA), and other relevant bodies. The office is committed to maintaining high standards of academic integrity, transparency, and quality service delivery.",
    quote: "At North Horr TVC, we are committed to providing quality education, efficient academic services, and a supportive learning environment that empowers every student to achieve their full potential.",
  },

];
