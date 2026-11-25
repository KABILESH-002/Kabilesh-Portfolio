// Everything on the CV, structured for the portfolio site.
// Edit here; the whole site reads from this file.

export const person = {
  name: 'Kumuthavannan Kabileshwar',
  short: 'Kabilesh',
  headline: 'Full-stack developer & AI researcher',
  cvTitle: 'Computer Science Intern',
  location: 'Colombo, Sri Lanka',
  email: 'kabileshking02@gmail.com',
  phone: '+94 78 632 2193',
  phoneHref: 'tel:+94786322193',
  cv: './Kabileshwar-CV.pdf',
  // Add profile links here, e.g. { label: 'GitHub', href: 'https://github.com/you' }
  links: [{ label: 'GitHub', href: 'https://github.com/KABILESH-002' }],
  summary:
    'Final year BSc (Hons) Computer Science undergraduate at the Informatics Institute of Technology (IIT), affiliated with the University of Westminster, with practical experience in UI/UX design, full-stack development and programming. Experienced in developing user-centered digital solutions through academic and freelance projects, including educational technology and an AI-based landslide prediction and route-safety project. Interested in applying problem-solving skills, creativity and technical skills to build accessible, responsive and impactful software.',
}

export const education = [
  { school: 'Informatics Institute of Technology', detail: 'Bachelor of Science in Computer Science', note: 'Affiliated with the University of Westminster', period: '2024 – 2027 (Expected)' },
  { school: "St. Joseph's College", detail: 'Higher Education', period: '2009 – 2023' },
]

// Featured research (final-year project)
export const research = {
  id: 'slopeguard',
  title: 'SlopeGuard AI',
  cvTitle: 'AI-Based Landslide Prediction Model & Safe Route Support',
  fullTitle: 'Rainfall-Adaptive Landslide Susceptibility and Uncertainty-Aware Evacuation Decision Support, Kegalle District, Sri Lanka',
  type: 'Final Year Project',
  period: 'October 2026 – Present',
  status: 'In development · research prototype',
  cvPoints: [
    'Developing an AI-based system to predict landslide risk using rainfall patterns and changes in rainfall behaviour.',
    'The proposed system aims to communicate potential landslide risks and provide users with safe route support.',
    'Currently in the development stage as a final-year research project.',
  ],
  problem:
    'Rainfall-triggered landslides are a recurring hazard in Sri Lanka’s hill districts. Static susceptibility maps ignore how rain builds up over days, and shortest-path routing can send people straight through the slopes most likely to fail.',
  questions: [
    { q: 'Rainfall-adaptive prediction', d: 'Does a rainfall-adaptive ML model beat rainfall-threshold and static-susceptibility baselines on event- and spatial-holdout tests?', m: 'PR-AUC · F1 · calibration' },
    { q: 'Scenarios & uncertainty', d: 'How do 6, 12 and 24-hour rainfall scenarios and their uncertainty affect the reliability of risk estimates?', m: 'Brier score · sensitivity' },
    { q: 'Robust routing', d: 'Does uncertainty-aware routing reduce exposure compared with shortest-path, static and deterministic dynamic routing?', m: 'CVaR exposure · infeasible routes · travel cost' },
  ],
  pipeline: [
    { k: 'Data', v: 'Station rainfall, landslide inventory, SRTM DEM, ESA WorldCover, SoilGrids, OSM roads; NASA IMERG / CHIRPS as secondary sources' },
    { k: 'Features', v: 'Terrain & land-cover factors plus antecedent rainfall windows (1, 3, 7, 15, 30 days)' },
    { k: 'Models', v: 'Rainfall threshold and logistic regression baselines; Random Forest and XGBoost; SHAP explanations; probability calibration' },
    { k: 'Routing', v: 'Road graph with risk-weighted edges; uncertainty-aware robust routing compared against shortest path' },
    { k: 'Prototype', v: '2D GIS research prototype: FastAPI services, PostGIS, React + MapLibre GL JS map' },
  ],
  stack: ['Python', 'GeoPandas', 'Rasterio', 'NetworkX', 'XGBoost', 'SHAP', 'FastAPI', 'Supabase / PostGIS', 'React', 'MapLibre GL JS'],
  area: 'Kegalle District, with Aranayake as a possible local pilot',
  milestones: [
    { when: '2026', what: 'Project proposal submitted & literature review', done: true },
    { when: 'Now', what: 'Baseline models on open datasets', done: false, current: true },
    { when: 'Jan 2027', what: 'Interim progress demonstration (IPD)', done: false },
    { when: '2027', what: 'Prototype evaluation with 3–5 domain experts & final report', done: false },
  ],
  disclaimer: 'A research prototype. It does not issue official warnings or guarantee that any route is safe.',
}

export const projects = [
  {
    id: 'scheduler',
    title: 'Scheduler AI',
    subtitle: 'Personalized AI Educational Platform',
    type: 'Academic Project',
    discipline: 'Full-stack · AI',
    period: 'January 2026 – May 2026',
    points: [
      'Developed an educational web platform designed to support school students from Grade 6 to A/L.',
      'Includes a personalized AI chatbot to provide learning support and help students with education-related questions.',
      'Designed to make academic assistance more accessible through a student-focused digital learning experience.',
    ],
    tags: ['Web platform', 'AI chatbot', 'EdTech', 'Grade 6 – A/L'],
    mock: 'chat',
  },
  {
    id: 'weather',
    title: 'Weather Forecast Website',
    subtitle: 'Front-End Development',
    type: 'Freelance Web Design Project',
    discipline: 'Front-end',
    period: 'January 2025 – March 2025',
    points: [
      'Designed a responsive weather website concept with clear presentation of weather information.',
      'Created an interactive UI using React, vanilla CSS and JavaScript, featuring charts, graphs and map concepts.',
    ],
    tags: ['React', 'JavaScript', 'Vanilla CSS', 'Charts & graphs', 'Map concepts', 'Responsive'],
    mock: 'weather',
  },
  {
    id: 'hunger',
    title: 'Hunger SL',
    subtitle: 'Mobile Application Design',
    type: 'Freelance UX Design Project',
    discipline: 'UX design',
    period: 'January 2026 – March 2026',
    points: [
      'Conceptualized and designed a social-impact mobile application connecting food donors with people in need.',
      'Conducted user research and competitive analysis; created user personas, user flows and information architecture.',
      'Produced wireframes, high-fidelity mockups and interactive prototypes, focusing on accessibility and ease of use.',
    ],
    tags: ['User research', 'Competitive analysis', 'Personas', 'User flows', 'Information architecture', 'Prototyping', 'Accessibility'],
    mock: 'hunger',
  },
  {
    id: 'hydro',
    title: 'Hydro Alert',
    subtitle: 'Water Management App Design',
    type: 'Freelance UX Design Project',
    discipline: 'UX design',
    period: 'September 2024 – November 2024',
    points: [
      'Designed an environmental-awareness application focused on water conservation and emergency alerts.',
      'Created interface concepts for water-usage tracking, conservation guidance and emergency notifications.',
      'Incorporated gamification and clear alert layouts to encourage engagement and actionable responses.',
    ],
    tags: ['Mobile UX', 'Gamification', 'Alerts', 'Water conservation'],
    mock: 'hydro',
  },
]

export const skills = {
  technical: [
    { group: 'UI / UX Design', items: ['Figma', 'Canva', 'Adobe XD', 'Sketch', 'User Research & Testing', 'Wireframing & Prototyping'] },
    { group: 'Software Development', items: ['Java', 'Python', 'React framework'] },
    { group: 'Code Editors', items: ['VS Code', 'PyCharm', 'IntelliJ IDEA'] },
    { group: 'Web Development', items: ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'PHP', 'Laravel'] },
    { group: 'XR Development', items: ['Unity', 'XR Interaction Toolkit', 'WebXR'] },
    { group: 'Version Control', items: ['Git'] },
    { group: 'Project Management', items: ['Agile', 'Jira', 'ClickUp'] },
  ],
  soft: ['Critical thinking', 'Problem solving', 'Leadership', 'Public speaking', 'Team coordination', 'Strong commitment', 'Time management', 'Multi-tasking', 'Team spirit'],
}

// Extracurricular (both freelance entries from the CV)
export const experience = [
  {
    title: 'Successful Freelance Portfolio',
    org: 'Freelance UX Design Project',
    period: 'May 2024 – May 2025',
    text: 'Successfully completed multiple freelance projects for clients across Sri Lanka, building a diverse portfolio spanning UX design and front-end development, demonstrating entrepreneurial spirit and technical versatility.',
  },
  {
    title: 'Successful Freelance Portfolio',
    org: 'Freelance programming solutions',
    period: 'May 2024 – May 2025',
    text: 'Delivered high-quality programming solutions for university students, showcasing strong understanding of Python and Java fundamentals, OOP concepts, and problem-solving capabilities.',
  },
]

export const references = [
  { name: 'Mr. Indrajith Ekanayake', role: 'Lecturer at IIT', contact: 'indrajith.e@iit.ac.lk', href: 'mailto:indrajith.e@iit.ac.lk' },
  { name: 'Mr. Ganeshamoorthy Gangatharan', role: 'Director at Northpole (Pvt) Ltd', contact: 'northpoleonline.com', href: 'https://northpoleonline.com' },
]
