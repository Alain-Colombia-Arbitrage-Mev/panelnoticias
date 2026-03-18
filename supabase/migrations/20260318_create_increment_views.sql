-- Create the increment_views function for the noticias table
-- This function is called from the app via supabase.rpc('increment_views', { noticia_id: id })

CREATE OR REPLACE FUNCTION public.increment_views(noticia_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.noticias
  SET views = views + 1
  WHERE id = noticia_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_views(UUID) TO anon;
