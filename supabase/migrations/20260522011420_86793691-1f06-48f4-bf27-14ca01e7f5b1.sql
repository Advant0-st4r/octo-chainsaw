
revoke execute on function public.match_user_chunks(vector, int, float) from public, anon;
grant execute on function public.match_user_chunks(vector, int, float) to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
