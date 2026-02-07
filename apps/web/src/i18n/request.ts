import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
const locales = ['en', 'hi'];

export default getRequestConfig(async () => {
  const locale = 'en'; // Default to English for now as per user request

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
