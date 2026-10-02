import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { isAdminLogin } from "@/lib/demo-requests";
import { formatDate } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/server";
import { getDemoRequests } from "@/lib/services";

export const metadata = { title: "Demo requests" };

const COPY = {
  en: { title: "Demo requests", lead: "Requests from the website form, newest first. Reply by email.", empty: "No requests yet.", cols: ["Date", "Name", "Email", "Company", "Message"] },
  ru: { title: "Заявки на демо", lead: "Заявки с формы на сайте, новые сверху. Отвечайте на почту.", empty: "Заявок пока нет.", cols: ["Дата", "Имя", "Почта", "Компания", "Сообщение"] },
  kk: { title: "Демо өтінімдері", lead: "Сайттағы формадан келген өтінімдер, жаңалары жоғарыда. Поштаға жауап беріңіз.", empty: "Әзірге өтінім жоқ.", cols: ["Күні", "Аты", "Пошта", "Компания", "Хабарлама"] },
};

/** Team-only list of demo requests. Visible to GitHub logins in ADMIN_GITHUB_LOGINS. */
export default async function DemoRequestsPage() {
  const user = await currentUser();
  if (!isAdminLogin(user?.login)) notFound();
  const { locale } = await getMessages();
  const c = COPY[locale];
  const rows = await getDemoRequests().list(200);
  return (
    <div>
      <h1 className="page-title">{c.title}</h1>
      <p className="page-intro">{c.lead}</p>
      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-text-secondary">{c.empty}</p>
      ) : (
        <div className="surface mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b text-xs text-text-muted">
              <tr>
                {c.cols.map((col) => (
                  <th key={col} className="px-4 py-3 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b align-top last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                    {formatDate(Math.floor(r.createdAt.getTime() / 1000), locale)}
                  </td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">
                    <a className="text-link" href={`mailto:${r.email}`}>
                      {r.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{r.company ?? "—"}</td>
                  <td className="max-w-[360px] whitespace-pre-wrap px-4 py-3 text-text-secondary">
                    {r.message ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
