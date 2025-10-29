// Helper to get doctors via edge function (bypasses RLS)
export async function getFirstDoctor(): Promise<string | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get_doctors`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch doctors:', await response.text())
      return null
    }

    const data = await response.json()
    return data?.doctors?.[0]?.id || null
  } catch (error) {
    console.error('Error fetching doctors:', error)
    return null
  }
}
