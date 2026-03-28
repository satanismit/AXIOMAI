-- Create the documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    upload_status TEXT NOT NULL DEFAULT 'processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: To create the 'research-documents' storage bucket, we would typically do it via the Supabase Dashboard
-- or using the following SQL if the storage schema is accessible:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('research-documents', 'research-documents', false);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Setup RLS policies for documents
CREATE POLICY "Users can view their own documents" 
ON public.documents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
ON public.documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.documents FOR DELETE 
USING (auth.uid() = user_id);

-- Setup Storage Policies for research-documents (Requires manual setup in Supabase Dashboard often)
-- CREATE POLICY "Users can upload their own documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'research-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can view their own documents" ON storage.objects FOR SELECT USING (bucket_id = 'research-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete their own documents" ON storage.objects FOR DELETE USING (bucket_id = 'research-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
