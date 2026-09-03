import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const fallbackLocations = [
  ['Gulawat Lotus Valley','Indore'],['Dewas Naka / Niranjanpur','Indore'],['Sukhlia & Vijay Nagar','Indore'],['Bapat Square & MR-10 Crossing','Indore'],['Super Corridor / ISBT','Indore'],['LIG Circle & Anoop Nagar','Indore'],['Janpath & Chappan Dukan','Indore'],['Palasia Square & High Court','Indore'],['Gandhi Hall & MG Road','Indore'],['Regal Square & Central Museum','Indore'],['Bada Ganpati & Krishnapura Chhatris','Indore'],['Rajwada Palace & Sarafa Bazaar','Indore'],['Kanch Mandir & Itwaria Bazaar','Indore'],['Indore Railway Station / Sarwate Bus Stand','Indore'],['Navlakha Square & Kamla Nehru Prani Sangrahalay','Indore'],['Annapurna Temple & Moti Tabela','Indore'],['Lal Bagh Palace & Collectorate','Indore'],['Rajendra Nagar & Choithram Mandi','Indore'],['Pipliyapala Regional Park','Indore'],['Rau Circle & IPS Academy Area','Indore'],['Ralamandal Wildlife Sanctuary','Indore'],['Patalpani Waterfalls & Janapav Kuti','Indore'],['Nagda Hills & Observatory Point','Dewas'],['Rajoda & Rajoda Hills Lake','Dewas'],['Industrial Area Phase 1 & 2','Dewas'],['Shankargarh Hills & Eco-Tourism Park','Dewas'],['Chamunda Nagar & Itawa Area','Dewas'],['Mata Tekri','Dewas'],['Dewas Ropeway Station & Tekri View Point','Dewas'],['Kushabhau Thakre Stadium','Dewas'],['Sayaji Gate & Lal Gate','Dewas'],['Pawar Chhatris','Dewas'],['Meetha Talab','Dewas'],['Dewas Bus Stand & Railway Station','Dewas'],['Bank Note Press (BNP) Campus & Colony','Dewas'],['Kshipra Dam & River Ghats','Dewas']
].map(([name, city]) => ({ id: `local-${name}`, name, city }));

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (query.length < 1) return NextResponse.json([]);
  const supabase = await createClient();
  if (!supabase) return NextResponse.json(fallbackLocations.filter(location => `${location.name} ${location.city}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8));
  const { data, error } = await supabase
    .from('location_zones')
    .select('id,name,cities(name)')
    .eq('is_active', true)
    .ilike('name', `%${query.replace(/[%_]/g, '')}%`)
    .order('display_order')
    .limit(8);
  if (error) return NextResponse.json(fallbackLocations.filter(location => `${location.name} ${location.city}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8));
  return NextResponse.json((data ?? []).map((zone: { id: string; name: string; cities: { name: string }[] }) => ({ id: zone.id, name: zone.name, city: zone.cities?.[0]?.name ?? '' })));
}
