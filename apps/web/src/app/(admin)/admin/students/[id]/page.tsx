export const dynamicParams = false

export function generateStaticParams() {
  return []
}

import StudentProfileClient from "./student-profile-client"

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <StudentProfileClient id={id} />
}
