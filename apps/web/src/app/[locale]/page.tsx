import { redirect } from 'next/navigation';

import {useTranslations} from 'next-intl';

export default function Home() {
  const t = useTranslations('Common');
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">{t('title')}</h1>
      <p className="mt-4">Welcome to Release 1</p>
    </main>
  );
}
