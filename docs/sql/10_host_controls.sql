-- ============================================================================
-- 10_host_controls.sql
-- Lets a room's host delete *another* player's room_players row (kick).
-- The existing "Users can remove themselves from a room" policy
-- (docs/sql/04_rls_policies.sql) only ever covers `user_id = auth.uid()`
-- — a player removing their own seat — so kicking someone else needs an
-- additional, separate delete policy rather than a change to that one.
-- ============================================================================

drop policy if exists "Hosts can remove other players from their rooms" on public.room_players;

create policy "Hosts can remove other players from their rooms"
  on public.room_players for delete
  using (public.is_room_host(room_id));
