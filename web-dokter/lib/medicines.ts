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

// Cari obat berdasarkan array nama (untuk template)
export async function getMedicinesByNames(names: string[]): Promise<Medicine[]> {
  const results: Medicine[] = []
  
  for (const name of names) {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('is_active', true)
      .eq('form', 'tablet')
      .ilike('name', `%${name}%`)
      .limit(1)
      .single()

    if (!error && data) {
      results.push(data)
    }
  }

  return results
}
