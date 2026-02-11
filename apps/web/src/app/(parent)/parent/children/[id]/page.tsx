export const dynamicParams = false

export function generateStaticParams() {
  return []
}

import ChildProfileClient from "./child-profile-client"

export default async function ChildProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ChildProfileClient id={id} />
}
