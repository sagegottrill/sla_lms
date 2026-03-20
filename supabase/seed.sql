-- ============================================================
-- SLA CONNECTA LMS — Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- COURSES (9 courses)
-- ============================================================
insert into public.courses (
  id, title, subtitle, instructor, instructor_title, instructor_bio, instructor_avatar,
  category, level, rating, review_count, students, duration, language, last_updated,
  price, original_price, image, badge, bestseller,
  what_youll_learn, curriculum, reviews, status
) values

(1,
  'Data Analytics with Python & Power BI',
  'Master data analysis from Excel to Python to Power BI dashboards — Africa''s most popular data course.',
  'Dr. Amara Osei', 'Lead Data Scientist, Ghanaian Innovation Lab',
  'Former Google data scientist with 12+ years of experience. Has trained over 20,000 students across Africa.',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face',
  'Data Science', 'Intermediate', 4.9, 2340, 8420, '32h', 'English', 'February 2026',
  75000, 150000,
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=220&fit=crop',
  'Bestseller', true,
  '["Analyse real-world datasets using Python (Pandas, NumPy)", "Build interactive Power BI dashboards from scratch", "Perform statistical analysis and hypothesis testing", "Create compelling data visualisations with Matplotlib & Seaborn", "Automate data cleaning and transformation pipelines", "Present data insights to non-technical stakeholders"]',
  '[{"module":"Module 1: Introduction to Data Analytics","lessons":6,"duration":"2h 30m","items":["What is data analytics?","The data analyst role in African businesses","Setting up Python & Jupyter","Your first dataset","Quiz: Foundations"]},{"module":"Module 2: Python for Data Analysis","lessons":10,"duration":"5h 15m","items":["Python basics refresher","NumPy fundamentals","Pandas DataFrames","Data loading & exploration","Data cleaning techniques","Handling missing values","Data merging & joins","Aggregation & groupby","Time series basics","Module project"]},{"module":"Module 3: Statistics for Data Analysts","lessons":8,"duration":"4h 00m","items":["Descriptive statistics","Probability fundamentals","Distributions","Hypothesis testing","Correlation & regression","A/B testing","Statistical storytelling","Module quiz"]},{"module":"Module 4: Data Visualisation","lessons":9,"duration":"4h 45m","items":["Matplotlib deep dive","Seaborn for statistical plots","Plotly interactive charts","Chart selection guide","Storytelling with data","Dashboard design principles","Colour for data","Accessibility in viz","Capstone project"]},{"module":"Module 5: Power BI Mastery","lessons":12,"duration":"6h 30m","items":["Power BI setup","Importing data","Data modelling in Power BI","DAX formulas","Building reports","Interactive dashboards","Publishing & sharing","Mobile layouts","Performance tips","Real business project","Final capstone","Certificate!"]}]',
  '[{"name":"Chioma Eze","rating":5,"comment":"Best investment I''ve made in my career. Got promoted 3 months after completing this!","date":"Jan 2026"},{"name":"Fatima Hassan","rating":5,"comment":"The Power BI section alone is worth 10x the price. Dr. Amara explains everything so clearly.","date":"Dec 2025"},{"name":"Grace Mensah","rating":4,"comment":"Excellent content. Would love more African business case studies but overall top-notch.","date":"Nov 2025"}]',
  'published'
),

(2,
  'Digital Marketing & Brand Strategy',
  'Learn to build a brand from scratch and master digital marketing across social media, SEO, and paid ads.',
  'Aisha Kamara', 'CMO, Flutterwave',
  '10+ years in digital marketing, led campaigns for MTN, Jumia, and Flutterwave reaching millions across Africa.',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face',
  'Marketing', 'Beginner', 4.8, 1456, 5310, '22h', 'English', 'January 2026',
  65000, 110000,
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=220&fit=crop',
  'Popular', false,
  '["Build a brand identity from scratch","Master social media marketing across platforms","Create high-converting ad campaigns","SEO fundamentals for organic growth","Content marketing strategy","Analytics and campaign measurement"]',
  '[{"module":"Module 1: Brand Foundations","lessons":6,"duration":"3h","items":["What is a brand?","Brand identity design","Your brand story","Competitor analysis","Target audience","Brand voice"]},{"module":"Module 2: Social Media Marketing","lessons":8,"duration":"4h 30m","items":["Platform strategy","Content creation","Instagram mastery","LinkedIn for B2B","Twitter/X strategy","TikTok marketing","Community building","Social analytics"]},{"module":"Module 3: SEO & Content","lessons":7,"duration":"4h","items":["SEO fundamentals","Keyword research","On-page optimization","Content strategy","Blogging for business","Email marketing","Module project"]},{"module":"Module 4: Paid Advertising","lessons":8,"duration":"5h","items":["Facebook Ads","Google Ads","Budget allocation","A/B testing ads","Retargeting","Campaign optimization","ROI tracking","Capstone"]}]',
  '[{"name":"Zara Mensah","rating":5,"comment":"Aisha is incredible. I grew my Instagram from 500 to 15K followers using her strategies.","date":"Feb 2026"},{"name":"Nkechi Adeyemi","rating":5,"comment":"The SEO module alone was worth the price. My website traffic tripled!","date":"Jan 2026"},{"name":"Amina Diallo","rating":4,"comment":"Great content, wish there was more on WhatsApp marketing for African markets.","date":"Dec 2025"}]',
  'published'
),

(3,
  'Women in Leadership: From Manager to CEO',
  'The definitive leadership program for ambitious African women ready to break through the glass ceiling.',
  'CEO Ngozi Williams', 'CEO, She Leads Africa',
  'Named Forbes 30 Under 30 Africa. Built SLA into the continent''s largest community for professional women.',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face',
  'Leadership', 'Advanced', 5.0, 2103, 12000, '18h', 'English', 'March 2026',
  0, null,
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=220&fit=crop',
  'Free', true,
  '["Executive presence and communication","Strategic thinking and decision-making","Building and leading high-performing teams","Negotiation and conflict resolution","Financial literacy for leaders","Personal branding for executives"]',
  '[{"module":"Module 1: Leadership Mindset","lessons":5,"duration":"2h 30m","items":["The leadership gap","Imposter syndrome","Growth mindset","Vision setting","Quiz"]},{"module":"Module 2: Communication & Influence","lessons":6,"duration":"3h","items":["Executive presence","Public speaking","Stakeholder management","Negotiation tactics","Difficult conversations","Module project"]},{"module":"Module 3: Strategic Leadership","lessons":7,"duration":"4h","items":["Strategic thinking","Decision frameworks","Team building","Performance management","Change management","Innovation leadership","Capstone"]},{"module":"Module 4: Career Acceleration","lessons":6,"duration":"3h","items":["Personal branding","Board readiness","Sponsorship vs mentorship","Salary negotiation","Work-life integration","Your leadership plan"]}]',
  '[{"name":"Dr. Kofi Asante","rating":5,"comment":"This course should be mandatory for every aspiring leader in Africa. Ngozi is a phenomenal teacher.","date":"Mar 2026"},{"name":"Amara Osei","rating":5,"comment":"I got my first board seat 4 months after completing this program. Life-changing!","date":"Feb 2026"},{"name":"Fatima Al-Hassan","rating":5,"comment":"The negotiation module helped me secure a 40% salary increase. Incredible value for a free course.","date":"Jan 2026"}]',
  'published'
),

(4,
  'Financial Modelling & Investment Analysis',
  'Build professional financial models in Excel and Python. Learn to value companies and make investment decisions.',
  'Chioma Eze, CFA', 'Investment Analyst, African Development Bank',
  'CFA charterholder with experience at Goldman Sachs and the African Development Bank. Specializes in emerging market finance.',
  'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=80&h=80&fit=crop&crop=face',
  'Finance', 'Intermediate', 4.7, 780, 3200, '26h', 'English', 'December 2025',
  85000, 130000,
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=220&fit=crop',
  'New', false,
  '["Build 3-statement financial models from scratch","Discounted Cash Flow (DCF) valuation","Comparable company analysis","Merger & acquisition modelling","Sensitivity analysis and scenarios","Investment memo writing"]',
  '[{"module":"Module 1: Financial Foundations","lessons":6,"duration":"3h","items":["Accounting refresher","Income statement","Balance sheet","Cash flow statement","Financial ratios","Quiz"]},{"module":"Module 2: Excel Modelling","lessons":8,"duration":"5h","items":["Excel best practices","Building assumptions","Revenue modelling","Cost structure","Working capital","Debt schedule","3-statement model","Module project"]},{"module":"Module 3: Valuation","lessons":7,"duration":"4h 30m","items":["Valuation overview","DCF methodology","WACC calculation","Terminal value","Comps analysis","Precedent transactions","Capstone"]},{"module":"Module 4: Advanced Topics","lessons":6,"duration":"4h","items":["M&A modelling","LBO basics","Sensitivity tables","Scenario analysis","Investment memo","Final project"]}]',
  '[{"name":"Grace Mensah","rating":5,"comment":"The DCF module is the best I''ve seen anywhere. Chioma makes complex topics simple.","date":"Feb 2026"},{"name":"Nkechi Adeyemi","rating":4,"comment":"Great course for aspiring investment bankers. The Excel templates are a goldmine.","date":"Jan 2026"}]',
  'published'
),

(5,
  'Full-Stack Web Development Bootcamp',
  'Go from zero to building full-stack web apps with React, Node.js, and PostgreSQL.',
  'Fatima Al-Hassan', 'Senior Engineer, Andela',
  'Full-stack engineer at Andela with 8+ years of experience. Mentor to 500+ aspiring developers across Africa.',
  'https://images.unsplash.com/photo-1611432579699-484f7990b127?w=80&h=80&fit=crop&crop=face',
  'Technology', 'Beginner', 4.8, 956, 9100, '48h', 'English', 'February 2026',
  120000, 200000,
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=220&fit=crop',
  'Hot', true,
  '["HTML, CSS, and modern JavaScript (ES6+)","React with hooks and state management","Node.js and Express REST APIs","PostgreSQL database design","Authentication and authorization","Deployment to production"]',
  '[{"module":"Module 1: HTML & CSS","lessons":10,"duration":"6h","items":["HTML fundamentals","CSS basics","Flexbox","Grid","Responsive design","Accessibility","CSS frameworks","Landing page project","Portfolio project","Quiz"]},{"module":"Module 2: JavaScript","lessons":12,"duration":"8h","items":["Variables & types","Functions","Arrays & objects","DOM manipulation","Events","Async/Await","Fetch API","ES6+ features","Error handling","Modules","Project","Quiz"]},{"module":"Module 3: React","lessons":14,"duration":"10h","items":["React intro","Components","Props","State","Hooks","useEffect","Forms","React Router","Context API","API integration","Styling","Testing","Full app project","Quiz"]},{"module":"Module 4: Backend & Deployment","lessons":12,"duration":"9h","items":["Node.js basics","Express","REST API design","PostgreSQL","Prisma ORM","Authentication","File uploads","Error handling","Testing","Docker basics","Deployment","Final capstone"]}]',
  '[{"name":"Amara Osei","rating":5,"comment":"Went from zero coding experience to landing a junior dev role in 6 months!","date":"Mar 2026"},{"name":"Zara Mensah","rating":5,"comment":"The best bootcamp-style course online. The projects are incredibly practical.","date":"Feb 2026"},{"name":"Chioma Eze","rating":4,"comment":"Comprehensive course. The React section is outstanding.","date":"Jan 2026"}]',
  'published'
),

(6,
  'Entrepreneurship & Business Modeling',
  'Turn your idea into a viable business. Learn startup methodology, fundraising, and scaling in African markets.',
  'Zara Mensah', 'Founder & CEO, AfriTech Ventures',
  'Serial entrepreneur who raised ₦5M for her edtech startup. Y Combinator alumna and mentor at Techstars Lagos.',
  'https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=80&h=80&fit=crop&crop=face',
  'Business', 'Intermediate', 4.9, 1867, 6750, '28h', 'English', 'January 2026',
  85000, 160000,
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=220&fit=crop',
  'Top Rated', false,
  '["Validate business ideas using lean methodology","Build a business model canvas","Create financial projections","Pitch to investors confidently","Fundraising strategy for African startups","Scaling operations and building a team"]',
  '[{"module":"Module 1: Ideation & Validation","lessons":7,"duration":"4h","items":["Problem identification","Customer discovery","Market research","MVP design","Lean canvas","User testing","Quiz"]},{"module":"Module 2: Business Model Design","lessons":8,"duration":"5h","items":["Revenue models","Pricing strategy","Unit economics","Market sizing (TAM/SAM/SOM)","Competitive analysis","Value proposition","Business model canvas","Module project"]},{"module":"Module 3: Fundraising","lessons":7,"duration":"4h","items":["Funding landscape in Africa","Angel vs VC","Pitch deck creation","Financial projections","Term sheets","Due diligence","Pitch practice"]},{"module":"Module 4: Growth & Scale","lessons":8,"duration":"5h","items":["Growth hacking","Operations","Team building","Legal & compliance","Partnerships","Metrics that matter","Scaling playbook","Final capstone"]}]',
  '[{"name":"Amina Diallo","rating":5,"comment":"Zara''s fundraising module helped me raise my pre-seed round. Invaluable!","date":"Feb 2026"},{"name":"Fatima Hassan","rating":5,"comment":"The business model canvas workshop completely changed how I think about my startup.","date":"Jan 2026"}]',
  'published'
),

(7,
  'Public Health & Community Development',
  'Design and implement health interventions that create lasting impact in African communities.',
  'Dr. Kofi Asante', 'Director of Programs, WHO Africa',
  'Public health expert with 15+ years at WHO and UNICEF. Has led health programs across 12 African countries.',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=80&h=80&fit=crop&crop=face',
  'Health', 'Beginner', 4.6, 520, 2100, '20h', 'English', 'November 2025',
  60000, null,
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=220&fit=crop',
  'New', false,
  '["Design community health interventions","Epidemiology fundamentals","Program monitoring and evaluation","Grant writing for health programs","Behaviour change communication","Data-driven health decision-making"]',
  '[{"module":"Module 1: Public Health Foundations","lessons":6,"duration":"3h","items":["Global health landscape","Health systems in Africa","Epidemiology basics","Disease burden","Health equity","Quiz"]},{"module":"Module 2: Program Design","lessons":7,"duration":"4h","items":["Needs assessment","Logic models","Intervention design","Behaviour change","Community engagement","Partnerships","Module project"]},{"module":"Module 3: Implementation","lessons":6,"duration":"3h 30m","items":["Project management","M&E frameworks","Data collection","Quality assurance","Supply chain","Case study"]},{"module":"Module 4: Funding & Sustainability","lessons":5,"duration":"3h","items":["Funding landscape","Grant writing","Budget management","Sustainability planning","Final project"]}]',
  '[{"name":"Grace Mensah","rating":5,"comment":"Dr. Asante brings real-world experience that you can''t find in textbooks.","date":"Jan 2026"},{"name":"Amara Osei","rating":4,"comment":"Great introduction to public health. The grant writing section is very practical.","date":"Dec 2025"}]',
  'published'
),

(8,
  'UX/UI Design for African Markets',
  'Design beautiful, accessible digital products that work for African users across diverse contexts.',
  'Nkechi Adeyemi', 'Head of Design, Paystack',
  'Award-winning designer who has shaped the UX of Africa''s leading fintech products. Previously at Google and Microsoft.',
  'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=80&h=80&fit=crop&crop=face',
  'Design', 'Intermediate', 4.9, 890, 4300, '30h', 'English', 'January 2026',
  80000, null,
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=220&fit=crop',
  'Bestseller', true,
  '["User research for diverse African markets","Wireframing and prototyping in Figma","Interaction design principles","Design systems and component libraries","Accessibility and inclusive design","Usability testing and iteration"]',
  '[{"module":"Module 1: UX Foundations","lessons":7,"duration":"4h","items":["What is UX?","User-centered design","Research methods","Personas","User journeys","Information architecture","Quiz"]},{"module":"Module 2: UI Design in Figma","lessons":10,"duration":"7h","items":["Figma setup","Layout & grids","Typography","Colour theory","Components","Auto layout","Variants","Prototyping","Design tokens","Module project"]},{"module":"Module 3: Design for Africa","lessons":7,"duration":"5h","items":["Low-bandwidth design","Offline-first patterns","USSD & SMS design","Multilingual UX","Mobile money UX","Cultural considerations","Case studies"]},{"module":"Module 4: Testing & Iteration","lessons":6,"duration":"4h","items":["Usability testing","A/B testing","Analytics for designers","Iteration cycles","Design handoff","Portfolio project"]}]',
  '[{"name":"Zara Mensah","rating":5,"comment":"Nkechi''s approach to designing for African contexts is unique and invaluable.","date":"Feb 2026"},{"name":"Chioma Eze","rating":5,"comment":"The Figma tutorials are the best I''ve found. My design skills improved dramatically.","date":"Jan 2026"}]',
  'published'
),

(9,
  'Supply Chain & Logistics Management',
  'Optimize supply chain operations for African businesses. From procurement to last-mile delivery.',
  'Grace Mensah', 'VP Operations, Jumia',
  'Operations leader who built Jumia''s logistics network across West Africa. Expert in last-mile delivery optimization.',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=80&h=80&fit=crop&crop=face',
  'Business', 'Advanced', 4.7, 420, 1800, '24h', 'English', 'October 2025',
  85000, null,
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=220&fit=crop',
  'New', false,
  '["Supply chain strategy and design","Procurement and vendor management","Inventory optimization","Logistics and distribution","Technology in supply chain (IoT, AI)","Risk management and resilience"]',
  '[{"module":"Module 1: Supply Chain Fundamentals","lessons":6,"duration":"3h","items":["Supply chain overview","Value chain analysis","Supply chain design","Demand forecasting","African supply chain challenges","Quiz"]},{"module":"Module 2: Procurement & Inventory","lessons":7,"duration":"4h","items":["Strategic sourcing","Vendor management","Negotiation","Inventory models","Safety stock","ABC analysis","Module project"]},{"module":"Module 3: Logistics & Distribution","lessons":7,"duration":"4h 30m","items":["Transportation modes","Route optimization","Warehousing","Last-mile delivery","Cross-border logistics","Cold chain","Case study"]},{"module":"Module 4: Technology & Innovation","lessons":6,"duration":"4h","items":["Supply chain tech","IoT applications","AI in logistics","Blockchain","Sustainability","Final capstone"]}]',
  '[{"name":"Amina Diallo","rating":5,"comment":"Grace''s experience at Jumia brings unmatched practical insights.","date":"Jan 2026"},{"name":"Fatima Hassan","rating":4,"comment":"Excellent coverage of African-specific logistics challenges.","date":"Nov 2025"}]',
  'published'
);

-- Reset sequence so next inserted course starts at id = 10
select setval('public.courses_id_seq', 9, true);


-- ============================================================
-- PROGRAMS (5 programs)
-- ============================================================
insert into public.programs (
  id, title, description, category, image, duration,
  start_date, price, enrolled, capacity, highlights, status
) values

(1,
  'Women in Data Science 2026',
  '12-week intensive cohort program covering Python, SQL, data visualization, and machine learning with real-world projects.',
  'Data Science',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
  '12 weeks', '2026-04-14', 300000, 145, 200,
  '["Live mentoring sessions","Real company datasets","Certificate from SLA","Job placement support"]',
  'active'
),

(2,
  'Startup Founders Accelerator',
  '10-week program for women building tech startups. Get mentorship, funding connections, and a demo day pitch.',
  'Business',
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=250&fit=crop',
  '10 weeks', '2026-05-01', 500000, 80, 100,
  '["1-on-1 mentorship","Investor pitch day","Legal & accounting support","$5K in cloud credits"]',
  'upcoming'
),

(3,
  'Leadership Excellence Program',
  '8-week executive leadership cohort for mid-senior women leaders ready to step into C-suite roles.',
  'Leadership',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=250&fit=crop',
  '8 weeks', '2026-04-07', 400000, 60, 60,
  '["Executive coaching","Board simulation","CEO roundtable","Lifetime alumni access"]',
  'active'
),

(4,
  'Digital Marketing Masterclass',
  '6-week hands-on program covering social media, SEO, paid ads, and analytics for African businesses.',
  'Marketing',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
  '6 weeks', '2026-03-24', 200000, 120, 150,
  '["Real campaign budget","Agency simulation","Google certification prep","Portfolio building"]',
  'active'
),

(5,
  'Full-Stack Developer Bootcamp',
  '16-week intensive bootcamp taking you from zero to job-ready full-stack developer.',
  'Technology',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop',
  '16 weeks', '2026-06-01', 600000, 90, 120,
  '["Daily pair programming","Code reviews","3 portfolio projects","Hiring partner network"]',
  'upcoming'
);

select setval('public.programs_id_seq', 5, true);


-- ============================================================
-- JOBS (6 jobs)
-- ============================================================
insert into public.jobs (
  id, title, company, location, type, salary, skills, posted, logo, description
) values

(1, 'Data Analyst', 'Flutterwave',
  'Lagos, Nigeria (Remote)', 'Full-time', '₦12M – ₦18M/yr',
  '["Python","SQL","Power BI","Data Analytics"]',
  '2 days ago', 'https://logo.clearbit.com/flutterwave.com',
  'Join our data team to analyze transaction patterns and build dashboards that drive business decisions.'
),

(2, 'Frontend Developer', 'Andela',
  'Nairobi, Kenya (Hybrid)', 'Full-time', '₦15M – ₦25M/yr',
  '["React","TypeScript","CSS","Git"]',
  '1 day ago', 'https://logo.clearbit.com/andela.com',
  'Build beautiful, accessible web applications for our global client portfolio.'
),

(3, 'Marketing Manager', 'MTN',
  'Accra, Ghana', 'Full-time', '₦10M – ₦15M/yr',
  '["Digital Marketing","SEO","Brand Strategy","Analytics"]',
  '3 days ago', 'https://logo.clearbit.com/mtn.com',
  'Lead digital marketing campaigns across West Africa for MTN''s consumer products.'
),

(4, 'Product Designer', 'Paystack',
  'Lagos, Nigeria (Remote)', 'Full-time', '₦12M – ₦20M/yr',
  '["Figma","UX Research","UI Design","Prototyping"]',
  '5 days ago', 'https://logo.clearbit.com/paystack.com',
  'Shape the future of payments in Africa by designing intuitive payment experiences.'
),

(5, 'Financial Analyst', 'Access Bank',
  'Lagos, Nigeria', 'Full-time', '₦8M – ₦15M/yr',
  '["Financial Modelling","Excel","Valuation","SQL"]',
  '1 week ago', 'https://logo.clearbit.com/accessbankplc.com',
  'Build financial models and conduct analysis to support lending and investment decisions.'
),

(6, 'Program Coordinator', 'Microsoft (ADC)',
  'Nairobi, Kenya (Hybrid)', 'Contract', '₦10M – ₦15M/yr',
  '["Project Management","Communication","Data Analysis"]',
  '4 days ago', 'https://logo.clearbit.com/microsoft.com',
  'Coordinate developer programs and community initiatives across the Africa Development Center.'
);

select setval('public.jobs_id_seq', 6, true);
