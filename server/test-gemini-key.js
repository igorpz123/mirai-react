// Script de teste para validar a API Key do Google Gemini
// Execute: node test-gemini-key.js

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'COLE_SUA_CHAVE_AQUI'

async function testGeminiKey() {
  console.log('🔍 Testando API Key do Google Gemini...\n')
  
  // Validar formato da chave
  console.log('1️⃣ Validando formato da chave:')
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'COLE_SUA_CHAVE_AQUI') {
    console.log('❌ API Key não configurada!')
    console.log('   Configure GEMINI_API_KEY no arquivo .env ou cole diretamente neste script.\n')
    return
  }
  
  console.log(`   Chave: ${GEMINI_API_KEY.substring(0, 10)}...`)
  console.log(`   Tamanho: ${GEMINI_API_KEY.length} caracteres`)
  
  if (GEMINI_API_KEY.startsWith('AIzaSy')) {
    console.log('   ✅ Formato correto (começa com AIzaSy)\n')
  } else {
    console.log('   ⚠️  Formato suspeito (deveria começar com AIzaSy)')
    console.log('   Certifique-se de gerar em https://aistudio.google.com/app/apikey\n')
  }
  
  // Testar requisição
  console.log('2️⃣ Testando requisição à API:')
  
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
  
  const body = {
    contents: [{
      parts: [{
        text: 'Responda apenas: OK'
      }]
    }]
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('   ✅ API Key válida!')
      console.log('   Resposta da IA:', data.candidates[0].content.parts[0].text)
      console.log('\n🎉 Teste concluído com sucesso! Sua chave está funcionando.\n')
    } else {
      console.log('   ❌ Erro na requisição:')
      console.log(`   Status: ${response.status}`)
      console.log(`   Mensagem: ${data.error?.message || JSON.stringify(data, null, 2)}`)
      
      if (response.status === 401) {
        console.log('\n💡 Solução:')
        console.log('   1. Acesse: https://aistudio.google.com/app/apikey')
        console.log('   2. Gere uma nova API Key')
        console.log('   3. A chave deve começar com "AIzaSy"')
        console.log('   4. Cole a nova chave no arquivo server/.env\n')
      } else if (response.status === 429) {
        console.log('\n💡 Você excedeu o limite de requisições. Aguarde alguns minutos.\n')
      }
    }
  } catch (error) {
    console.log('   ❌ Erro de conexão:', error.message)
    console.log('\n💡 Verifique sua conexão com a internet.\n')
  }
}

testGeminiKey()
