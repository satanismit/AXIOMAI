-- Create the saved_ideas table
CREATE TABLE IF NOT EXISTS public.saved_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    problem TEXT,
    solution TEXT,
    target_users TEXT,
    tech_stack TEXT,
    source_papers JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.saved_ideas ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own saved ideas"
ON public.saved_ideas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved ideas"
ON public.saved_ideas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved ideas"
ON public.saved_ideas FOR DELETE
USING (auth.uid() = user_id);
