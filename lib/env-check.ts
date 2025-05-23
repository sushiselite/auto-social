export interface EnvStatus {
  supabase: boolean
  anthropic: boolean
  openai: boolean
  all: boolean
}

export function checkEnvVars(): EnvStatus {
  const supabase = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  const anthropic = !!process.env.ANTHROPIC_API_KEY
  const openai = !!process.env.OPENAI_API_KEY
  
  return {
    supabase,
    anthropic,
    openai,
    all: supabase && anthropic && openai
  }
}

export function getEnvMessage(status: EnvStatus): string {
  if (status.all) {
    return "🎉 All API keys configured! Real agent functionality is active."
  }
  
  const missing = []
  if (!status.supabase) missing.push("Supabase")
  if (!status.anthropic) missing.push("Anthropic")
  if (!status.openai) missing.push("OpenAI")
  
  return `⚠️ Demo mode active. Missing: ${missing.join(", ")}. Visit the setup guide to configure.`
} 