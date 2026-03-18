-- Function to get total views across all articles (server-side aggregation)
-- This avoids the Supabase default row limit issue when summing views client-side

CREATE OR REPLACE FUNCTION public.get_total_views()
RETURNS BIGINT AS $$
BEGIN
  RETURN (SELECT COALESCE(SUM(views), 0) FROM public.noticias);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_total_views() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_total_views() TO anon;
