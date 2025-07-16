import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import deMessages from '@/messages/de.json'
import enMessages from '@/messages/en.json'

const messages = {
  de: deMessages,
  en: enMessages
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value || 'de'

  return {
    locale,
    messages: messages[locale as keyof typeof messages] || messages.de
  }
})
