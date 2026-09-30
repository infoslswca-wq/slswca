-- Member clubs (mirrors packages/core/src/content/clubs.ts)
insert into public.clubs (slug, name) values
  ('powertain-calisthenics', 'Powertain Calisthenics'),
  ('arcade-calisthenics', 'Arcade Calisthenics'),
  ('fitness-for-life', 'Fitness for Life'),
  ('nsbm-calisthenics-club', 'NSBM Calisthenics Club'),
  ('soul-lifters', 'Soul Lifters'),
  ('kalos-sthenos', 'Kalos Sthenos'),
  ('street-pump', 'Street Pump'),
  ('calisthenics-cartel', 'Calisthenics Cartel'),
  ('calisthenics-lk', 'Calisthenics LK'),
  ('mount-beach-cc', 'Mount Beach CC'),
  ('visal-gymnastx', 'Visal Gymnastx')
on conflict (slug) do nothing;
