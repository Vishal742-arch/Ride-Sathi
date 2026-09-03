-- Seed Ujjain City and location zones into Supabase database schema
insert into public.cities(name, state, latitude, longitude)
values ('Ujjain', 'Madhya Pradesh', 23.1765, 75.7885)
on conflict(name) do nothing;

insert into public.location_zones(city_id, name, display_order)
select c.id, z.name, z.ord
from public.cities c
cross join (values
  ('Mahakaleshwar Jyotirlinga Temple & Corridor (Mahakal Lok)', 1),
  ('Ram Ghat & Kshipra River Ghats', 2),
  ('Ujjain Junction Railway Station & Bus Stand', 3),
  ('Kal Bhairav Temple & Bhairavgarh', 4),
  ('Harsiddhi Temple & Chintaman Ganesh', 5),
  ('Mangalnath Temple & Planetarium', 6),
  ('Sandipani Ashram & Ankapat', 7),
  ('Gopal Mandir & Tower Square', 8),
  ('Nania Vada & Freeganj Main Market', 9),
  ('Vikram University & Kothari Palace', 10),
  ('Nanakheda Bus Stand & Dewas Road Crossing', 11),
  ('Gadkalika Temple & Bhartrihari Caves', 12),
  ('Vedh Shala (Jantar Mantar Observatory)', 13),
  ('Siddhavat & Kaliadeh Palace', 14),
  ('Indore Road Bypass & Nanukheda', 15),
  ('Rishi Nagar & Sethi Nagar Area', 16)
) as z(name, ord)
where c.name = 'Ujjain'
on conflict(city_id, name) do nothing;
