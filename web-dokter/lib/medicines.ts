import { supabase, Medicine } from './supabase'

export async function getMedicines(): Promise<Medicine[]> {
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .eq('is_active', true)
    .eq('form', 'tablet')
    .order('name')

  if (error) {
    console.error('Error fetching medicines:', error)
    return []
  }

  return data || []
}

export async function searchMedicines(query: string): Promise<Medicine[]> {
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .eq('is_active', true)
    .eq('form', 'tablet')
    .or(`name.ilike.%${query}%,generic_name.ilike.%${query}%`)
    .order('name')
    .limit(10)

  if (error) {
    console.error('Error searching medicines:', error)
    return []
  }

  return data || []
}
