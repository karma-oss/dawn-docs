import { getStaffWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function DashboardPage() {
  const staff = await getStaffWithOrg()
  const supabase = await createClient()
  const orgId = staff.organization_id

  // Get workspaces
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('organization_id', orgId)

  const workspaceIds = workspaces?.map((w: { id: string }) => w.id) ?? []

  // Get pages count
  const { data: pages } = await supabase
    .from('pages')
    .select('id, title, updated_at')
    .in('workspace_id', workspaceIds.length > 0 ? workspaceIds : ['00000000-0000-0000-0000-000000000000'])
    .order('updated_at', { ascending: false })

  const pageCount = pages?.length ?? 0
  const workspaceCount = workspaces?.length ?? 0
  const recentPages = (pages ?? []).slice(0, 5)

  const stats = [
    { title: 'ページ数', value: pageCount.toString(), color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'ワークスペース数', value: workspaceCount.toString(), color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div data-karma-context="dashboard" data-karma-auth="required">
      <h1 className="mb-6 text-2xl font-bold">ダッシュボード</h1>
      <p className="mb-4 text-sm text-gray-500">{staff.organizations?.name} - {staff.name}</p>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {stats.map((s) => (
          <Card key={s.title} className={s.bg} data-karma-entity="docs-stat">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近のページ</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPages.length === 0 ? (
            <p className="text-sm text-gray-500">ページがありません</p>
          ) : (
            <div className="space-y-3">
              {recentPages.map((page: { id: string; title: string; updated_at: string }) => (
                <Link
                  key={page.id}
                  href={`/pages/${page.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors"
                  data-karma-entity="page"
                >
                  <p className="font-medium">{page.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(page.updated_at).toLocaleDateString('ja-JP')}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
