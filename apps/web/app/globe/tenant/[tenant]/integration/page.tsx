import { redirect } from "next/navigation";

export default function IntegrationPage({ params }: { params: { tenant: string } }) {
  redirect(`/globe/tenant/${params.tenant}/automation`);
}
