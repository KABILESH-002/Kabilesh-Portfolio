// "How it works" scroll stories for every project. Each step = one screen of scrolling.
// Text stays faithful to what the CV says each project does.

export const STORIES = {
  slopeguard: [
    { title: 'Rain builds up', text: 'Landslides follow rain that accumulates over days. SlopeGuard AI reads rainfall patterns and how they change, using antecedent windows instead of a single day’s total.' },
    { title: 'Risk emerges', text: 'Terrain and rainfall go into a rainfall-adaptive model (Random Forest and XGBoost, explained with SHAP and calibrated), tested against rainfall-threshold and logistic-regression baselines.' },
    { title: 'Routing under uncertainty', text: 'The shortest way to the shelter crosses the riskiest slope. A risk-aware route penalises expected exposure and its worst-case tail, trading a little distance for a much safer path.' },
    { title: 'Communicating the risk', text: 'The research prototype shows susceptibility on a map and suggests safer routes, so people can understand potential landslide risk before they move.' },
  ],
  scheduler: [
    { title: 'Built for every level', text: 'An educational web platform for school students from Grade 6 all the way to A/L. Students start from their own level and subjects.' },
    { title: 'Ask anything', text: 'A personalised AI chatbot sits at the centre. Students ask education-related questions in their own words, any time they get stuck.' },
    { title: 'Help that fits the student', text: 'Answers are shaped around the student’s grade and subject, giving learning support rather than just a reply.' },
    { title: 'Student-focused, accessible', text: 'A calm, student-focused digital learning experience designed to make academic help more accessible, on any screen.' },
  ],
  weather: [
    { title: 'Clear at a glance', text: 'A responsive weather website concept that puts the essentials first: temperature, conditions and what to expect, readable in a second.' },
    { title: 'Charts & graphs', text: 'Hourly temperature and rain probability come alive as interactive charts and graphs, built with React, vanilla CSS and JavaScript.' },
    { title: 'Map concepts', text: 'A rain-radar style map concept gives the forecast a sense of place, so users see where the weather is coming from.' },
    { title: 'Responsive by design', text: 'The same interface reflows from a wide desktop dashboard to a focused phone layout without losing clarity.' },
  ],
  hunger: [
    { title: 'Research & competitive analysis', text: 'It started with people: user research with donors and people in need, plus a competitive analysis of existing food-sharing ideas.' },
    { title: 'Personas, flows & IA', text: 'Findings became user personas, user flows and an information architecture that keeps donating and requesting food to a few clear steps.' },
    { title: 'Wireframes to high fidelity', text: 'Low-fidelity wireframes tested the structure first, then evolved into high-fidelity mockups with a warm, trustworthy visual language.' },
    { title: 'An accessible prototype', text: 'Interactive prototypes connect a food donor to someone nearby who needs it, designed for accessibility and ease of use.' },
  ],
  hydro: [
    { title: 'Track water usage', text: 'An environmental-awareness app that makes water use visible, with daily and weekly usage tracking against a personal goal.' },
    { title: 'Conservation guidance', text: 'Small, practical tips turn awareness into habits, nudging people towards saving water every day.' },
    { title: 'Gamification', text: 'Streaks, badges and goals reward conservation, so saving water feels like progress instead of a chore.' },
    { title: 'Emergency alerts', text: 'When it matters, clear alert layouts and emergency notifications tell people exactly what is happening and what to do next.' },
  ],
}
