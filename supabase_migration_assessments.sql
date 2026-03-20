-- Migration script for Skills Assessments, Exams, and Course Transcripts

-- 1. Extend the lessons structure in courses (if stored as JSONB, this is just for reference, but let's ensure we note it).
-- The 'courses' table already uses JSONB for 'curriculum'. We don't need to alter the schema for the course builder itself
-- because it just stores JSON, but we will update the frontend to save `transcript_text` and `exam_data` in that JSON!

-- 2. Skills Assessments Tables (For the /dashboard/skills page)
CREATE TABLE IF NOT EXISTS public.skills_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    duration TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.skills_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES public.skills_assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings
    correct_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.skills_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES public.skills_assessments(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    level_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.skills_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_results ENABLE ROW LEVEL SECURITY;

-- Policies for skills_assessments (Public Read)
CREATE POLICY "Assessments are viewable by everyone" ON public.skills_assessments FOR SELECT USING (true);

-- Policies for skills_questions (Public Read)
CREATE POLICY "Questions are viewable by everyone" ON public.skills_questions FOR SELECT USING (true);

-- Policies for skills_results (Users can view and insert their own results)
CREATE POLICY "Users can view their own assessment results" ON public.skills_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assessment results" ON public.skills_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert initial mockup data into the real tables so the platform isn't empty!
INSERT INTO public.skills_assessments (id, title, category, duration, icon_name) VALUES
('b0e2716c-1111-40b5-9b22-444444444441', 'Data Analytics', 'Data Science', '10 min', 'BarChart3'),
('b0e2716c-2222-40b5-9b22-444444444442', 'Leadership & Management', 'Leadership', '8 min', 'Users'),
('b0e2716c-3333-40b5-9b22-444444444443', 'Digital Marketing', 'Marketing', '8 min', 'Smartphone'),
('b0e2716c-4444-40b5-9b22-444444444444', 'Financial Literacy', 'Finance', '8 min', 'DollarSign')
ON CONFLICT DO NOTHING;

INSERT INTO public.skills_questions (assessment_id, question_text, options, correct_index) VALUES
('b0e2716c-1111-40b5-9b22-444444444441', 'Which function in Excel is used to look up a value in a table?', '["SUMIF", "VLOOKUP", "COUNTIF", "INDEX"]', 1),
('b0e2716c-1111-40b5-9b22-444444444441', 'What does SQL stand for?', '["Structured Query Language", "Simple Query Logic", "System Query Language", "Standard Query Library"]', 0),
('b0e2716c-2222-40b5-9b22-444444444442', 'What is the primary role of a transformational leader?', '["Maintain status quo", "Inspire and motivate change", "Enforce rules strictly", "Delegate all decisions"]', 1),
('b0e2716c-3333-40b5-9b22-444444444443', 'What does SEO stand for?', '["Social Engine Optimization", "Search Engine Optimization", "System Email Outreach", "Site Engagement Operations"]', 1),
('b0e2716c-4444-40b5-9b22-444444444444', 'What is compound interest?', '["Interest on the principal only", "Interest on both principal and accumulated interest", "A fixed interest rate", "Interest paid monthly"]', 1);

-- Note: Only a few sample questions were migrated for brevity. Admins can add more later.
